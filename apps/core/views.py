from django.shortcuts import render, get_object_or_404
from django.http import Http404, JsonResponse
from django.utils.translation import get_language
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .seo_config import PROGRAMS, LOCATIONS, CITIES
from .models import (
    NewsArticle, Achievement, Advantage, CourseCategory, Course,
    Testimonial, FAQ, ConsultationRequest
)
from .forms import TestimonialForm, ConsultationForm
from apps.leads.forms import TrialLessonForm

def index(request):
    """Головна сторінка з усіма секціями."""
    lang = get_language()

    # Вибір полів залежно від мови
    def get_localized_field(obj, field):
        if lang == 'ru' and hasattr(obj, f'{field}_ru'):
            value = getattr(obj, f'{field}_ru', None)
            if value:
                return value
        return getattr(obj, f'{field}_uk', '')

    context = {
        'achievements': Achievement.objects.filter(is_active=True).order_by('order'),
        'advantages': Advantage.objects.prefetch_related('items').filter(is_active=True).order_by('order'),
        'course_categories': CourseCategory.objects.prefetch_related(
            'courses'
        ).filter(courses__is_active=True).distinct().order_by('order'),
        'testimonials': Testimonial.objects.filter(is_published=True).order_by('-created_at')[:10],
        'faqs': FAQ.objects.filter(is_active=True).order_by('order'),
        'trial_form': TrialLessonForm(),
        'consultation_form': ConsultationForm(),
        'testimonial_form': TestimonialForm(),
        'current_language': lang,
    }
    return render(request, 'core/index.html', context)

def about(request):
    """Про нас."""
    return render(request, 'core/about.html')

def contacts(request):
    """Контакти."""
    return render(request, 'core/contacts.html')

def testing(request):
    """Тест рівня з UTM tracking."""
    context = {
        'utm_source': request.GET.get('from', ''),
    }
    return render(request, 'core/testing.html', context)

def program_detail(request, slug):
    """Сторінка програми (17 програм)."""
    program = PROGRAMS.get(slug)

    if not program:
        raise Http404(f"Програма '{slug}' не знайдена")

    # Вибрати переклад згідно з мовою
    lang = get_language()
    data = {
        'slug': slug,
        'title': program.get(f'title_{lang}', program['title']),
        'description': program.get(f'description_{lang}', program['description']),
        'full_content': program.get(f'full_content_{lang}', program.get('full_content', '')),
        'includes': program.get(f'includes_{lang}', program.get('includes', [])),
        'benefits': program.get(f'benefits_{lang}', program.get('benefits', [])),
    }

    return render(request, 'core/program_detail.html', {'program': data})

def school_location(request, slug):
    """Orphan page: локація (13 локацій)."""
    location = LOCATIONS.get(slug)

    if not location:
        raise Http404(f"Локація '{slug}' не знайдена")

    # Переклад
    lang = get_language()
    data = {
        'slug': slug,
        'name': location.get(f'name_{lang}', location['name']),
        'district': location.get(f'district_{lang}', location['district']),
        'city': location.get(f'city_{lang}', location.get('city', '')),
        'seo_content': location.get(f'seo_content_{lang}', location.get('seo_content', '')),
        'why_online': location.get(f'why_online_{lang}', location.get('why_online', [])),
    }

    return render(request, 'core/school_location.html', {'location': data})

def city_page(request, city):
    """Orphan page: місто (4 міста)."""
    # Перевірка чи це не news slug (захист від конфлікту)
    if city == 'news':
        from django.shortcuts import redirect
        return redirect('core:news_list', permanent=True)

    city_data = CITIES.get(city)

    if not city_data:
        raise Http404(f"Місто '{city}' не знайдене")

    # Переклад
    lang = get_language()
    data = {
        'slug': city,
        'name': city_data.get(f'name_{lang}', city_data['name']),
        'seo_content': city_data.get(f'seo_content_{lang}', city_data.get('seo_content', '')),
        'achievements': city_data.get(f'achievements_{lang}', city_data.get('achievements', [])),
    }

    return render(request, 'core/city_page.html', {'city': data})


def news_list(request):
    """Список всіх статей блогу."""
    lang = get_language()
    articles = NewsArticle.objects.filter(is_published=True)

    # Пагінація
    paginator = Paginator(articles, 10)  # 10 статей на сторінку
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'articles': page_obj,
        'page_obj': page_obj,
    }

    return render(request, 'core/news_list.html', context)


def news_detail(request, slug):
    """Детальна сторінка статті."""
    lang = get_language()

    # Шукаємо статтю за slug залежно від мови
    if lang == 'ru':
        article = NewsArticle.objects.filter(
            slug_ru=slug,
            is_published=True
        ).first()
    else:
        article = NewsArticle.objects.filter(
            slug_uk=slug,
            is_published=True
        ).first()

    if not article:
        raise Http404(f"Стаття з slug '{slug}' не знайдена")

    # Вибираємо дані залежно від мови
    context = {
        'article': article,
        'title': article.title_ru if lang == 'ru' and article.title_ru else article.title_uk,
        'content': article.content_ru if lang == 'ru' and article.content_ru else article.content_uk,
        'meta_description': article.meta_description_ru if lang == 'ru' and article.meta_description_ru else article.meta_description_uk,
    }

    return render(request, 'core/news_detail.html', context)


# ============================================================================
# Homepage Content Views
# ============================================================================

@require_http_methods(["POST"])
def submit_testimonial(request):
    """Обробка форми відгуку з HTMX."""
    form = TestimonialForm(request.POST)

    if form.is_valid():
        testimonial = form.save(commit=False)
        testimonial.is_published = False  # Потребує модерації
        testimonial.save()

        # Повертаємо success message для HTMX
        return render(request, 'core/components/testimonial_success.html', {
            'message': 'Ваш відгук буде опубліковано після перевірки модератором'
        })

    # Якщо форма невалідна, повертаємо форму з помилками
    return render(request, 'core/components/testimonial_form.html', {
        'form': form
    }, status=400)


@require_http_methods(["GET"])
def get_testimonial_form(request):
    """Отримати форму відгуку для модального вікна."""
    form = TestimonialForm()
    return render(request, 'core/components/testimonial_form.html', {
        'form': form
    })


@require_http_methods(["POST"])
def submit_consultation(request):
    """Обробка форми консультації з HTMX."""
    form = ConsultationForm(request.POST)

    if form.is_valid():
        consultation = form.save(commit=False)

        # Збираємо UTM параметри
        consultation.utm_source = request.GET.get('utm_source', '') or request.POST.get('utm_source', '')
        consultation.utm_medium = request.GET.get('utm_medium', '') or request.POST.get('utm_medium', '')
        consultation.utm_campaign = request.GET.get('utm_campaign', '') or request.POST.get('utm_campaign', '')
        consultation.utm_content = request.GET.get('utm_content', '') or request.POST.get('utm_content', '')
        consultation.utm_term = request.GET.get('utm_term', '') or request.POST.get('utm_term', '')
        consultation.fbclid = request.GET.get('fbclid', '') or request.POST.get('fbclid', '')
        consultation.gclid = request.GET.get('gclid', '') or request.POST.get('gclid', '')
        consultation.referrer = request.META.get('HTTP_REFERER', '')

        # IP адреса
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            consultation.ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            consultation.ip_address = request.META.get('REMOTE_ADDR')

        consultation.save()

        # Повертаємо success message
        return render(request, 'core/components/consultation_success.html', {
            'message': 'Дякуємо! Ми зв\'яжемося з вами найближчим часом.'
        })

    # Якщо форма невалідна, повертаємо помилки
    return render(request, 'core/components/consultation_form.html', {
        'form': form
    }, status=400)

