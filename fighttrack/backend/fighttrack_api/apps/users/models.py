from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator
from django.db import models


class UserProfile(models.Model):
    """Extended profile for each authenticated user."""
    WEIGHT_CLASS_CHOICES = [
        ('flyweight', 'Flyweight (-57kg)'),
        ('bantamweight', 'Bantamweight (-61kg)'),
        ('featherweight', 'Featherweight (-66kg)'),
        ('lightweight', 'Lightweight (-70kg)'),
        ('welterweight', 'Welterweight (-77kg)'),
        ('middleweight', 'Middleweight (-84kg)'),
        ('light_heavyweight', 'Light Heavyweight (-93kg)'),
        ('heavyweight', 'Heavyweight (+93kg)'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, default='')
    weight_class = models.CharField(max_length=20, choices=WEIGHT_CLASS_CHOICES, blank=True)
    years_experience = models.PositiveIntegerField(default=0)
    rating = models.PositiveIntegerField(default=0)
    achievements = models.JSONField(default=list, blank=True)
    primary_martial_art = models.CharField(max_length=100, blank=True, default='')
    preferred_sparring_duration = models.CharField(max_length=120, blank=True, default='')
    equipment_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

    @property
    def achievements_count(self):
        return len(self.achievements or [])


class UserExperience(models.Model):
    """Experience entries per martial art for a user."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    martial_art = models.CharField(max_length=100)
    years = models.PositiveIntegerField(default=0)
    months = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(11)])
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['martial_art']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'martial_art'],
                name='unique_user_martial_art_experience',
            ),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.martial_art}"

    @property
    def total_months(self):
        return (self.years * 12) + self.months
