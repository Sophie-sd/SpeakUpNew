# Generated manually for updating verbose names and adding proxy model

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('leads', '0004_remove_runninglinetext_to_core'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='triallesson',
            options={'ordering': ['-created_at'], 'verbose_name': 'Заявка hero', 'verbose_name_plural': 'Заявки hero'},
        ),
        # Proxy модель не потребує міграції, але потрібно створити permissions
        # Це буде зроблено автоматично при синхронізації
    ]

