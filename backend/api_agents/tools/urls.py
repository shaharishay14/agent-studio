"""
Tools/Connections URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComposioConnectionViewSet


router = DefaultRouter()
router.register(r'', ComposioConnectionViewSet, basename='connection')

urlpatterns = [
    path('', include(router.urls)),
]
