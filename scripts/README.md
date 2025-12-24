# Scripts Documentation

Ця директорія містить bash-скрипти для автоматичної перевірки якості коду.

## Доступні скрипти

### Перевірки

- **check-html-rules.sh** - Перевірка HTML правил (viewport, inputmode, video, scripts)
- **check-css-rules.sh** - Перевірка CSS правил (100dvh, safe-area, rem, flex, hover)
- **check-js-rules.sh** - Перевірка JavaScript правил (var, pageshow, eval, HTMX)
- **check_template_tags.sh** - Критична перевірка Django template tags (заборона розривів)
- **check-python-rules.sh** - Перевірка Python правил (type hints, settings split, secrets)
- **check-all-rules.sh** - Запуск всіх перевірок одночасно

### Автовиправлення

- **fix-rules.sh** - Автоматичне виправлення деяких порушень

### Утиліти

- **pre-commit-hook.sh** - Git pre-commit hook логіка
- **setup-git-hooks.sh** - Автоматичне налаштування Git hooks
- **download-normalize.sh** - Завантаження normalize.css

## Використання

```bash
# Запустити всі перевірки
bash scripts/check-all-rules.sh

# Або через npm
npm run check:rules

# Автовиправлення
bash scripts/fix-rules.sh
# Або
npm run fix:rules
```

## Детальний опис

### check-html-rules.sh

Перевіряє:
- Viewport meta теги (viewport-fit=cover, interactive-widget=resizes-content)
- Inline styles та event handlers
- inputmode для tel/number inputs
- Video теги (poster, playsinline, muted)
- Script теги (defer/async)

### check-css-rules.sh

Перевіряє:
- 100vh fallback на 100dvh
- safe-area-inset usage
- font-size в rem
- flex shorthand (flex: 1 0 0)
- hover effects в @media (hover: hover)
- overscroll-behavior
- !important заборона
- backdrop-filter prefix

### check-js-rules.sh

Перевіряє:
- var заборона
- pageshow event listener
- strict mode або IIFE
- eval() заборона
- HTMX integration

### check_template_tags.sh

**КРИТИЧНА ПЕРЕВІРКА** - перевіряє що Django теги `{{ }}` та `{% %}` не розриваються на кілька рядків.

### check-python-rules.sh

Перевіряє:
- Type hints
- Settings split структура
- Hardcoded secrets
- DEBUG в production

## Exit codes

- `0` - Всі перевірки пройшли успішно
- `1` - Знайдено помилки

## Приклади використання в CI/CD

```bash
#!/bin/bash
set -e

# Запустити всі перевірки
npm run check:rules

# Якщо є помилки, спробувати автовиправлення
if [ $? -ne 0 ]; then
  npm run fix:rules
  npm run check:rules
fi
```

