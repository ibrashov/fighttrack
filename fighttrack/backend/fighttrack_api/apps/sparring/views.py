from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SparringRequest
from .serializers import (
    SparringRequestSerializer,
    SparringRequestCreateSerializer,
    SparringStatusSerializer,
)


# ── FBV ─────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sparring_list_create(request):
    """
    FBV:
      GET  – list all sparring requests involving the current user
      POST – create a new sparring request (initiator = request.user)
    """
    if request.method == 'GET':
        requests_qs = SparringRequest.objects.filter(
            Q(initiator=request.user) | Q(opponent=request.user)
        ).select_related('initiator', 'opponent', 'gym')
        serializer = SparringRequestSerializer(requests_qs, many=True)
        return Response(serializer.data)

    # POST
    serializer = SparringRequestCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        if serializer.validated_data['opponent_id'] == request.user.id:
            return Response(
                {'error': 'You cannot challenge yourself.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sparring_req = serializer.save(initiator=request.user)
        return Response(
            SparringRequestSerializer(sparring_req).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sparring_incoming(request):
    """FBV: List pending sparring requests received by current user."""
    incoming = SparringRequest.objects.filter(
        opponent=request.user, status='pending'
    ).select_related('initiator', 'gym')
    serializer = SparringRequestSerializer(incoming, many=True)
    return Response(serializer.data)


# ── CBV ─────────────────────────────────────────────────────────────────────

class SparringDetailView(APIView):
    """CBV: Retrieve or cancel a specific sparring request."""
    permission_classes = [IsAuthenticated]

    def _get_request(self, pk, user):
        try:
            return SparringRequest.objects.get(
                Q(pk=pk) & (Q(initiator=user) | Q(opponent=user))
            )
        except SparringRequest.DoesNotExist:
            return None

    def get(self, request, pk):
        sparring_req = self._get_request(pk, request.user)
        if not sparring_req:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SparringRequestSerializer(sparring_req).data)

    def delete(self, request, pk):
        sparring_req = self._get_request(pk, request.user)
        if not sparring_req:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        if sparring_req.initiator != request.user:
            return Response({'error': 'Only initiator can cancel.'}, status=status.HTTP_403_FORBIDDEN)
        sparring_req.status = 'cancelled'
        sparring_req.save()
        return Response(SparringRequestSerializer(sparring_req).data)


class SparringStatusView(APIView):
    """CBV: Accept or decline a received sparring request."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            sparring_req = SparringRequest.objects.get(pk=pk, opponent=request.user)
        except SparringRequest.DoesNotExist:
            return Response({'error': 'Not found or not your request.'}, status=status.HTTP_404_NOT_FOUND)

        if sparring_req.status != 'pending':
            return Response({'error': 'Only pending requests can be updated.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SparringStatusSerializer(data=request.data)
        if serializer.is_valid():
            sparring_req.status = serializer.validated_data['status']
            sparring_req.save()
            return Response(SparringRequestSerializer(sparring_req).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
