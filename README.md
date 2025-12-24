# SpeakUp - Django + HTMX Application

Професійний Django проєкт з автоматичною системою контролю якості коду.

## 🚀 Швидкий старт

### Встановлення

```bash
# 1. Клонуйте репозиторій
git clone <repository-url>
cd SpeakUp

# 2. Встановіть залежності
make install

# 3. Налаштуйте environment variables
cp .env.example .env
# Відредагуйте .env файл

# 4. Запустіть міграції
make migrate

# 5. Запустіть сервер
make run
```

## 📋 Доступні команди

- `make install` - Встановити всі залежності
- `make lint` - Запустити всі лінтери
- `make test` - Запустити тести
- `make fix` - Автоматично виправити помилки
- `make clean` - Очистити кеш та тимчасові файли
- `make run` - Запустити development server
- `make migrate` - Створити та застосувати міграції

## 🏗️ Архітектура

Проєкт використовує:
- **Django 4.2** - Backend framework
- **HTMX** - Dynamic HTML updates
- **Vanilla JavaScript** - Frontend logic
- **CSS Custom Properties** - Design system
- **BEM** - CSS methodology

## 🔍 Система контролю якості

Проєкт має автоматичну систему перевірки 140+ правил:

- **Stylelint** - CSS якість
- **ESLint** - JavaScript якість
- **HTMLHint** - HTML структура
- **Flake8** - Python style
- **Mypy** - Python types
- **Black** - Python formatting
- **Custom bash scripts** - Специфічні перевірки

### Запуск перевірок

```bash
# Всі перевірки
npm run check:rules

# Окремі перевірки
npm run lint:css
npm run lint:js
npm run lint:html

# Автовиправлення
npm run fix:rules
```

## 📁 Структура проєкту

```
SpeakUp/
├── apps/              # Django apps
├── SpeakUp/           # Django project settings
├── static/            # Static files (CSS, JS)
├── templates/         # Django templates
├── scripts/           # Quality check scripts
└── .github/          # CI/CD workflows
```

## 🧪 Тестування

```bash
# Запустити тести
make test

# Або через Django
python manage.py test
```

## 🚢 Deployment

Проєкт готовий до deployment на:
- Heroku
- Render
- Railway
- DigitalOcean
- AWS

## 📚 Документація

- [CONTRIBUTING.md](CONTRIBUTING.md) - Гайд для контрибюторів
- [CODE_STYLE.md](CODE_STYLE.md) - Стайл гайд
- [scripts/README.md](scripts/README.md) - Документація скриптів

## 📄 Ліцензія

MIT

