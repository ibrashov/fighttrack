from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserExperience, UserProfile
from .serializers import (
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user and return auth token."""

    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password'],
    )
    if user is None:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Delete auth token."""

    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user."""

    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


class UserProfileView(APIView):
    """Get or update current user's profile, including experience rows."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile_data = {key: value for key, value in serializer.validated_data.items() if key != 'experiences'}
        experiences = serializer.validated_data.get('experiences', [])

        with transaction.atomic():
            for field, value in profile_data.items():
                setattr(profile, field, value)

            # Keep legacy field populated for older UI surfaces and reporting.
            primary_months = 0
            if profile.primary_martial_art and experiences:
                primary_entry = next(
                    (
                        entry for entry in experiences
                        if entry['martial_art'].strip().lower() == profile.primary_martial_art.strip().lower()
                    ),
                    None,
                )
                if primary_entry:
                    primary_months = (primary_entry['years'] * 12) + primary_entry['months']
            elif experiences:
                primary_months = (experiences[0]['years'] * 12) + experiences[0]['months']

            profile.years_experience = primary_months // 12
            profile.save()

            if 'experiences' in serializer.validated_data:
                request.user.experiences.all().delete()
                UserExperience.objects.bulk_create([
                    UserExperience(
                        user=request.user,
                        martial_art=entry['martial_art'].strip(),
                        years=entry['years'],
                        months=entry['months'],
                        notes=entry.get('notes', ''),
                    )
                    for entry in experiences
                ])

        request.user.refresh_from_db()
        serializer = UserSerializer(
            User.objects.select_related('profile').prefetch_related('experiences').get(pk=request.user.pk)
        )
        return Response(serializer.data)


class UsersListView(APIView):
    """List all users except current user for sparring opponent search."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.exclude(id=request.user.id).select_related('profile').prefetch_related('experiences')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
