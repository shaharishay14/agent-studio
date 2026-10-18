"""
Shared utility functions used across multiple domains.
"""
import base64


def convert_image_to_base64(file_attachment):
    """
    Convert a FileAttachment image to base64 data URI for GPT-4 vision.

    Args:
        file_attachment: FileAttachment model instance with image data

    Returns:
        str: Base64 data URI (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
        None: If conversion fails or file is not an image
    """
    try:
        # Get file content from database
        image_data = file_attachment.get_file_content() if hasattr(file_attachment, 'get_file_content') else file_attachment.file_content

        if not image_data:
            return None

        # Convert memoryview to bytes if needed
        if isinstance(image_data, memoryview):
            image_data = bytes(image_data)

        # Encode to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')

        # Get MIME type (default to jpeg if not available)
        mime_type = file_attachment.mime_type or 'image/jpeg'

        # Return data URI
        return f"data:{mime_type};base64,{base64_image}"

    except Exception as e:
        print(f"❌ Error converting image to base64: {e}")
        return None
