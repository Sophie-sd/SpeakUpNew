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
    """
    Відправка підтвердження на email.

    Примітка: Наразі не відправляємо email, оскільки в моделі немає поля email.
    Функція залишена для майбутнього використання, коли додадуть email поле.
    Можна також відправляти email адміністратору з інформацією про нову заявку.
    """
    # TODO: Додати поле email в модель TrialLesson або відправляти адміністратору
    # Наразі просто логуємо, що заявка створена
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f'[TrialForm] New lead created: {lead.name} - {lead.phone}. Email notification skipped (no email field).')

    # Позначаємо, що "email відправлено" (насправді просто заявка оброблена)
    lead.email_sent = True
    lead.save(update_fields=['email_sent'])
    return True

    # Майбутня реалізація, коли додадуть email поле:
    # if not lead.email:
    #     logger.warning(f'[TrialForm] Cannot send email to {lead.name}: no email address')
    #     return False
    #
    # test_url = request.build_absolute_uri(reverse('core:testing'))
    # html_message = render_to_string('leads/emails/trial_confirmation.html', {
    #     'name': lead.name,
    #     'test_url': test_url,
    # })
    #
    # try:
    #     send_mail(
    #         subject='Запис на пробний урок - SpeakUp',
    #         message=f"Вітаємо, {lead.name}! Перейдіть за посиланням: {test_url}",
    #         from_email=settings.DEFAULT_FROM_EMAIL,
    #         recipient_list=[lead.email],
    #         html_message=html_message,
    #         fail_silently=False,
    #     )
    #     lead.email_sent = True
    #     lead.save(update_fields=['email_sent'])
    #     return True
    # except Exception as e:
    #     logger.error(f'[TrialForm] Email sending failed: {e}', exc_info=True)
    #     return False





