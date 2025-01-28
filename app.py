from flask import Flask, render_template, request, redirect, url_for
import tensorflow as tf
import numpy as np
import os
from PIL import Image

# Inicjalizacja aplikacji Flask
app = Flask(__name__)

# Ścieżki do modelu i folderów
MODEL_PATH = "model/model_classification.h5"
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Załaduj model
model = tf.keras.models.load_model(MODEL_PATH)

# Ustaw folder na przesłane pliki
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Funkcja sprawdzająca, czy przesłany plik jest dozwolonym formatem
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Strona główna (formularz)
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Sprawdź, czy plik został przesłany
        if "file" not in request.files:
            return "Nie przesłano pliku", 400

        file = request.files["file"]
        if file.filename == "":
            return "Nie wybrano pliku", 400

        if file and allowed_file(file.filename):
            # Zapisz plik na serwerze
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)

            # Przetwórz obraz i dokonaj predykcji
            result = predict(filepath)

            # Przekaż wynik i ścieżkę obrazu do widoku
            return render_template("result.html", result=result, image_url=file.filename)

    return render_template("index.html")


# Funkcja do predykcji obrazu
def predict(filepath):
    # Wczytaj obraz w odpowiednim rozmiarze (224x224)
    img = Image.open(filepath).resize((224, 224))
    img_array = np.array(img) / 255.0  # Normalizacja
    img_array = np.expand_dims(img_array, axis=0)  # Dodanie wymiaru batch

    # Dokonaj predykcji
    predictions = model.predict(img_array)
    class_names = ["Zdrowy", "Zapalenie płuc", "Normalna"]  # Dostosuj do swoich klas
    predicted_class = class_names[np.argmax(predictions)]
    confidence = np.max(predictions) * 100  # Pewność w procentach

    return {"class": predicted_class, "confidence": confidence}


if __name__ == "__main__":
    # Utwórz folder na przesłane pliki, jeśli nie istnieje
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Uruchom aplikację Flask
    app.run(debug=True)
