"""
Credits URL Configuration
"""
from django.urls import path
from .views import credit_balance, credit_usage_history, add_credits


urlpatterns = [
    path('balance/', credit_balance, name='credit_balance'),
    path('history/', credit_usage_history, name='credit_history'),
    path('add/', add_credits, name='add_credits'),
]
