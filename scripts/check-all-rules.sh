#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║   🚀 FULL PROJECT HEALTH CHECK        ║"
echo "╔════════════════════════════════════════╗"
echo ""

TOTAL_ERRORS=0

# 1. Django Template Tags
if [ -f "scripts/check_template_tags.sh" ]; then
  bash scripts/check_template_tags.sh || ((TOTAL_ERRORS++))
  echo ""
fi

# 2. HTML Custom Rules
if [ -f "scripts/check-html-rules.sh" ]; then
  bash scripts/check-html-rules.sh || ((TOTAL_ERRORS++))
  echo ""
fi

# 3. CSS Custom Rules
if [ -f "scripts/check-css-rules.sh" ]; then
  bash scripts/check-css-rules.sh || ((TOTAL_ERRORS++))
  echo ""
fi

# 4. JavaScript Custom Rules
if [ -f "scripts/check-js-rules.sh" ]; then
  bash scripts/check-js-rules.sh || ((TOTAL_ERRORS++))
  echo ""
fi

# 5. Python Custom Rules
if [ -f "scripts/check-python-rules.sh" ]; then
  bash scripts/check-python-rules.sh || ((TOTAL_ERRORS++))
  echo ""
fi

# 6. Stylelint
if command -v npm &> /dev/null && [ -f "package.json" ]; then
  echo "========================================="
  echo "🎨 Running Stylelint..."
  echo "========================================="
  npm run lint:css || ((TOTAL_ERRORS++))
  echo ""
fi

# 7. ESLint
if command -v npm &> /dev/null && [ -f "package.json" ]; then
  echo "========================================="
  echo "⚡ Running ESLint..."
  echo "========================================="
  npm run lint:js || ((TOTAL_ERRORS++))
  echo ""
fi

# 8. HTMLHint
if command -v npm &> /dev/null && [ -f "package.json" ]; then
  echo "========================================="
  echo "📝 Running HTMLHint..."
  echo "========================================="
  npm run lint:html || ((TOTAL_ERRORS++))
  echo ""
fi

# Підсумок
echo "╔════════════════════════════════════════╗"
echo "║   📊 FINAL SUMMARY                     ║"
echo "╔════════════════════════════════════════╗"
echo "Total failed checks: $TOTAL_ERRORS"
echo ""

if [ $TOTAL_ERRORS -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED! 🎉"
  exit 0
else
  echo "❌ SOME CHECKS FAILED"
  echo "Run 'npm run fix:rules' to auto-fix some issues"
  exit 1
fi


