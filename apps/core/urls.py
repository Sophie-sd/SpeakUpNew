from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Головні сторінки
    path('', views.index, name='index'),
    path('about', views.about, name='about'),
    path('contacts', views.contacts, name='contacts'),
    path('testing', views.testing, name='testing'),

    # Homepage content forms
    path('submit-testimonial/', views.submit_testimonial, name='submit_testimonial'),
    path('get-testimonial-form/', views.get_testimonial_form, name='get_testimonial_form'),
    path('submit-consultation/', views.submit_consultation, name='submit_consultation'),

    # NEWS - ПЕРЕД catch-all! (КРИТИЧНО для SEO)
    path('news/', views.news_list, name='news_list'),
    path('news/<slug:slug>/', views.news_detail, name='news_detail'),

    # Програми (динамічний slug)
    path('programs/<slug:slug>', views.program_detail, name='program_detail'),

    # Orphan: Локації (динамічний slug)
    path('school/<slug:slug>', views.school_location, name='school_location'),

    # Orphan: Міста (динамічний slug) - В КІНЦІ як catch-all
    path('<slug:city>', views.city_page, name='city_page'),
]

