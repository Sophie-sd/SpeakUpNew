from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse


def get_client_ip(request):
    """Отримати IP адресу клієнта"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def send_trial_confirmation_email(lead, request):
    """Відправка підтвердження на email"""
    test_url = request.build_absolute_uri(reverse('core:testing'))

    html_message = render_to_string('leads/emails/trial_confirmation.html', {
        'name': lead.name,
        'test_url': test_url,
    })

    try:
        send_mail(
            subject='Запис на пробний урок - SpeakUp',
            message=f"Вітаємо, {lead.name}! Перейдіть за посиланням: {test_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[lead.phone],  # TODO: змінити на email якщо є
            html_message=html_message,
            fail_silently=False,
        )
        lead.email_sent = True
        lead.save(update_fields=['email_sent'])
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False




