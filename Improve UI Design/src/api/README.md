# FCR Feedback Categorization API

## Setup Instructions

### 1. Place Your Model Files

Copy your model files to the project root:
```
/
├── api/
├── two_layer_categorization_model_fixed/  # Your model directory
├── main_category_classes.json
├── subcategory_classes.json
```

### 2. Install Dependencies

```bash
cd api
pip install -r requirements.txt
```

### 3. Run the API Locally

```bash
# From the /api directory
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 4. Test the API

Visit `http://localhost:8000/docs` for interactive API documentation

### API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /predict` - Predict single text
- `POST /predict/bulk` - Predict multiple texts
- `GET /categories` - Get available categories

### Example Request

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"text": "The food was cold and tasted bad"}'
```

## Deployment Options

### Option 1: Deploy on Render.com (Free Tier Available)

1. Push your code to GitHub
2. Go to [Render.com](https://render.com)
3. Create a new "Web Service"
4. Connect your repository
5. Set:
   - Build Command: `cd api && pip install -r requirements.txt`
   - Start Command: `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add your model files via Render's file system

### Option 2: Deploy on Railway.app

1. Push code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Create new project from GitHub repo
4. Railway will auto-detect Python and run the API

### Option 3: Deploy on AWS Lambda (Serverless)

Use AWS Lambda with API Gateway for serverless deployment. Note: May need to optimize model size.

### Option 4: Deploy on Google Cloud Run

Perfect for containerized TensorFlow applications:
```bash
gcloud run deploy fcr-api --source . --platform managed
```

## Environment Variables

You can set these environment variables to customize paths:

- `MODEL_PATH` - Path to model directory (default: `two_layer_categorization_model_fixed`)
- `MAIN_CLASSES_PATH` - Path to main classes JSON (default: `main_category_classes.json`)
- `SUB_CLASSES_PATH` - Path to subcategories JSON (default: `subcategory_classes.json`)

## Production Configuration

For production, update CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
