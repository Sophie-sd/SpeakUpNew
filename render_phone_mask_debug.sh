#!/bin/bash
# Команди для діагностики проблеми з маскою телефону на Render
# Виконайте ці команди в Render Shell (Render Dashboard → Your Service → Shell)

echo "========================================="
echo "🔍 Діагностика маски телефону на Render"
echo "========================================="
echo ""

# 1. Перевірка наявності оновленого файлу
echo "1️⃣ Перевірка файлу form-helpers.js:"
echo "----------------------------------------"
ls -la staticfiles/js/utils/form-helpers.js
echo ""
echo "Перевірка розміру файлу (має бути ~436 рядків):"
wc -l staticfiles/js/utils/form-helpers.js
echo ""

# 2. Перевірка чи є нова функція calculateNewCursorPosition
echo "2️⃣ Перевірка наявності нової функції:"
echo "----------------------------------------"
grep -c "calculateNewCursorPosition" staticfiles/js/utils/form-helpers.js
echo ""

# 3. Перевірка вмісту функції
echo "3️⃣ Перевірка вмісту функції initPhoneMask:"
echo "----------------------------------------"
grep -A 10 "export function initPhoneMask" staticfiles/js/utils/form-helpers.js | head -15
echo ""

# 4. Перевірка чи правильно зібрався collectstatic
echo "4️⃣ Перевірка дати модифікації файлу:"
echo "----------------------------------------"
stat -f "%Sm %N" -t "%Y-%m-%d %H:%M:%S" staticfiles/js/utils/form-helpers.js 2>/dev/null || ls -lh staticfiles/js/utils/form-helpers.js
echo ""

# 5. Перевірка чи файл в static теж оновлений
echo "5️⃣ Порівняння з файлом в static:"
echo "----------------------------------------"
if [ -f "static/js/utils/form-helpers.js" ]; then
    echo "Файл в static існує"
    wc -l static/js/utils/form-helpers.js
    echo "Перевірка calculateNewCursorPosition в static:"
    grep -c "calculateNewCursorPosition" static/js/utils/form-helpers.js
else
    echo "⚠️ Файл в static не знайдено"
fi
echo ""

# 6. Перевірка чи collectstatic виконався правильно
echo "6️⃣ Перевірка чи collectstatic виконався:"
echo "----------------------------------------"
python manage.py collectstatic --noinput --dry-run 2>&1 | tail -5
echo ""

# 7. Перевірка вмісту файлу (перші 100 рядків)
echo "7️⃣ Перші 100 рядків файлу (для перевірки):"
echo "----------------------------------------"
head -100 staticfiles/js/utils/form-helpers.js | tail -20
echo ""

echo "========================================="
echo "✅ Діагностика завершена"
echo "========================================="
echo ""
echo "Якщо файл не оновився, виконайте:"
echo "  python manage.py collectstatic --noinput"
echo ""
echo "Потім перезапустіть сервіс в Render Dashboard"

