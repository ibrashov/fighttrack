from django.db import models
from django.contrib.auth.models import User


class TrainingLog(models.Model):
    """A single training session entry logged by a user."""

    FOCUS_CHOICES = [
        ('striking', 'Striking'),
        ('grappling', 'Grappling'),
        ('conditioning', 'Physical Conditioning'),
        ('sparring', 'Sparring'),
        ('technique', 'Technique Drills'),
    ]

    INTENSITY_CHOICES = [
        (1, 'Very Light'),
        (2, 'Light'),
        (3, 'Moderate'),
        (4, 'Hard'),
        (5, 'Max Effort'),
    ]

    # ForeignKey: TrainingLog → User
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='training_logs',
    )

    title = models.CharField(max_length=200)
    focus = models.CharField(max_length=20, choices=FOCUS_CHOICES)
    duration_minutes = models.PositiveIntegerField(help_text='Duration in minutes')
    intensity = models.PositiveSmallIntegerField(choices=INTENSITY_CHOICES, default=3)
    notes = models.TextField(blank=True, default='')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username} – {self.title} ({self.date})"
