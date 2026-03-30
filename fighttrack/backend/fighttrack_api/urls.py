from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('fighttrack_api.apps.users.urls')),
    path('api/gyms/', include('fighttrack_api.apps.gyms.urls')),
    path('api/training/', include('fighttrack_api.apps.training.urls')),
    path('api/sparring/', include('fighttrack_api.apps.sparring.urls')),
]
