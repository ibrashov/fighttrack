from django.urls import path
from . import views

urlpatterns = [
    path('', views.gym_list, name='gym-list'),
    path('create/', views.GymCreateView.as_view(), name='gym-create'),
    path('<int:pk>/', views.gym_detail, name='gym-detail'),
    path('<int:pk>/edit/', views.GymUpdateDeleteView.as_view(), name='gym-update-delete'),
]
