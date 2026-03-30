from django.db import models
from django.contrib.auth.models import User
from fighttrack_api.apps.gyms.models import Gym


class SparringRequest(models.Model):
    """A sparring challenge from one user to another at a specific gym."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('cancelled', 'Cancelled'),
    ]

    # ForeignKey: SparringRequest → User (initiator)
    initiator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_sparring_requests',
    )

    # ForeignKey: SparringRequest → User (opponent)
    opponent = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_sparring_requests',
    )

    # ForeignKey: SparringRequest → Gym
    gym = models.ForeignKey(
        Gym,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sparring_requests',
    )

    proposed_date = models.DateField()
    proposed_time = models.TimeField()
    martial_art = models.CharField(max_length=100, blank=True, default='')
    duration = models.CharField(max_length=120, blank=True, default='')
    message = models.TextField(blank=True, default='')
    equipment_notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return (f"{self.initiator.username} → {self.opponent.username} "
                f"@ {self.gym} on {self.proposed_date} [{self.status}]")
