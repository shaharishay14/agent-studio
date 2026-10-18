"""
Agents URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import AllowAny
from .views import AgentViewSet, AgentTemplateViewSet


router = DefaultRouter()
router.register(r'templates', AgentTemplateViewSet, basename='agent-template')
router.register(r'', AgentViewSet, basename='agent')

urlpatterns = [
    # Custom route for public agent endpoint: /api/agents/public/{id}/
    # AllowAny permission allows unauthenticated access
    path('public/<uuid:pk>/', AgentViewSet.as_view({'get': 'public'}, permission_classes=[AllowAny]), name='agent-public'),
    path('', include(router.urls)),
]
