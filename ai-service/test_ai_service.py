"""
AgriSense AI - Microservice Test Suite
Tests endpoints: /health, /classes, /analyze (multipart and JSON), uncertainty threshold.
"""
import os
import unittest
import json
from io import BytesIO
from PIL import Image, ImageDraw

from app import app
from model import DEFAULT_CONFIDENCE_THRESHOLD

class TestAiService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        # Create a test leaf image in memory
        cls.test_image_bytes = BytesIO()
        img = Image.new("RGB", (256, 256), color=(34, 139, 34))
        draw = ImageDraw.Draw(img)
        draw.ellipse([50, 50, 200, 200], fill=(200, 100, 20))  # rust-like spot
        img.save(cls.test_image_bytes, format="JPEG")
        cls.test_image_bytes.seek(0)

        # Real test leaf path
        cls.real_leaf_path = os.path.join(os.path.dirname(__file__), "test_corn_common_rust.jpg")

    def test_01_health_endpoint(self):
        """Verify /health returns online status and model info."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "online")
        self.assertTrue(data["modelLoaded"])
        self.assertEqual(data["supportedClassesCount"], 38)
        self.assertIn("Corn", data["supportedCrops"])
        self.assertIn("Tomato", data["supportedCrops"])

    def test_02_classes_endpoint(self):
        """Verify /classes returns all 38 classes and metadata."""
        response = self.client.get("/classes")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["totalClasses"], 38)
        self.assertEqual(len(data["classes"]), 38)
        # Check an item structure
        sample = data["classes"][0]
        self.assertIn("className", sample)
        self.assertIn("crop", sample)
        self.assertIn("disease", sample)
        self.assertIn("symptoms", sample)
        self.assertIn("actions", sample)

    def test_03_analyze_multipart_upload(self):
        """Verify /analyze via multipart/form-data upload with real leaf image."""
        if not os.path.exists(self.real_leaf_path):
            self.skipTest("Real test image not found")

        with open(self.real_leaf_path, "rb") as f:
            file_bytes = BytesIO(f.read())

        response = self.client.post(
            "/analyze",
            data={
                "image": (file_bytes, "corn_rust.jpg"),
                "cropName": "Corn"
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertIn("diagnosis", data)
        self.assertIn("colorMetrics", data)
        self.assertIn("scientificDisclaimer", data)

        diag = data["diagnosis"]
        self.assertIn("Common Rust", diag["primaryCondition"])
        self.assertGreaterEqual(diag["confidenceScore"], 0.65)
        self.assertFalse(diag["isInconclusive"])
        self.assertGreater(len(diag["symptomsDetected"]), 0)
        self.assertGreater(len(diag["recommendedActions"]), 0)
        self.assertIn("variIndex", data["colorMetrics"])

    def test_04_analyze_json_path(self):
        """Verify /analyze via JSON payload with imagePath."""
        if not os.path.exists(self.real_leaf_path):
            self.skipTest("Real test image not found")

        response = self.client.post(
            "/analyze",
            json={
                "imagePath": self.real_leaf_path,
                "cropName": "Corn"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["diagnosis"]["predictedClass"], "Corn_(maize)___Common_rust_")

    def test_05_uncertainty_threshold_handling(self):
        """Verify that an ambiguous / high-threshold request triggers Inconclusive advisory."""
        # Set an impossibly high threshold (0.9999) to test uncertainty branch
        response = self.client.post(
            "/analyze",
            data={
                "image": (BytesIO(self.test_image_bytes.getvalue()), "ambiguous.jpg"),
                "cropName": "Tomato",
                "confidenceThreshold": "0.9999"
            },
            content_type="multipart/form-data"
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        diag = data["diagnosis"]
        self.assertTrue(diag["isInconclusive"])
        self.assertIn("Inconclusive", diag["primaryCondition"])
        self.assertIsNotNone(diag["uncertaintyWarning"])

    def test_06_missing_image_validation(self):
        """Verify proper 400 error handling on empty request."""
        response = self.client.post("/analyze", json={})
        self.assertEqual(response.status_code, 400)

if __name__ == "__main__":
    unittest.main()
