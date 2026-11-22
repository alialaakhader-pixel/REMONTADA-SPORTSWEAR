const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const Database = require('better-sqlite3');

let db;
function initDb() {
  if (db) return;
  const file = path.join(app.getPath('userData'), 'remontada-pos.sqlite');
  db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (product_id TEXT PRIMARY KEY, title TEXT NOT NULL, model_code TEXT NOT NULL, base_price REAL NOT NULL DEFAULT 0, raw_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS variants (
      product_id TEXT NOT NULL, variant_id TEXT NOT NULL, label TEXT NOT NULL DEFAULT '',
      size TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '', sku TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0), price REAL NOT NULL DEFAULT 0,
      raw_json TEXT NOT NULL, PRIMARY KEY(product_id, variant_id),
      FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sales (
      sale_id TEXT PRIMARY KEY, receipt_number TEXT NOT NULL UNIQUE, subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0, total REAL NOT NULL, payment_method TEXT NOT NULL,
      created_at TEXT NOT NULL, synced INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id TEXT NOT NULL, product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL, product_title TEXT NOT NULL, variant_label TEXT NOT NULL,
      quantity INTEGER NOT NULL, unit_price REAL NOT NULL, line_total REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(sale_id)
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      event_id TEXT PRIMARY KEY, event_type TEXT NOT NULL, payload TEXT NOT NULL,
      created_at TEXT NOT NULL, synced INTEGER NOT NULL DEFAULT 0, last_error TEXT
    );
  `);
}
function snapshot() {
  initDb();
  const products = db.prepare('SELECT * FROM products ORDER BY title').all().map(p => ({
    ...JSON.parse(p.raw_json), id: p.product_id, title: p.title, modelCode: p.model_code,
    basePrice: p.base_price,
    variants: db.prepare('SELECT * FROM variants WHERE product_id=? ORDER BY label').all(p.product_id).map(v => ({
      ...JSON.parse(v.raw_json), id: v.variant_id, size: v.size, colorName: v.color,
      sku: v.sku, variantCode: v.sku, stockQty: v.quantity
    }))
  }));
  const stock = {};
  for (const row of db.prepare('SELECT product_id,variant_id,quantity,sku FROM variants').all()) {
    stock[row.product_id + ':' + row.variant_id] = { quantity: row.quantity, sku: row.sku };
  }
  const pending = db.prepare('SELECT count(*) AS n FROM sync_queue WHERE synced=0').get().n;
  const sales = db.prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 30').all();
  return { products, stock, pending, sales, offlineAuthorized: db.prepare("SELECT value FROM settings WHERE key='offline_authorized'").get()?.value === '1' };
}
ipcMain.handle('pos:init', () => snapshot());
ipcMain.handle('pos:authorize', () => { initDb(); db.prepare("INSERT INTO settings(key,value) VALUES('offline_authorized','1') ON CONFLICT(key) DO UPDATE SET value='1'").run(); return true; });
ipcMain.handle('pos:logout', () => { initDb(); db.prepare("DELETE FROM settings WHERE key='offline_authorized'").run(); return true; });
ipcMain.handle('pos:replace-catalog', (_e, { products, stockRows }) => {
  initDb();
  const serverStock = new Map((stockRows || []).map(r => [r.product_id + ':' + r.variant_id, Number(r.quantity || 0)]));
  const pending = db.prepare('SELECT event_type,payload FROM sync_queue WHERE synced=0').all();
  const deltas = new Map();
  for (const ev of pending) {
    const p = JSON.parse(ev.payload);
    if (ev.event_type === 'sale') for (const item of (p.items || [])) {
      const k = item.product_id + ':' + item.variant_id; deltas.set(k, (deltas.get(k) || 0) - Number(item.quantity || 0));
    }
    if (ev.event_type === 'restock') {
      const k = p.product_id + ':' + p.variant_id; deltas.set(k, (deltas.get(k) || 0) + Number(p.quantity_delta || 0));
    }
  }
  const tx = db.transaction(() => {
    for (const p of products || []) {
      const pid = String(p.id); const code = String(p.modelCode || p.model_code || '');
      db.prepare(`INSERT INTO products(product_id,title,model_code,base_price,raw_json) VALUES(?,?,?,?,?)
        ON CONFLICT(product_id) DO UPDATE SET title=excluded.title,model_code=excluded.model_code,base_price=excluded.base_price,raw_json=excluded.raw_json`)
        .run(pid, p.title || 'منتج', code, Number(p.basePrice || 0), JSON.stringify(p));
      for (const v of p.variants || []) {
        const vid = String(v.id); const key = pid + ':' + vid;
        const label = [v.size, v.colorName].filter(Boolean).join(' / ') || 'بدون مقاس';
        const sku = String(v.variantCode || v.sku || (code ? code + (v.size ? '-' + v.size : '') : vid));
        const exists = db.prepare('SELECT quantity FROM variants WHERE product_id=? AND variant_id=?').get(pid,vid);
        const base = serverStock.has(key) ? serverStock.get(key) : (exists?.quantity ?? Number(v.stockQty || 0));
        const qty = Math.max(0, base + (deltas.get(key) || 0));
        db.prepare(`INSERT INTO variants(product_id,variant_id,label,size,color,sku,quantity,price,raw_json)
          VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(product_id,variant_id) DO UPDATE SET
          label=excluded.label,size=excluded.size,color=excluded.color,sku=excluded.sku,quantity=excluded.quantity,price=excluded.price,raw_json=excluded.raw_json`)
          .run(pid,vid,label,String(v.size || ''),String(v.colorName || ''),sku,qty,Number(p.basePrice || 0),JSON.stringify(v));
      }
    }
  });
  tx(); return snapshot();
});
ipcMain.handle('pos:create-sale', (_e, payload) => {
  initDb();
  const tx = db.transaction(() => {
    for (const item of payload.items) {
      const row = db.prepare('SELECT quantity FROM variants WHERE product_id=? AND variant_id=?').get(String(item.product_id),String(item.variant_id));
      if (!row || row.quantity < Number(item.quantity)) throw new Error('الكمية المتاحة لا تكفي: ' + item.product_title + ' ' + item.variant_label);
    }
    for (const item of payload.items) {
      db.prepare('UPDATE variants SET quantity=quantity-? WHERE product_id=? AND variant_id=?')
        .run(Number(item.quantity),String(item.product_id),String(item.variant_id));
    }
    db.prepare('INSERT INTO sales(sale_id,receipt_number,subtotal,discount,total,payment_method,created_at,synced) VALUES(?,?,?,?,?,?,?,0)')
      .run(payload.sale_id,payload.receipt_number,payload.subtotal,payload.discount,payload.total,payload.payment_method,new Date().toISOString());
    const insertItem = db.prepare('INSERT INTO sale_items(sale_id,product_id,variant_id,product_title,variant_label,quantity,unit_price,line_total) VALUES(?,?,?,?,?,?,?,?)');
    for (const item of payload.items) insertItem.run(payload.sale_id,String(item.product_id),String(item.variant_id),item.product_title,item.variant_label,Number(item.quantity),Number(item.unit_price),Number(item.quantity)*Number(item.unit_price));
    db.prepare('INSERT INTO sync_queue(event_id,event_type,payload,created_at,synced) VALUES(?,?,?,?,0)')
      .run(payload.event_id,'sale',JSON.stringify(payload),new Date().toISOString());
  });
  tx(); return snapshot();
});
ipcMain.handle('pos:add-stock', (_e, payload) => {
  initDb();
  const tx = db.transaction(() => {
    const row = db.prepare('SELECT quantity FROM variants WHERE product_id=? AND variant_id=?').get(String(payload.product_id),String(payload.variant_id));
    if (!row) throw new Error('الصنف غير موجود في قاعدة البيانات المحلية');
    db.prepare('UPDATE variants SET quantity=quantity+? WHERE product_id=? AND variant_id=?').run(Number(payload.quantity_delta),String(payload.product_id),String(payload.variant_id));
    db.prepare('INSERT INTO sync_queue(event_id,event_type,payload,created_at,synced) VALUES(?,?,?,?,0)')
      .run(payload.event_id,'restock',JSON.stringify(payload),new Date().toISOString());
  });
  tx(); return snapshot();
});
ipcMain.handle('pos:pending', () => { initDb(); return db.prepare('SELECT event_id,event_type,payload FROM sync_queue WHERE synced=0 ORDER BY created_at').all().map(x=>({...x,payload:JSON.parse(x.payload)})); });
ipcMain.handle('pos:mark-synced', (_e,eventId) => {
  initDb(); const tx=db.transaction(()=>{db.prepare('UPDATE sync_queue SET synced=1,last_error=NULL WHERE event_id=?').run(eventId); const q=db.prepare('SELECT payload,event_type FROM sync_queue WHERE event_id=?').get(eventId); if(q?.event_type==='sale'){const p=JSON.parse(q.payload);db.prepare('UPDATE sales SET synced=1 WHERE sale_id=?').run(p.sale_id);}}); tx(); return snapshot();
});
ipcMain.handle('pos:sync-error', (_e,{eventId,error}) => { initDb(); db.prepare('UPDATE sync_queue SET last_error=? WHERE event_id=?').run(String(error||'تعذر المزامنة').slice(0,500),eventId); });
function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1050, minHeight: 700,
    backgroundColor: '#050914', title: 'REMONTADA POS',
    webPreferences: { preload: path.join(__dirname,'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname,'..','dist','index.html'));
}
app.whenReady().then(() => { initDb(); createWindow(); app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();}); });
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
