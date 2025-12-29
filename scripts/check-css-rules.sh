#!/bin/bash
set -e

echo "========================================="
echo "🎨 CSS Custom Rules Check"
echo "========================================="

ERROR_COUNT=0
WARNING_COUNT=0

# Знаходимо всі CSS файли (крім normalize.css)
CSS_FILES=$(find static/css -name "*.css" ! -name "normalize.css" 2>/dev/null || echo "")

if [ -z "$CSS_FILES" ]; then
  echo "⚠️  No CSS files found in static/css/"
  exit 0
fi

# Правило 1: 100vh має мати fallback 100dvh (або коментар "Fallback")
echo ""
echo "📐 [Rule 1] Checking 100vh fallback..."
VH_ISSUES=$(echo "$CSS_FILES" | while read -r file; do
  grep -n '100vh' "$file" 2>/dev/null | while IFS=: read -r linenum line; do
    # Перевіряємо, чи є 100dvh або коментар "Fallback" в наступних 2 рядках
    context=$(sed -n "$((linenum-1)),$((linenum+2))p" "$file" 2>/dev/null)
    if ! echo "$context" | grep -qE '100dvh|Fallback'; then
      echo "$file:$linenum: $line"
    fi
  done
done || echo "")

if [ -n "$VH_ISSUES" ]; then
  echo "❌ Found 100vh without 100dvh fallback:"
  echo "$VH_ISSUES"
  echo "   Fix: Use 'height: 100vh; /* Fallback */ height: 100dvh;'"
  ((ERROR_COUNT++))
else
  echo "✅ All 100vh declarations have fallback"
fi

# Правило 2: safe-area-inset-* має використовуватись для padding/margin
echo ""
echo "📱 [Rule 2] Checking safe-area-inset usage..."
SAFE_AREA_USAGE=$(echo "$CSS_FILES" | xargs grep -c 'env(safe-area-inset-' 2>/dev/null | grep -v ':0$' || echo "")
if [ -z "$SAFE_AREA_USAGE" ]; then
  echo "⚠️  No safe-area-inset usage detected (may be intentional)"
  echo "   Recommendation: Use env(safe-area-inset-bottom) for fixed elements"
  ((WARNING_COUNT++))
else
  echo "✅ safe-area-inset is used: $(echo "$SAFE_AREA_USAGE" | wc -l) file(s)"
fi

# Правило 3: font-size має бути в rem, а не px (warning, не error)
echo ""
echo "🔤 [Rule 3] Checking font-size units (prefer rem over px)..."
PX_FONT_SIZES=$(echo "$CSS_FILES" | xargs grep -n 'font-size:.*px' 2>/dev/null || echo "")
if [ -n "$PX_FONT_SIZES" ]; then
  echo "⚠️  font-size in px found (recommend rem for accessibility):"
  echo "$PX_FONT_SIZES" | head -n 10
  if [ $(echo "$PX_FONT_SIZES" | wc -l) -gt 10 ]; then
    echo "   ... and $(( $(echo "$PX_FONT_SIZES" | wc -l) - 10 )) more"
  fi
  ((WARNING_COUNT++))
else
  echo "✅ All font-sizes use rem"
fi

# Правило 4: flex: 1; має бути flex: 1 0 0; або flex: 1 0 auto;
echo ""
echo "📦 [Rule 4] Checking flex shorthand..."
FLEX_ISSUES=$(echo "$CSS_FILES" | xargs grep -n 'flex:\s*1;' 2>/dev/null || echo "")
if [ -n "$FLEX_ISSUES" ]; then
  echo "❌ Found 'flex: 1;' without explicit flex-basis:"
  echo "$FLEX_ISSUES"
  echo "   Fix: Use 'flex: 1 0 0;' or 'flex: 1 0 auto;'"
  ((ERROR_COUNT++))
else
  echo "✅ All flex shorthands are explicit"
fi

# Правило 5: hover ефекти мають бути в @media (hover: hover)
echo ""
echo "🖱️  [Rule 5] Checking hover effects in media query..."
HOVER_EFFECTS=$(echo "$CSS_FILES" | xargs grep -n ':hover' 2>/dev/null || echo "")
if [ -n "$HOVER_EFFECTS" ]; then
  # Перевіряємо, чи всі :hover в @media (hover: hover)
  UNCHECKED_HOVERS=$(echo "$CSS_FILES" | while read -r file; do
    awk '
      /@media.*\(hover: hover\)/ { in_media=1; next }
      /^}/ { if (in_media) in_media=0 }
      /:hover/ { if (!in_media) print FILENAME":"NR":"$0 }
    ' "$file" 2>/dev/null
  done || echo "")

  if [ -n "$UNCHECKED_HOVERS" ]; then
    echo "⚠️  :hover effects outside @media (hover: hover):"
    echo "$UNCHECKED_HOVERS" | head -n 5
    echo "   Recommendation: Wrap hover effects in @media (hover: hover) { ... }"
    ((WARNING_COUNT++))
  else
    echo "✅ All :hover effects are in @media (hover: hover)"
  fi
else
  echo "✅ No hover effects found"
fi

# Правило 6: overscroll-behavior: none; на body
echo ""
echo "📜 [Rule 6] Checking overscroll-behavior..."
OVERSCROLL=$(echo "$CSS_FILES" | xargs grep -c 'overscroll-behavior' 2>/dev/null | grep -v ':0$' || echo "")
if [ -z "$OVERSCROLL" ]; then
  echo "⚠️  No overscroll-behavior detected"
  echo "   Recommendation: Add 'body { overscroll-behavior: none; }' to base.css"
  ((WARNING_COUNT++))
else
  echo "✅ overscroll-behavior is used"
fi

# Правило 7: !important заборонений (дублює Stylelint, але для надійності)
echo ""
echo "🚫 [Rule 7] Checking for !important..."
IMPORTANT=$(echo "$CSS_FILES" | xargs grep -n '!important' 2>/dev/null || echo "")
if [ -n "$IMPORTANT" ]; then
  echo "❌ !important found (forbidden):"
  echo "$IMPORTANT"
  ((ERROR_COUNT++))
else
  echo "✅ No !important detected"
fi

# Правило 8: backdrop-filter має мати -webkit- prefix
echo ""
echo "🌫️  [Rule 8] Checking backdrop-filter prefix..."
BACKDROP_ISSUES=$(echo "$CSS_FILES" | xargs grep -n 'backdrop-filter:' 2>/dev/null | grep -v '\-webkit-backdrop-filter' || echo "")
if [ -n "$BACKDROP_ISSUES" ]; then
  echo "⚠️  backdrop-filter without -webkit- prefix:"
  echo "$BACKDROP_ISSUES"
  echo "   Fix: Add '-webkit-backdrop-filter: ...; backdrop-filter: ...;'"
  ((WARNING_COUNT++))
else
  echo "✅ All backdrop-filters have -webkit- prefix (or none used)"
fi

# Підсумок
echo ""
echo "========================================="
echo "📊 CSS Rules Summary"
echo "========================================="
echo "Errors: $ERROR_COUNT"
echo "Warnings: $WARNING_COUNT"

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ CSS custom rules check FAILED"
  exit 1
else
  echo "✅ CSS custom rules check PASSED"
  exit 0
fi




