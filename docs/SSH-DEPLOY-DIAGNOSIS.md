# تشخيص مشكلة الـ SSH Deploy — OpenGym

> التاريخ: 2026-07-04
> الحالة: **تحتاج خطوة أخيرة من المستخدم** (اختبار مباشر من Azure IP)

---

## 🔴 المشكلة الأصلية

Workflow الـ Deploy في `Open_Gym` بيقع بعد ~8 ثواني بالخطأ:

```
ssh: handshake failed: ssh: unable to authenticate,
attempted methods [none publickey], no supported methods remain
```

الـ Build workflow شغّال 100% (الصورة بتترفع على GHCR بنجاح).
المشكلة في خطوة الـ SSH deployment فقط.

---

## ✅ اللي اتأكدنا منه (كل ده **صحيح**)

| الفحص | النتيجة | خلاصة |
|---|---|---|
| الـ 3 secrets موجودة في GitHub | `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` | ✅ موجودة |
| المفتاح في GitHub valid | `Fingerprint: SHA256:DSm8...digitalocean (ED25519)` | ✅ صحيح |
| المفتاح على جهازك المحلي | نفس الـ fingerprint بالظبط (399 bytes) | ✅ صحيح |
| المفتاح على السيرفر (`~/.ssh/authorized_keys`) | نفس الـ public key بالظبط | ✅ مطابق |
| `sshd_config` | `PermitRootLogin yes`, `PubkeyAuthentication yes` | ✅ صحيح |
| `/etc/ssh/sshd_config.d/` | مفيش override لـ root (فقط `PasswordAuthentication no`) | ✅ صحيح |
| صلاحيات `/root` و `~/.ssh` و `authorized_keys` | `700`, `700`, `600` | ✅ صحيحة |
| UFW firewall | `OpenSSH ALLOW Anywhere` | ✅ مفتوح |
| الاتصال من جهازك | `ssh root@64.226.118.40` شغّال 100% | ✅ شغّال |
| `pubkeyacceptedalgorithms` | بيحتوي `ssh-ed25519` | ✅ يدعم المفتاح |

**الخلاصة: كل الـ prerequisites سليمة.** المفتاح صحيح، السيرفر صحيح، الإعدادات صحيحة.

---

## 🧪 التجارب اللي اتعملت ونتيجتها

### 1. حذف خطوة "Inspect secret" اللي بتسرب المفتاح
- ✅ اتعمل (commit `17d5f1b`)
- النتيجة: **ماحلّش المشكلة** (كانت debug فقط)

### 2. تحديث `SSH_PRIVATE_KEY` بـ `Get-Content -Raw | Set-Clipboard`
- ✅ اتعمل
- النتيجة: المفتاح وصل 399 bytes بالظبط زي الملف الأصلي
- **ماحلّش المشكلة**

### 3. تعيين الـ secret بـ `gh secret set < file` (من غير PowerShell)
- ✅ اتعمل
- النتيجة: نفس الـ fingerprint
- **ماحلّش المشكلة** → أثبت إن المشكلة **مش في الـ secret**

### 4. فحص fail2ban
- ✅ لقينا IP محظور: `20.62.194.5` (Microsoft Azure = GitHub Actions)
- ✅ فكّينا الحظر: `fail2ban-client unban 20.62.194.5`
- ✅ ضفنا GitHub IPs لـ whitelist في `/etc/fail2ban/jail.d/github-whitelist.local`
- النتيجة: `Currently banned: 0`
- **ماحلّش المشكلة**

### 5. Verbose SSH من جوه الـ workflow
- ✅ أضفنا `ssh -v` debug
- النتيجة الأهم:
  ```
  debug1: Offering public key: ED25519 SHA256:DSm8... explicit
  debug1: Authentications that can continue: publickey
  debug1: No more authentication methods to try.
  Permission denied (publickey)
  ```
- **التشخيص**: السيرفر بيوصل، kex بيتم، host key يتقبل، المفتاح يتعمل offer، **بس السيرفر بيرفضه**.

### 6. فحص auth.log على السيرفر
- ✅ آخر سطور بتظهر:
  ```
  Accepted publickey for root from 104.28.161.141 ... ED25519 SHA256:DSm8...
  ```
- `104.28.161.141` = Cloudflare WARP (الاتصال من جهازك)
- **لكن**: محاولات GitHub Actions **مش بتعمل entry ناجح ولا فاشل في auth.log** في وقت الـ workflow

---

## 🎯 السبب المرجّح (غير مؤكد 100%)

المشكلة الأكتر احتمالاً هي:

### احتمال A — `fail2ban` بيحظر GitHub IPs رغم الـ whitelist

الـ whitelist ممكن يكون فيه خطأ syntax (حصل warning وقت الـ reload)، أو fail2ban بيحظر IPs جديده من GitHub اللي مش في القائمه قبل الـ reload.

**اختبار**: لازم نراقب fail2ban **أثناء** تشغيل الـ workflow.

### احتمال B — فيه جدار ناري أعلى مستوى (DigitalOcean Firewall / Cloudflare)

أحياناً DigitalOcean Cloud Firewall أو Cloudflare proxy بيحظر IPs معينة قبل ما توصل للسيرفر.

**اختبار**: نراقب auth.log + fail2ban status **أثناء** الـ workflow.

---

## 🛠️ المطلوب منك دلوقتي (اختبار حاسم)

### الخطوة 1: استعد لمراقبة السيرفر في الوقت الحقيقي

افتح PowerShell وده شغّاله (هيفضل يراقب auth.log حي):

```powershell
ssh root@64.226.118.40 "tail -f /var/log/auth.log" 2>&1 | Select-String "sshd"
```

**سيب الشاشة دي مفتوحة.**

### الخطوة 2: في PowerShell تانية — قولي "جاهز"

لما تقول "جاهز"، أنا هشغّل الـ workflow، وأنت هتشوف محاولات GitHub بتظهر على السيرفر ولا لأ.

### اللي محتاجين نشوفه في الشاشة الأولى:

| لو شفت ده | المعنى |
|---|---|
| `Connection from <IP> port XXXX` | الاتصال وصل للسيرفر |
| `Failed publickey for root from <IP>` | المفتاح اتعمل offer بس اترفض |
| **مفيش أي حاجة بتظهر** | الاتصال مش بيوصل للسيرفر أصلاً (firewall أعلى) |

---

## 🔄 بدائل لو الاختبار فشل (احتياط)

### لو اتأكدنا إن المشكلة في المفتاح رغم كل حاجة

نولّد مفتاح **جديد مخصص لـ GitHub Actions** (مش مفتاحك الشخصي):

```powershell
# على جهازك
ssh-keygen -t ed25519 -f $HOME\.ssh\opengym_ci -C "opengym-ci" -N ""

# اعرض المفتاح العام (هنضيفه على السيرفر)
Get-Content $HOME\.ssh\opengym_ci.pub

# اعرض المفتاح الخاص (هنحطه في GitHub secret)
Get-Content $HOME\.ssh\opengym_ci -Raw | Set-Clipboard
```

بعدين:
1. على السيرفر: ضيف الـ public key لـ `~/.ssh/authorized_keys`
2. على GitHub: حدّث `SSH_PRIVATE_KEY` بالـ private key الجديد
3. أعِد تشغيل الـ workflow

### لو المشكلة في firewall أعلى (DigitalOcean)

لو auth.log مفيهوش أي entry من GitHub IPs:
- راجع **DigitalOcean → Networking → Firewalls** لو فيه firewall على الـ droplet
- أو لو السيرفر ورا **Cloudflare proxy**، فـ SSH مش بيشتغل عبر Cloudflare proxy أصلاً (لازم تستخدم IP مباشر زي ما احنا عاملين)

---

## 📁 الملفات اللي اتعدّلت (commit history)

```
31d6a3e ci(deploy): verbose ssh + source IP debug
b1fcf16 ci(deploy): test SSH with real ssh-keygen + ssh client
29cae20 ci(deploy): detect CRLF + test normalized key
17d5f1b ci(deploy): safe debug step — key fingerprint + host/user values
50b419d fix(deploy): rename secret to SSH_PRIVATE_KEY (matches mazaya)
```

> ⚠️ **بعد ما تحل المشكلة**: لازم **تحذف خطوات الـ debug** من `.github/workflows/deploy.yml` وترجّع للنسخة النظيفة (نفس شكل mazaya deploy.yml بالظبط).

---

## ✅ خطوات ما بعد الحل (Checklist)

- [ ] تأكيد إن الـ deploy شغّال من GitHub Actions
- [ ] حذف خطوات الـ debug من `deploy.yml` (رجوع للنسخة النظيفة)
- [ ] عمل rotation لمفتاح SSH (لأن المفتاح اتسرب في logs الـ debug القديمة)
- [ ] التأكد من إن `/opt/openappo-gym/.env` موجود ومظبوط على السيرفر
- [ ] اختبار الـ health check النهائي: `https://opengym.openappo.com/`

---

## 📞 لما ترجعلي

قولي بس:
1. **"جاهز للمراقبة"** — وأنا أشغّل الـ workflow
2. أو **"محتاج المفتاح الجديد"** — وأنا أوريك الخطوات بالتفصيل
