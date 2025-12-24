#!/bin/bash
set -e

echo "========================================="
echo "🐍 Python Custom Rules Check"
echo "========================================="

ERROR_COUNT=0
WARNING_COUNT=0

# Знаходимо всі Python файли
PY_FILES=$(find . -name "*.py" -not -path "*/venv/*" -not -path "*/node_modules/*" -not -path "*/migrations/*" 2>/dev/null || echo "")

if [ -z "$PY_FILES" ]; then
  echo "⚠️  No Python files found"
  exit 0
fi

# Правило 1: Перевірка type hints (warning)
echo ""
echo "📝 [Rule 1] Checking for type hints..."
NO_HINTS=$(echo "$PY_FILES" | xargs grep -L 'def.*->.*:' 2>/dev/null | wc -l || echo "0")
if [ "$NO_HINTS" -gt 0 ]; then
  echo "⚠️  $NO_HINTS files without return type hints"
  ((WARNING_COUNT++))
else
  echo "✅ All functions have type hints"
fi

# Правило 2: Перевірка docstrings для класів та функцій
echo ""
echo "📚 [Rule 2] Checking docstrings..."
# Просто нагадування
echo "ℹ️  Remember to add docstrings to all public classes and functions"

# Правило 3: Settings split check
echo ""
echo "⚙️  [Rule 3] Checking settings structure..."
if [ -f "SpeakUp/settings.py" ]; then
  echo "❌ Found monolithic settings.py (should be split into settings/ directory)"
  ((ERROR_COUNT++))
elif [ -d "SpeakUp/settings" ]; then
  echo "✅ Settings are properly split"
fi

# Правило 4: Перевірка SECRET_KEY в коді
echo ""
echo "🔒 [Rule 4] Checking for hardcoded secrets..."
SECRETS=$(echo "$PY_FILES" | xargs grep -nE 'SECRET_KEY\s*=\s*["\'](?!os\.environ)' 2>/dev/null || echo "")
if [ -n "$SECRETS" ]; then
  echo "❌ Hardcoded SECRET_KEY found:"
  echo "$SECRETS"
  ((ERROR_COUNT++))
else
  echo "✅ No hardcoded secrets detected"
fi

# Правило 5: Перевірка DEBUG в production
echo ""
echo "🐛 [Rule 5] Checking DEBUG setting..."
if [ -f "SpeakUp/settings/production.py" ]; then
  if grep -q "DEBUG = True" "SpeakUp/settings/production.py" 2>/dev/null; then
    echo "❌ DEBUG=True in production.py"
    ((ERROR_COUNT++))
  else
    echo "✅ DEBUG properly configured in production"
  fi
fi

# Підсумок
echo ""
echo "========================================="
echo "📊 Python Rules Summary"
echo "========================================="
echo "Errors: $ERROR_COUNT"
echo "Warnings: $WARNING_COUNT"

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ Python custom rules check FAILED"
  exit 1
else
  echo "✅ Python custom rules check PASSED"
  exit 0
fi

