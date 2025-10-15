"""
FastAPI Backend for FCR Feedback Categorization Model
This file should be deployed alongside your React frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import tensorflow_hub as hub
import tensorflow_text  # Required for BERT ops
from keras.layers import TFSMLayer
import json
import numpy as np
from typing import List, Dict
import os

app = FastAPI(title="FCR Feedback Categorization API")

# Configure CORS to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and classes
model = None
main_classes = None
sub_classes = None

# Request/Response models
class PredictionRequest(BaseModel):
    text: str

class PredictionResult(BaseModel):
    label: str
    probability: float

class PredictionResponse(BaseModel):
    mainPredictions: List[PredictionResult]
    subPredictions: List[PredictionResult]

class BulkPredictionRequest(BaseModel):
    texts: List[str]

class BulkPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]

# Load model and classes on startup
@app.on_event("startup")
async def load_model_and_classes():
    global model, main_classes, sub_classes
    
    try:
        # Adjust these paths based on where your files are located
        model_path = os.getenv("MODEL_PATH", "two_layer_categorization_model_fixed")
        main_classes_path = os.getenv("MAIN_CLASSES_PATH", "main_category_classes.json")
        sub_classes_path = os.getenv("SUB_CLASSES_PATH", "subcategory_classes.json")
        
        # Load model
        model = TFSMLayer(model_path, call_endpoint="serving_default")
        print(f"✅ Model loaded successfully from {model_path}")
        
        # Load class labels
        with open(main_classes_path) as f:
            main_classes = json.load(f)
        with open(sub_classes_path) as f:
            sub_classes = json.load(f)
        print(f"✅ Classes loaded: {len(main_classes)} main categories, {len(sub_classes)} subcategories")
        
    except Exception as e:
        print(f"❌ Error loading model or classes: {e}")
        raise

def predict_text(text: str) -> Dict:
    """Make prediction for a single text input"""
    try:
        # Convert to tensor
        inputs = tf.constant([text])
        
        # Get predictions
        outputs = model(inputs)
        
        # Extract probabilities
        main_probs = outputs["main_category_output"][0].numpy() * 100
        sub_probs = outputs["subcategory_output"][0].numpy() * 100
        
        # Sort predictions by probability
        main_sorted = sorted(
            zip(main_classes, main_probs), 
            key=lambda x: x[1], 
            reverse=True
        )
        sub_sorted = sorted(
            zip(sub_classes, sub_probs), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return {
            "mainPredictions": [
                {"label": label, "probability": float(prob)}
                for label, prob in main_sorted
            ],
            "subPredictions": [
                {"label": label, "probability": float(prob)}
                for label, prob in sub_sorted
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "FCR Feedback Categorization API",
        "version": "2.2"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "main_classes_count": len(main_classes) if main_classes else 0,
        "sub_classes_count": len(sub_classes) if sub_classes else 0
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Predict category for a single text input"""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty")
    
    return predict_text(request.text)

@app.post("/predict/bulk", response_model=BulkPredictionResponse)
async def predict_bulk(request: BulkPredictionRequest):
    """Predict categories for multiple text inputs"""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not request.texts:
        raise HTTPException(status_code=400, detail="No texts provided")
    
    predictions = []
    for text in request.texts:
        try:
            pred = predict_text(text)
            predictions.append(pred)
        except Exception as e:
            # Return error prediction for failed items
            predictions.append({
                "mainPredictions": [{"label": "Error", "probability": 0.0}],
                "subPredictions": [{"label": "Error", "probability": 0.0}]
            })
    
    return {"predictions": predictions}

@app.get("/categories")
async def get_categories():
    """Get available category labels"""
    if not main_classes or not sub_classes:
        raise HTTPException(status_code=503, detail="Classes not loaded")
    
    return {
        "mainCategories": main_classes,
        "subCategories": sub_classes
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
