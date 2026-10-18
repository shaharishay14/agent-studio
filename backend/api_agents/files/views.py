"""
File attachment management views.
"""
import traceback
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.http import HttpResponse

from ..agents.models import Agent
from ..files.models import FileAttachment
from ..files.serializers import FileAttachmentSerializer


class FileAttachmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for uploading and managing file attachments.

    Features:
    - Users can upload files of any type
    - Files are stored in the database as binary data (not on filesystem)
    - Original filename, size, and MIME type are automatically detected
    - Files can be attached to agent chat messages
    - Files can be downloaded via the download endpoint
    - All operations are scoped to the authenticated user
    """
    serializer_class = FileAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ['get', 'post', 'delete']  # Exclude PUT and PATCH

    def get_queryset(self):
        """
        Ensures users can only see their own files.
        Optionally filter by agent_id query parameter.
        """
        queryset = FileAttachment.objects.filter(user=self.request.user)

        # Filter by agent if agent_id is provided
        agent_id = self.request.query_params.get('agent_id')
        if agent_id:
            queryset = queryset.filter(agent_id=agent_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Handles file uploads - stores file content in database.
        Requires agent_id in request data.
        """
        try:
            print(f"📤 File upload attempt by user: {request.user.username}")
            print(f"📋 Request FILES: {request.FILES}")
            print(f"📋 Request data: {request.data}")

            # Validate agent_id is provided
            agent_id = request.data.get('agent_id')
            if not agent_id:
                print("❌ No agent_id provided in request")
                return Response(
                    {'error': 'agent_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate agent exists and belongs to user
            try:
                agent = Agent.objects.get(id=agent_id, user=request.user)
                print(f"✅ Agent validated: {agent.name} (ID={agent.id})")
            except Agent.DoesNotExist:
                print(f"❌ Agent not found or doesn't belong to user: {agent_id}")
                return Response(
                    {'error': 'Agent not found or does not belong to you'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = request.FILES.get('file')
            if not file:
                print("❌ No file provided in request")
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            print(f"📎 File received: {file.name}, size: {file.size}, type: {file.content_type}")

            # Get is_temporary flag from request (default: False)
            is_temporary = request.data.get('is_temporary', 'false').lower() in ['true', '1', 'yes']

            # ===== CHECK FILE LIMIT =====
            # Only check limit for persistent files (not temporary)
            if not is_temporary:
                current_file_count = FileAttachment.objects.filter(
                    agent=agent,
                    user=request.user,
                    is_temporary=False
                ).count()

                if current_file_count >= 10:
                    print(f"❌ File limit reached: {current_file_count}/10 files")
                    return Response(
                        {
                            'error': 'File limit reached',
                            'detail': f'You can only upload up to 10 persistent files per agent. Current count: {current_file_count}. Please delete some files before uploading new ones.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            # ============================

            # Read file content into memory
            file_content = file.read()

            # Store in database with agent relationship
            attachment = FileAttachment.objects.create(
                user=request.user,
                agent=agent,
                file_content=file_content,
                original_filename=file.name,
                file_size=file.size,
                mime_type=file.content_type or 'application/octet-stream',
                is_temporary=is_temporary
            )

            # Extract text content from file
            from ..files.content_extractor import get_content_extractor
            extractor = get_content_extractor()
            extracted_text, extraction_status = extractor.extract(
                file_content=file_content,
                filename=file.name,
                mime_type=file.content_type or 'application/octet-stream'
            )
            attachment.extracted_text = extracted_text
            attachment.extraction_status = extraction_status
            attachment.save()

            temp_status = " (TEMPORARY)" if is_temporary else ""
            extraction_info = f", Extraction: {extraction_status}" if extraction_status != 'pending' else ""
            print(f"✅ File uploaded successfully{temp_status}: ID={attachment.id}, Agent={agent.name}, Size={file.size} bytes{extraction_info}")

            serializer = self.get_serializer(attachment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"❌ File upload error: {e}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['files'],
        operation_id='files_download',
        summary='Download file content',
        description='Retrieves the binary file content from the database. Returns the file with appropriate Content-Type header based on the stored MIME type.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='File attachment UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                description='File content (binary). Returns the file with appropriate Content-Type header based on the stored MIME type.'
            ),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='File not found or not owned by user')
        }
    )
    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """
        Downloads the file content from the database.
        """
        file_attachment = self.get_object()

        try:
            file_content = file_attachment.get_file_content()
            if not file_content:
                return Response(
                    {'error': 'File content not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            response = HttpResponse(file_content, content_type=file_attachment.mime_type)
            response['Content-Disposition'] = f'attachment; filename="{file_attachment.original_filename}"'
            response['Content-Length'] = str(file_attachment.file_size)
            return response

        except Exception as e:
            print(f"❌ File download error: {e}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
