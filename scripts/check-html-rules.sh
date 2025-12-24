#!/bin/bash
set -e

echo "========================================="
echo "🔍 HTML Custom Rules Check"
echo "========================================="

ERROR_COUNT=0
WARNING_COUNT=0

# Знаходимо всі HTML файли (крім normalize.css та node_modules)
HTML_FILES=$(find templates -name "*.html" 2>/dev/null || echo "")

if [ -z "$HTML_FILES" ]; then
  echo "⚠️  No HTML files found in templates/"
  exit 0
fi

# Правило 1: viewport meta має містити viewport-fit=cover та interactive-widget=resizes-content
echo ""
echo "📱 [Rule 1] Checking viewport meta attributes..."
VIEWPORT_ISSUES=$(echo "$HTML_FILES" | xargs grep -l 'name="viewport"' 2>/dev/null | while read -r file; do
  if ! grep -q 'viewport-fit=cover' "$file" || ! grep -q 'interactive-widget=resizes-content' "$file"; then
    echo "$file"
  fi
done || echo "")

if [ -n "$VIEWPORT_ISSUES" ]; then
  echo "❌ Viewport meta tags missing required attributes:"
  echo "$VIEWPORT_ISSUES" | while read -r file; do
    echo "   $file"
  done
  echo "   Required: <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content\">"
  ((ERROR_COUNT++))
else
  echo "✅ All viewport meta tags are correct"
fi

# Правило 2: inline style="" заборонені (дублює HTMLHint, але для надійності)
echo ""
echo "🎨 [Rule 2] Checking for inline styles..."
INLINE_STYLES=$(echo "$HTML_FILES" | xargs grep -n 'style="' 2>/dev/null || echo "")
if [ -n "$INLINE_STYLES" ]; then
  echo "❌ Inline styles found (forbidden):"
  echo "$INLINE_STYLES"
  ((ERROR_COUNT++))
else
  echo "✅ No inline styles detected"
fi

# Правило 3: inline onclick="", onerror="" та інші event handlers заборонені
echo ""
echo "🔧 [Rule 3] Checking for inline event handlers..."
INLINE_HANDLERS=$(echo "$HTML_FILES" | xargs grep -nE 'on(click|load|error|submit|change|input|focus|blur|keydown|keyup|mouseover|mouseout)=' 2>/dev/null || echo "")
if [ -n "$INLINE_HANDLERS" ]; then
  echo "❌ Inline event handlers found (forbidden):"
  echo "$INLINE_HANDLERS"
  ((ERROR_COUNT++))
else
  echo "✅ No inline event handlers detected"
fi

# Правило 4: input type="tel" або type="number" має мати inputmode="tel" або inputmode="decimal"
echo ""
echo "📞 [Rule 4] Checking inputmode for tel/number inputs..."
TEL_INPUTS=$(echo "$HTML_FILES" | xargs grep -n 'type="tel"' 2>/dev/null | grep -v 'inputmode="tel"' || echo "")
NUMBER_INPUTS=$(echo "$HTML_FILES" | xargs grep -n 'type="number"' 2>/dev/null | grep -v 'inputmode=' || echo "")

if [ -n "$TEL_INPUTS" ]; then
  echo "⚠️  Inputs with type=\"tel\" missing inputmode=\"tel\":"
  echo "$TEL_INPUTS"
  ((WARNING_COUNT++))
fi

if [ -n "$NUMBER_INPUTS" ]; then
  echo "⚠️  Inputs with type=\"number\" missing inputmode (recommend inputmode=\"decimal\"):"
  echo "$NUMBER_INPUTS"
  ((WARNING_COUNT++))
fi

if [ -z "$TEL_INPUTS" ] && [ -z "$NUMBER_INPUTS" ]; then
  echo "✅ All tel/number inputs have correct inputmode"
fi

# Правило 5: <video> теги мають містити poster, playsinline, muted
echo ""
echo "🎬 [Rule 5] Checking video tags..."
VIDEO_TAGS=$(echo "$HTML_FILES" | xargs grep -n '<video' 2>/dev/null || echo "")
if [ -n "$VIDEO_TAGS" ]; then
  echo "$VIDEO_TAGS" | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    linenum=$(echo "$line" | cut -d: -f2)
    content=$(echo "$line" | cut -d: -f3-)

    issues=""
    echo "$content" | grep -q 'poster=' || issues="${issues}poster "
    echo "$content" | grep -q 'playsinline' || issues="${issues}playsinline "
    echo "$content" | grep -q 'muted' || issues="${issues}muted "

    if [ -n "$issues" ]; then
      echo "⚠️  $file:$linenum missing attributes: $issues"
      ((WARNING_COUNT++))
    fi
  done
else
  echo "✅ No video tags found (or all are correct)"
fi

# Правило 6: <script> теги мають містити defer або async
echo ""
echo "📜 [Rule 6] Checking script tags for defer/async..."
SCRIPT_TAGS=$(echo "$HTML_FILES" | xargs grep -n '<script src=' 2>/dev/null | grep -v 'defer\|async' || echo "")
if [ -n "$SCRIPT_TAGS" ]; then
  echo "⚠️  Script tags without defer/async found:"
  echo "$SCRIPT_TAGS"
  ((WARNING_COUNT++))
else
  echo "✅ All external scripts have defer/async"
fi

# Правило 7: touch-action: manipulation для інтерактивних елементів (перевіряємо в CSS, але нагадуємо тут)
echo ""
echo "👆 [Rule 7] Reminder: Use touch-action: manipulation for interactive elements"
echo "   (This is checked in CSS, ensure buttons/links have this property)"

# Підсумок
echo ""
echo "========================================="
echo "📊 HTML Rules Summary"
echo "========================================="
echo "Errors: $ERROR_COUNT"
echo "Warnings: $WARNING_COUNT"

if [ $ERROR_COUNT -gt 0 ]; then
  echo "❌ HTML custom rules check FAILED"
  exit 1
else
  echo "✅ HTML custom rules check PASSED"
  exit 0
fi

