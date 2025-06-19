from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import os
from PIL import Image
import matplotlib.pyplot as plt
from lime import lime_image
from skimage.segmentation import mark_boundaries
from tensorflow.keras.preprocessing import image
import google.generativeai as genai
import os
import dotenv

dotenv.load_dotenv() 
# Konfiguracja klienta Gemini
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Inicjalizacja modelu
medical_model = genai.GenerativeModel('gemini-2.0-flash')

# Inicjalizacja aplikacji Flask
app = Flask(__name__)
CORS(app)


# Ścieżki do modelu i folderów
MODEL_PATH = "model/model_classification.h5"
UPLOAD_FOLDER = "uploads"
EXPLANATIONS_FOLDER  = "static/explanations"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Załaduj model
model = tf.keras.models.load_model(MODEL_PATH)

# Ustaw folder na przesłane pliki
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['EXPLANATIONS_FOLDER'] = EXPLANATIONS_FOLDER 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXPLANATIONS_FOLDER , exist_ok=True)

# Add route for serving uploaded files
@app.route('/uploads/<filename>')
def serve_uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/explanations/<filename>')
def serve_explanation_image(filename):
    return send_from_directory(app.config['EXPLANATIONS_FOLDER'], filename)

# Funkcja sprawdzająca, czy przesłany plik jest dozwolonym formatem
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/predict", methods=["POST"])
def predict_endpoint():
    if "file" not in request.files:
        return jsonify({"error": "Brak pliku w żądaniu"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nie wybrano pliku"}), 400

    if file and allowed_file(file.filename):
        # Zapisz plik na serwerze
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        try:
            # Wywołaj funkcję predict (niezmieniona logika)
            prediction_data, explanation_filepath = predict_image_and_generate_explanation(filepath)

            # Zwróć dane w formacie JSON
            return jsonify({
                "message": "Plik przetworzony pomyślnie",
                "original_image_url": f"/uploads/{file.filename}", # URL do oryginalnego obrazu
                "explanation_image_url": f"/explanations/{os.path.basename(explanation_filepath)}",
                "prediction": prediction_data
            })
        except Exception as e:
            # Lepsze logowanie błędów
            print(f"Błąd podczas przetwarzania pliku: {e}")
            return jsonify({"error": f"Wystąpił błąd podczas przetwarzania pliku: {str(e)}"}), 500
    
    return jsonify({"error": "Nieprawidłowy format pliku"}), 400 

def predict_image_and_generate_explanation(filepath):
    width, height = calculate_dimensions(filepath)

    # Load and resize image for model input
    img = Image.open(filepath).resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Dokonaj predykcji
    predictions = model.predict(img_array)
    # Upewnij się, że class_names odpowiadają kolejności klas z Twojego modelu
    class_names = ['Covid', 'Normal', 'Viral Pneumonia']
    
    predicted_class_index = np.argmax(predictions)
    predicted_class = class_names[predicted_class_index]
    confidence = round(float(np.max(predictions) * 100), 4)

    # Pass dimensions to LIME explanation
    explanation_path = generate_lime_explanation(filepath, width, height)

    return {"class": predicted_class, "confidence": confidence}, explanation_path



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
    predictions = model.predict(img_array)
    predicted_class_index = np.argmax(predictions[0]) # Get the index of the highest prediction

    temp, mask = explanation.get_image_and_mask(
        predicted_class_index,
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

    explanation_filename = os.path.join(EXPLANATIONS_FOLDER, os.path.basename(image_path))
    plt.figure(figsize=(10, 10))
    plt.imshow(result_img)
    plt.axis('off')
    plt.savefig(explanation_filename, bbox_inches='tight', pad_inches=0)
    plt.close()

    return explanation_filename

@app.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        # Pobranie JSON-a z żądania
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Brak pola 'text' w żądaniu"}), 400

        text = data["text"]

        # Zabezpieczenie: unikanie udzielania diagnoz
        risky_phrases = [
            "czy jestem chory", "czy mam covid", "czy to zapalenie płuc",
            "czy jestem zdrowy", "czy to groźne", "czy muszę do lekarza",
            "czy to poważne", "czy mam się martwić", "czy muszę iść do szpitala"
        ]

        if any(phrase in text.lower() for phrase in risky_phrases):
            return jsonify({
                "response_text": "Nie jestem w stanie postawić diagnozy. Proszę skonsultuj się z lekarzem."
            })

        # Stworzenie prompta
        prompt = f"""
        Jesteś doświadczonym specjalistą w zakresie radiologii i analizy zdjęć RTG klatki piersiowej.
        Odpowiadasz w prosty, zwięzły sposób na pytania użytkowników aplikacji diagnostycznej.
        Nie udzielaj diagnoz - jedynie dostarczaj informacji ogólnych, edukacyjnych i wspierających korzystanie z systemu AI.

        
        Odpowiedz na pytanie:\n\n\"{text}\" \n
        Zwróć tylko odpowiedź.
        
        """

        # Wygenerowanie odpowiedzi z modelu
        response = medical_model.generate_content(prompt)

        # Wyciągnięcie tekstu z response
        response_text = response.candidates[0].content.parts[0].text

        # Zwrócenie odpowiedzi w JSON-ie
        return jsonify({"response_text": response_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(EXPLANATIONS_FOLDER, exist_ok=True)

    app.run(debug=True, port=5000)
