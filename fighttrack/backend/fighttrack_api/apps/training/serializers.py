from rest_framework import serializers
from .models import TrainingLog


class TrainingLogSerializer(serializers.ModelSerializer):
    """ModelSerializer for full TrainingLog representation."""
    username = serializers.CharField(source='user.username', read_only=True)
    focus_display = serializers.CharField(source='get_focus_display', read_only=True)
    intensity_display = serializers.CharField(source='get_intensity_display', read_only=True)

    class Meta:
        model = TrainingLog
        fields = [
            'id', 'user', 'username', 'title', 'focus', 'focus_display',
            'duration_minutes', 'intensity', 'intensity_display',
            'notes', 'date', 'created_at', 'updated_at',
        ]
        read_only_fields = ['user', 'username', 'created_at', 'updated_at',
                            'focus_display', 'intensity_display']


class TrainingLogWriteSerializer(serializers.Serializer):
    """Plain Serializer used for create/update validation."""
    title = serializers.CharField(max_length=200)
    focus = serializers.ChoiceField(choices=[
        'striking', 'grappling', 'conditioning', 'sparring', 'technique'
    ])
    duration_minutes = serializers.IntegerField(min_value=1, max_value=600)
    intensity = serializers.IntegerField(min_value=1, max_value=5)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    date = serializers.DateField()

    def create(self, validated_data):
        return TrainingLog.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
