#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Отримуємо список змінених файлів
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo "No files staged for commit."
  exit 0
fi

ERROR_COUNT=0

# Перевірка Django шаблонів
TEMPLATE_FILES=$(echo "$STAGED_FILES" | grep '\.html$' || echo "")
if [ -n "$TEMPLATE_FILES" ]; then
  echo "Checking Django templates..."
  bash scripts/check_template_tags.sh || ((ERROR_COUNT++))
fi

# Перевірка CSS
CSS_FILES=$(echo "$STAGED_FILES" | grep '\.css$' | grep -v 'normalize.css' || echo "")
if [ -n "$CSS_FILES" ]; then
  echo "Checking CSS files..."
  npx stylelint $CSS_FILES || true  # stylelint warnings не блокують коміт, кастомні правила перевіряють критичні речі
  bash scripts/check-css-rules.sh || ((ERROR_COUNT++))
fi

# Перевірка JS
JS_FILES=$(echo "$STAGED_FILES" | grep '\.js$' || echo "")
if [ -n "$JS_FILES" ]; then
  echo "Checking JavaScript files..."
  npx eslint $JS_FILES || ((ERROR_COUNT++))
  bash scripts/check-js-rules.sh || ((ERROR_COUNT++))
fi

# Перевірка HTML (виключаємо email шаблони, оскільки вони потребують inline styles)
if [ -n "$TEMPLATE_FILES" ]; then
  echo "Checking HTML structure..."
  HTML_FILES=$(echo "$TEMPLATE_FILES" | grep -v '/emails/' || echo "")
  if [ -n "$HTML_FILES" ]; then
    npx htmlhint $HTML_FILES || ((ERROR_COUNT++))
  fi
  bash scripts/check-html-rules.sh || ((ERROR_COUNT++))
fi

# Перевірка Python
PY_FILES=$(echo "$STAGED_FILES" | grep '\.py$' || echo "")
if [ -n "$PY_FILES" ]; then
  echo "Checking Python files..."
  bash scripts/check-python-rules.sh || ((ERROR_COUNT++))
fi

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ Pre-commit checks failed! Fix errors before committing."
  echo "Run 'npm run fix:rules' to auto-fix some issues."
  exit 1
fi

echo "✅ All pre-commit checks passed!"
exit 0

