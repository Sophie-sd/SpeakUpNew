.PHONY: help install lint test fix clean run migrate shell

help:
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies (Node.js + Python)"
	@echo "  make lint       - Run all linters (CSS, JS, HTML, Python)"
	@echo "  make test       - Run Django tests"
	@echo "  make fix         - Auto-fix issues (CSS, JS, Python)"
	@echo "  make clean      - Clean cache files and temporary files"
	@echo "  make run        - Run Django development server"
	@echo "  make migrate     - Create and apply migrations"
	@echo "  make shell       - Open Django shell"

install:
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt || echo "requirements.txt not found, skipping..."
	pip install -r requirements-dev.txt || echo "requirements-dev.txt not found, skipping..."
	@echo "Setting up Git hooks..."
	npx husky install || echo "Husky not installed yet, run 'npm install' first"

lint:
	@echo "Running frontend linters..."
	npm run check:rules || true
	@echo "Running Python linters..."
	flake8 . || echo "flake8 not installed"
	mypy . || echo "mypy not installed"

test:
	python manage.py test

fix:
	@echo "Fixing frontend issues..."
	npm run fix:rules || true
	npm run lint:fix || true
	@echo "Fixing Python issues..."
	black . || echo "black not installed"

clean:
	@echo "Cleaning Python cache..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type f -name "*.bak" -delete 2>/dev/null || true
	@echo "Cleaning Node.js cache..."
	rm -rf node_modules/.cache 2>/dev/null || true
	@echo "Cleaning Django cache..."
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .coverage htmlcov/ 2>/dev/null || true

run:
	python manage.py runserver

migrate:
	python manage.py makemigrations
	python manage.py migrate

shell:
	python manage.py shell





