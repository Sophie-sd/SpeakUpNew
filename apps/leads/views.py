from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from .forms import TrialLessonForm
from .utils import send_trial_confirmation_email, get_client_ip


@require_http_methods(["POST"])
@csrf_protect
def submit_trial_form(request):
    """API endpoint для відправки форми запису на пробний урок"""
    form = TrialLessonForm(request.POST)

    if form.is_valid():
        lead = form.save(commit=False)

        # UTM та реклама:
        lead.utm_source = request.POST.get('utm_source', '')
        lead.utm_medium = request.POST.get('utm_medium', '')
        lead.utm_campaign = request.POST.get('utm_campaign', '')
        lead.utm_content = request.POST.get('utm_content', '')
        lead.utm_term = request.POST.get('utm_term', '')
        lead.fbclid = request.POST.get('fbclid', '')
        lead.gclid = request.POST.get('gclid', '')
        lead.referrer = request.META.get('HTTP_REFERER', '')
        lead.ip_address = get_client_ip(request)

        lead.save()

        # Відправити email:
        send_trial_confirmation_email(lead, request)

        # TODO: Telegram notification (заглушка)

        return JsonResponse({
            'success': True,
            'redirect_url': '/testing/',
            'message': 'Дякуємо! Перенаправляємо вас на тест.'
        })
    else:
        return JsonResponse({
            'success': False,
            'errors': form.errors
        }, status=400)



