#!/bin/bash
set -e

echo "========================================="
echo "🔧 Automatic Rules Fixes"
echo "========================================="

FIXED_COUNT=0

# Fix 1: Видалити inline style=""
echo ""
echo "🎨 [Fix 1] Removing inline styles..."
HTML_FILES=$(find templates -name "*.html" 2>/dev/null || echo "")
if [ -n "$HTML_FILES" ]; then
  BEFORE=$(echo "$HTML_FILES" | xargs grep -c 'style="' 2>/dev/null | grep -v ':0$' | wc -l || echo "0")
  if [ "$BEFORE" -gt 0 ]; then
    echo "$HTML_FILES" | xargs sed -i.bak 's/ style="[^"]*"//g' 2>/dev/null || true
    AFTER=$(echo "$HTML_FILES" | xargs grep -c 'style="' 2>/dev/null | grep -v ':0$' | wc -l || echo "0")
    REMOVED=$((BEFORE - AFTER))
    if [ $REMOVED -gt 0 ]; then
      echo "✅ Removed $REMOVED inline style attributes"
      ((FIXED_COUNT++))
    fi
  else
    echo "✅ No inline styles to remove"
  fi
fi

# Fix 2: Додати inputmode="tel" до type="tel"
echo ""
echo "📞 [Fix 2] Adding inputmode=\"tel\" to tel inputs..."
if [ -n "$HTML_FILES" ]; then
  echo "$HTML_FILES" | xargs sed -i.bak 's/<input type="tel"/<input type="tel" inputmode="tel"/g' 2>/dev/null || true
  echo "✅ Added inputmode to tel inputs"
  ((FIXED_COUNT++))
fi

# Fix 3: flex: 1; → flex: 1 0 0;
echo ""
echo "📦 [Fix 3] Fixing flex shorthand..."
CSS_FILES=$(find static/css -name "*.css" ! -name "normalize.css" 2>/dev/null || echo "")
if [ -n "$CSS_FILES" ]; then
  BEFORE=$(echo "$CSS_FILES" | xargs grep -c 'flex:\s*1;' 2>/dev/null | grep -v ':0$' | wc -l || echo "0")
  if [ "$BEFORE" -gt 0 ]; then
    echo "$CSS_FILES" | xargs sed -i.bak 's/flex: 1;/flex: 1 0 0;/g' 2>/dev/null || true
    AFTER=$(echo "$CSS_FILES" | xargs grep -c 'flex:\s*1;' 2>/dev/null | grep -v ':0$' | wc -l || echo "0")
    FIXED=$((BEFORE - AFTER))
    if [ $FIXED -gt 0 ]; then
      echo "✅ Fixed $FIXED flex shorthand declarations"
      ((FIXED_COUNT++))
    fi
  else
    echo "✅ No flex shorthand issues to fix"
  fi
fi

# Видалити .bak файли
find . -name "*.bak" -delete 2>/dev/null || true

echo ""
echo "========================================="
echo "📊 Fixes Summary"
echo "========================================="
echo "Total fixes applied: $FIXED_COUNT"
echo "✅ Auto-fix complete"

