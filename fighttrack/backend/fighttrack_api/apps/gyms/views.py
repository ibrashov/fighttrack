from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Gym
from .serializers import GymSerializer, GymCreateSerializer


# ── FBV ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gym_list(request):
    """FBV: List all active gyms, optional ?city= filter."""
    city = request.query_params.get('city', '')
    if city:
        gyms = Gym.active.by_city(city)
    else:
        gyms = Gym.active.all()
    serializer = GymSerializer(gyms, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gym_detail(request, pk):
    """FBV: Retrieve a single gym by PK."""
    try:
        gym = Gym.objects.get(pk=pk)
    except Gym.DoesNotExist:
        return Response({'error': 'Gym not found.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = GymSerializer(gym)
    return Response(serializer.data)


# ── CBV ─────────────────────────────────────────────────────────────────────

class GymCreateView(APIView):
    """CBV: Create a new gym (admin only in production; open for demo)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GymCreateSerializer(data=request.data)
        if serializer.is_valid():
            gym = serializer.save()
            return Response(GymSerializer(gym).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GymUpdateDeleteView(APIView):
    """CBV: Update or delete a gym."""
    permission_classes = [IsAuthenticated]

    def _get_gym(self, pk):
        try:
            return Gym.objects.get(pk=pk)
        except Gym.DoesNotExist:
            return None

    def put(self, request, pk):
        gym = self._get_gym(pk)
        if not gym:
            return Response({'error': 'Gym not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = GymCreateSerializer(gym, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(GymSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        gym = self._get_gym(pk)
        if not gym:
            return Response({'error': 'Gym not found.'}, status=status.HTTP_404_NOT_FOUND)
        gym.is_active = False  # Soft delete
        gym.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
