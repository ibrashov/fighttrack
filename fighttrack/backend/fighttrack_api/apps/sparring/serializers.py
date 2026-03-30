from django.contrib.auth.models import User
from rest_framework import serializers

from fighttrack_api.apps.gyms.serializers import GymSerializer
from fighttrack_api.apps.users.models import UserExperience

from .models import SparringRequest

EXPERIENCE_GAP_LIMIT_MONTHS = 6
INCOMPLETE_PROFILE_MESSAGE = 'Complete your profile experience before sending a challenge.'
EXPERIENCE_GAP_MESSAGE = 'Please choose an opponent with closer experience. The experience gap must not exceed 6 months.'


def resolve_experience_months(user, martial_art=''):
    profile = getattr(user, 'profile', None)
    target_martial_art = (martial_art or '').strip() or getattr(profile, 'primary_martial_art', '').strip()

    if not target_martial_art:
        return None, ''

    entry = UserExperience.objects.filter(
        user=user,
        martial_art__iexact=target_martial_art,
    ).first()

    if not entry:
        return None, target_martial_art

    return entry.total_months, entry.martial_art


class SparringRequestSerializer(serializers.ModelSerializer):
    """ModelSerializer for full SparringRequest output."""

    initiator_username = serializers.CharField(source='initiator.username', read_only=True)
    opponent_username = serializers.CharField(source='opponent.username', read_only=True)
    gym_detail = GymSerializer(source='gym', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SparringRequest
        fields = [
            'id',
            'initiator',
            'initiator_username',
            'opponent',
            'opponent_username',
            'gym',
            'gym_detail',
            'proposed_date',
            'proposed_time',
            'martial_art',
            'duration',
            'message',
            'equipment_notes',
            'status',
            'status_display',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'initiator',
            'initiator_username',
            'opponent_username',
            'gym_detail',
            'status_display',
            'created_at',
            'updated_at',
        ]


class SparringRequestCreateSerializer(serializers.Serializer):
    """Plain serializer for creating a new sparring request."""

    opponent_id = serializers.IntegerField()
    gym_id = serializers.IntegerField()
    proposed_date = serializers.DateField()
    proposed_time = serializers.TimeField()
    martial_art = serializers.CharField(required=False, allow_blank=True, default='')
    duration = serializers.CharField(required=False, allow_blank=True, default='')
    message = serializers.CharField(required=False, allow_blank=True, default='')
    equipment_notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_opponent_id(self, value):
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Opponent user does not exist.')
        return value

    def validate(self, attrs):
        initiator = self.context['request'].user
        try:
            opponent = User.objects.select_related('profile').get(pk=attrs['opponent_id'])
        except User.DoesNotExist as exc:
            raise serializers.ValidationError({'opponent_id': 'Opponent user does not exist.'}) from exc

        initiator_months, resolved_art = resolve_experience_months(initiator, attrs.get('martial_art', ''))
        opponent_months, _ = resolve_experience_months(opponent, attrs.get('martial_art', '') or resolved_art)

        if initiator_months is None or opponent_months is None:
            raise serializers.ValidationError({'non_field_errors': [INCOMPLETE_PROFILE_MESSAGE]})

        if abs(initiator_months - opponent_months) > EXPERIENCE_GAP_LIMIT_MONTHS:
            raise serializers.ValidationError({'non_field_errors': [EXPERIENCE_GAP_MESSAGE]})

        attrs['resolved_martial_art'] = resolved_art
        return attrs

    def create(self, validated_data):
        return SparringRequest.objects.create(
            initiator=validated_data['initiator'],
            opponent_id=validated_data['opponent_id'],
            gym_id=validated_data['gym_id'],
            proposed_date=validated_data['proposed_date'],
            proposed_time=validated_data['proposed_time'],
            martial_art=validated_data.get('martial_art', '').strip() or validated_data.get('resolved_martial_art', ''),
            duration=validated_data.get('duration', '').strip(),
            message=validated_data.get('message', '').strip(),
            equipment_notes=validated_data.get('equipment_notes', '').strip(),
        )


class SparringStatusSerializer(serializers.Serializer):
    """Plain serializer for updating sparring request status."""

    status = serializers.ChoiceField(choices=['accepted', 'declined', 'cancelled'])
