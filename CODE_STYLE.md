# Code Style Guide

Цей документ описує стандарти коду для проєкту SpeakUp.

## HTML

### Django Templates

- Використовуйте семантичні HTML5 теги
- Django теги `{{ }}` та `{% %}` мають бути на одному рядку
- Використовуйте `{% with %}` для складних expressions
- Завжди додавайте `{% csrf_token %}` в форми

### Приклад

```django
{% load static %}
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content">
  <title>{% block title %}Page Title{% endblock %}</title>
</head>
<body>
  <form method="post">
    {% csrf_token %}
    <div class="form-group">
      <label for="id_name">Name</label>
      <input type="text" id="id_name" name="name" required>
    </div>
  </form>
</body>
</html>
```

## CSS

### BEM Methodology

Використовуйте BEM для іменування класів:

```css
/* Block */
.button { }

/* Element */
.button__icon { }

/* Modifier */
.button--primary { }
.button--large { }
```

### CSS Custom Properties

Використовуйте CSS variables з `base.css`:

```css
.my-component {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}
```

### Правила

- ❌ Ніколи не використовуйте `!important`
- ✅ Використовуйте `rem` для `font-size`
- ✅ `100vh` має fallback `100dvh`
- ✅ `:hover` в `@media (hover: hover)`
- ✅ Touch targets мінімум 44px

## JavaScript

### ES6+ Features

```javascript
'use strict';

// Використовуйте const/let, не var
const name = 'John';
let age = 30;

// Arrow functions
const greet = (name) => {
  return `Hello, ${name}`;
};

// Template literals
const message = `User ${name} is ${age} years old`;

// Optional chaining
const value = obj?.property?.nested;
```

### HTMX Integration

```javascript
// CSRF Token
document.body.addEventListener('htmx:configRequest', function (event) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]');
  if (csrfToken) {
    event.detail.headers['X-CSRFToken'] = csrfToken.getAttribute('content');
  }
});

// Error handling
document.body.addEventListener('htmx:responseError', function (event) {
  console.error('HTMX Error:', event.detail);
});
```

### Правила

- ❌ Ніколи не використовуйте `eval()`
- ✅ Використовуйте `'use strict';`
- ✅ Додавайте `pageshow` event для bfcache
- ✅ Використовуйте event delegation

## Python

### Type Hints

```python
from typing import List, Dict, Optional

def process_data(items: List[str]) -> Dict[str, int]:
    """Process list of items and return statistics."""
    return {'count': len(items)}
```

### Django Patterns

```python
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
from django.template.loader import render_to_string

@require_http_methods(["POST"])
def htmx_view(request):
    if request.headers.get('HX-Request'):
        html = render_to_string('template.html', {})
        return HttpResponse(html)
    return redirect('index')
```

### Правила

- ✅ Використовуйте type hints
- ✅ Додавайте docstrings
- ✅ Settings split (base, develop, production)
- ✅ Secrets в env variables
- ✅ `require_http_methods` decorators

## Git

### Commit Messages

```
feat: Add user authentication
fix: Resolve CSS layout issue
docs: Update README
style: Format code with black
refactor: Extract common logic
test: Add tests for user model
```

### Branch Naming

- `feature/description`
- `fix/description`
- `docs/description`

## Accessibility

- ✅ Використовуйте семантичні HTML теги
- ✅ Додавайте `aria-label` для icon-only buttons
- ✅ Мінімальний touch target 44px
- ✅ Keyboard navigation support
- ✅ Focus indicators visible

## Security

- ✅ CSRF tokens в усіх формах
- ✅ Secrets в environment variables
- ✅ No inline scripts/styles
- ✅ Sanitize user input
- ✅ HttpOnly cookies для auth

## Додаткові ресурси

- [Django Best Practices](https://docs.djangoproject.com/en/stable/misc/design-philosophies/)
- [HTMX Documentation](https://htmx.org/docs/)
- [BEM Methodology](http://getbem.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)



