"""
AgriSense AI - Flask Deep Learning Foliar Pathology Microservice
Replaces simplistic rule-based heuristics with an authentic MobileNetV2
neural network trained on the PlantVillage dataset (38 classes).
"""
import os
import io
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

from model import get_classifier, DEFAULT_CONFIDENCE_THRESHOLD

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("agrisense_api")

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 5001))

# Initialize the classifier singleton on startup
classifier = None
try:
    classifier = get_classifier()
    logger.info("Classifier successfully initialized on service boot.")
except Exception as e:
    logger.error(f"Failed to initialize classifier on boot: {e}. Will attempt on first request.")

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint providing runtime and model diagnostics."""
    global classifier
    if classifier is None:
        try:
            classifier = get_classifier()
        except Exception:
            pass

    return jsonify({
        "status": "online",
        "service": "AgriSense AI Deep Learning Microservice",
        "version": "2.0.0",
        "modelLoaded": classifier is not None,
        "device": str(classifier.device) if classifier else "unknown",
        "supportedClassesCount": len(classifier.class_names) if classifier else 0,
        "supportedCrops": list(classifier.crop_to_classes.keys()) if classifier else [],
        "confidenceThreshold": DEFAULT_CONFIDENCE_THRESHOLD,
        "capabilities": [
            "MobileNetV2 Deep Learning Inference (PlantVillage 38 Classes)",
            "Softmax Probability Calibration & Top-3 Ranked Candidates",
            "Uncertainty & Inconclusive Leaf Image Detection",
            "Crop-Specific Pathology Symptom & Intervention Mapping",
            "Supplementary Optical RGB & VARI Vegetation Index Decomposition"
        ]
    })

@app.route("/classes", methods=["GET"])
def list_supported_classes():
    """Returns all 38 supported plant disease classes and their crop grouping."""
    global classifier
    if classifier is None:
        classifier = get_classifier()

    return jsonify({
        "totalClasses": len(classifier.classes_metadata),
        "totalCrops": len(classifier.crop_to_classes),
        "crops": list(classifier.crop_to_classes.keys()),
        "classes": classifier.classes_metadata
    })

@app.route("/analyze", methods=["POST"])
def analyze_image():
    """
    Primary image analysis endpoint.
    Supports both:
    1. Direct multipart/form-data image file upload ('image' or 'file' field).
    2. JSON payload with 'imagePath' and 'cropName'.
    """
    global classifier
    if classifier is None:
        try:
            classifier = get_classifier()
        except Exception as e:
            return jsonify({
                "error": f"Model initialization failed: {str(e)}",
                "hint": "Run python download_model.py to download pretrained weights."
            }), 503

    pil_img = None
    crop_name = "General"
    threshold = DEFAULT_CONFIDENCE_THRESHOLD

    try:
        # Check for multipart/form-data file upload
        if "image" in request.files or "file" in request.files:
            file_obj = request.files.get("image") or request.files.get("file")
            if not file_obj or file_obj.filename == "":
                return jsonify({"error": "No file selected in multipart request"}), 400

            crop_name = request.form.get("cropName", "General")
            custom_thresh = request.form.get("confidenceThreshold")
            if custom_thresh:
                try:
                    threshold = float(custom_thresh)
                except ValueError:
                    pass

            try:
                img_bytes = file_obj.read()
                pil_img = Image.open(io.BytesIO(img_bytes))
            except Exception as img_err:
                return jsonify({"error": f"Invalid image file: {str(img_err)}"}), 400

        # Check for JSON payload with imagePath
        elif request.is_json or request.content_type == "application/json":
            data = request.get_json(silent=True) or {}
            image_path = data.get("imagePath")
            crop_name = data.get("cropName", "General")
            custom_thresh = data.get("confidenceThreshold")
            if custom_thresh:
                try:
                    threshold = float(custom_thresh)
                except ValueError:
                    pass

            if not image_path:
                return jsonify({"error": "Valid imagePath or multipart image file is required"}), 400

            # Resolve relative paths against workspace root or uploads folder
            resolved_path = os.path.abspath(image_path)
            if not os.path.exists(resolved_path):
                # Try relative to parent directories
                alt_paths = [
                    os.path.join(os.path.dirname(__file__), "..", image_path.lstrip("/\\")),
                    os.path.join(os.path.dirname(__file__), "..", "server", image_path.lstrip("/\\")),
                    os.path.join(os.path.dirname(__file__), "..", "server", "uploads", os.path.basename(image_path))
                ]
                found = False
                for alt in alt_paths:
                    if os.path.exists(alt):
                        resolved_path = os.path.abspath(alt)
                        found = True
                        break
                if not found:
                    return jsonify({"error": f"Image file not found on disk at {image_path}"}), 400

            try:
                pil_img = Image.open(resolved_path)
            except Exception as img_err:
                return jsonify({"error": f"Failed to open image at {image_path}: {str(img_err)}"}), 400

        else:
            return jsonify({"error": "Content-Type must be multipart/form-data or application/json"}), 400

        # Execute deep learning inference
        result = classifier.predict(
            pil_img=pil_img,
            selected_crop=crop_name,
            confidence_threshold=threshold
        )
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Inference exception: {e}", exc_info=True)
        return jsonify({"error": f"Inference failed: {str(e)}"}), 500

if __name__ == "__main__":
    print(f"===============================================================")
    print(f" AgriSense AI Deep Learning Microservice running on Port {PORT}")
    print(f" Model: MobileNetV2 trained on PlantVillage (38 Classes)")
    print(f" Health check: http://127.0.0.1:{PORT}/health")
    print(f" Classes list: http://127.0.0.1:{PORT}/classes")
    print(f" Ingestion endpoint: http://127.0.0.1:{PORT}/analyze")
    print(f"===============================================================")
    app.run(host="127.0.0.1", port=PORT, debug=False)
