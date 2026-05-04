# PROJECT STATUS — أكاديمية طنطا للسباحة
**آخر تحديث:** 3 مايو 2026

---

## الحالة الحالية: المرحلة الثالثة جارية 🔄

---

## ما تم إنجازه بالكامل

### المرحلة الأولى — البنية التحتية ✅
| الملف | الوظيفة |
|-------|---------|
| `src/app/layout.tsx` | Root Layout + SessionProvider |
| `src/components/Providers.tsx` | Client wrapper لـ SessionProvider |
| `src/lib/supabase.ts` | Lazy Singleton client للـ DB |
| `src/lib/auth.ts` | NextAuth config + 3 أدوار |
| `src/lib/types.ts` | TypeScript types كاملة |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth API handler |
| `src/components/layout/Sidebar.tsx` | شريط جانبي ذكي حسب الدور |
| `src/app/admin/layout.tsx` | Layout الأدمن + حماية الدور |
| `src/app/coach/layout.tsx` | Layout المدرب + حماية الدور |
| `src/app/parent/layout.tsx` | Layout ولي الأمر + حماية الدور |
| `src/app/login/page.tsx` | صفحة تسجيل الدخول |
| `src/app/page.tsx` | توجيه ذكي حسب الجلسة |
| `supabase/schema.sql` | Schema كامل **تم تشغيله بنجاح في Supabase** ✅ |
| `.env.local` | متغيرات البيئة مكتملة ✅ |

### المرحلة الثانية — واجهة ولي الأمر ✅
| الملف | الوظيفة |
|-------|---------|
| `src/app/register/page.tsx` | تسجيل حساب جديد لولي الأمر |
| `src/app/api/auth/register/route.ts` | API إنشاء الحساب + تشفير كلمة السر |
| `src/app/parent/page.tsx` | Dashboard ولي الأمر |
| `src/components/shared/ImageUploader.tsx` | مكوّن رفع الصور — يرسل لـ `/api/upload` (server-side) |
| `src/app/parent/swimmers/new/page.tsx` | إضافة سباح جديد + رفع إيصال الالتحاق |
| `src/app/api/parent/swimmers/route.ts` | API إضافة السباح |
| `src/app/parent/swimmers/page.tsx` | قائمة أبنائي + حالة كل طلب |
| `src/app/parent/payments/page.tsx` | صفحة المدفوعات الشهرية |
| `src/app/parent/payments/PaymentUploadCard.tsx` | بطاقة رفع الإيصال الشهري |
| `src/app/api/parent/payments/route.ts` | API رفع الإيصالات الشهرية |

### المرحلة الثالثة — لوحة تحكم الأدمن (جارية) 🔄

#### ✅ صفحة طلبات الالتحاق `/admin/requests`
- عرض الطلبات المعلقة مع بيانات السباح + ولي الأمر + صورة الإيصال
- Modal القبول: اختيار مدرب ← ثم مجموعة مفلترة حسب المدرب
- Modal الرفض: حقل سبب الرفض (5 أحرف minimum بـ Zod)
- Optimistic update — الطلب يختفي فوراً بعد القرار بدون reload

| الملف | الوظيفة |
|-------|---------|
| `src/app/admin/requests/page.tsx` | Server Component — جلب البيانات |
| `src/app/admin/requests/RequestsClient.tsx` | Client Component — Modal + تفاعل |
| `src/app/api/admin/requests/[id]/approve/route.ts` | يفعّل السباح + يعيّنه لمدرب ومجموعة |
| `src/app/api/admin/requests/[id]/reject/route.ts` | يرفض الطلب مع سبب |

#### ✅ صفحة المدفوعات الشهرية `/admin/payments`
- عرض إيصالات الشهر الحالي المعلقة مع بيانات السباح
- Modal موحّد للقبول والرفض
- عند القبول: `payment.status = 'approved'` + `swimmer.payment_status = 'paid'`
- Optimistic update بعد كل قرار

| الملف | الوظيفة |
|-------|---------|
| `src/app/admin/payments/page.tsx` | Server Component — جلب البيانات |
| `src/app/admin/payments/PaymentsClient.tsx` | Client Component — Modal + تفاعل |
| `src/app/api/admin/payments/[id]/approve/route.ts` | يوافق + يحدّث payment_status للسباح |
| `src/app/api/admin/payments/[id]/reject/route.ts` | يرفض الإيصال |

#### ✅ صفحة إدارة المدربين `/admin/coaches`
- بطاقات المدربين (3 أعمدة) مع اسم + عدد سباحين + إيميل
- إضافة مدرب: الأدمن يدخل الاسم والإيميل فقط — **الباسورد يتولّد تلقائياً**
- بعد الإضافة: Success Modal يعرض الباسورد المؤقت مرة واحدة (مع زر Copy + Show/Hide)
- المدرب يغيّر إيميله وباسورده من صفحة الإعدادات الخاصة به
- حذف مدرب: يحذف الـ user (CASCADE يزيل الـ coach، SET NULL على السباحين)

| الملف | الوظيفة |
|-------|---------|
| `src/app/admin/coaches/page.tsx` | Server Component — جلب المدربين |
| `src/app/admin/coaches/CoachesClient.tsx` | Client Component — بطاقات + Modals |
| `src/app/api/admin/coaches/route.ts` | POST — ينشئ user + coach + يولّد باسورد مؤقت |
| `src/app/api/admin/coaches/[id]/route.ts` | DELETE — يحذف المدرب وحسابه |

#### ✅ إعدادات المدرب `/coach/settings`
- بطاقة تغيير الإيميل (يتحقق من الباسورد الحالي)
- بطاقة تغيير الباسورد (يتحقق من الحالي + تأكيد الجديد)
- Show/Hide لكل حقول الباسورد

| الملف | الوظيفة |
|-------|---------|
| `src/app/coach/settings/page.tsx` | Client Component — فورمي التغيير |
| `src/app/api/coach/settings/route.ts` | PATCH — يغيّر الإيميل أو الباسورد بعد التحقق |

#### ✅ صفحة سباحي المدرب `/coach/swimmers`
- عرض السباحين النشطين التابعين للمدرب فقط
- إحصائيات: إجمالي / مدفوعين / غير مدفوعين
- بحث بالاسم + فلتر حالة الدفع (الكل / مدفوع / لم يدفع)
- بطاقة لكل سباح: الاسم + المستوى + حالة الدفع + العمر + المجموعة + بيانات ولي الأمر
- لا يوجد أي أكشن — عرض فقط

| الملف | الوظيفة |
|-------|---------|
| `src/app/coach/swimmers/page.tsx` | Server Component — جلب سباحي هذا المدرب |
| `src/app/coach/swimmers/CoachSwimmersClient.tsx` | Client Component — عرض + بحث + فلترة |

#### ✅ صفحة إدارة المجموعات `/admin/groups`
- المجموعات معروضة مجمّعة حسب المدرب (reduce)
- إضافة مجموعة: اختيار مدرب + نمط أيام (راديو) + فترة (راديو) + الوقت
- الاسم يتولّد تلقائياً: `"سبت / اثنين / أربعاء — 8:00 ص"`
- معاينة الاسم live قبل الحفظ
- منع التكرار: نفس المدرب + نفس الأيام + نفس الفترة
- حذف مجموعة: السباحون يتفكّ ارتباطهم (SET NULL)

| الملف | الوظيفة |
|-------|---------|
| `src/app/admin/groups/page.tsx` | Server Component — جلب المجموعات والمدربين |
| `src/app/admin/groups/GroupsClient.tsx` | Client Component — بطاقات + Modals |
| `src/app/api/admin/groups/route.ts` | POST — ينشئ مجموعة جديدة |
| `src/app/api/admin/groups/[id]/route.ts` | DELETE — يحذف المجموعة |

#### ✅ API رفع الصور `/api/upload`
| الملف | الوظيفة |
|-------|---------|
| `src/app/api/upload/route.ts` | يستقبل FormData ويرفع للـ Storage بـ supabaseAdmin (bypass RLS) |

---

## المشاكل التي تم حلها

### 1. Serialization Error — Sidebar Icons
- **المشكلة:** Server Component كانت تمرر Lucide icons كـ props للـ Sidebar (Client Component) — الأيقونات functions مش plain objects فبيحصل خطأ.
- **الحل:** نقلنا تعريف القوائم جوّا `Sidebar.tsx` مباشرة، وبقينا نبعت بس `userRole` كـ string.

### 2. supabaseKey is required
- **المشكلة:** الـ Supabase client بيتعمل وقت تحميل الملف (module load time) قبل ما env vars تكون جاهزة.
- **الحل:** **Lazy Singleton Pattern** — الـ client بيتعمل بس أول مرة نحتاجه فعلاً.

### 3. useSession must be wrapped in SessionProvider
- **المشكلة:** `useSession` hook مش لاقي الـ Context.
- **الحل:** `Providers.tsx` كـ Client Component في Root Layout يلف كل التطبيق.

### 4. Admin Login Failed
- **المشكلة:** الـ bcrypt hash المكتوب في `schema.sql` لكلمة `admin123` كان خاطئ.
- **الحل:** توليد hash صحيح عبر Node.js وتشغيل `UPDATE users SET password_hash = '...' WHERE role = 'admin'` مباشرة في Supabase SQL Editor.

### 5. Image Upload — StorageApiError (RLS Violation)
- **المشكلة:** `ImageUploader` كان يرفع مباشرة بـ anon key، وبما إن المصادقة عبر NextAuth (مش Supabase Auth) فلا يوجد Supabase session token → RLS ترفض الرفع.
- **الحل:** إنشاء `/api/upload` route على السيرفر يستخدم `supabaseAdmin` (service role key) لتجاوز RLS. الـ `ImageUploader` بقى يرسل الصورة لهذا الـ route بـ `FormData`.

### 6. Receipt Image 404 — Bucket not found
- **المشكلة:** Storage buckets كانت `public: false` فالصور المرفوعة مش بتظهر.
- **الحل:** تشغيل في Supabase SQL Editor:
  ```sql
  UPDATE storage.buckets SET public = true 
  WHERE id IN ('enrollment-receipts', 'payment-receipts');
  ```

### 7. Zod v4 — errors vs issues
- **المشكلة:** `parsed.error.errors[0]` بترمي خطأ في Zod v4.
- **الحل:** `parsed.error.issues[0]` — Zod v4 استبدل `errors` بـ `issues`.

### 8. Next.js 16 — params as Promise
- **المشكلة:** في Route Handlers، `params` بقت `Promise<{id: string}>` في Next.js 16.
- **الحل:** دايماً `await params` قبل الوصول لـ `id`:
  ```typescript
  export async function POST(req, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```

### 9. Type Error — Supabase Nested Selects
- **المشكلة:** `(data ?? []) as RequestItem[]` بيرمي TS2352 لأن Supabase بيرجع نوع معقد للـ nested selects.
- **الحل:** `(data ?? []) as unknown as RequestItem[]` — الـ `unknown` بتكسر الـ type chain.

---

## المتبقي من المرحلة الثالثة

| الصفحة | الأولوية | الوصف |
|--------|----------|-------|
| `/admin/swimmers` | 🔴 عالية | عرض كل السباحين + فلترة + إعادة تعيين مجموعة |
| `/coach/swimmers` | ✅ مكتملة | المدرب يشوف سباحينه فقط في مجموعته |
| `/admin/page.tsx` | 🟡 متوسطة | Dashboard إحصائيات (عدد سباحين / مدربين / طلبات معلقة) |
| `/parent` reset password | 🟢 منخفضة | استعادة كلمة السر عبر الإيميل |

---

## قواعد تقنية ثابتة (لا تتغير)

| القاعدة | التفاصيل |
|---------|---------|
| Next.js version | **16.2.4** — `params` في Route Handlers = `Promise` يجب `await` |
| Zod version | **v4** — استخدم `issues[0]` لا `errors[0]` |
| Supabase Auth | **غير مستخدم** — المصادقة عبر NextAuth فقط |
| Storage uploads | **دايماً** عبر `/api/upload` بـ `supabaseAdmin` لتجاوز RLS |
| Type casting | `as unknown as InterfaceType[]` للـ nested Supabase selects |
| كل سطر كود | **يجب أن يحتوي على تعليق عربي** يشرح وظيفته |
| قبل التنفيذ | **شرح الخطة أولاً والحصول على موافقة** ثم البدء |

---

## CSS Custom Properties المستخدمة
```
var(--cyan)              → اللون الأزرق الرئيسي
var(--cyan-muted)        → خلفية فاتحة للعناصر الـ cyan
var(--cyan-foreground)   → لون النص فوق خلفية cyan
var(--gold)              → اللون الذهبي للتحذيرات
var(--gold-muted)        → خلفية فاتحة للتحذيرات
var(--card)              → خلفية البطاقات
var(--border)            → لون الحدود
var(--secondary)         → خلفية ثانوية (inputs)
var(--muted-foreground)  → نص رمادي خافت
var(--destructive)       → لون الحذف / الخطر
```

---

## بيانات Supabase
- **URL:** `https://nlqonomxitpocwpqnvxc.supabase.co`
- **الجداول:** users, coaches, parents, swimmers, training_groups, enrollment_requests, payments
- **Storage Buckets:** `enrollment-receipts`, `payment-receipts` (كلاهما `public: true`)
- **الـ Schema:** تم تشغيله بنجاح ✅

---

## هيكل المجلدات الحالي
```
tanat-swimming-academy/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                        ← توجيه ذكي حسب الجلسة
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    ← Dashboard الأدمن
│   │   │   ├── requests/
│   │   │   │   ├── page.tsx
│   │   │   │   └── RequestsClient.tsx
│   │   │   ├── payments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── PaymentsClient.tsx
│   │   │   ├── coaches/
│   │   │   │   ├── page.tsx
│   │   │   │   └── CoachesClient.tsx
│   │   │   └── groups/
│   │   │       ├── page.tsx
│   │   │       └── GroupsClient.tsx
│   │   ├── coach/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── parent/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── swimmers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   └── payments/
│   │   │       ├── page.tsx
│   │   │       └── PaymentUploadCard.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── upload/route.ts             ← رفع الصور بـ supabaseAdmin
│   │       ├── parent/
│   │       │   ├── swimmers/route.ts
│   │       │   └── payments/route.ts
│   │       ├── admin/
│   │       │   ├── requests/[id]/approve/route.ts
│   │       │   ├── requests/[id]/reject/route.ts
│   │       │   ├── payments/[id]/approve/route.ts
│   │       │   ├── payments/[id]/reject/route.ts
│   │       │   ├── coaches/route.ts
│   │       │   ├── coaches/[id]/route.ts
│   │       │   ├── groups/route.ts
│   │       │   └── groups/[id]/route.ts
│   │       └── coach/
│   │           └── settings/route.ts
│   ├── components/
│   │   ├── Providers.tsx
│   │   ├── layout/Sidebar.tsx
│   │   ├── shared/ImageUploader.tsx
│   │   └── ui/...
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── supabase.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── types/next-auth.d.ts
└── supabase/schema.sql
```
