from django.urls import path
from . import views

app_name = 'leads'

urlpatterns = [
    path('api/trial-form/', views.submit_trial_form, name='submit_trial_form'),
]



