-- Applied to the live REMONTADA Supabase project.
-- Extends idempotent offline POS sync to catalog, inventory adjustments, returns and expenses.

alter table public.pos_offline_events
  drop constraint if exists pos_offline_events_event_type_check;
alter table public.pos_offline_events
  add constraint pos_offline_events_event_type_check
  check (event_type = any (array['sale','restock','product_upsert','adjustment','return','expense']::text[]));

create table if not exists public.pos_returns (
  event_id uuid primary key,
  return_id uuid not null unique,
  sale_id uuid not null references public.pos_sales(id),
  product_id text not null,
  variant_id text not null,
  product_title text not null,
  variant_label text not null default '',
  quantity integer not null check (quantity > 0),
  refund_amount numeric(12,2) not null default 0 check (refund_amount >= 0),
  restock boolean not null default true,
  reason text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.pos_returns enable row level security;
drop policy if exists "admin pos returns access" on public.pos_returns;
create policy "admin pos returns access" on public.pos_returns
  for all to authenticated
  using ((select (auth.jwt()->'app_metadata'->>'role')) = 'admin')
  with check ((select (auth.jwt()->'app_metadata'->>'role')) = 'admin');
grant select, insert, update, delete on public.pos_returns to authenticated;
create index if not exists pos_returns_sale_id_idx on public.pos_returns(sale_id);
create index if not exists pos_returns_created_by_idx on public.pos_returns(created_by);

create table if not exists public.pos_expenses (
  event_id uuid primary key,
  expense_id uuid not null unique,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'عام',
  note text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.pos_expenses enable row level security;
drop policy if exists "admin pos expenses access" on public.pos_expenses;
create policy "admin pos expenses access" on public.pos_expenses
  for all to authenticated
  using ((select (auth.jwt()->'app_metadata'->>'role')) = 'admin')
  with check ((select (auth.jwt()->'app_metadata'->>'role')) = 'admin');
grant select, insert, update, delete on public.pos_expenses to authenticated;
create index if not exists pos_expenses_created_by_idx on public.pos_expenses(created_by);
create index if not exists pos_expenses_created_at_idx on public.pos_expenses(created_at desc);

create or replace function public.pos_apply_offline_event(p_event_id uuid, p_event_type text, p_payload jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $function$
declare
  v_existing public.pos_offline_events%rowtype;
  v_result jsonb;
  v_product jsonb;
  v_products jsonb;
  v_next_products jsonb;
  v_variant jsonb;
  v_sold integer;
  v_returned integer;
  v_qty integer;
  v_sale_id uuid;
begin
  if auth.uid() is null or (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'غير مصرح: يلزم حساب إدارة';
  end if;
  if p_event_type not in ('sale','restock','product_upsert','adjustment','return','expense') then
    raise exception 'نوع الحركة غير مدعوم';
  end if;
  insert into public.pos_offline_events(event_id,event_type,payload)
  values (p_event_id,p_event_type,p_payload)
  on conflict (event_id) do nothing;
  select * into v_existing from public.pos_offline_events where event_id=p_event_id for update;
  if v_existing.event_type <> p_event_type then raise exception 'معرف الحركة مستخدم لنوع آخر'; end if;
  if (v_existing.payload - '_applied') <> p_payload then raise exception 'معرف الحركة مكرر ببيانات مختلفة'; end if;
  if coalesce(v_existing.payload->>'_applied','false')='true' then
    return jsonb_build_object('already_applied',true);
  end if;

  if p_event_type='sale' then
    perform public.pos_create_sale(
      (p_payload->>'sale_id')::uuid,p_payload->>'receipt_number',
      coalesce((p_payload->>'subtotal')::numeric,0),coalesce((p_payload->>'discount')::numeric,0),
      coalesce((p_payload->>'total')::numeric,0),coalesce(p_payload->>'payment_method','cash'),
      p_payload->>'cashier_note',coalesce(p_payload->'items','[]'::jsonb)
    );
    v_result := jsonb_build_object('sale_id',p_payload->>'sale_id');
  elsif p_event_type in ('restock','adjustment') then
    perform public.inventory_adjust_stock(
      p_payload->>'product_id',p_payload->>'variant_id',p_payload->>'product_title',
      coalesce(p_payload->>'variant_label',''),p_payload->>'sku',
      (p_payload->>'quantity_delta')::integer,
      case when p_event_type='restock' then 'restock' else 'adjustment' end,
      coalesce(p_payload->>'note','حركة مخزون من برنامج الكاشير')
    );
    v_result := jsonb_build_object('inventory_updated',true);
  elsif p_event_type='product_upsert' then
    v_product := p_payload->'product';
    if jsonb_typeof(v_product) <> 'object' or coalesce(v_product->>'id','') = '' then
      raise exception 'بيانات المنتج غير مكتملة';
    end if;
    select coalesce(public_state->'products','[]'::jsonb) into v_products
      from public.store_state where id=1 for update;
    select coalesce(jsonb_agg(case when item->>'id'=v_product->>'id' then item || v_product else item end),'[]'::jsonb)
      into v_next_products from jsonb_array_elements(v_products) item;
    if not exists (select 1 from jsonb_array_elements(v_products) item where item->>'id'=v_product->>'id') then
      v_next_products := v_next_products || jsonb_build_array(v_product);
    end if;
    update public.store_state
      set public_state=jsonb_set(coalesce(public_state,'{}'::jsonb),'{products}',v_next_products,true),updated_at=now()
      where id=1;
    for v_variant in select value from jsonb_array_elements(coalesce(v_product->'variants','[]'::jsonb))
    loop
      insert into public.inventory_stock(product_id,variant_id,product_title,variant_label,sku,quantity)
      values (v_product->>'id',v_variant->>'id',coalesce(v_product->>'title','منتج'),
        coalesce(v_variant->>'label',concat_ws(' / ',v_variant->>'size',v_variant->>'colorName')),
        coalesce(v_variant->>'sku',v_variant->>'variantCode'),greatest(0,coalesce((v_variant->>'stockQty')::integer,0)))
      on conflict (product_id,variant_id) do update
        set product_title=excluded.product_title,variant_label=excluded.variant_label,sku=excluded.sku,updated_at=now();
    end loop;
    v_result := jsonb_build_object('product_id',v_product->>'id','saved',true);
  elsif p_event_type='return' then
    v_sale_id := (p_payload->>'sale_id')::uuid;
    v_qty := (p_payload->>'quantity')::integer;
    select coalesce(sum(quantity),0) into v_sold from public.pos_sale_items
      where sale_id=v_sale_id and product_id=p_payload->>'product_id' and variant_id=p_payload->>'variant_id';
    select coalesce(sum(quantity),0) into v_returned from public.pos_returns
      where sale_id=v_sale_id and product_id=p_payload->>'product_id' and variant_id=p_payload->>'variant_id';
    if v_qty <= 0 or v_qty > v_sold-v_returned then raise exception 'كمية المرتجع تتجاوز الكمية المباعة المتبقية'; end if;
    if coalesce((p_payload->>'restock')::boolean,true) then
      perform public.inventory_adjust_stock(p_payload->>'product_id',p_payload->>'variant_id',
        p_payload->>'product_title',coalesce(p_payload->>'variant_label',''),p_payload->>'sku',
        v_qty,'return',coalesce(p_payload->>'reason','مرتجع من الكاشير'));
    end if;
    insert into public.pos_returns(event_id,return_id,sale_id,product_id,variant_id,product_title,variant_label,quantity,refund_amount,restock,reason,created_by)
    values (p_event_id,(p_payload->>'return_id')::uuid,v_sale_id,p_payload->>'product_id',p_payload->>'variant_id',
      coalesce(p_payload->>'product_title',''),coalesce(p_payload->>'variant_label',''),v_qty,
      coalesce((p_payload->>'refund_amount')::numeric,0),coalesce((p_payload->>'restock')::boolean,true),
      coalesce(p_payload->>'reason',''),auth.uid());
    v_result := jsonb_build_object('returned',true);
  elsif p_event_type='expense' then
    insert into public.pos_expenses(event_id,expense_id,title,amount,category,note,created_by)
    values (p_event_id,(p_payload->>'expense_id')::uuid,coalesce(p_payload->>'title','مصروف'),
      (p_payload->>'amount')::numeric,coalesce(p_payload->>'category','عام'),coalesce(p_payload->>'note',''),auth.uid());
    v_result := jsonb_build_object('expense_saved',true);
  end if;
  update public.pos_offline_events set payload=p_payload || jsonb_build_object('_applied',true),applied_at=now()
    where event_id=p_event_id;
  return coalesce(v_result,'{}'::jsonb);
end;
$function$;
grant execute on function public.pos_apply_offline_event(uuid,text,jsonb) to authenticated;
