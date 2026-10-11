"""
AgriSense AI - PlantVillage Training & Fine-Tuning Script
PyTorch Transfer Learning using MobileNetV2 on PlantVillage (38 Classes).

Usage:
    python train_plantvillage.py --data-dir path/to/PlantVillage --epochs 10 --batch-size 32
"""
import os
import sys
import argparse
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, models, transforms

# 38 Canonical PlantVillage Classes
EXPECTED_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",
    "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
]

def build_model(num_classes=38, pretrained=True):
    """Initializes MobileNetV2 with frozen backbone and custom classification head."""
    weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v2(weights=weights)

    # Freeze base convolutional features
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace final classification head with Dropout + Linear layer
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, num_classes)
    )
    return model

def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform

def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for i, (images, targets) in enumerate(loader):
        images, targets = images.to(device), targets.to(device)
        optimizer.zero_grad()

        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == targets.data).item()
        total += targets.size(0)

        if (i + 1) % 50 == 0:
            print(f"    Batch [{i+1}/{len(loader)}] Loss: {loss.item():.4f} Running Acc: {correct/total*100:.2f}%")

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc

def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, targets in loader:
            images, targets = images.to(device), targets.to(device)
            outputs = model(images)
            loss = criterion(outputs, targets)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == targets.data).item()
            total += targets.size(0)

    val_loss = running_loss / total
    val_acc = correct / total
    return val_loss, val_acc

def main():
    parser = argparse.ArgumentParser(description="Train MobileNetV2 on PlantVillage Dataset")
    parser.add_argument("--data-dir", type=str, default="./data/PlantVillage", help="Path to PlantVillage directory")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Mini-batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate for Adam optimizer")
    parser.add_argument("--val-split", type=float, default=0.2, help="Validation fraction (0-1)")
    parser.add_argument("--save-path", type=str, default="./models/mobilenetv2_plant.pth", help="Output model path")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Starting training on device: {device}")

    if not os.path.exists(args.data_dir):
        print(f"[!] Dataset directory not found at: {args.data_dir}")
        print("    To obtain the dataset:")
        print("    1. Download PlantVillage from Kaggle: https://www.kaggle.com/datasets/emmarex/plantdisease")
        print("       or https://huggingface.co/datasets/mohanty/PlantVillage")
        print("    2. Extract to a directory structured as: <data-dir>/<class_name>/*.JPG")
        print("    3. Rerun this script pointing --data-dir to the extracted folder.")
        sys.exit(1)

    train_tf, val_tf = get_transforms()
    full_dataset = datasets.ImageFolder(root=args.data_dir, transform=train_tf)
    num_classes = len(full_dataset.classes)
    print(f"[*] Found {len(full_dataset)} images across {num_classes} classes.")

    val_size = int(len(full_dataset) * args.val_split)
    train_size = len(full_dataset) - val_size
    train_ds, val_ds = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=2, pin_memory=True)

    model = build_model(num_classes=num_classes, pretrained=True)
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.classifier.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=4, gamma=0.2)

    best_val_acc = 0.0
    os.makedirs(os.path.dirname(os.path.abspath(args.save_path)), exist_ok=True)

    print(f"[*] Beginning training for {args.epochs} epochs...")
    start_time = time.time()

    for epoch in range(args.epochs):
        ep_start = time.time()
        print(f"\n--- Epoch {epoch+1}/{args.epochs} ---")
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        elapsed = time.time() - ep_start
        print(f"Epoch {epoch+1} Complete ({elapsed:.1f}s) | Train Loss: {train_loss:.4f} Acc: {train_acc*100:.2f}% | Val Loss: {val_loss:.4f} Acc: {val_acc*100:.2f}%")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), args.save_path)
            print(f"[*] New best validation accuracy: {best_val_acc*100:.2f}%. Saved checkpoint to {args.save_path}")

    total_time = time.time() - start_time
    print(f"\n[DONE] Training complete in {total_time/60:.2f} minutes. Best Val Acc: {best_val_acc*100:.2f}%")

if __name__ == "__main__":
    main()
