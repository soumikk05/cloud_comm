import os
import csv
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import transforms
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix

# Add path insert to load train_forgery_cnn module
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from train_forgery_cnn import SyntheticTamperingDataset

WEIGHTS_PATH = 'app/models/weights/forgery_mobilenet_v2.pt'
REPORTS_DIR = 'reports'
JSON_OUT = os.path.join(REPORTS_DIR, 'tampering_metrics.json')
CSV_OUT = os.path.join(REPORTS_DIR, 'tampering_metrics.csv')

def main():
    print("=== EVALUATING FORGERY CNN ===")
    os.makedirs(REPORTS_DIR, exist_ok=True)

    if not os.path.exists(WEIGHTS_PATH):
        print(f"Error: Weights not found at {WEIGHTS_PATH}!")
        return

    # Load MobileNetV2 architecture
    from torchvision import models
    try:
        model = models.mobilenet_v2(weights=None)
    except Exception:
        model = models.mobilenet_v2(pretrained=False)

    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 64),
        nn.ReLU(),
        nn.Linear(64, 1),
        nn.Sigmoid(),
    )

    model.load_state_dict(torch.load(WEIGHTS_PATH))
    model.eval()

    # Load test split
    transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    dataset = SyntheticTamperingDataset(num_samples=100, transform=transform)
    dataloader = DataLoader(dataset, batch_size=16, shuffle=False)

    all_preds = []
    all_targets = []

    print("Running evaluation on 100 test patches...")
    with torch.no_grad():
        for images, labels in dataloader:
            outputs = model(images)
            preds = (outputs >= 0.5).float().squeeze(1).tolist()
            all_preds.extend(preds)
            all_targets.extend(labels.tolist())

    # Compute metrics
    report = classification_report(all_targets, all_preds, output_dict=True)
    conf_matrix = confusion_matrix(all_targets, all_preds).tolist()

    accuracy = report["accuracy"]
    print(f"Evaluation completed. Test Accuracy: {accuracy:.2%}")

    metrics = {
        "status": "trained",
        "dataset_version": "synthetic_tampering_v1",
        "num_samples": 100,
        "test_accuracy": accuracy,
        "classification_report": report,
        "confusion_matrix": conf_matrix,
        "framework": "pytorch/torchvision",
        "model_version": "1.0.0"
    }

    # Save JSON
    with open(JSON_OUT, 'w') as f:
        json.dump(metrics, f, indent=2)
    print("JSON report saved to:", JSON_OUT)

    # Save CSV
    with open(CSV_OUT, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["metric", "value"])
        writer.writerow(["accuracy", accuracy])
        writer.writerow(["precision_genuine", report["0.0"]["precision"]])
        writer.writerow(["recall_genuine", report["0.0"]["recall"]])
        writer.writerow(["precision_tampered", report["1.0"]["precision"]])
        writer.writerow(["recall_tampered", report["1.0"]["recall"]])
    print("CSV report saved to:", CSV_OUT)

if __name__ == '__main__':
    main()
