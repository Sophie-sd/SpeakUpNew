from django import forms


class ExampleForm(forms.Form):
    """Example form with proper validation."""
    name = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'Enter your name',
        })
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-input',
            'placeholder': 'Enter your email',
            'inputmode': 'email',
        })
    )
    phone = forms.CharField(
        max_length=20,
        required=False,
        widget=forms.TextInput(attrs={
            'type': 'tel',
            'class': 'form-input',
            'placeholder': 'Enter your phone',
            'inputmode': 'tel',
        })
    )

