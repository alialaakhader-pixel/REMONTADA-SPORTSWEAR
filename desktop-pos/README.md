# REMONTADA POS

برنامج كاشير Windows 10/11 مرتبط بقاعدة Supabase الخاصة بمتجر REMONTADA SPORTSWEAR.

## المتطلبات
- Node.js 22 أو أحدث لبناء نسخة التثبيت.
- حساب Supabase Auth موجود مسبقًا وله app_metadata.role = admin.
- مفتاح Supabase Publishable فقط داخل تطبيق سطح المكتب؛ لا تستخدم service_role أو secret key في التطبيق.

## البناء محليًا
1. افتح مجلد desktop-pos.
2. انسخ .env.example إلى .env وضع رابط Supabase ومفتاح Publishable.
3. شغّل npm install.
4. شغّل npm run dist:win.
5. ستجد ملفات التثبيت داخل release.

## بناء ملف Windows من GitHub
شغّل GitHub Actions ثم workflow باسم Build REMONTADA POS for Windows، وبعد نجاحه نزّل artifact باسم remontada-pos-windows.

## ملاحظات
- البرنامج يرفض الدخول إلا لحساب الإدارة.
- البيع يتم من خلال دالة PostgreSQL ذرية تخصم الكميات وتكتب سجل الحركة في معاملة واحدة.
- البرنامج يقرأ المنتجات من store_state.public_state.products، ويهيئ رصيد المخزون لأول مرة فقط.
- الاتصال بالإنترنت مطلوب حتى لا يحدث بيع متعارض بين المحل والمتجر.
- قبل استخدامه فعليًا، يجب إكمال ربط صفحة المتجر الإلكتروني بنفس جدول المخزون ودالة تسجيل الطلبات الأونلاين، ثم اختبار البيع من الطرفين.
