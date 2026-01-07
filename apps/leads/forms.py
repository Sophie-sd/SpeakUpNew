from django import forms
from .models import TrialLesson
from .utils import normalize_phone_number


class TrialLessonForm(forms.ModelForm):
    # Honeypot поле (приховане CSS)
    website = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'tabindex': '-1',
            'autocomplete': 'off',
            'class': 'form-group__input--honeypot'
        })
    )

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
        phone = self.cleaned_data.get('phone', '')
        return normalize_phone_number(phone)

    def clean_website(self):
        """Якщо honeypot заповнено - це бот"""
        website = self.cleaned_data.get('website', '')
        if website:
            # Не показуємо помилку боту, просто валідація не пройде
            raise forms.ValidationError("Bot detected")
        return website





