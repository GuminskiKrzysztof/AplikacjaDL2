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


def predict(filepath):
    img = Image.open(filepath).resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array)
    class_names = ['Covid', 'Normal', 'Viral Pneumonia']
    predicted_class = class_names[np.argmax(predictions)]
    confidence = np.max(predictions) * 100

    explanation_path = generate_lime_explanation(filepath)

    return {"class": predicted_class, "confidence": confidence}, explanation_path


def generate_lime_explanation(image_path):
    img = image.load_img(image_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    explainer = lime_image.LimeImageExplainer()
    explanation = explainer.explain_instance(img_array[0], lambda x: model.predict(x), top_labels=5, hide_color=0,
                                             num_samples=100)

    temp, mask = explanation.get_image_and_mask(explanation.top_labels[0], positive_only=True, num_features=5,
                                                hide_rest=True)
    result_img = mark_boundaries(temp, mask)

    explanation_filename = os.path.join(RESULTS_FOLDER, os.path.basename(image_path))
    plt.imsave(explanation_filename, result_img.astype(np.uint8))

    return explanation_filename


if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(RESULTS_FOLDER, exist_ok=True)
    app.run(debug=True)
