from flask import Flask, render_template, request
import tensorflow as tf
import numpy as np
import os
from PIL import Image

# Initialize Flask application
app = Flask(__name__)

# Paths to model and folders
MODEL_PATH = "model/model_classification.h5"
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Set upload folder
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Function to check if file has allowed extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Main page (form)
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Check if file was uploaded
        if "file" not in request.files:
            return "No file uploaded", 400

        file = request.files["file"]
        if file.filename == "":
            return "No file selected", 400

        if file and allowed_file(file.filename):
            # Save file on server
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)

            # Process image and make prediction
            result = predict(filepath)

            # Pass result and image path to view
            return render_template("result.html", result=result, image_url=file.filename)

    return render_template("index.html")


# Image prediction function
def predict(filepath):
    # Load image in correct size (224x224)
    img = Image.open(filepath).resize((224, 224))
    img_array = np.array(img) / 255.0  # Normalization
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension

    # Make prediction
    predictions = model.predict(img_array)
    class_names = ['Covid', 'Normal', 'Viral Pneumonia']
    predicted_class = class_names[np.argmax(predictions)]
    confidence = np.max(predictions) * 100  # Confidence in percentage

    return {"class": predicted_class, "confidence": confidence}


if __name__ == "__main__":
    # Create upload folder if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Run Flask application
    app.run(debug=True)
