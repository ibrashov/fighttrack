from django.urls import path
from . import views

urlpatterns = [
    path('', views.sparring_list_create, name='sparring-list-create'),
    path('incoming/', views.sparring_incoming, name='sparring-incoming'),
    path('<int:pk>/', views.SparringDetailView.as_view(), name='sparring-detail'),
    path('<int:pk>/status/', views.SparringStatusView.as_view(), name='sparring-status'),
]
