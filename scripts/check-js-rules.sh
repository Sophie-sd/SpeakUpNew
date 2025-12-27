#!/bin/bash
set -e

echo "========================================="
echo "⚡ JavaScript Custom Rules Check"
echo "========================================="

ERROR_COUNT=0
WARNING_COUNT=0

# Знаходимо всі JS файли
JS_FILES=$(find static/js -name "*.js" 2>/dev/null || echo "")

if [ -z "$JS_FILES" ]; then
  echo "⚠️  No JavaScript files found in static/js/"
  exit 0
fi

# Правило 1: var заборонений (дублює ESLint, але для надійності)
echo ""
echo "🚫 [Rule 1] Checking for var usage..."
VAR_USAGE=$(echo "$JS_FILES" | xargs grep -nE '\bvar\s+' 2>/dev/null || echo "")
if [ -n "$VAR_USAGE" ]; then
  echo "❌ 'var' found (use const/let):"
  echo "$VAR_USAGE"
  ((ERROR_COUNT++))
else
  echo "✅ No 'var' usage detected"
fi

# Правило 2: pageshow event listener для bfcache
echo ""
echo "🔄 [Rule 2] Checking for pageshow event listener..."
PAGESHOW=$(echo "$JS_FILES" | xargs grep -c "pageshow" 2>/dev/null | grep -v ':0$' || echo "")
if [ -z "$PAGESHOW" ]; then
  echo "⚠️  No 'pageshow' event listener detected"
  echo "   Recommendation: Add window.addEventListener('pageshow', (event) => { ... }) for bfcache"
  ((WARNING_COUNT++))
else
  echo "✅ pageshow event listener found"
fi

# Правило 3: strict mode або IIFE
echo ""
echo "🔒 [Rule 3] Checking for strict mode or IIFE..."
STRICT_MODE=$(echo "$JS_FILES" | xargs grep -c "'use strict'" 2>/dev/null | grep -v ':0$' || echo "")
IIFE=$(echo "$JS_FILES" | xargs grep -c '(function()' 2>/dev/null | grep -v ':0$' || echo "")

if [ -z "$STRICT_MODE" ] && [ -z "$IIFE" ]; then
  echo "⚠️  No 'use strict' or IIFE detected"
  echo "   Recommendation: Use 'use strict'; or wrap code in IIFE"
  ((WARNING_COUNT++))
else
  echo "✅ Code uses strict mode or IIFE"
fi

# Правило 4: eval() заборонений (дублює ESLint)
echo ""
echo "🚨 [Rule 4] Checking for eval() usage..."
EVAL_USAGE=$(echo "$JS_FILES" | xargs grep -nE '\beval\s*\(' 2>/dev/null || echo "")
if [ -n "$EVAL_USAGE" ]; then
  echo "❌ eval() found (forbidden for security):"
  echo "$EVAL_USAGE"
  ((ERROR_COUNT++))
else
  echo "✅ No eval() usage detected"
fi

# Правило 5: HTMX integration check (htmx:afterSwap, htmx:configRequest)
echo ""
echo "🔗 [Rule 5] Checking HTMX integration..."
HTMX_INTEGRATION=$(echo "$JS_FILES" | xargs grep -cE 'htmx:(afterSwap|configRequest|responseError|sendError)' 2>/dev/null | grep -v ':0$' || echo "")
if [ -n "$HTMX_INTEGRATION" ]; then
  echo "✅ HTMX event listeners found"
else
  echo "ℹ️  No HTMX event listeners detected (may be intentional)"
fi

# Підсумок
echo ""
echo "========================================="
echo "📊 JavaScript Rules Summary"
echo "========================================="
echo "Errors: $ERROR_COUNT"
echo "Warnings: $WARNING_COUNT"

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ JavaScript custom rules check FAILED"
  exit 1
else
  echo "✅ JavaScript custom rules check PASSED"
  exit 0
fi



