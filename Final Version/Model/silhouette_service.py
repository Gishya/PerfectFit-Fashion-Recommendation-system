from rembg import remove
from PIL import Image, ImageEnhance
import cv2
import numpy as np
import io
import base64

class SilhouetteService:
    def __init__(self):
        pass
    
    def remove_background(self, image_data):
        """Remove background from image using rembg"""
        try:
            # If image_data is base64, decode it
            if isinstance(image_data, str):
                image_data = base64.b64decode(image_data)
            
            # Remove background
            output = remove(image_data)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(output))
            
            return image
        except Exception as e:
            print(f"Error removing background: {e}")
            return None
    
    def create_silhouette(self, image_with_no_bg):
        """Convert image to black silhouette"""
        try:
            # Convert to RGBA if not already
            if image_with_no_bg.mode != 'RGBA':
                image_with_no_bg = image_with_no_bg.convert('RGBA')
            
            # Create silhouette
            silhouette = Image.new('RGBA', image_with_no_bg.size, (0, 0, 0, 0))
            
            # Get image data
            data = image_with_no_bg.getdata()
            new_data = []
            
            for item in data:
                # If pixel is not transparent, make it black
                if item[3] > 0:  # Alpha channel > 0
                    new_data.append((0, 0, 0, 255))  # Black
                else:
                    new_data.append((0, 0, 0, 0))  # Transparent
            
            silhouette.putdata(new_data)
            return silhouette
        except Exception as e:
            print(f"Error creating silhouette: {e}")
            return None
    
    def resize_and_center(self, image, target_size=(300, 400)):
        """Resize image while maintaining aspect ratio and center it"""
        try:
            # Calculate aspect ratio
            aspect_ratio = image.width / image.height
            target_aspect = target_size[0] / target_size[1]
            
            if aspect_ratio > target_aspect:
                # Image is wider, fit to width
                new_width = target_size[0]
                new_height = int(target_size[0] / aspect_ratio)
            else:
                # Image is taller, fit to height
                new_height = target_size[1]
                new_width = int(target_size[1] * aspect_ratio)
            
            # Resize image
            resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Create new image with target size and center the resized image
            centered_image = Image.new('RGBA', target_size, (0, 0, 0, 0))
            
            # Calculate position to center the image
            x = (target_size[0] - new_width) // 2
            y = (target_size[1] - new_height) // 2
            
            centered_image.paste(resized_image, (x, y))
            
            return centered_image
        except Exception as e:
            print(f"Error resizing and centering: {e}")
            return None
    
    def image_to_base64(self, image):
        """Convert PIL Image to base64 string"""
        try:
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            buffer.seek(0)
            return base64.b64encode(buffer.getvalue()).decode()
        except Exception as e:
            print(f"Error converting to base64: {e}")
            return None
    
    def process_user_image(self, image_data):
        """Complete pipeline: remove background -> create silhouette -> resize"""
        try:
            # Step 1: Remove background
            no_bg_image = self.remove_background(image_data)
            if not no_bg_image:
                return None
            
            # Step 2: Create silhouette
            silhouette = self.create_silhouette(no_bg_image)
            if not silhouette:
                return None
            
            # Step 3: Resize and center
            final_silhouette = self.resize_and_center(silhouette)
            if not final_silhouette:
                return None
            
            # Step 4: Convert to base64
            return self.image_to_base64(final_silhouette)
        except Exception as e:
            print(f"Error processing user image: {e}")
            return None