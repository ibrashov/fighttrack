from django.urls import path
from . import views

urlpatterns = [
    path('', views.training_log_list_create, name='training-list-create'),
    path('stats/', views.training_stats, name='training-stats'),
    path('<int:pk>/', views.TrainingLogDetailView.as_view(), name='training-detail'),
]
