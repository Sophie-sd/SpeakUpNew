#!/bin/bash
set -e

echo "Downloading normalize.css v8.0.1..."

# Створюємо директорію якщо не існує
mkdir -p static/css

# Завантажуємо normalize.css
curl -o static/css/normalize.css https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css

# Додаємо коментар вгорі
sed -i.bak '1i\
/*!\
 * normalize.css v8.0.1\
 * ❌ WARNING: DO NOT MODIFY THIS FILE\
 * This file is managed by scripts/download-normalize.sh\
 */\
' static/css/normalize.css

# Видаляємо backup файл
rm -f static/css/normalize.css.bak

echo "✅ normalize.css downloaded successfully!"


