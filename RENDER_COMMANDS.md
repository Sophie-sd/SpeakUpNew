# Команди для Render Shell - Діагностика маски телефону

## Швидкі команди для копіювання в Render Shell:

### 1. Перевірка чи файл оновився:
```bash
ls -lh staticfiles/js/utils/form-helpers.js
wc -l staticfiles/js/utils/form-helpers.js
```

### 2. Перевірка чи є нова функція:
```bash
grep -c "calculateNewCursorPosition" staticfiles/js/utils/form-helpers.js
```

### 3. Перевірка вмісту (має бути нова функція):
```bash
grep -A 5 "calculateNewCursorPosition" staticfiles/js/utils/form-helpers.js
```

### 4. Якщо файл не оновився - перезберіть статику:
```bash
python manage.py collectstatic --noinput
```

### 5. Перевірка чи файл правильно зібрався:
```bash
head -120 staticfiles/js/utils/form-helpers.js | tail -30
```

### 6. Перевірка дати модифікації:
```bash
stat staticfiles/js/utils/form-helpers.js
```

---

## Якщо файл не оновився на Render:

1. **Перевірте чи зміни закомічені в Git:**
   ```bash
   git log --oneline -5 static/js/utils/form-helpers.js
   ```

2. **Перевірте чи Render підтягнув останні зміни:**
   - Render Dashboard → Your Service → Events
   - Перевірте останній deploy

3. **Примусово перезберіть статику:**
   ```bash
   python manage.py collectstatic --noinput --clear
   ```

4. **Перезапустіть сервіс:**
   - Render Dashboard → Your Service → Manual Deploy → Clear build cache & deploy

---

## Якщо файл оновився, але все одно не працює:

1. **Перевірте чи немає помилок JavaScript в логах:**
   - Render Dashboard → Logs
   - Шукайте помилки з "form-helpers" або "initPhoneMask"

2. **Перевірте чи файл завантажується в браузері:**
   - Відкрийте сайт → F12 → Network
   - Знайдіть `form-helpers.js`
   - Перевірте Response - має бути нова версія з `calculateNewCursorPosition`

3. **Очистіть кеш браузера:**
   - Cmd+Shift+R (Mac) або Ctrl+Shift+R (Windows)

---

## Найшвидше рішення:

Якщо файл не оновився, виконайте в Render Shell:
```bash
python manage.py collectstatic --noinput
```

Потім в Render Dashboard:
- Settings → Manual Deploy → Clear build cache & deploy

