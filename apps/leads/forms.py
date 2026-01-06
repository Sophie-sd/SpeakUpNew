from django import forms
from .models import TrialLesson


class TrialLessonForm(forms.ModelForm):
    class Meta:
        model = TrialLesson
        fields = ['name', 'phone']
        widgets = {
            'name': forms.TextInput(attrs={
                'placeholder': "Ім'я",
                'class': 'form-group__input',
                'required': True,
            }),
            'phone': forms.TextInput(attrs={
                'placeholder': '+380',
                'class': 'form-group__input',
                'type': 'tel',
                'inputmode': 'tel',
                'required': True,
            }),
        }

    def clean_name(self):
        """Валідація імені: мінімум 2 символи"""
        name = self.cleaned_data.get('name', '').strip()
        if name and len(name) < 2:
            raise forms.ValidationError("Ім'я має містити мінімум 2 символи")
        return name

    def clean_phone(self):
        """Нормалізувати телефон до +380XXXXXXXXX (формат моделі: ^\+380\d{9}$)"""
        phone = self.cleaned_data.get('phone', '').strip()
        if not phone:
            return phone

        # Видалити всі пробіли, дужки, дефіси та інші символи
        phone_clean = phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')

        # Витягти тільки цифри
        digits = ''.join(filter(str.isdigit, phone_clean))

        # Нормалізація до формату +380XXXXXXXXX (12 цифр: 380 + 9 цифр номера)
        if len(digits) == 12 and digits.startswith('380'):
            # 380XXXXXXXXX -> +380XXXXXXXXX
            phone = '+' + digits
        elif len(digits) == 10 and digits.startswith('0'):
            # 0XXXXXXXXX -> +380XXXXXXXXX
            phone = '+380' + digits[1:]
        elif len(digits) == 9:
            # XXXXXXXXX (9 цифр без префіксу) -> +380XXXXXXXXX
            phone = '+380' + digits
        elif phone_clean.startswith('+380') and len(digits) == 12:
            # +380XXXXXXXXX -> залишити як є
            phone = '+' + digits
        else:
            raise forms.ValidationError("Введіть коректний український номер телефону у форматі +380, 380 або 0")

        # Фінальна перевірка формату (модель очікує ^\+380\d{9}$)
        if not phone.startswith('+380') or len(phone) != 13:
            raise forms.ValidationError("Номер має містити 9 цифр після коду +380")

        return phone





