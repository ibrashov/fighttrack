from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TrainingLog
from .serializers import TrainingLogSerializer, TrainingLogWriteSerializer


# ── FBV ─────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def training_log_list_create(request):
    """
    FBV:
      GET  – list all training logs for the authenticated user
      POST – create a new training log linked to request.user
    """
    if request.method == 'GET':
        logs = TrainingLog.objects.filter(user=request.user)
        serializer = TrainingLogSerializer(logs, many=True)
        return Response(serializer.data)

    # POST
    serializer = TrainingLogWriteSerializer(data=request.data)
    if serializer.is_valid():
        log = serializer.save(user=request.user)
        return Response(TrainingLogSerializer(log).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_stats(request):
    """FBV: Aggregate stats for the current user's training logs."""
    logs = TrainingLog.objects.filter(user=request.user)
    total_sessions = logs.count()
    total_minutes = sum(l.duration_minutes for l in logs)

    focus_breakdown = {}
    for log in logs:
        focus_breakdown[log.focus] = focus_breakdown.get(log.focus, 0) + 1

    return Response({
        'total_sessions': total_sessions,
        'total_minutes': total_minutes,
        'total_hours': round(total_minutes / 60, 1),
        'focus_breakdown': focus_breakdown,
    })


# ── CBV ─────────────────────────────────────────────────────────────────────

class TrainingLogDetailView(APIView):
    """CBV: Retrieve, update, or delete a single TrainingLog."""
    permission_classes = [IsAuthenticated]

    def _get_log(self, pk, user):
        try:
            return TrainingLog.objects.get(pk=pk, user=user)
        except TrainingLog.DoesNotExist:
            return None

    def get(self, request, pk):
        log = self._get_log(pk, request.user)
        if not log:
            return Response({'error': 'Training log not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TrainingLogSerializer(log).data)

    def put(self, request, pk):
        log = self._get_log(pk, request.user)
        if not log:
            return Response({'error': 'Training log not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TrainingLogWriteSerializer(log, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(TrainingLogSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        log = self._get_log(pk, request.user)
        if not log:
            return Response({'error': 'Training log not found.'}, status=status.HTTP_404_NOT_FOUND)
        log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
