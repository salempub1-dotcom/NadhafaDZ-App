# NadhafaDZ App

تطبيق تجريبي لتنبيه سكان الحي عند مرور شاحنة النظافة. يبدأ المشروع بحي **بن يوب** وحي **العميرات** في براقي، مع إمكانية التوسع لاحقًا وربط التطبيق مباشرة بشاحنات البلدية.

## ما تم بناؤه

- Expo + React Native + TypeScript
- Expo Router
- Supabase Auth
- جلسات محفوظة على الهاتف
- Protected Routes: لا يمكن فتح صفحات التطبيق بدون تسجيل الدخول
- تسجيل دخول وإنشاء حساب
- الصفحة الرئيسية
- شاشة الخريطة الحية (واجهة أولية)
- الإبلاغ عن مرور شاحنة النظافة باستخدام GPS
- التنبيهات
- الملف الشخصي وتسجيل الخروج
- Migration آمنة لبلاغات الشاحنات والتأكيدات مع RLS

## ربط Supabase

انسخ الملف:

```bash
cp .env.example .env
```

ثم ضع بيانات مشروع Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

لا تضع service_role key داخل التطبيق.

## قاعدة البيانات

المشروع يفترض أن جدول `public.profiles` الموجود لديك يبقى كما هو. ملف:

`supabase/migrations/001_mvp_truck_reports.sql`

يضيف فقط جداول بلاغات الشاحنات والتأكيدات وRPC لعرض Feed منقح لا يكشف هوية المبلّغ.

## التشغيل

```bash
npm install
npx expo start
```

بعدها افتح التطبيق عبر Expo Go أو Android emulator.

## المرحلة التالية

1. تطبيق Migration على مشروع Supabase الحالي.
2. وضع Project URL وPublishable Key في `.env` محليًا أو عبر EAS Secrets عند البناء.
3. ربط `profiles` باختيار الحي بدل القيمة التجريبية الثابتة.
4. تحويل شاشة الخريطة إلى خريطة حقيقية وعرض آخر رصد مؤكد.
5. إضافة Expo Push Notifications.
6. إضافة نظام بلاغات نقاط تراكم القمامة.
7. لاحقًا: مصدر GPS رسمي من شاحنة البلدية ولوحة تحكم للبلدية.
