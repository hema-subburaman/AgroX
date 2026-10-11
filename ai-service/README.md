# AgriSense AI – Foliar Pathology Deep Learning Microservice

This microservice replaces simplistic rule-based heuristics (RGB thresholds) with an authentic **MobileNetV2** Convolutional Neural Network trained on the **PlantVillage** benchmark dataset (38 classes across 14 crop species).

---

## 🌟 Capabilities

1. **Authentic Deep Learning Inference**:
   - Transfer learning using **MobileNetV2** backbone with custom classification head.
   - Evaluates 224×224 RGB leaf photographs normalized against ImageNet statistics.
   - Returns genuine **Softmax** probability distribution and top-3 candidate predictions.

2. **38 Plant Pathology Classes (PlantVillage)**:
   - Covers 14 economically critical crop species: **Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange (Citrus), Peach, Pepper (Bell), Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato**.
   - Identifies bacterial infections, fungal blights, rusts, mildews, viral infections, spider mite pest damage, and healthy control foliage.

3. **Empirical Uncertainty & Inconclusive Handling**:
   - Default confidence threshold: `0.65` (65%).
   - Predictions below the threshold return `Inconclusive — Please Upload a Clearer Image` rather than forcing a low-confidence false diagnosis.
   - Distinguishes neural softmax likelihood from true clinical in-field pathology.

4. **Comprehensive Agronomic Knowledge Base**:
   - Every class is mapped in `class_mapping.json` to its scientific name, category, characteristic foliar symptoms, immediate actions, and cultural preventative practices.

5. **Supplementary Optical Color Metrics**:
   - Computes Visible Atmospherically Resistant Index (**VARI**): `(G - R) / (G + R - B)`.
   - Computes photosynthetic green canopy coverage and yellow chlorosis / necrosis ratios as supplementary diagnostic context.

---

## 📊 Supported Classes Reference Table

| Index | Plant / Crop | Condition / Disease Name | Category | Health Status |
|---|---|---|---|---|
| 0 | Apple | Apple Scab (*Venturia inaequalis*) | Fungal Infection | Diseased |
| 1 | Apple | Black Rot (*Botryosphaeria obtusa*) | Fungal Infection | Diseased |
| 2 | Apple | Cedar Apple Rust (*Gymnosporangium*) | Fungal Infection | Diseased |
| 3 | Apple | Healthy Apple Foliage | Healthy | Healthy |
| 4 | Blueberry | Healthy Blueberry Bush | Healthy | Healthy |
| 5 | Cherry | Powdery Mildew (*Podosphaera*) | Fungal Infection | Diseased |
| 6 | Cherry | Healthy Cherry Foliage | Healthy | Healthy |
| 7 | Corn (Maize) | Gray Leaf Spot (*Cercospora zeae-maydis*) | Fungal Infection | Diseased |
| 8 | Corn (Maize) | Common Rust (*Puccinia sorghi*) | Fungal Infection | Diseased |
| 9 | Corn (Maize) | Northern Corn Leaf Blight (*Exserohilum*) | Fungal Infection | Diseased |
| 10 | Corn (Maize) | Healthy Corn Canopy | Healthy | Healthy |
| 11 | Grape | Grape Black Rot (*Guignardia bidwellii*) | Fungal Infection | Diseased |
| 12 | Grape | Esca / Black Measles (*Phaeomoniella*) | Fungal Infection | Diseased |
| 13 | Grape | Isariopsis Leaf Blight (*Pseudocercospora*) | Fungal Infection | Diseased |
| 14 | Grape | Healthy Grapevine Canopy | Healthy | Healthy |
| 15 | Orange (Citrus) | Citrus Greening / Huanglongbing (*Candidatus*) | Bacterial Infection | Diseased |
| 16 | Peach | Bacterial Spot (*Xanthomonas arboricola*) | Bacterial Infection | Diseased |
| 17 | Peach | Healthy Peach Foliage | Healthy | Healthy |
| 18 | Pepper (Bell) | Bacterial Spot (*Xanthomonas euvesicatoria*) | Bacterial Infection | Diseased |
| 19 | Pepper (Bell) | Healthy Bell Pepper Foliage | Healthy | Healthy |
| 20 | Potato | Potato Early Blight (*Alternaria solani*) | Fungal Infection | Diseased |
| 21 | Potato | Potato Late Blight (*Phytophthora infestans*) | Fungal Infection | Diseased |
| 22 | Potato | Healthy Potato Canopy | Healthy | Healthy |
| 23 | Raspberry | Healthy Raspberry Cane | Healthy | Healthy |
| 24 | Soybean | Healthy Soybean Canopy | Healthy | Healthy |
| 25 | Squash | Powdery Mildew (*Podosphaera xanthii*) | Fungal Infection | Diseased |
| 26 | Strawberry | Strawberry Leaf Scorch (*Diplocarpon*) | Fungal Infection | Diseased |
| 27 | Strawberry | Healthy Strawberry Foliage | Healthy | Healthy |
| 28 | Tomato | Bacterial Spot (*Xanthomonas perforans*) | Bacterial Infection | Diseased |
| 29 | Tomato | Early Blight (*Alternaria solani*) | Fungal Infection | Diseased |
| 30 | Tomato | Late Blight (*Phytophthora infestans*) | Fungal Infection | Diseased |
| 31 | Tomato | Leaf Mold (*Passalora fulva*) | Fungal Infection | Diseased |
| 32 | Tomato | Septoria Leaf Spot (*Septoria lycopersici*) | Fungal Infection | Diseased |
| 33 | Tomato | Two-Spotted Spider Mite Damage (*Tetranychus*) | Pest Damage | Diseased |
| 34 | Tomato | Target Spot (*Corynespora cassiicola*) | Fungal Infection | Diseased |
| 35 | Tomato | Tomato Yellow Leaf Curl Virus (TYLCV) | Viral Infection | Diseased |
| 36 | Tomato | Tomato Mosaic Virus (ToMV) | Viral Infection | Diseased |
| 37 | Tomato | Healthy Tomato Foliage | Healthy | Healthy |

---

## 🛠️ Model Weights Setup

The model uses pre-trained weights (`mobilenetv2_plant.pth`, ~8.9 MB) trained on the New Plant Diseases Dataset (Augmented).

To automatically verify or download the weights:
```powershell
python download_model.py
```
Weights are saved to: `ai-service/models/mobilenetv2_plant.pth`.

If downloading manually:
1. Download from Hugging Face: [Daksh159/plant-disease-mobilenetv2](https://huggingface.co/Daksh159/plant-disease-mobilenetv2/resolve/main/mobilenetv2_plant.pth)
2. Place the file inside `ai-service/models/mobilenetv2_plant.pth`.

---

## 🏋️‍♂️ Training / Fine-Tuning from Scratch

A complete training and fine-tuning script is provided in `train_plantvillage.py`.

### 1. Obtain the Dataset
Download the PlantVillage dataset from:
- Hugging Face: `mohanty/PlantVillage`
- Kaggle: `emmarex/plantdisease`

Extract into directory: `ai-service/data/PlantVillage/<class_name>/*.JPG`.

### 2. Run Training Script
```powershell
python train_plantvillage.py --data-dir ./data/PlantVillage --epochs 10 --batch-size 32 --lr 0.001 --save-path ./models/mobilenetv2_plant.pth
```

Features included:
- Data augmentations: `RandomResizedCrop(224)`, `RandomHorizontalFlip()`, `RandomRotation(15)`, `ColorJitter()`.
- CrossEntropy loss with Adam optimizer.
- Validation accuracy evaluation and best checkpoint saving.

---

## 🚀 Running the Microservice

```powershell
cd ai-service
# Activate virtual environment if present
.\venv\Scripts\Activate.ps1
# Install dependencies
pip install -r requirements.txt
# Launch service on Port 5001
python app.py
```

### Endpoints:
- `GET /health` – Returns service status, loaded model architecture, supported classes count, and device.
- `GET /classes` – Returns all 38 classes with mapped symptoms and treatment recommendations.
- `POST /analyze` – Accepts multipart file upload (`image` field) or JSON payload (`imagePath`, `cropName`).

---

## 🧪 Testing

Run the automated test suite:
```powershell
python test_ai_service.py
```
Verifies `/health`, `/classes`, multipart upload, path resolution, uncertainty threshold handling, and error validation.
