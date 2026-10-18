"""
Workflows URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TriggerViewSet, WorkflowViewSet


router = DefaultRouter()
router.register(r'triggers', TriggerViewSet, basename='trigger')
router.register(r'', WorkflowViewSet, basename='workflow')

urlpatterns = [
    path('', include(router.urls)),
]
