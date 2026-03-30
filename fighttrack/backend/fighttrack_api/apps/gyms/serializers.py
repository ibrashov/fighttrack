from rest_framework import serializers
from .models import Gym


class GymSerializer(serializers.ModelSerializer):
    """ModelSerializer for Gym."""
    class Meta:
        model = Gym
        fields = '__all__'
        read_only_fields = ['created_at']


class GymCreateSerializer(serializers.Serializer):
    """Plain Serializer used when creating/validating gym input."""
    name = serializers.CharField(max_length=200)
    address = serializers.CharField(max_length=300)
    city = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100, default='Kazakhstan')
    description = serializers.CharField(required=False, allow_blank=True, default='')

    def create(self, validated_data):
        return Gym.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
