# مراجعة نظام الـ CI/CD لمشروع GYM Management (OpenGym)

> تاريخ المراجعة: 2026-07-04
> المقارنة مع: `mazaya-system` (النموذج المرجعي)

---

## ✅ الخلاصة المختصرة

**مشروع GYM Management شغّال بنفس نظام mazaya-system بالظبط.** البناء بيحصل off-server على GitHub Actions، والسيرفر بيسحب صورة جاهزة فقط — يعني استهلاك موارد DigitalOcean وقت البناء = صفر تقريباً.

مطلوب منك تعديل **واحد بس** (مشكلة أمنية في ملف deploy)، وبعدها النظام جاهز. التفاصيل بالتحت.

---

## 🔍 مقارنة جانبًا بجانب

| البند | mazaya-system | GYM Management (OpenGym) | الحالة |
|---|---|---|---|
| مكان البناء | GitHub Actions (off-server) | GitHub Actions (off-server) | ✅ مطابق |
| رفع الصورة | GHCR (`ghcr.io`) | GHCR (`ghcr.io`) | ✅ مطابق |
| ذاكرة البناء (Node) | مقلوبة بـ `--max-old-space-size` | مقلوبة بنفس القيم | ✅ مطابق |
| Dockerfile multi-stage | 4 مراحل (deps/builder/runner) | 4 مراحل | ✅ مطابق |
| output: standalone | نعم | نعم | ✅ مطابق |
| تشغيل non-root user | nextjs (1001) | nextjs (1001) | ✅ مطابق |
| Build cache (gha) | مفعّل | مفعّل | ✅ مطابق |
| طريقة الـ Deploy على السيرفر | SSH من GitHub | SSH من GitHub | ✅ مطابق |
| تشغيل الـ runtime | **Docker Swarm** (`docker service update`) | **Docker standalone** (`docker run --restart`) | ⚠️ مختلف (مش مشكلة) |
| **ترتيب تشغيل الـ deploy** | `on: push` (بيشتغل بالتوازي مع build) | `on: workflow_run` (بعد نجاح build) | ✅ GYM أحسن |
| خطوة "Inspect secret" | غير موجودة | **موجودة — بتطبع المفتاح في الـ logs** | ❌ **خطر أمني** |
| ملف `.env` على السيرفر | يُحقن في الـ swarm service | `/opt/openappo-gym/.env` (عبر `--env-file`) | ✅ مطابق منطقياً |

---

## ❌ المشكلة الوحيدة المطلوب إصلاحها

ملف: `.github/workflows/deploy.yml`

فيه خطوة اسمها **"Inspect secret"** بتعمل `echo` و `printf` لـ `SSH_PRIVATE_KEY` كامل في سجلّات GitHub Actions. ده اتضاف وقت الـ debugging لحل مشكلة الاتصال — خلصت إصلاحها (آخر commit: `rename secret to SSH_PRIVATE_KEY`)، فالخطوة دي **ماتلزمش وبتسرّب المفتاح الخاص كامل** لأي حد يقدر يشوف logs الـ workflow.

### التعديل المطلوب

افتح `.github/workflows/deploy.yml` و **احذف بلوك "Inspect secret" بالكامل** (الخطوة اللي اسمها `- name: Inspect secret` ومعاها الـ `env` و الـ `run`).

الشكل النهائي الصحيح للافتتاحية لازم يكون:

```yaml
jobs:
  deploy:
    name: Deploy via SSH
    runs-on: ubuntu-latest
    timeout-minutes: 15
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          command_timeout: 10m
          script: |
            ... (نفس السكربت الحالي بدون تغيير)
```

> ⚠️ **مهم بعد الحذف:** لازم **تعمل rotation (تغيير) لمفتاح SSH** على السيرفر لأن المفتاح القديم اتسجّل في logs كاملة، حتى لو حذفت الخطوة دلوقتي السجل القديم لسه موجود. شوف قسم "تغيير مفتاح SSH" بالتحت.

---

## 🔑 الـ Secrets المطلوبة (في GitHub)

### كم secret محتاج؟ **3 بس** في GitHub repo `Open_Gym`:

| اسم الـ Secret | القيمة | منين تجيبها |
|---|---|---|
| `SSH_HOST` | IP السيرفر على DigitalOcean | من لوحة DigitalOcean → Droplets → السيرفر |
| `SSH_USER` | اسم المستخدم (عادة `root` أو مستخدم sudo) | اللي بتدخل بيه عادةً |
| `SSH_PRIVATE_KEY` | المفتاح الخاص كامل (`-----BEGIN ... PRIVATE KEY-----`) | من جهازك المحلي — شوف تحت |

> **ملاحظة مهمة:** ملف `.env` (الـ Database / Auth / R2 / Resend ... إلخ) **مش** secrets في GitHub. ده بيفضل على السيرفر في `/opt/openappo-gym/.env` والسكربت بياخده عبر `--env-file`. ده التصميم الصحيح ومطابق لـ mazaya.

### إزاي تضيف الـ 3 secrets في GitHub

1. افتح: https://github.com/momarzouk1998/Open_Gym/settings/secrets/actions
2. اضغط **New repository secret**
3. ضيف التلاتة بالأسماء بالظبط زي ما هي مكتوبة فوق (case-sensitive).

### منين تجيب `SSH_PRIVATE_KEY`؟

المفتاح الخاص لازم يكون عندك على جهازك المحلي (اللي بتدخل بيه السيرفر). 

```bash
# على ويندوز / Git Bash — اعمل عرض للمفتاح:
cat ~/.ssh/id_ed25519          # أو id_rsa حسب نوع المفتاح
```

انسخ **النص كامل** من أول سطر `-----BEGIN ... PRIVATE KEY-----` لحد `-----END ... PRIVATE KEY-----`inclusive (مع كل الأسطر والفراغات بالظبط).

لو معندكش مفتاح SSH للسيرفر أصلاً، اعمل واحد جديد:

```bash
ssh-keygen -t ed25519 -C "github-actions-opengym"
# هيطلّع لك ملفين:
#   ~/.ssh/id_ed25519       (الخاص - تحطه في GitHub secret)
#   ~/.ssh/id_ed25519.pub   (العام - تحطه في السيرفر ~/.ssh/authorized_keys)
```

بعدها حط المفتاح العام على السيرفر:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub SSH_USER@SSH_HOST
```

---

## 🔁 تغيير مفتاح SSH بعد الإصلاح (موصى به)

عشان الخطوة الـ debugية القديمة كانت بتطبع المفتاح في الـ logs:

```bash
# 1. على جهازك: اعمل مفتاح جديد
ssh-keygen -t ed25519 -f ~/.ssh/opengym_ci_key -C "opengym-ci"

# 2. حط العام على السيرفر (ادخل بالمفتاح القديم أو كلمة السر)
ssh-copy-id -i ~/.ssh/opengym_ci_key.pub SSH_USER@SSH_HOST

# 3. على السيرفر: احذف أي بياركة قديمة مش لازمة من:
nano ~/.ssh/authorized_keys
# (احذف السطور القديمة لو عايز)

# 4. حدّث GitHub secret SSH_PRIVATE_KEY بالملف الجديد:
cat ~/.ssh/opengym_ci_key
# (انسخ النص وحطه مكان القديمة)

# 5. امسح logs الـ workflow القديمة لو ممكن من:
# Settings → Actions → أي runs قديمة → Delete run
```

---

## 📦 ملف `.env` على السيرفر

السكربت الحالي بيشاور على `/opt/openappo-gym/.env`. لو المسار مختلف على سيرفرك غيّره في deploy.yml أو انقل الملف.

محتوى الملف لازم يحتوي على (نفس المفاتيح اللي في `.env.local` محلياً، لكن بقيم الإنتاج):

```env
# Database
DATABASE_URL=postgresql://...@host:5432/opengym

# NextAuth
AUTH_SECRET=...
NEXTAUTH_URL=https://opengym.openappo.com

# App
NEXT_PUBLIC_APP_URL=https://opengym.openappo.com
NEXT_PUBLIC_APP_NAME=OpenGym
ADMIN_EMAIL=...

# WhatsApp & Instapay
NEXT_PUBLIC_WHATSAPP_NUMBER=...
NEXT_PUBLIC_INSTAPAY_NUMBER=...

# Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_ENDPOINT=...
R2_PUBLIC_BASE_URL=...

# Resend (Email)
RESEND_API_KEY=...
EMAIL_FROM=...
```

> ملاحظة: المتغيرات اللي بتبدأ بـ `NEXT_PUBLIC_` لازم تتكرر في الـ secret أو تتعمل build-time — بس في حالتنا (`--env-file`) بتتكبس في runtime، والـ public vars موجودة في الـ image من وقت البناء عبر `process.env`. لو فيه مشاكل في ظهور القيم public-side، نقول ونحلها.

---

## ⚙️ فرق بسيط (اختياري) — Swarm vs Standalone

| | mazaya | GYM |
|---|---|---|
| Runtime | Docker Swarm (`docker service`) | Docker standalone (`docker run --restart unless-stopped`) |
| الميزة | تحديث zero-downtime، replicas | أبسط، بدون إعداد swarm |

GYM اللي بيستخدم standalone **شغّال تمام ومش لازم تقلبه لـ Swarm**. الـ `--restart unless-stopped` كافي لو السيرفر هينزل مرة واحدة. لو عايز zero-downtime لاحقاً نقولك.

---

## 📝 خطوات التشغيل النهائية (Checklist)

1. [ ] افتح `Open_Gym` repo على GitHub → **Settings → Secrets and variables → Actions**
2. [ ] تأكد إن موجودة: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (لو ناقصة ضيفها)
3. [ ] على جهازك: عدّل `.github/workflows/deploy.yml` واحذف بلوك "Inspect secret"
4. [ ] اعمل commit على `main` و push
5. [ ] (موصى به) اعمل rotation لمفتاح SSH كما هو مشروح فوق
6. [ ] على السيرفر: تأكد إن `/opt/openappo-gym/.env` موجود وفيه كل المتغيرات
7. [ ] شغّل workflow يدوياً من تبويب Actions → Deploy → **Run workflow** عشان تختبر
8. [ ] اتأكد من الـ health checks في آخر السكربت:
   - `http://127.0.0.1:3000/` → HTTP 200
   - `https://opengym.openappo.com/` → HTTP 200

---

## ✅ النتيجة

بعد التعديل الواحد ده، نظام GYM Management = مظبوط 100% زي mazaya-system:
- استهلاك DigitalOcean أثناء البناء = صفر (البناء على GitHub)
- السيرفر بس بيسحب صورة ويعمل restart
- نفس مستوى الأمان (non-root user، standalone image، secrets في GitHub Actions)
