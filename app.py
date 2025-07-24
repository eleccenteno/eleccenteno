import os
from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename
import unicodedata
from PIL import Image

app = Flask(__name__)

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 6 * 1024 * 1024  # 6MB

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def normalize_string(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return "".join(c for c in s if c.isalnum() or c in (' ', '_')).rstrip().replace(' ', '_')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        propietario = request.form.get('propietario', 'default_propietario')
        ano = request.form.get('ano', '2024')
        centro = request.form.get('centro', 'default_centro')
        filepicker = request.form.get('filepicker', 'default_filepicker')

        propietario_norm = normalize_string(propietario)
        centro_norm = normalize_string(centro)

        # Create directory structure
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], propietario_norm, ano, centro_norm)
        os.makedirs(upload_path, exist_ok=True)

        # Save the file
        filename = secure_filename(filepicker + '.' + file.filename.rsplit('.', 1)[1].lower())
        file_path = os.path.join(upload_path, filename)

        # Resize and save
        try:
            image = Image.open(file)
            original_size_mb = len(file.read()) / (1024 * 1024)
            file.seek(0) # Reset file pointer

            if original_size_mb > 5:
                quality = 70
            elif 2 <= original_size_mb <= 5:
                quality = 85
            else:
                quality = 95 # Keep high quality for smaller images

            # Resize logic can be more sophisticated, e.g., reducing dimensions
            # For now, we just adjust quality
            image.save(file_path, optimize=True, quality=quality)

        except Exception as e:
            return jsonify({"error": f"Could not process image: {e}"}), 500


        return jsonify({"message": "File uploaded successfully", "path": file_path}), 200
    else:
        return jsonify({"error": "File type not allowed"}), 400

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True)
