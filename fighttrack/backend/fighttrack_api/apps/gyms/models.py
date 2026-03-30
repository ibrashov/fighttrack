from django.db import models


class ActiveGymManager(models.Manager):
    """Custom model manager: returns only gyms that are marked active."""
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

    def by_city(self, city: str):
        return self.get_queryset().filter(city__icontains=city)


class Gym(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Kazakhstan')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Default manager (all gyms) and custom manager
    objects = models.Manager()
    active = ActiveGymManager()

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} – {self.city}"
