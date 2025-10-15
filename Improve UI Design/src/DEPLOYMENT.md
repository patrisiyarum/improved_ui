# Deployment Guide - FCR Feedback Categorization

This guide will help you deploy both the frontend (React) and backend (Python API) of your application.

## Prerequisites

Before deploying, make sure you have:

1. Your model files:
   - `two_layer_categorization_model_fixed/` directory
   - `main_category_classes.json`
   - `subcategory_classes.json`

2. Git repository with all code

## Project Structure

```
your-project/
├── api/                                    # Backend Python API
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
├── lib/                                    # Frontend API client
│   └── api.ts
├── components/                             # React components
├── App.tsx                                 # Main React app
├── two_layer_categorization_model_fixed/  # Your TensorFlow model
├── main_category_classes.json             # Main categories
└── subcategory_classes.json               # Subcategories
```

## Deployment Strategy

You have two main options:

### Option A: Separate Deployments (Recommended)

Deploy frontend and backend separately for better scalability.

**Backend (Python API):** Deploy on platforms that support Python
- Render.com (Free tier available)
- Railway.app
- Google Cloud Run
- AWS Lambda + API Gateway

**Frontend (React):** Deploy on static hosting
- Vercel (Recommended - easiest)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Option B: Monolithic Deployment

Deploy both on the same server.

---

## Detailed Deployment Instructions

### 🚀 Recommended: Render.com + Vercel

This is the easiest setup with free tiers available.

#### Step 1: Deploy Backend on Render.com

1. **Push your code to GitHub** (make sure to include model files)

2. **Go to [Render.com](https://render.com)** and sign up

3. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `fcr-categorization-api`
     - **Root Directory:** Leave blank or set to `/`
     - **Environment:** `Python 3`
     - **Build Command:** `cd api && pip install -r requirements.txt`
     - **Start Command:** `cd api && uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Instance Type:** Free (or paid for production)

4. **Add model files** (if not in git due to size):
   - Use Render's disk storage or
   - Upload via Render Shell after deployment

5. **Note your API URL** (e.g., `https://fcr-categorization-api.onrender.com`)

#### Step 2: Deploy Frontend on Vercel

1. **Update environment variable:**
   Create a file `.env.local` in your project root:
   ```
   NEXT_PUBLIC_API_URL=https://fcr-categorization-api.onrender.com
   ```

2. **Go to [Vercel.com](https://vercel.com)** and sign up

3. **Import your repository:**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Framework Preset: Will auto-detect
   - Add environment variable: `NEXT_PUBLIC_API_URL` with your Render URL

4. **Deploy!** Vercel will build and deploy automatically

5. **Your app is live!** Visit the provided URL

---

### 🐳 Alternative: Docker Deployment

Deploy both frontend and backend together using Docker.

#### Create Dockerfile for Backend

```dockerfile
# api/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model files and API code
COPY main.py .
COPY two_layer_categorization_model_fixed/ ./two_layer_categorization_model_fixed/
COPY main_category_classes.json .
COPY subcategory_classes.json .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Deploy on Google Cloud Run

```bash
# Build and deploy
cd api
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fcr-api
gcloud run deploy fcr-api \
  --image gcr.io/YOUR_PROJECT_ID/fcr-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### 🏠 Local Development Setup

#### 1. Start Backend

```bash
# Navigate to api directory
cd api

# Install dependencies
pip install -r requirements.txt

# Make sure model files are in project root:
# - two_layer_categorization_model_fixed/
# - main_category_classes.json
# - subcategory_classes.json

# Start the API server
python main.py
```

API will run at `http://localhost:8000`

#### 2. Start Frontend

```bash
# In a new terminal, from project root
npm install  # or yarn install

# Make sure .env.local exists with:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server (this depends on your build setup)
npm run dev  # or appropriate command for your setup
```

Frontend will run at `http://localhost:3000` (or your configured port)

---

## Environment Variables

### Backend (api/main.py)
- `MODEL_PATH` - Path to model directory (default: `two_layer_categorization_model_fixed`)
- `MAIN_CLASSES_PATH` - Path to main classes JSON (default: `main_category_classes.json`)
- `SUB_CLASSES_PATH` - Path to subcategories JSON (default: `subcategory_classes.json`)

### Frontend
- `NEXT_PUBLIC_API_URL` - URL of your backend API (e.g., `http://localhost:8000` for dev)

---

## Testing Your Deployment

1. **Test Backend:**
   ```bash
   curl https://your-api-url.com/health
   ```

2. **Test Prediction:**
   ```bash
   curl -X POST https://your-api-url.com/predict \
     -H "Content-Type: application/json" \
     -d '{"text": "The food was cold"}'
   ```

3. **Test Frontend:**
   - Visit your deployed frontend URL
   - Check that the API status badge shows "API Connected"
   - Try analyzing a sample comment
   - Upload a test CSV file

---

## Troubleshooting

### Backend Issues

**Problem:** Model not loading
- **Solution:** Ensure model files are in the correct path relative to `main.py`
- Check environment variables are set correctly

**Problem:** Memory errors
- **Solution:** Your model may be too large for free tier. Upgrade to paid plan or optimize model

**Problem:** CORS errors
- **Solution:** Update CORS origins in `api/main.py` to include your frontend URL

### Frontend Issues

**Problem:** "API Offline" badge always showing
- **Solution:** Check that `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is actually running and accessible

**Problem:** API calls failing
- **Solution:** Check browser console for errors
- Ensure API URL doesn't have trailing slash
- Test API directly with curl

---

## Production Checklist

Before going to production:

- [ ] Update CORS settings in `api/main.py` to only allow your frontend domain
- [ ] Set up proper authentication if handling sensitive data
- [ ] Enable HTTPS for both frontend and backend
- [ ] Set up monitoring and logging
- [ ] Configure automatic backups for your model files
- [ ] Test all features with real data
- [ ] Set up rate limiting on API endpoints
- [ ] Configure proper error tracking (e.g., Sentry)

---

## Cost Estimation

### Free Tier Options
- **Render.com Backend:** Free tier (sleeps after 15 min inactivity)
- **Vercel Frontend:** Free tier (generous limits)
- **Total:** $0/month

### Production Options
- **Render.com Starter:** $7/month (always-on)
- **Google Cloud Run:** Pay per request (~$10-50/month depending on usage)
- **AWS Lambda:** Pay per request (~$5-30/month)
- **Vercel Pro:** $20/month (if you exceed free tier)

---

## Need Help?

- Backend API Docs: Visit `https://your-api-url.com/docs` for interactive documentation
- Check logs in your deployment platform
- Review error messages in browser console
- Ensure all dependencies are installed correctly
