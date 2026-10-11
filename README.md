# AgriSense AI – Smart Crop Health, Soil Condition and Pest Risk Monitoring System

AgriSense AI is an end-to-end precision agriculture web platform designed for continuous root-zone telemetry, ESP32 microcontroller ingestion, computer vision leaf pathology screening, and disease-triangle pest risk prediction.

---

## 🌟 Key Features

1. **Agronomic Dashboard**:
   - Real-time KPI metric cards (Volumetric Soil Moisture %, Soil/Ambient Temperature °C, Ambient Humidity %, Composite Pest Risk Rating, Soil pH).
   - 24-hour diurnal microclimate telemetry trend visualization using **Recharts**.
   - Active threshold violations feed with one-click acknowledgment.
   - Farm plot and crop status summary.
   - Transparent data source indicator: strictly separates **Physical ESP32 Telemetry** from **Demonstration Simulation Mode**.

2. **Crop Health Monitoring & Foliar Pathology**:
   - Interactive crop phenology selector (Wheat, Tomato, Maize, Cotton, Rice).
   - Drag-and-drop leaf photo uploader with file type (JPEG/PNG/WebP) and 5MB size validation.
   - Computer vision diagnostic output:
     - Primary foliar condition & category (Healthy, Fungal, Bacterial, Nutrient Deficiency, Pest Damage).
     - Confidence score and severity grading.
     - Visible Atmospherically Resistant Index (**VARI**) and RGB channel decomposition.
     - Identified foliar symptoms, recommended immediate actions, and preventative cultural practices.
     - **Mandatory Scientific Disclosure**: Transparently explains that consumer optical RGB cameras capture visible light only and cannot replace calibrated Near-Infrared (NIR) multispectral NDVI sensors.

3. **Soil Telemetry & Root Microclimate**:
   - Live and historical soil moisture, temperature, humidity, and soil pH tracking.
   - Threshold limit boundary overlays (Min 40%, Max 80%).
   - Interactive simulation sandbox: test scenarios such as *Moisture Deficit (24%)*, *Saturated Waterlogging (89%)*, or *High Spore Humidity (88%)*.
   - Manual probe sample logging modal for ground truthing.

4. **Pest & Pathogen Risk Prediction**:
   - Empirical disease-triangle modeling correlating temperature, relative humidity, and soil moisture.
   - Composite risk rating gauge (LOW, MEDIUM, HIGH, 0–100 score).
   - Identified pest and spore vectors (Powdery Mildew, Rust, Aphids, Armyworm, Pythium Root Rot).
   - Integrated Pest Management (IPM) protocols (Cultural, Biological, Chemical safeguards).
   - Interactive **What-If Environmental Simulator**: adjust sliders for temperature, humidity, and moisture to preview risk shifts.

5. **Imaging Analysis Studio**:
   - Dedicated laboratory view with side-by-side photo inspection and color channel histograms.
   - Filterable historical gallery of all image diagnostic sessions.
   - Detailed inspection drawer/modal.

6. **Threshold Alerts**:
   - Configurable agronomic boundaries for moisture, temperature, humidity, and pH.
   - Active, Acknowledged, and Resolved alerts workflow.
   - Deduplicated notifications to prevent field alert fatigue.

7. **Audit History & CSV Export**:
   - Searchable, filterable audit log of all readings and diagnoses.
   - One-click CSV export for field records and compliance.

8. **Settings & ESP32 Hardware Integration**:
   - Configurable sensor thresholds and crop profiles.
   - Ready-to-flash C++ Arduino firmware for ESP32 with WiFi and HTTPClient.
   - Wiring pinout schematics (Capacitive Moisture v1.2, DHT22, Analog pH probe).
   - One-click database reset and sample data re-seeding.

---

## 🛠️ Mandatory Tech Stack

- **Frontend**: React.js with Vite (`client/`)
- **Styling**: **Plain CSS only** — custom component stylesheets and CSS variables (Zero Tailwind CSS, Zero Bootstrap).
- **Charts**: Recharts (`ResponsiveContainer`, `AreaChart`, `LineChart`)
- **API Client**: Axios
- **Backend**: Node.js & Express.js (`server/`)
- **Database**: MongoDB with Mongoose
- **Image Uploads**: Multer with disk storage and type validation
- **AI Microservice**: Standalone Python Flask service (`ai-service/`, Port 5001) powered by **PyTorch MobileNetV2** trained on the 38-class **PlantVillage** benchmark dataset. Features real softmax probability calibration, uncertainty thresholding, 38-class agronomic symptom/treatment mapping, and supplementary optical RGB & VARI vegetation index decomposition.

---

## 📁 Project Structure

```
Design_Thinking/
├── client/                      # React.js Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable components (Sidebar, Navbar, MetricCard, Toast, etc.)
│   │   ├── pages/               # Dashboard, CropHealth, SoilMonitoring, PestRisk, etc.
│   │   ├── services/            # Axios API client (api.js)
│   │   ├── styles/              # Plain CSS files (variables.css, index.css)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                      # Node.js Express Backend
│   ├── models/                  # Crop, SensorReading, ImageAnalysis, Alert, ThresholdSetting
│   ├── routes/                  # REST API endpoints
│   ├── services/                # Pest risk engine, Image analysis service, Alert service
│   ├── uploads/                 # Storage for uploaded crop images
│   ├── seed.js                  # Standalone agronomic database seed script
│   ├── server.js                # Express entrypoint
│   ├── .env.example
│   └── package.json
│
├── ai-service/                  # Standalone Python AI Microservice
│   ├── app.py                   # Flask CV microservice (Port 5001)
│   └── requirements.txt
│
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance running on `localhost:27017` or MongoDB Atlas URI)
- **Python** (v3.10+ recommended, with Flask & Pillow)

---

### Step 1: Start MongoDB
Ensure MongoDB is running locally on port 27017:
```bash
# Windows service
net start MongoDB
# Or via mongod CLI
mongod --dbpath <your-db-path>
```

---

### Step 2: Configure & Start Backend Server

```bash
cd server
npm install
```

Create a `.env` file from `.env.example`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/agrisense_db
PYTHON_AI_URL=http://127.0.0.1:5001
ESP32_API_KEY=agrisense_esp32_secret_key_2026
NODE_ENV=development
```

Seed the database with realistic sample agronomic data:
```bash
npm run seed
```

Start the Express backend server:
```bash
npm start
# Server runs at http://localhost:5000/
```

---

### Step 3: Start Python AI Microservice (Deep Learning Engine)

```powershell
cd ai-service
# Activate Python virtual environment
.\venv\Scripts\Activate.ps1
# Install PyTorch, Torchvision, Flask & dependencies
pip install -r requirements.txt
# Verify or download pre-trained MobileNetV2 weights (PlantVillage 38 Classes)
python download_model.py
# Run automated test suite
python test_ai_service.py
# Start AI microservice (runs on port 5001)
python app.py
```

---

### Step 4: Start Frontend Client

```bash
cd client
npm install
npm run dev
# Vite runs at http://localhost:5173/
```

Open your browser at `http://localhost:5173/`.

---

## 📡 ESP32 Sensor Integration Guide

Field microcontrollers send HTTP POST requests with JSON telemetry:

- **Endpoint**: `POST http://<SERVER_IP>:5000/api/sensors/ingest`
- **Header**: `x-api-key: agrisense_esp32_secret_key_2026`
- **Payload**:
```json
{
  "deviceId": "ESP32_AGRI_NODE_01",
  "cropName": "Wheat",
  "fieldPlot": "Plot 1 North",
  "soilMoisture": 58.4,
  "soilTemperature": 24.2,
  "ambientHumidity": 65.0,
  "soilPh": 6.8,
  "batteryLevel": 94
}
```

The system ingests the data, verifies thresholds, triggers alerts if necessary, and marks the telemetry with `dataSource: "physical_esp32"` and `isSimulated: false`.

---

## 🔬 Scientific & Sensor Transparency Notice

- **Ordinary RGB vs Multispectral NDVI**: Consumer camera sensors capture standard visible light (400–700nm). True agricultural NDVI requires calibrated Near-Infrared (NIR, 700–1100nm) sensors. The Visible Atmospherically Resistant Index (**VARI**) is an optical proxy for chlorophyll greenness and cannot replace laboratory or multispectral drone surveys.
- **Simulation Transparency**: Values produced during demonstration sandbox mode are explicitly marked `isSimulated: true` and are never misrepresented as real physical measurements.
