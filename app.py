from flask import Flask, render_template, request, send_from_directory
import tensorflow as tf
import numpy as np
import os
from PIL import Image
import matplotlib.pyplot as plt
from lime import lime_image
from skimage.segmentation import mark_boundaries
from tensorflow.keras.preprocessing import image

# Initialize Flask application
app = Flask(__name__)

# Paths to model and folders
MODEL_PATH = "model/model_classification.h5"
UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "static/results"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Set folders
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Add route for serving uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        if "file" not in request.files:
            return "No file uploaded", 400

        file = request.files["file"]
        if file.filename == "":
            return "No file selected", 400

        if file and allowed_file(file.filename):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)

            result, explanation_path = predict(filepath)
            return render_template("result.html", result=result, image_url=file.filename,
                                   explanation_url=explanation_path)

    return render_template("index.html")


def calculate_dimensions(image_path, max_size=800):
    """Calculate new dimensions maintaining aspect ratio"""
    img = Image.open(image_path)
    width, height = img.size
    
    # If image is already smaller than max_size, keep original dimensions
    if width <= max_size and height <= max_size:
        return width, height
    
    # Calculate new dimensions maintaining aspect ratio
    if width > height:
        new_width = max_size
        new_height = int((height / width) * max_size)
    else:
        new_height = max_size
        new_width = int((width / height) * max_size)
    
    return new_width, new_height

def predict(filepath):
    # Get optimal dimensions
    width, height = calculate_dimensions(filepath)
    
    # Load and resize image while maintaining aspect ratio
    img = Image.open(filepath).resize((224, 224))  # Keep 224x224 for model input
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array)
    class_names = ['Covid', 'Normal', 'Viral Pneumonia']
    predicted_class = class_names[np.argmax(predictions)]
    confidence = round(float(np.max(predictions) * 100), 4) 

    # Pass dimensions to LIME explanation
    explanation_path = generate_lime_explanation(filepath, width, height)

    return {"class": predicted_class, "confidence": confidence}, explanation_path


def generate_lime_explanation(image_path, width, height):
    # Load image for model prediction
    img_for_model = image.load_img(image_path, target_size=(224, 224))
    img_array = image.img_to_array(img_for_model)
    img_array = np.expand_dims(img_array, axis=0)

    # Load image for visualization with original proportions
    img_for_viz = Image.open(image_path).resize((width, height))
    img_viz_array = np.array(img_for_viz)

    explainer = lime_image.LimeImageExplainer()
    explanation = explainer.explain_instance(
        img_array[0], 
        lambda x: model.predict(x), 
        top_labels=5, 
        hide_color=0,
        num_samples=100
    )

    temp, mask = explanation.get_image_and_mask(
        explanation.top_labels[0], 
        positive_only=False, 
        num_features=5,
        hide_rest=True
    )

    # Convert mask to proper format and resize
    mask = mask.astype('uint8') * 255  # Convert to 8-bit unsigned integer
    mask_resized = Image.fromarray(mask).resize((width, height), Image.Resampling.NEAREST)
    mask_array = np.array(mask_resized) > 0  # Convert back to boolean mask

    # Create the final visualization
    result_img = mark_boundaries(
        img_viz_array/255.0, 
        mask_array,
        color=(1, 0, 0),  # Red boundaries
        outline_color=(1, 0, 0)  # Red outline
    )

    explanation_filename = os.path.join(RESULTS_FOLDER, os.path.basename(image_path))
    plt.figure(figsize=(10, 10))
    plt.imshow(result_img)
    plt.axis('off')
    plt.savefig(explanation_filename, bbox_inches='tight', pad_inches=0)
    plt.close()

    return explanation_filename


if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(RESULTS_FOLDER, exist_ok=True)
    app.run(debug=True)
