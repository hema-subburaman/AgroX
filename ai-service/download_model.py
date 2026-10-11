"""
AgriSense AI - Model Weights Downloader
Downloads the pre-trained MobileNetV2 PlantVillage model weights from Hugging Face.
"""
import os
import sys
import urllib.request

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_FILENAME = "mobilenetv2_plant.pth"
MODEL_PATH = os.path.join(MODELS_DIR, MODEL_FILENAME)
MODEL_URL = "https://huggingface.co/Daksh159/plant-disease-mobilenetv2/resolve/main/mobilenetv2_plant.pth"
EXPECTED_SIZE_APPROX = 9337706  # ~8.9 MB

def download_model(force=False):
    os.makedirs(MODELS_DIR, exist_ok=True)
    if os.path.exists(MODEL_PATH) and not force:
        size = os.path.getsize(MODEL_PATH)
        if size > 1000000:
            print(f"[OK] Pretrained model weights already present at: {MODEL_PATH} ({size:,} bytes)")
            return MODEL_PATH

    print(f"[*] Downloading MobileNetV2 PlantVillage weights from:\n    {MODEL_URL}")
    print(f"[*] Target destination:\n    {MODEL_PATH}")

    def progress(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = min(100.0, (downloaded / total_size) * 100)
            sys.stdout.write(f"\r    Downloading: {percent:.1f}% ({downloaded:,} / {total_size:,} bytes)")
        else:
            sys.stdout.write(f"\r    Downloading: {downloaded:,} bytes")
        sys.stdout.flush()

    try:
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH, reporthook=progress)
        print("\n[OK] Model weights downloaded successfully.")
        size = os.path.getsize(MODEL_PATH)
        print(f"[OK] File verified on disk: {size:,} bytes")
        return MODEL_PATH
    except Exception as e:
        print(f"\n[ERROR] Failed to download model weights: {e}")
        raise

if __name__ == "__main__":
    download_model(force="--force" in sys.argv)
