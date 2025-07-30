import os
import json
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import openai
from silhouette_service import SilhouetteService
import base64

app = Flask(__name__)
CORS(app)

# Initialize silhouette service
silhouette_service = SilhouetteService()

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Load your new Keras body shape classification model
body_shape_model = load_model('body_shape_keras_model.keras')

# OpenAI API key
openai.api_key = "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"

def get_standard_silhouette(body_shape):
    """Get base64 encoded standard silhouette for body shape"""
    try:
        # Map body shapes to their corresponding PNG files
        body_shape_files = {
            'Apple': 'Apple.png',
            'Hourglass': 'HourGlass.png',
            'Inverted': 'Inverted.png',
            'Rectangle': 'Rectangle.png',
            'Triangle': 'Triangle.png'
        }
        
        # Get the filename for the body shape
        filename = body_shape_files.get(body_shape, 'Rectangle.png')  # Default to Rectangle if not found
        silhouette_path = os.path.join('dataset', 'standard_body_shapes', filename)
        
        if os.path.exists(silhouette_path):
            with open(silhouette_path, 'rb') as f:
                return base64.b64encode(f.read()).decode()
        else:
            print(f"Silhouette file not found: {silhouette_path}")
            return None
    except Exception as e:
        print(f"Error getting standard silhouette: {e}")
        return None

# Load dress recommendations JSON
def load_dress_data():
    try:
        with open('Data.json', 'r') as file:
            data = json.load(file)
        return data.get('dresses', [])
    except (FileNotFoundError, json.JSONDecodeError):
        return []

dress_data = load_dress_data()

# Detect face & determine skin tone
def detect_face_and_skin(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        return "No faces detected.", None

    x, y, w, h = faces[0]
    face_region_rgb = img[y:y + h, x:x + w]
    avg_rgb = np.mean(face_region_rgb, axis=(0, 1))

    if avg_rgb[0] > 150 and avg_rgb[1] > 130 and avg_rgb[2] > 120:
        skin_tone = 'Fair'
    elif avg_rgb[0] < 100 and avg_rgb[1] < 80 and avg_rgb[2] < 80:
        skin_tone = 'Dark'
    elif avg_rgb[0] < 140 and avg_rgb[1] < 120 and avg_rgb[2] > 100:
        skin_tone = 'Medium'
    else:
        skin_tone = 'Olive'

    return skin_tone, faces

# Get OpenAI explanation
def get_openai_explanation(skin_tone, body_shape, dress_name, occasion):
    prompt = f"""
    Explain why the dress would be a good choice for:
    - Skin tone: {skin_tone}
    - Body shape: {body_shape}
    - Occasion: {occasion}

    Provide a concise, professional fashion advice (2-3 sentences) highlighting how this dress complements these features.
    """

    print (f"OpenAI prompt: {prompt}")

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return "Professional fashion advice is currently unavailable."

# Main prediction logic
def predict_dress(image_path, occasion):
    # Detect skin tone
    skin_tone, faces = detect_face_and_skin(image_path)
    if skin_tone == "No faces detected.":
        return {'error': 'No faces detected in the image'}

    # Predict body shape using new model
    img = image.load_img(image_path, target_size=(224, 224))
    img_array = image.img_to_array(img) / 255.0  # normalize if needed
    img_array = np.expand_dims(img_array, axis=0)

    preds = body_shape_model.predict(img_array)
    predicted_class_idx = np.argmax(preds, axis=1)[0]

    body_shape_map = {
        0: 'Apple',
        1: 'Hourglass',
        2: 'Inverted',
        3: 'Rectangle',
        4: 'Triangle'
    }
    body_shape = body_shape_map.get(predicted_class_idx, 'Unknown')

    # Find matching dress
    for dress in dress_data:
        if (dress.get('Occasion', '').lower() == occasion.lower() and
                dress.get('Skin Tone', '').lower() == skin_tone.lower() and
                dress.get('Body Shape', '').lower() == body_shape.lower()):

            explanation = get_openai_explanation(
                skin_tone,
                body_shape,
                dress.get('Dress Name', 'Not available'),
                occasion
            )

            return {
                'skin_tone': skin_tone,
                'predicted_shape': body_shape,
                'dress_recommendation': {
                    'Dress Name': dress.get('Dress Name', 'Not available'),
                    'Image Name': dress.get('Image name', 'Not available')
                },
                'explanation': explanation
            }

    # If no matching dress found
    return {
        'skin_tone': skin_tone,
        'predicted_shape': body_shape,
        'dress_recommendation': 'No recommendation available.',
        'explanation': f"No specific recommendation found for {body_shape} body shape and {skin_tone} skin tone for {occasion} occasion."
    }

# Upload image
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    image_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(image_path)
    return jsonify({'image_url': image_path}), 200

# Predict endpoint
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    image_url = data.get('image_url')
    occasion = data.get('occasion')

    if not image_url or not occasion:
        return jsonify({'error': 'Missing required fields'}), 400

    result = predict_dress(image_url, occasion)
    return jsonify(result), 200

@app.route('/api/process-silhouette', methods=['POST'])
def process_silhouette():
    try:
        data = request.json
        
        # Get the uploaded image (base64)
        image_data = data.get('image')
        predicted_body_shape = data.get('body_shape')
        
        if not image_data or not predicted_body_shape:
            return jsonify({'error': 'Image and body_shape are required'}), 400
        
        # Remove the data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Process user image to create silhouette
        user_silhouette = silhouette_service.process_user_image(image_data)
        
        if not user_silhouette:
            return jsonify({'error': 'Failed to process user image'}), 500
        
        # Get standard silhouette for the predicted body shape
        standard_silhouette = get_standard_silhouette(predicted_body_shape)
        
        if not standard_silhouette:
            return jsonify({'error': 'Failed to get standard silhouette'}), 500
        
        return jsonify({
            'user_silhouette': user_silhouette,
            'standard_silhouette': standard_silhouette,
            'body_shape': predicted_body_shape,
            'success': True
        })
    
    except Exception as e:
        print(f"Error in process_silhouette: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/get-standard-silhouette/<body_shape>', methods=['GET'])
def get_standard_silhouette_endpoint(body_shape):
    """Get standard silhouette for a specific body shape"""
    try:
        silhouette = get_standard_silhouette(body_shape)
        if silhouette:
            return jsonify({
                'silhouette': silhouette,
                'body_shape': body_shape,
                'success': True
            })
        else:
            return jsonify({'error': 'Silhouette not found'}), 404
    
    except Exception as e:
        print(f"Error getting standard silhouette: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
# To run the Flask app, use the command: python ReactAPI.py