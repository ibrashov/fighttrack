from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth-login'),
    path('logout/', views.logout_view, name='auth-logout'),
    path('register/', views.register_view, name='auth-register'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('users/', views.UsersListView.as_view(), name='users-list'),
]
