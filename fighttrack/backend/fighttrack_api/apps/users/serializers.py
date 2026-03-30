from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserExperience, UserProfile


class LoginSerializer(serializers.Serializer):
    """Plain serializer for login credentials."""

    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.Serializer):
    """Plain serializer for registration data."""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("Username already taken.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        UserProfile.objects.create(user=user)
        return user


class UserExperienceSerializer(serializers.ModelSerializer):
    """Serializer for per-martial-art experience rows."""

    total_months = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserExperience
        fields = [
            'id',
            'martial_art',
            'years',
            'months',
            'notes',
            'total_months',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'total_months', 'created_at', 'updated_at']

    def validate(self, attrs):
        years = attrs.get('years', getattr(self.instance, 'years', 0))
        months = attrs.get('months', getattr(self.instance, 'months', 0))
        martial_art = (attrs.get('martial_art') or getattr(self.instance, 'martial_art', '')).strip()

        if not martial_art:
            raise serializers.ValidationError({'martial_art': 'Martial art is required.'})
        if years == 0 and months == 0:
            raise serializers.ValidationError('Experience must be greater than 0 months.')
        if months > 11:
            raise serializers.ValidationError({'months': 'Months must be between 0 and 11.'})
        attrs['martial_art'] = martial_art
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """ModelSerializer for the UserProfile model."""

    achievements_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'bio',
            'weight_class',
            'years_experience',
            'rating',
            'achievements',
            'achievements_count',
            'primary_martial_art',
            'preferred_sparring_duration',
            'equipment_notes',
            'created_at',
        ]
        read_only_fields = ['created_at', 'achievements_count']

    def validate_achievements(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Achievements must be a list.')
        return [str(item).strip() for item in value if str(item).strip()]


class UserSerializer(serializers.ModelSerializer):
    """ModelSerializer for the built-in User, embedding profile and experiences."""

    profile = UserProfileSerializer(read_only=True)
    experiences = UserExperienceSerializer(many=True, read_only=True)
    latest_achievement = serializers.SerializerMethodField()
    display_experience = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'profile',
            'experiences',
            'latest_achievement',
            'display_experience',
        ]

    def get_latest_achievement(self, obj):
        achievements = getattr(obj.profile, 'achievements', []) if hasattr(obj, 'profile') else []
        return achievements[0] if achievements else ''

    def get_display_experience(self, obj):
        if not hasattr(obj, 'profile'):
            return ''

        primary = obj.profile.primary_martial_art.strip()
        experiences = list(getattr(obj, 'experiences', []).all() if hasattr(getattr(obj, 'experiences', None), 'all') else [])
        if not experiences:
            return ''

        selected = next((entry for entry in experiences if entry.martial_art.lower() == primary.lower()), experiences[0])
        parts = []
        if selected.years:
            parts.append(f"{selected.years}y")
        if selected.months:
            parts.append(f"{selected.months}m")
        return ' '.join(parts)


class ProfileUpdateSerializer(serializers.Serializer):
    """Combined serializer for updating profile core fields and experience rows."""

    bio = serializers.CharField(required=False, allow_blank=True, default='')
    weight_class = serializers.CharField(required=False, allow_blank=True, default='')
    rating = serializers.IntegerField(required=False, min_value=0, default=0)
    achievements = serializers.ListField(
        child=serializers.CharField(allow_blank=False),
        required=False,
        allow_empty=True,
    )
    primary_martial_art = serializers.CharField(required=False, allow_blank=True, default='')
    preferred_sparring_duration = serializers.CharField(required=False, allow_blank=True, default='')
    equipment_notes = serializers.CharField(required=False, allow_blank=True, default='')
    experiences = UserExperienceSerializer(many=True, required=False)

    def validate_achievements(self, value):
        return [item.strip() for item in value if item.strip()]

    def validate(self, attrs):
        experiences = attrs.get('experiences')
        primary = (attrs.get('primary_martial_art') or '').strip()

        if experiences:
            normalized = [entry['martial_art'].strip().lower() for entry in experiences]
            if len(normalized) != len(set(normalized)):
                raise serializers.ValidationError({'experiences': 'Each martial art can only be listed once.'})

        if primary and experiences:
            available = {entry['martial_art'].strip().lower() for entry in experiences}
            if primary.lower() not in available:
                raise serializers.ValidationError({
                    'primary_martial_art': 'Primary martial art must match one of the experience entries.',
                })

        return attrs
