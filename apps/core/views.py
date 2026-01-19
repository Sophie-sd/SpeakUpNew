from django.shortcuts import render, get_object_or_404
from django.http import Http404, JsonResponse, HttpResponse
from django.urls import reverse
from django.utils.translation import get_language
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import models
import logging
from .seo_config import PROGRAMS, LOCATIONS, CITIES

logger = logging.getLogger(__name__)
from .models import (
    NewsArticle, Achievement, Advantage, CourseCategory, Course,
    Testimonial, FAQ, ConsultationRequest, ContactInfo
)
from .forms import TestimonialForm, ConsultationForm, CorporateConsultationForm
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

    faqs_list = list(FAQ.objects.filter(is_active=True).order_by('order'))
    context = {
        'achievements': Achievement.objects.filter(is_active=True).order_by('order'),
        'advantages': Advantage.objects.prefetch_related('items').filter(is_active=True).order_by('order'),
        'course_categories': CourseCategory.objects.prefetch_related(
            'courses'
        ).filter(courses__is_active=True).distinct().order_by('order'),
        'testimonials': Testimonial.objects.filter(is_published=True).order_by('-created_at')[:10],
        'faqs': faqs_list,
        'faqs_column1': faqs_list[:4],
        'faqs_column2': faqs_list[4:8],
        'faqs_column3': faqs_list[8:12],
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
    lang = get_language()
    contact_info = ContactInfo.objects.filter(is_active=True).first()

    context = {
        'contact_info': contact_info,
        'current_language': lang,
    }
    return render(request, 'core/contacts.html', context)

def faq(request):
    """Сторінка з частими питаннями."""
    lang = get_language()
    faqs_list = list(FAQ.objects.filter(is_active=True).order_by('order'))

    context = {
        'faqs': faqs_list,
        'current_language': lang,
    }
    return render(request, 'core/faq.html', context)

def testing(request):
    """Тест рівня з UTM tracking."""
    context = {
        'utm_source': request.GET.get('from', ''),
    }
    return render(request, 'core/testing.html', context)

def programs_list(request):
    """Сторінка з усіма програмами, структурованими за категоріями."""
    lang = get_language()

    # Категорії програм
    categories = {
        'kids': {
            'title': 'Діти та підлітки',
            'title_ru': 'Дети и подростки',
            'programs': []
        },
        'group': {
            'title': 'Дорослі - Групові та онлайн програми',
            'title_ru': 'Взрослые - Групповые и онлайн программы',
            'programs': []
        },
        'individual': {
            'title': 'Дорослі - Індивідуальні програми',
            'title_ru': 'Взрослые - Индивидуальные программы',
            'programs': []
        },
        'professional': {
            'title': 'Профільні курси',
            'title_ru': 'Профильные курсы',
            'programs': []
        },
        'exams': {
            'title': 'Підготовка до іспитів',
            'title_ru': 'Подготовка к экзаменам',
            'programs': []
        },
        'beginners': {
            'title': 'Для початківців',
            'title_ru': 'Для начинающих',
            'programs': []
        },
    }

    # Структуруємо програми за категоріями
    for slug, program in PROGRAMS.items():
        category_key = program.get('category', 'group')
        if category_key not in categories:
            category_key = 'group'  # fallback

        # Вибрати переклад згідно з мовою
        program_data = {
            'slug': slug,
            'title': program.get(f'title_{lang}', program['title']),
            'description': program.get(f'description_{lang}', program['description']),
            'price': program.get('price', {}),
            'duration': program.get('duration', ''),
            'badge': program.get('badge'),
            'includes': program.get(f'includes_{lang}', program.get('includes', [])),
            'benefits': program.get(f'benefits_{lang}', program.get('benefits', [])),
            'url': f'/programs/{slug}',
        }

        categories[category_key]['programs'].append(program_data)

    # Локалізуємо назви категорій
    for category_key, category_data in categories.items():
        category_data['title'] = category_data.get(f'title_{lang}', category_data['title'])

    context = {
        'categories': categories,
        'current_language': lang,
    }

    return render(request, 'core/programs_list.html', context)

def program_detail(request, slug):
    """Сторінка програми (26 програм)."""
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
        'price': program.get('price', {}),
        'duration': program.get('duration', ''),
        'badge': program.get('badge'),
    }

    # Для корпоративної програми додаємо детальну інформацію
    if slug == 'corporate':
        corporate_data = program.get('schedule', {})
        if corporate_data:
            data['schedule'] = corporate_data.get(lang, corporate_data.get('uk', []))

        corporate_data = program.get('course_types', {})
        if corporate_data:
            data['course_types'] = corporate_data.get(lang, corporate_data.get('uk', []))

        corporate_data = program.get('pricing_details', {})
        if corporate_data:
            data['pricing_details'] = corporate_data.get(lang, corporate_data.get('uk', []))

        # Програми навчання
        programs_data = program.get('programs', {})
        if programs_data:
            data['programs'] = {}
            for key, prog in programs_data.items():
                data['programs'][key] = {
                    'title': prog.get(f'title_{lang}', prog.get('title_uk', '')),
                    'description': prog.get(f'description_{lang}', prog.get('description_uk', '')),
                    'features': prog.get(f'features_{lang}', prog.get('features_uk', [])),
                    'target': prog.get(f'target_{lang}', prog.get('target_uk', [])),
                    'components': prog.get(f'components_{lang}', prog.get('components_uk', [])),
                    'benefits': prog.get(f'benefits_{lang}', prog.get('benefits_uk', []))
                }

        # Чому саме Speak Up
        why_data = program.get('why_speak_up', {})
        if why_data:
            data['why_speak_up'] = {}
            for key, item in why_data.items():
                data['why_speak_up'][key] = {
                    'title': item.get(f'title_{lang}', item.get('title_uk', '')),
                    'content': item.get(f'content_{lang}', item.get('content_uk', []))
                }

        # Етапи співпраці
        stages_data = program.get('stages', {})
        if stages_data:
            data['stages'] = stages_data.get(lang, stages_data.get('uk', []))

        # Навички
        skills_data = program.get('skills', {})
        if skills_data:
            data['skills'] = skills_data.get(lang, skills_data.get('uk', []))

        # Гарантія
        guarantee_data = program.get('guarantee', {})
        if guarantee_data:
            data['guarantee'] = {
                'title': guarantee_data.get(f'title_{lang}', guarantee_data.get('title_uk', '')),
                'content': guarantee_data.get(f'content_{lang}', guarantee_data.get('content_uk', []))
            }

        # Компоненти
        components_data = program.get('components', {})
        if components_data:
            data['components'] = {}
            for key, comp in components_data.items():
                data['components'][key] = {
                    'title': comp.get(f'title_{lang}', comp.get('title_uk', '')),
                    'subtitle': comp.get(f'subtitle_{lang}', comp.get('subtitle_uk', '')),
                    'features': comp.get(f'features_{lang}', comp.get('features_uk', []))
                }

        # Досвід
        experience_data = program.get('experience', {})
        if experience_data:
            data['experience'] = experience_data.get(lang, experience_data.get('uk', ''))

        # Форма консультації
        data['consultation_form'] = CorporateConsultationForm()

        # Використовуємо спеціальний шаблон для корпоративної програми
        return render(request, 'core/program_detail_corporate.html', {'program': data})

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
    city_name = city_data.get(f'name_{lang}', city_data['name'])
    city_name_ru = city_data.get('name_ru', city_data['name'])

    # Знайти локації в цьому місті
    city_locations = []
    for loc_slug, loc_data in LOCATIONS.items():
        if loc_data.get('city') == city_name or loc_data.get('city_ru') == city_name_ru:
            city_locations.append({
                'slug': loc_slug,
                'district': loc_data.get(f'district_{lang}', loc_data.get('district', '')),
            })

    data = {
        'slug': city,
        'name': city_name,
        'name_ru': city_name_ru,
        'seo_content': city_data.get(f'seo_content_{lang}', city_data.get('seo_content', '')),
        'achievements': city_data.get(f'achievements_{lang}', city_data.get('achievements', [])),
        'locations': city_locations,
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


def feedback_list(request):
    """Сторінка відгуків клієнтів."""
    lang = get_language()
    testimonials = Testimonial.objects.filter(is_published=True).order_by('-created_at')

    # Статистика для intro
    total_count = testimonials.count()
    avg_rating = testimonials.aggregate(avg=models.Avg('rating'))['avg'] or 0
    avg_rating = round(avg_rating, 1) if avg_rating else 0

    # Пагінація
    paginator = Paginator(testimonials, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'testimonials': page_obj,
        'page_obj': page_obj,
        'current_language': lang,
        'total_count': total_count,
        'avg_rating': avg_rating,
    }
    return render(request, 'core/feedback.html', context)


def job_list(request):
    """Сторінка вакансій."""
    lang = get_language()

    # Статичний контент вакансій (можна винести в модель пізніше)
    vacancies = [
        {
            'title_uk': 'Дизайнер (віддалено)',
            'title_ru': 'Дизайнер (удаленно)',
            'description_uk': 'Шукаємо талановитого дизайнера для створення візуального контенту для нашої школи англійської мови.',
            'description_ru': 'Ищем талантливого дизайнера для создания визуального контента для нашей школы английского языка.',
            'requirements_uk': [
                'Досвід роботи дизайнером від 2 років',
                'Володіння Adobe Photoshop, Illustrator, Figma',
                'Розуміння принципів UX/UI дизайну',
                'Здатність працювати в команді та дотримуватися дедлайнів',
                'Базове знання англійської мови'
            ],
            'requirements_ru': [
                'Опыт работы дизайнером от 2 лет',
                'Владение Adobe Photoshop, Illustrator, Figma',
                'Понимание принципов UX/UI дизайна',
                'Способность работать в команде и соблюдать дедлайны',
                'Базовое знание английского языка'
            ],
            'responsibilities_uk': [
                'Створення рекламних креативів для соціальних мереж',
                'Розробка макетів для сайту та email-розсилок',
                'Дизайн презентацій та навчальних матеріалів',
                'Підтримка візуального стилю бренду'
            ],
            'responsibilities_ru': [
                'Создание рекламных креативов для социальных сетей',
                'Разработка макетов для сайта и email-рассылок',
                'Дизайн презентаций и учебных материалов',
                'Поддержка визуального стиля бренда'
            ],
            'conditions_uk': [
                'Віддалена робота',
                'Гнучкий графік',
                'Конкурентна заробітна плата (обговорюється на співбесіді)',
                'Професійний розвиток та навчання',
                'Робота в дружній команді'
            ],
            'conditions_ru': [
                'Удаленная работа',
                'Гибкий график',
                'Конкурентная заработная плата (обсуждается на собеседовании)',
                'Профессиональное развитие и обучение',
                'Работа в дружной команде'
            ],
        },
        {
            'title_uk': 'Таргетолог (віддалено)',
            'title_ru': 'Таргетолог (удаленно)',
            'description_uk': 'Шукаємо досвідченого таргетолога для налаштування та ведення рекламних кампаній в соціальних мережах.',
            'description_ru': 'Ищем опытного таргетолога для настройки и ведения рекламных кампаний в социальных сетях.',
            'requirements_uk': [
                'Досвід роботи таргетологом від 1.5 років',
                'Володіння Facebook Ads, Google Ads',
                'Розуміння метрик та аналітики',
                'Досвід роботи з освітніми проектами (перевага)',
                'Здатність аналізувати дані та оптимізувати кампанії'
            ],
            'requirements_ru': [
                'Опыт работы таргетологом от 1.5 лет',
                'Владение Facebook Ads, Google Ads',
                'Понимание метрик и аналитики',
                'Опыт работы с образовательными проектами (преимущество)',
                'Способность анализировать данные и оптимизировать кампании'
            ],
            'responsibilities_uk': [
                'Налаштування та запуск рекламних кампаній',
                'Ведення рекламних кампаній та оптимізація',
                'Аналіз результатів та підготовка звітів',
                'Робота з креативами та текстами'
            ],
            'responsibilities_ru': [
                'Настройка и запуск рекламных кампаний',
                'Ведение рекламных кампаний и оптимизация',
                'Анализ результатов и подготовка отчетов',
                'Работа с креативами и текстами'
            ],
            'conditions_uk': [
                'Віддалена робота',
                'Гнучкий графік',
                'Конкурентна заробітна плата (обговорюється на співбесіді)',
                'Бонусна система за результати',
                'Професійний розвиток'
            ],
            'conditions_ru': [
                'Удаленная работа',
                'Гибкий график',
                'Конкурентная заработная плата (обсуждается на собеседовании)',
                'Бонусная система за результаты',
                'Профессиональное развитие'
            ],
        },
        {
            'title_uk': 'Дизайнер рекламних креативів (віддалено)',
            'title_ru': 'Дизайнер рекламных креативов (удаленно)',
            'description_uk': 'Шукаємо креативного дизайнера для створення рекламних креативів та банерів для соціальних мереж та контекстної реклами.',
            'description_ru': 'Ищем креативного дизайнера для создания рекламных креативов и баннеров для социальных сетей и контекстной рекламы.',
            'requirements_uk': [
                'Досвід роботи дизайнером від 1 року',
                'Володіння Adobe Photoshop, Illustrator, After Effects (перевага)',
                'Розуміння специфіки рекламних креативів',
                'Здатність швидко створювати якісні макети',
                'Креативність та увага до деталей'
            ],
            'requirements_ru': [
                'Опыт работы дизайнером от 1 года',
                'Владение Adobe Photoshop, Illustrator, After Effects (преимущество)',
                'Понимание специфики рекламных креативов',
                'Способность быстро создавать качественные макеты',
                'Креативность и внимание к деталям'
            ],
            'responsibilities_uk': [
                'Створення рекламних креативів для Facebook, Instagram, Google',
                'Адаптація креативів під різні формати',
                'Робота з брендбуком та підтримка стилю',
                'Створення анімованих креативів (перевага)'
            ],
            'responsibilities_ru': [
                'Создание рекламных креативов для Facebook, Instagram, Google',
                'Адаптация креативов под разные форматы',
                'Работа с брендбуком и поддержка стиля',
                'Создание анимированных креативов (преимущество)'
            ],
            'conditions_uk': [
                'Віддалена робота',
                'Гнучкий графік',
                'Конкурентна заробітна плата (обговорюється на співбесіді)',
                'Робота з цікавими проектами',
                'Швидкий кар\'єрний ріст'
            ],
            'conditions_ru': [
                'Удаленная работа',
                'Гибкий график',
                'Конкурентная заработная плата (обсуждается на собеседовании)',
                'Работа с интересными проектами',
                'Быстрый карьерный рост'
            ],
        },
    ]

    context = {
        'vacancies': vacancies,
        'current_language': lang,
    }
    return render(request, 'core/job.html', context)


def shares_list(request):
    """Сторінка акцій та спеціальних пропозицій."""
    lang = get_language()

    # Статичний контент акцій (можна винести в модель пізніше)
    promotions = [
        {
            'title_uk': 'Акція 1+1 = 4',
            'title_ru': 'Акция 1+1 = 4',
            'description_uk': 'Купуй 2 рівні англійської і ще 2 отримай в подарунок',
            'description_ru': 'Покупай 2 уровня английского и еще 2 получи в подарок',
            'details_uk': 'Спеціальна пропозиція: отримайте два рівні навчання за ціною одного. Ідеальна можливість швидко підвищити свій рівень англійської з максимальною економією.',
            'details_ru': 'Специальное предложение: получите два уровня обучения по цене одного. Идеальная возможность быстро повысить свой уровень английского с максимальной экономией.',
            'conditions_uk': [
                'Акція діє на всі програми навчання',
                'Можна придбати будь-які 2 рівні',
                'Економія до 50% від вартості',
                'Гарантія результату зберігається'
            ],
            'conditions_ru': [
                'Акция действует на все программы обучения',
                'Можно приобрести любые 2 уровня',
                'Экономия до 50% от стоимости',
                'Гарантия результата сохраняется'
            ],
            'how_to_get_uk': 'Щоб отримати знижку, просто зателефонуйте нам або заповніть форму на сайті. Наш менеджер допоможе підібрати оптимальну програму та розповість про всі деталі акції.',
            'how_to_get_ru': 'Чтобы получить скидку, просто позвоните нам или заполните форму на сайте. Наш менеджер поможет подобрать оптимальную программу и расскажет обо всех деталях акции.',
            'example_uk': 'Приклад: Якщо один рівень коштує 15,900 грн, то за акцією ви отримаєте 2 рівні за 15,900 грн замість 31,800 грн. Економія: 15,900 грн!',
            'example_ru': 'Пример: Если один уровень стоит 15,900 грн, то по акции вы получите 2 уровня за 15,900 грн вместо 31,800 грн. Экономия: 15,900 грн!',
            'valid_until_uk': 'Акція діє до кінця місяця',
            'valid_until_ru': 'Акция действует до конца месяца',
        },
    ]

    context = {
        'promotions': promotions,
        'current_language': lang,
    }
    return render(request, 'core/shares.html', context)


# ============================================================================
# Homepage Content Views
# ============================================================================

@require_http_methods(["POST"])
def submit_testimonial(request):
    """Обробка форми відгуку з HTMX."""
    form = TestimonialForm(request.POST)

    if form.is_valid():
        try:
            testimonial = form.save(commit=False)
            testimonial.is_published = False  # Потребує модерації

            try:
                testimonial.save()
            except ValidationError as e:
                # ValidationError від model validators
                if hasattr(e, 'error_dict'):
                    for field, errors in e.error_dict.items():
                        form.add_error(field, errors)
                else:
                    form.add_error(None, e)
                return render(request, 'core/components/testimonial_form.html', {
                    'form': form
                }, status=400)

            # Повертаємо success message для HTMX
            return render(request, 'core/components/testimonial_success.html', {
                'message': 'Ваш відгук буде опубліковано після перевірки модератором'
            })
        except Exception as e:
            logger.error('[TestimonialForm] Unexpected error: %s', e, exc_info=True)
            form.add_error(None, 'Помилка сервера. Спробуйте ще раз.')
            return render(request, 'core/components/testimonial_form.html', {
                'form': form
            }, status=500)

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
    # Визначити тип форми на основі data-form-location
    form_location = request.POST.get('form_location', request.POST.get('data-form-location', ''))

    # Визначити яку форму використовувати
    if 'corporate' in str(form_location):
        form = CorporateConsultationForm(request.POST)
    else:
        form = ConsultationForm(request.POST)

    if form.is_valid():
        try:
            consultation = form.save(commit=False)

            # Збираємо UTM параметри
            consultation.utm_source = request.GET.get('utm_source', '') or request.POST.get('utm_source', '')
            consultation.utm_medium = request.GET.get('utm_medium', '') or request.POST.get('utm_medium', '')
            consultation.utm_campaign = request.GET.get('utm_campaign', '') or request.POST.get('utm_campaign', '')
            consultation.utm_term = request.GET.get('utm_term', '') or request.POST.get('utm_term', '')
            consultation.fbclid = request.GET.get('fbclid', '') or request.POST.get('fbclid', '')
            consultation.gclid = request.GET.get('gclid', '') or request.POST.get('gclid', '')
            consultation.referrer = request.META.get('HTTP_REFERER', '')

            # Зберегти вибраний прайс-пакет
            selected_pricing = request.POST.get('selected_pricing', '')
            if selected_pricing:
                consultation.utm_content = f"pricing:{selected_pricing}"
            else:
                consultation.utm_content = request.GET.get('utm_content', '') or request.POST.get('utm_content', '')

            # IP адреса
            from apps.leads.utils import get_client_ip
            consultation.ip_address = get_client_ip(request)

            # КРИТИЧНО: Обробка ValidationError при збереженні
            try:
                consultation.save()
            except ValidationError as e:
                # ValidationError від model validators
                if hasattr(e, 'error_dict'):
                    for field, errors in e.error_dict.items():
                        form.add_error(field, errors)
                else:
                    form.add_error(None, e)

                return render(request, 'core/components/consultation_form.html', {
                    'form': form
                }, status=400)

            # Повертаємо success message з HTMX redirect
            response = HttpResponse(status=200)
            response['HX-Redirect'] = reverse('core:thank_you')
            return response

        except Exception as e:
            # Інші несподівані помилки
            logger.error('[ConsultationForm] Unexpected error: %s', e, exc_info=True)
            form.add_error(None, 'Помилка сервера. Спробуйте ще раз.')
            return render(request, 'core/components/consultation_form.html', {
                'form': form
            }, status=500)

    # Якщо форма невалідна, повертаємо помилки
    return render(request, 'core/components/consultation_form.html', {
        'form': form
    }, status=400)


@require_http_methods(["GET"])
def thank_you(request):
    """Thank you page після успішної відправки форми"""
    return render(request, 'core/thank_you.html')


# ===== SEO STUB PAGES =====

def golovna_3_stub(request):
    """SEO stub for /ru/golovna-3/."""
    return render(request, 'core/stubs/golovna_3_stub.html')

def glavnaya_stranicza_stub(request):
    """SEO stub for /ru/glavnaya-stranicza/."""
    return render(request, 'core/stubs/glavnaya_stranicza_stub.html')

def summer_camp_2021_stub(request):
    """SEO stub for /ru/programs/summer-camp-2021."""
    return render(request, 'core/stubs/summer_camp_2021_stub.html')

def sertyfikat_stub(request):
    """SEO stub for /ru/sertyfikat/."""
    return render(request, 'core/stubs/sertyfikat_stub.html')

def shares_detail_stub(request):
    """SEO stub for /ru/shares/kupy-2-urovnya-anglyjskogo-y-poluchy-eshhe-2-v-podarok/."""
    return render(request, 'core/stubs/shares_detail_stub.html')

def shares_page_stub(request, page):
    """SEO stub for /ru/shares/page/<page>/."""
    return render(request, 'core/stubs/shares_page_stub.html', {'page': page})

def programma_loyalnosty_stub(request):
    """SEO stub for /ru/programma-loyalnosty/."""
    return render(request, 'core/stubs/programma_loyalnosty_stub.html')

def buy_stub(request):
    """Landing page for adults learning programs."""
    lang = get_language()

    # Отримуємо програми для дорослих з PROGRAMS
    adult_programs = []
    for slug, program in PROGRAMS.items():
        category = program.get('category', '')
        if category in ['group', 'individual', 'professional', 'exams', 'beginners']:
            adult_programs.append({
                'slug': slug,
                'title': program.get(f'title_{lang}', program['title']),
                'description': program.get(f'description_{lang}', program['description']),
                'url': f'/programs/{slug}',
            })

    context = {
        'current_language': lang,
        'adult_programs': adult_programs[:6],  # Перші 6 програм
        'consultation_form': ConsultationForm(),
    }
    return render(request, 'core/adults_learning.html', context)

def kids_learning_page(request):
    """Landing page for kids learning programs."""
    lang = get_language()

    # Отримуємо дані програми kids
    kids_program = PROGRAMS.get('kids', {})

    # Отримуємо інші дитячі програми
    kids_programs = []
    for slug, program in PROGRAMS.items():
        if program.get('category') == 'kids' and slug != 'kids':
            kids_programs.append({
                'slug': slug,
                'title': program.get(f'title_{lang}', program['title']),
                'description': program.get(f'description_{lang}', program['description']),
                'url': f'/programs/{slug}',
            })

    context = {
        'current_language': lang,
        'kids_program': {
            'title': kids_program.get(f'title_{lang}', kids_program.get('title', '')),
            'description': kids_program.get(f'description_{lang}', kids_program.get('description', '')),
            'full_content': kids_program.get(f'full_content_{lang}', kids_program.get('full_content', '')),
            'includes': kids_program.get(f'includes_{lang}', kids_program.get('includes', [])),
            'benefits': kids_program.get(f'benefits_{lang}', kids_program.get('benefits', [])),
            'url': '/programs/kids',
        },
        'other_kids_programs': kids_programs,
        'consultation_form': ConsultationForm(),
    }
    return render(request, 'core/kids_learning.html', context)

def premium_learning_page(request):
    """Landing page for Premium learning program."""
    lang = get_language()

    # Отримуємо дані програми premium
    premium_program = PROGRAMS.get('premium', {})

    context = {
        'current_language': lang,
        'premium_program': {
            'title': premium_program.get(f'title_{lang}', premium_program.get('title', '')),
            'description': premium_program.get(f'description_{lang}', premium_program.get('description', '')),
            'full_content': premium_program.get(f'full_content_{lang}', premium_program.get('full_content', '')),
            'includes': premium_program.get(f'includes_{lang}', premium_program.get('includes', [])),
            'benefits': premium_program.get(f'benefits_{lang}', premium_program.get('benefits', [])),
            'price': premium_program.get('price', {}),
            'duration': premium_program.get('duration', ''),
            'url': '/programs/premium',
        },
        'consultation_form': ConsultationForm(),
    }
    return render(request, 'core/premium_learning.html', context)

def dogovir_stub(request):
    """SEO stub for /ru/dogovir-pro-nadannya-poslug-dostupu-do-elektronnogo-kabinetu-speak-up-2/."""
    return render(request, 'core/stubs/dogovir_stub.html')

