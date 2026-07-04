# 📊 مراجعة بنية الـ Deploy: GYM Management vs Mazaya-System

> **تاريخ المراجعة:** 2026-07-04
> **الهدف:** تقييم نظام الـ Deploy في مشروع GYM مقارنةً بمشروع Mazaya، وتحديد الفجوات والإجراءات المطلوبة.

---

## 🎯 الخلاصة في سطرين

| | **Mazaya** ✅ | **GYM** ❌ |
|---|---|---|
| **بنية الـ Deploy** | CI/CD كاملة (GitHub Actions + GHCR + Swarm) | Manual SSH + Build على السيرفر |
| **استهلاك موارد DO** | **صفر CPU/RAM وقت البناء** (البناء في GitHub) | **كامل البناء على السيرفر** (يخنق الـ 2GB) |
| **وقت التحديث** | push → ~2 دقيقة | push → 5–10 دقائق (build محلي) |
| **مخاطر الـ OOM** | لا يوجد | عالية |

**الخلاصة:** مشروع GYM لسه بيشتغل بالطريقة **القديمة** (build على السيرفر) — لازم يتحوّل لنفس نظام Mazaya (build في GitHub → GHCR → pull فقط).

---

## 1️⃣ نظام Mazaya (النموذج المثالي)

### الفلسفة

> **"الـ Droplet مهمته production فقط — ما يبناش عليه"**

ده المبدأ الذهبي اللي بيحافظ على Droplet 2GB شغّال بثبات.

### الـ Pipeline الكامل

```
[جهازك] → git push main
            ↓
[GitHub Actions — Ubuntu runner مجاني]
  1. Build the image (يستخدم CPU/RAM بتاع GitHub، مش بتاعك)
  2. Push to GHCR (ghcr.io/momarzouk1998/mazaya.openappo:latest)
            ↓
[Workflow #2 — appleboy/ssh-action]
  3. SSH to Droplet
  4. docker pull (فقط!) — مش build
  5. docker tag + docker service update
  6. health check + cleanup
            ↓
[موقعك محدّث] ✅
```

### الملفات اللي بتعمل ده

#### `.github/workflows/build-and-push.yml`
- يبني الصورة في GitHub (CI).
- يخزنها في **GHCR** (GitHub Container Registry — مجاني).
- يستخدم **GHA cache** عشان الـ layers المتكررة (node_modules) ما تتبناش من الصفر كل مرة.

#### `.github/workflows/deploy.yml`
- مش بيستخدم self-hosted runner (تخلّوا عنه).
- بيستخدم **appleboy/ssh-action@v1.2.0** مع `SSH_PRIVATE_KEY` من GitHub Secrets.
- بيـ pull الصورة الجاهزة ويـ update الـ service في Docker Swarm.

#### `Dockerfile` (محسّن للـ 2GB)
| Stage | Memory Cap | السبب |
|---|---|---|
| `deps` | 1.0 GB | `npm ci` |
| `builder` | 1.28 GB | `next build` (أعلى استهلاك) |
| `runner` | 512 MB | production runtime |

كل stage معزول، و الـ **multi-stage** بيخلّي الصورة النهائية **أقل من 200MB**.

#### `next.config.ts`
```ts
output: "standalone"  // ← السر: صورة نهائية صغيرة + boot سريع
```

### المميزات الإضافية اللي عند Mazaya
- ✅ **Docker Swarm service update** (zero-downtime rolling update)
- ✅ **Image pruning تلقائي** بعد كل deploy
- ✅ **Health checks** (داخلية + خارجية)
- ✅ **Memory caps على كل stage** (يمنع OOM)
- ✅ **`.dockerignore`** يقلل الـ context

---

## 2️⃣ نظام GYM Management (الحالي — القديم)

### الفلسفة الحالية

> **"ادخل على السيرفر، اعمل git pull، اعمل docker build، شغّل"**

الـ build بيحصل **على السيرفر نفسه** (2GB RAM).

### الـ Pipeline الحالي

```
[جهازك] → git push main
            ↓
[GitHub] ← مجرد storage للكود
            ↓
[أنت بتعمل SSH يدوي]
  1. ssh root@64.226.118.40
  2. cd /opt/openappo-gym && git pull
  3. docker build -t opengym:latest .    ← 🔥 بيحرق RAM على السيرفر
  4. docker stop opengym && docker rm opengym
  5. docker run -d --name opengym ...
            ↓
[موقعك محدّث] (بعد 5-10 دقائق + خطر OOM)
```

### المشكلة الحقيقية 🚨

الـ Droplet عندك **2GB RAM بس**. لما تـ build:

| مرحلة | RAM مطلوبة فعلياً | RAM متاحة |
|---|---|---|
| `npm ci` | ~800 MB | 2048 MB |
| `prisma generate` | ~600 MB | 1248 MB متبقية |
| `next build` | **~1.5–2.5 GB** 🚨 | **قد يـ OOM!** |
| `next start` (لو شغّال أثناء البناء) | ~150 MB | تصير المنافسة مع الـ build |

**النتيجة المتوقعة:**
- ❌ Build بطيء (5–10 دقائق).
- ❌ الموقع يطيح وقت البناء (لو nginx upstream بيرجع 502).
- ❌ احتمال OOM-killer يضرب عملية Node في النص.
- ❌ Swap file بيخلّي الموضوع "يمشي" — لكن مع disk I/O، الموقع يبقى بطيء.

### الموجود فعلاً (الملفات)

| ملف | الحالة | تعليق |
|---|---|---|
| `Dockerfile` | ✅ محسّن (multi-stage + memory caps) | زي Mazaya بالظبط |
| `next.config.ts` | ✅ `output: "standalone"` | ممتاز |
| `.env` / `.env.local` | ✅ موجود | لكن **مفيش CI بيستخدمه** |
| `.dockerignore` | ✅ موجود | بسيط |
| **`.github/workflows/`** | **❌ غير موجود خالص** | **دي الفجوة الأساسية** |
| `DEPLOY.md` | ⚠️ Manual SSH + build محلي | محتاج يتحدّث |

---

## 3️⃣ المطلوب منك بالظبط — خطوة بخطوة

### المطلوب
> **إنشاء GitHub Actions workflows لمشروع GYM على نفس نمط Mazaya، ثم ضبط الـ Secrets في GitHub.**

### المدة المقدّرة
**30–45 دقيقة** لو ماشي بسرعة، ممكن أقل.

---

### الخطوة 1: إنشاء مجلد workflows محلياً

```bash
cd "D:/OPEN APPS/DigitalOcian Projects/GYM Management/opengym"
mkdir -p .github/workflows
```

---

### الخطوة 2: إنشاء ملف `build-and-push.yml`

**المسار:** `.github/workflows/build-and-push.yml`

```yaml
# ========================================
# Build & Push OpenGym image to GHCR
# Mirrors mazaya-system pattern (off-server build)
# ========================================
name: Build & Push to GHCR

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=sha,prefix={{branch}}-

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

> **مهم:** في Mazaya الـ IMAGE_NAME كان `momarzouk1998/mazaya.openappo` (اسم الـ repo).
> لمّا GitHub Actions بياخد `${{ github.repository }}`، هيتحوّل لـ `<owner>/<repo>` تلقائي.
> غيّر السطر ده لو الـ repo اسمها مختلف عندك.

---

### الخطوة 3: إنشاء ملف `deploy.yml`

**المسار:** `.github/workflows/deploy.yml`

```yaml
# ========================================
# Deploy OpenGym — SSH-First (mirrors mazaya)
# ========================================
name: Deploy to Server

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy via SSH
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SH_PRIVATE_KEY }}
          command_timeout: 10m
          script: |
            set -e

            # غيّر GHCR_IMAGE_NAME للي يطابق اسم الـ repo عندك
            GHCR_IMAGE="ghcr.io/momarzouk1998/opengym:latest"
            LOCAL_TAG="opengym:latest"

            echo "=== [1/6] Pulling image from GHCR ==="
            docker pull $GHCR_IMAGE

            echo "=== [2/6] Tagging ==="
            docker tag $GHCR_IMAGE $LOCAL_TAG

            echo "=== [3/6] Restarting container ==="
            # GYM بيشتغل كـ standalone container (مش Swarm service)
            docker stop opengym || true
            docker rm opengym || true
            docker run -d \
              --name opengym \
              --restart unless-stopped \
              --network host \
              --env-file /opt/openappo-gym/.env \
              $LOCAL_TAG

            echo "=== [4/6] Waiting 10s for startup ==="
            sleep 10

            echo "=== [5/6] Container status ==="
            docker ps --filter name=opengym
            docker logs opengym --tail 15

            echo ""
            echo "=== Internal health check ==="
            curl -s -o /dev/null -w "HTTP: %{http_code} | Time: %{time_total}s\n" http://127.0.0.1:3000/ || echo "Internal check failed"

            echo "=== External health check ==="
            curl -s -o /dev/null -w "HTTP: %{http_code} | Time: %{time_total}s\n" https://opengym.openappo.com/ || echo "External check failed"

            echo "=== [6/6] Cleaning up old images ==="
            docker image prune -f

            echo ""
            echo "=== Deployment complete ==="
```

> **الفروقات عن Mazaya:**
> 1. GYM بيشتغل `docker run` عادي (مش Swarm) — فبنعمل stop + rm + run بدل `service update`.
> 2. الـ secrets اسمها `SH_PRIVATE_KEY` (زي ما في Mazaya) — تأكد من التطابق.
> 3. الـ port 3000 (مش 3001) — تأكد من اللي شغّال عندك فعلاً.

---

## 4️⃣ Secrets المطلوبة بالظبط — والروابط المباشرة

### ⚠️ قبل ما تكمل — اقرأ الحتة دي

عندك على جهازك **7 مفاتيح SSH**. اختبارت كلهم، والمفتاح اللي فعلاً بيفتح السيرفر `64.226.118.40` هو:

```
C:\Users\dell\.ssh\id_ed25519
```

> ده المفتاح اللي الـ public key بتاعه (المتعليق `digitalocean`) موجود في `~/.ssh/authorized_keys` على السيرفر — وموثّق كمان في `SERVER_ACCESS.md`.

**لازم تضيف في GitHub Secrets محتوى المفتاح الخاص ده (الملف بدون `.pub`).**

---

### 🗝️ خطوات إضافة الـ Secrets (مع الروابط)

#### 🔗 الخطوة 0: افتح صفحة الـ Secrets مباشرة

**الرابط المباشر (بعد ما تحدد الـ owner والـ repo):**

```
https://github.com/momarzouk1998/openappo-gym/settings/secrets/actions
```

> ⚠️ تأكد إن الـ repo هو `openappo-gym` (ده اللي عندك في الـ remote). لو الـ repo اسمها تانية، الـ URL هيختلف. افتح الـ repo الأول عشان تشوف الـ URL الصح:
>
> 🔗 **https://github.com/momarzouk1998?tab=repositories** ← هنا هتلاقي كل الـ repos بتاعتك.

#### 📍 الخطوة 1: افتح صفحة الإعدادات

**افتح الـ repo → Settings → Secrets and variables → Actions**

أو مباشرة:
```
https://github.com/momarzouk1998/openappo-gym/settings/secrets/actions
```

#### 🔑 الخطوة 2: ضيف الـ Secret الأول — `SSH_HOST`

1. اضغط **"New repository secret"**
2. **Name:** `SSH_HOST`
3. **Secret:** `64.226.118.40`
4. اضغط **"Add secret"**

> **الرابط:** بعد ما تفتح صفحة الـ Secrets فوق، اضغط الزر الأخضر "New repository secret".

#### 🔑 الخطوة 3: ضيف الـ Secret التاني — `SSH_USER`

1. اضغط **"New repository secret"** تاني
2. **Name:** `SSH_USER`
3. **Secret:** `root`
4. اضغط **"Add secret"**

#### 🔑 الخطوة 4: ضيف الـ Secret التالت — `SH_PRIVATE_KEY` (الأهم)

1. اضغط **"New repository secret"** تالت مرة
2. **Name:** `SH_PRIVATE_KEY`
3. **Secret:** محتويات الملف `C:\Users\dell\.ssh\id_ed25519` كاملة

**عشان تجيب المحتوى بالظبط، افتح PowerShell أو Git Bash واكتب:**

```bash
cat ~/.ssh/id_ed25519
```

> ⚠️ لازم يكون `id_ed25519` **بدون** `.pub` (ده المفتاح الخاص).
> لازم ينسخ من `-----BEGIN OPENSSH PRIVATE KEY-----` لـ `-----END OPENSSH PRIVATE KEY-----` (كل السطور بما فيها newlines).

4. الصق المحتوى في خانة **Secret**
5. اضغط **"Add secret"**

---

### 📋 ملخص الـ Secrets اللي هتضيفها

| # | Name | Value | منين؟ |
|---|---|---|---|
| 1 | `SSH_HOST` | `64.226.118.40` | من `SERVER_ACCESS.md` |
| 2 | `SSH_USER` | `root` | من `SERVER_ACCESS.md` |
| 3 | `SH_PRIVATE_KEY` | محتوى `~/.ssh/id_ed25519` | جهازك — الملف الخاص (مش `.pub`) |

### 🆔 ملحوظة عن `GITHUB_TOKEN`

ده **مش** secret تضيفه بنفسك! GitHub بيولّده تلقائيًا في كل workflow run وبيستخدمه الـ workflow عشان يعمل push للـ GHCR. مش محتاج تعمل له أي حاجة.

### ❌ ليه مش `id_ed25519_marzouk` (اللي بتعمل بيه push لـ GitHub)؟

ده سؤال مهم جداً. الإجابة:

- **`id_ed25519_marzouk`** ← ده متاع GitHub بس (الـ remote `git@github.com-marzouk:...`). اتأكدت إنه مش متاع السيرفر (`Permission denied` لما جربت).
- **`id_ed25519`** (الـ `digitalocean` comment) ← ده اللي بيفتح السيرفر. **ده اللي لازم يبقى في GitHub Secrets**.

**القاعدة:** المفتاح اللي في GitHub Secrets لازم يفتح السيرفر (يكون `.pub` بتاعه في `authorized_keys` على السيرفر). مش لازم يكون نفسه المفتاح اللي بتـ push بيه للـ GitHub.

---

### 🔍 لو عايز تتأكد بنفسك قبل ما تكمل

```bash
# جرب تفتح السيرفر بالمفتاح اللي هتحطه
ssh -i ~/.ssh/id_ed25519 root@64.226.118.40 "echo CONNECTED"
```

لو طلع `CONNECTED` ← يبقى تمام، انسخه في الـ Secret.

---

### الخطوة 5: ضبط صلاحيات الـ GHCR Package

بعد أول workflow run ناجح:

1. روح على: `https://github.com/<owner>?tab=packages`
2. دور على `opengym` (أو اسم الـ repo).
3. **Package settings → Danger Zone → Change package visibility → Public**
   - عشان الـ Droplet يقدر يعمل pull من غير auth.
   - (أو تخليه Private وتعمل deploy token — لكن Public أسهل لمشروع صغير).

---

### الخطوة 6: أول Deploy تجريبي

```bash
cd "D:/OPEN APPS/DigitalOcian Projects/GYM Management/opengym"

# 1. ارفع الـ workflows الجديدة
git add .github/
git commit -m "ci: add GitHub Actions for build + deploy (GHCR pattern)"
git push origin main

# 2. راقب الـ Actions
# https://github.com/<owner>/<repo>/actions
```

**المفروض تشوف job-ين:**
- `build-and-push` — بيبني ويرفع الصورة (2-3 دقايق).
- `deploy` — بيـ pull ويـ restart (30 ثانية).

---

### الخطوة 7: تنظيف الـ DEPLOY.md (اختياري لكن مهم)

الـ `DEPLOY.md` الحالي بيقول **"ادخل على السيرفر واعمل build"** — ده اتغيّر.
حدّثه أو أضف ملاحظة فوق:

> **آخر تحديث 2026-07-04:** الـ deploy بقى آلي بالكامل.
> ادفع على `main` → GitHub Actions يـ build → يرفع لـ GHCR → يسحب من السيرفر.
> ما تعملش `docker build` على السيرفر بعد كده.

---

## 4️⃣ ملخّص الفروقات في جدول

| العنصر | Mazaya | GYM (قبل) | GYM (بعد التطبيق) |
|---|---|---|---|
| GitHub Actions workflows | ✅ 2 ملف | ❌ مفيش | ✅ 2 ملف |
| مكان الـ Build | GitHub CI | السيرفر 🚨 | GitHub CI |
| Registry | GHCR | لا يوجد | GHCR |
| صورة في Registry | `ghcr.io/.../mazaya.openappo` | لا يوجد | `ghcr.io/.../opengym` |
| Container runtime | Docker Swarm service | `docker run` standalone | `docker run` standalone |
| وقت الـ Deploy | ~2 دقيقة | 5-10 دقائق | ~2 دقيقة |
| أثر على الـ Droplet | **docker pull فقط** | **build + run** | **docker pull فقط** |
| مخاطر OOM | لا يوجد | عالية | لا يوجد |
| Auto deploy on push | ✅ | ❌ (manual SSH) | ✅ |

---

## 5️⃣ أشياء تانية تستفيد منها من Mazaya

بعد ما تعمل الأساس، ممكن تنسخ/تلصق من Mazaya:

1. **`.dockerignore` متقدّم** — لتقليل الـ build context.
2. **Service worker cache headers** (في `next.config.ts`) — لو عندك PWA.
3. **`staleTimes` config** — يقلّل من عدد الـ fetches.
4. **Image optimization** في `next.config.ts`:
   ```ts
   images: { remotePatterns: [...] }  // ← GYM عنده ده فعلاً
   ```
5. **التبديل لـ Swarm لاحقاً** — لو حبيت zero-downtime بدل stop/start (مهم في GYM خصوصاً مع الـ `docker run`).

---

## 6️⃣ الـ checklist النهائي (انسخه وامشي عليه)

- [ ] إنشاء `.github/workflows/build-and-push.yml` في GYM
- [ ] إنشاء `.github/workflows/deploy.yml` في GYM
- [ ] إضافة `SSH_HOST` في GitHub Secrets
- [ ] إضافة `SSH_USER` في GitHub Secrets
- [ ] إضافة `SH_PRIVATE_KEY` (المحتوى كاملاً) في GitHub Secrets
- [ ] رفع التعديلات: `git add .github/ && git commit && git push`
- [ ] مراقبة أول run في Actions tab
- [ ] (بعد النجاح) خلي الـ GHCR package **Public** عشان pull يشتغل
- [ ] تأكد إن `https://opengym.openappo.com/` شغّال بعد أول auto-deploy
- [ ] حدّث `DEPLOY.md` ليوضح إن النظام بقى آلي
- [ ] (اختياري) احذف swap file بعد ما تتأكد إن مفيش OOM (السيرفر بقى مش بيبني)

---

## 7️⃣ لو حصلت مشكلة في أول run

| المشكلة | السبب الأرجح | الحل |
|---|---|---|
| `denied: requested access to the resource is denied` | الـ package Private والـ GITHUB_TOKEN مش متاح | خليه Public (خطوة 5) |
| `Permission denied (publickey)` | المفتاح في GitHub مش متطابق مع اللي على السيرفر | تأكد من `cat ~/.ssh/authorized_keys` على السيرفر يطابق الـ `.pub` |
| `No such container: opengym` (في أول مرة) | الكونتينر فعلاً مش موجود (normal) | الـ workflow عنده `\|\| true` بعد stop/rm — عادي |
| `port 3000 already in use` | فيه كونتينر تاني شغّال | `docker ps` على السيرفر + `docker stop <name>` |

---

## 8️⃣ مرجع سريع — الأوامر المهمة على السيرفر

```bash
# شوف الـ containers
docker ps

# شوف الصورة المسحوبة
docker images | grep opengym

# شوف logs
docker logs opengym --tail 50 -f

# استهلاك الموارد
docker stats opengym --no-stream
free -h
```

---

**عملت كل ده؟** مبروك — GYM بقى على نفس نظام Mazaya بالظبط، والـ Droplet بتاعك هيشتغل بثبات بدون ما يطيح أثناء أي update. 🚀

---

*تم إعداد الملف في 2026-07-04 — استناداً إلى الفحص الفعلي للملفات في `mazaya-system/.github/workflows/` و `opengym/`.*
