"""
Django management команда для оновлення досягнень Speak Up.
Використання: python manage.py update_achievements
"""
from django.core.management.base import BaseCommand
from apps.core.models import Achievement


class Command(BaseCommand):
    help = 'Оновлює досягнення Speak Up з актуальними даними'

    def handle(self, *args, **options):
        # Дані для оновлення (6 досягнень: 4 в першому рядку, 2 в другому)
        ACHIEVEMENTS_DATA = [
            {
                'number': 200000,
                'suffix': '+',
                'label_uk': 'Українців вже підвищили<br>рівень з нами',
                'label_ru': 'Украинцев уже повысили<br>уровень с нами',
                'order': 1,
                'is_active': True
            },
            {
                'number': 20,
                'suffix': '',
                'label_uk': 'років досвіду',
                'label_ru': 'лет опыта',
                'order': 2,
                'is_active': True
            },
            {
                'number': 85,
                'suffix': '%',
                'label_uk': 'Середня оцінка<br>студентів',
                'label_ru': 'Средняя оценка<br>студентов',
                'order': 3,
                'is_active': True
            },
            {
                'number': 5000,
                'suffix': '+',
                'label_uk': 'Студентів навчається<br>в Україні зараз',
                'label_ru': 'Студентов обучается<br>в Украине сейчас',
                'order': 4,
                'is_active': True
            },
            {
                'number': 100,
                'suffix': '+',
                'label_uk': 'шкіл в 11 країнах<br>на 4 континентах',
                'label_ru': 'школ в 11 странах<br>на 4 континентах',
                'order': 5,
                'is_active': True
            },
            {
                'number': 500000,
                'suffix': '+',
                'label_uk': 'студентів по світу',
                'label_ru': 'студентов по миру',
                'order': 6,
                'is_active': True
            }
        ]

        self.stdout.write('Оновлення досягнень Speak Up...\n')

        # Деактивувати всі існуючі досягнення
        Achievement.objects.update(is_active=False)
        self.stdout.write(self.style.WARNING('Деактивовано всі існуючі досягнення\n'))

        created_count = 0
        updated_count = 0

        for data in ACHIEVEMENTS_DATA:
            achievement, created = Achievement.objects.update_or_create(
                number=data['number'],
                suffix=data['suffix'],
                defaults={
                    'label_uk': data['label_uk'],
                    'label_ru': data['label_ru'],
                    'order': data['order'],
                    'is_active': data['is_active']
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Створено: {achievement}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Оновлено: {achievement}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nГотово! Створено: {created_count}, оновлено: {updated_count}'
            )
        )
        self.stdout.write(
            f'Активних досягнень: {Achievement.objects.filter(is_active=True).count()}'
        )

