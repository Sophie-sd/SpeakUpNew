#!/usr/bin/env python
"""
Запуск імпорту news статей.
Використання: python manage.py shell < scripts/run_import.py
"""
import os
import sys
import django

# Налаштування Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SpeakUp.settings.develop')
django.setup()

# Імпортуємо та запускаємо головну функцію
from scripts.import_news import main

if __name__ == '__main__':
    main()


