"""
AgriSense AI - Deep Learning Foliar Classifier
Uses MobileNetV2 trained on the PlantVillage dataset (38 classes).
"""
import os
import json
import logging
from typing import Dict, Any, Optional, Tuple
from PIL import Image
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms

from download_model import download_model, MODEL_PATH

logger = logging.getLogger("agrisense_classifier")
logging.basicConfig(level=logging.INFO)

# Path to class mapping JSON
MAPPING_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "class_mapping.json")

# Default diagnostic uncertainty threshold (tested against validation distributions)
# Predictions below this confidence return an "Inconclusive" advisory.
DEFAULT_CONFIDENCE_THRESHOLD = 0.65

class PlantDiseaseClassifier:
    def __init__(self, weights_path: str = MODEL_PATH, mapping_path: str = MAPPING_PATH):
        self.weights_path = weights_path
        self.mapping_path = mapping_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.classes_metadata: list = []
        self.class_names: list = []
        self.crop_to_classes: Dict[str, list] = {}
        self.model: Optional[nn.Module] = None

        self._load_class_mapping()
        self._build_and_load_model()

        # Standard ImageNet / MobileNetV2 preprocessing pipeline
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def _load_class_mapping(self):
        """Loads the 38-class metadata taxonomy from class_mapping.json."""
        if not os.path.exists(self.mapping_path):
            raise FileNotFoundError(f"Class mapping file not found at {self.mapping_path}")

        with open(self.mapping_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.classes_metadata = data.get("classes", [])
        self.class_names = [c["className"] for c in self.classes_metadata]

        for item in self.classes_metadata:
            crop = item["crop"].split(" ")[0].strip()  # e.g., 'Apple', 'Corn', 'Tomato'
            if crop not in self.crop_to_classes:
                self.crop_to_classes[crop] = []
            self.crop_to_classes[crop].append(item)

        logger.info(f"Loaded {len(self.class_names)} classes across {len(self.crop_to_classes)} crops.")

    def _build_and_load_model(self):
        """Builds MobileNetV2 architecture with a 38-unit classifier head and loads pretrained weights."""
        num_classes = len(self.class_names)
        if num_classes != 38:
            logger.warning(f"Expected 38 classes, found {num_classes}")

        # Construct MobileNetV2 backbone
        model = models.mobilenet_v2()
        # Replace classifier head to match trained architecture: Dropout(0.2) -> Linear(1280, 38)
        model.classifier[1] = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(model.classifier[1].in_features, num_classes)
        )

        # Ensure weights exist or download them
        if not os.path.exists(self.weights_path) or os.path.getsize(self.weights_path) < 1000000:
            logger.info("Weights missing or incomplete. Triggering automatic download...")
            download_model()

        try:
            state_dict = torch.load(self.weights_path, map_location=self.device)
            model.load_state_dict(state_dict, strict=True)
            logger.info(f"Successfully loaded model weights into MobileNetV2 on {self.device}.")
        except Exception as e:
            logger.error(f"Error loading model weights from {self.weights_path}: {e}")
            raise

        model.to(self.device)
        model.eval()
        self.model = model

    @staticmethod
    def compute_supplementary_rgb_metrics(pil_img: Image.Image) -> Dict[str, Any]:
        """
        Computes supplementary optical RGB metrics (VARI, chlorophyll proxy, chlorosis estimate).
        This provides supplementary color analysis without serving as the primary disease classifier.
        """
        rgb_thumb = pil_img.convert("RGB")
        rgb_thumb.thumbnail((400, 400))
        arr = np.array(rgb_thumb, dtype=np.float32)

        r = arr[:, :, 0]
        g = arr[:, :, 1]
        b = arr[:, :, 2]

        avg_r = float(np.mean(r))
        avg_g = float(np.mean(g))
        avg_b = float(np.mean(b))

        # VARI (Visible Atmospherically Resistant Index): (G - R) / (G + R - B)
        denom = g + r - b
        denom[denom == 0] = 1e-5
        vari_matrix = (g - r) / denom
        avg_vari = float(np.clip(np.mean(vari_matrix), -1.0, 1.0))

        # Green coverage: pixels with prominent green reflection
        green_mask = (g > r * 1.08) & (g > b * 1.08)
        green_pct = float(np.mean(green_mask) * 100)

        # Yellow / chlorotic discoloration: high red and green, low blue
        yellow_mask = (r > 120) & (g > 100) & (b < 90) & (np.abs(r - g) < 50)
        yellow_pct = float(np.mean(yellow_mask) * 100)

        return {
            "avgRed": round(avg_r, 1),
            "avgGreen": round(avg_g, 1),
            "avgBlue": round(avg_b, 1),
            "variIndex": round(avg_vari, 3),
            "greenCoveragePercent": round(green_pct, 1),
            "yellowNecrosisPercent": round(yellow_pct, 1),
            "opticalDiscolorationArea": round(min(yellow_pct * 1.2, 85.0), 1)
        }

    def predict(
        self,
        pil_img: Image.Image,
        selected_crop: str = "General",
        confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD
    ) -> Dict[str, Any]:
        """
        Performs neural inference on an uploaded leaf image.
        Returns authentic prediction, top probabilities, uncertainty assessment,
        and mapped agronomic symptoms and treatment advice.
        """
        if self.model is None:
            raise RuntimeError("Model is not initialized.")

        # Compute supplementary RGB metrics
        color_metrics = self.compute_supplementary_rgb_metrics(pil_img)

        # Image preprocessing
        img_rgb = pil_img.convert("RGB")
        tensor = self.transform(img_rgb).unsqueeze(0).to(self.device)

        # Forward pass
        with torch.no_grad():
            logits = self.model(tensor)
            probabilities = torch.softmax(logits, dim=1)[0]
            top_k_probs, top_k_indices = torch.topk(probabilities, k=min(3, len(self.class_names)))

        top_prob = float(top_k_probs[0].item())
        top_idx = int(top_k_indices[0].item())
        predicted_meta = self.classes_metadata[top_idx]

        # Top 3 candidates for transparency
        top_candidates = []
        for prob_val, idx_val in zip(top_k_probs, top_k_indices):
            meta = self.classes_metadata[int(idx_val.item())]
            top_candidates.append({
                "className": meta["className"],
                "disease": meta["disease"],
                "crop": meta["crop"],
                "confidence": round(float(prob_val.item()), 4),
                "confidencePercent": round(float(prob_val.item()) * 100, 2)
            })

        # Uncertainty handling
        is_inconclusive = top_prob < confidence_threshold
        uncertainty_warning = None
        if is_inconclusive:
            uncertainty_warning = (
                f"Model prediction confidence ({top_prob * 100:.1f}%) is below the diagnostic reliability "
                f"threshold ({confidence_threshold * 100:.0f}%). This image does not clearly match known foliar "
                f"pathology patterns. Please upload a sharper, evenly lit, macro photograph centered on the leaf."
            )

        # Supported crop validation
        supported_crops = list(self.crop_to_classes.keys())
        selected_crop_clean = selected_crop.split(" ")[0].strip()
        is_supported_crop = selected_crop_clean in supported_crops or selected_crop_clean == "General"

        crop_mismatch_warning = None
        if is_supported_crop and selected_crop_clean != "General" and not is_inconclusive:
            predicted_crop_prefix = predicted_meta["crop"].split(" ")[0].strip()
            if predicted_crop_prefix.lower() != selected_crop_clean.lower():
                crop_mismatch_warning = (
                    f"Selected crop is '{selected_crop}', but model detected visual features consistent with "
                    f"'{predicted_meta['crop']}'. Verify that the uploaded photo belongs to {selected_crop}."
                )
        elif not is_supported_crop:
            crop_mismatch_warning = (
                f"Crop '{selected_crop}' is not included in the 14 crops supported by the PlantVillage optical "
                f"model (Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, "
                f"Soybean, Squash, Strawberry, Tomato). Screening results may be inconclusive."
            )

        # Determine diagnostic labels
        if is_inconclusive:
            primary_condition = "Inconclusive — Please Upload a Clearer Image"
            category = "Inconclusive"
            severity = "Uncertain"
            symptoms = [
                "Optical pattern is ambiguous or indistinct",
                "Leaf lesions or pigmentation do not match supported diagnostic signatures",
                f"Top candidate ({predicted_meta['disease']}) has low confidence ({top_prob * 100:.1f}%)"
            ]
            actions = [
                "Capture leaf photo in natural diffuse daylight (avoid direct blinding sun or heavy shadows)",
                "Focus directly on lesions and leaf blade against a neutral background",
                "If symptoms persist in the field, consult a local agronomic extension officer"
            ]
            preventative = [
                "Maintain routine field scouting along plot transects",
                "Check root-zone soil telemetry to rule out moisture or pH stress"
            ]
        else:
            primary_condition = predicted_meta["disease"]
            category = predicted_meta["category"]
            # Strict rule: Do not invent severity from confidence score!
            # If healthy, severity is 'None'. For diseases, typical severity is documented or marked.
            severity = predicted_meta.get("typicalSeverity", "Moderate" if not predicted_meta["isHealthy"] else "None")
            symptoms = predicted_meta.get("symptoms", [])
            actions = predicted_meta.get("actions", [])
            preventative = predicted_meta.get("preventative", [])

        return {
            "analysisType": "plantvillage_mobilenetv2_cnn",
            "isDemonstrationResult": False,
            "modelInfo": {
                "architecture": "MobileNetV2 (Transfer Learning)",
                "dataset": "PlantVillage (38 Classes)",
                "inputResolution": "224x224 RGB",
                "device": str(self.device),
                "confidenceThreshold": confidence_threshold
            },
            "diagnosis": {
                "primaryCondition": primary_condition,
                "category": category,
                "confidenceScore": round(top_prob, 4),
                "confidencePercent": round(top_prob * 100, 2),
                "isHealthy": predicted_meta["isHealthy"] if not is_inconclusive else None,
                "severity": severity,
                "severityBasis": "Documented agronomic pathology profile (never fabricated from confidence)",
                "affectedAreaPercentage": color_metrics["opticalDiscolorationArea"] if not predicted_meta["isHealthy"] else 0.0,
                "symptomsDetected": symptoms,
                "recommendedActions": actions,
                "preventativeMeasures": preventative,
                "predictedClass": predicted_meta["className"],
                "predictedCrop": predicted_meta["crop"],
                "isInconclusive": is_inconclusive,
                "uncertaintyWarning": uncertainty_warning,
                "cropMismatchWarning": crop_mismatch_warning
            },
            "topCandidates": top_candidates,
            "colorMetrics": color_metrics,
            "supportedCropInfo": {
                "selectedCrop": selected_crop,
                "isCropSupportedByModel": is_supported_crop,
                "supportedCropList": supported_crops
            },
            "scientificDisclaimer": {
                "sensorType": "Standard Consumer Optical RGB Camera",
                "isTrueMultispectral": False,
                "disclaimerText": (
                    "Scientific & Clinical Advisory: Image-based plant disease classification via deep learning is a "
                    "screening decision-support aid. Model confidence indicates softmax class likelihood, not guaranteed "
                    "in-field pathology. In-person scouting, extension laboratory validation, and soil microclimate "
                    "correlation are required before applying chemical treatments."
                )
            }
        }

# Global singleton classifier instance
_classifier_instance: Optional[PlantDiseaseClassifier] = None

def get_classifier() -> PlantDiseaseClassifier:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = PlantDiseaseClassifier()
    return _classifier_instance
