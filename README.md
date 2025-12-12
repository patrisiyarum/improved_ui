# FCR Feedback Categorization Frontend

A modern, responsive web application for analyzing and categorizing operational feedback from Delta crew members about on-board meals. This tool automates the manual review process using AI to classify feedback into precise subcategories.

This frontend connects to a separate [FastAPI backend](https://github.com/patrisiyarum/feedback_webapp) hosted at `https://feedback-webapp-5zc2.onrender.com`.

**Live Demo:** https://improved-ui.onrender.com (currently suspended)

## Technology Stack

* **Framework:** React 18
* **Language:** TypeScript
* **Build Tool:** Vite 6
* **UI Library:** Shadcn/ui (Radix UI components)
* **Data Visualization:** Recharts
* **Icons:** Lucide React
* **File Processing:** PapaParse (CSV), SheetJS (Excel)

## Features

### 1. Analyze Tab
* **Single Comment Analysis** - Enter feedback text for instant AI classification
* **Prediction Results** - View predicted subcategory with confidence scores
* **Bulk Upload** - Process CSV/Excel files containing multiple comments
* **Sample Comments** - Pre-filled examples to test the model
* **Smart File Processing** - Automatic header detection and data cleaning

### 2. Analytics Dashboard
After bulk processing, view comprehensive insights:
* **AI Confidence Health Check** - Distribution of model certainty across predictions
* **Top Problem Airports** - Volume of reports by departure station
* **Issue Volume Over Time** - Daily trends from flight date data
* **Fleet Breakdown** - Issues categorized by aircraft type
* **Report Source Analysis** - Crew vs passenger meal categorization

### 3. About Tab
* Project background and business context
* Model architecture details (Augmented BERT)
* Hybrid intelligence approach (deep learning + keyword extraction)
* Technology stack information

### Additional Features
* **Real-time API Health Monitoring** - Connection and model status indicators
* **Dark Mode UI** - Modern, accessible interface
* **Excel Export** - Download categorized results with predictions
* **Progress Tracking** - Visual feedback during bulk processing

## Project Structure

```
Improve UI Design/
├── src/
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   ├── components/
│   │   ├── BulkUpload.tsx         # CSV/Excel upload and processing
│   │   ├── PredictionCard.tsx     # Results display component
│   │   ├── SampleComments.tsx     # Example feedback samples
│   │   └── ui/                    # Reusable UI components
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── progress.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       └── utils.ts
├── package.json
├── vite.config.ts
└── vercel.json
```

## Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/patrisiyarum/improved_ui.git
   cd improved_ui
   cd "Improve UI Design"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Backend API:**
   The app connects to `https://feedback-webapp-5zc2.onrender.com` by default.

   To use a local backend, update the `API_URL` constant in `src/App.tsx`:
   ```typescript
   const API_URL = "http://localhost:8000";
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Open your browser to `http://localhost:5173`

5. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

1. **Single Analysis:** Enter a comment in the Analyze tab and click "Analyze Feedback"
2. **Bulk Processing:** Upload a CSV/Excel file with a text column containing feedback
3. **View Analytics:** After bulk upload, switch to the Analytics tab for visualizations
4. **Export Results:** Download the categorized data as an Excel file

## API Integration

The application expects the backend to provide these endpoints:
* `GET /health` - API and model status
* `POST /predict` - Single comment prediction

Required request format:
```json
{
  "text": "The meal was cold and unappetizing"
}
```

Expected response format:
```json
{
  "subPredictions": [
    {
      "label": "Food Quality",
      "probability": 94.5
    }
  ]
}
```

## Development

Built with modern React patterns:
* Functional components with hooks
* TypeScript for type safety
* Responsive design with Tailwind CSS
* Client-side file processing
* Optimized chart rendering with useMemo

## Deployment

The application is deployed on [Render](https://render.com) at https://improved-ui.onrender.com.

### Render Configuration

The app is configured as a static site on Render with the following settings:
* **Build Command:** `cd "Improve UI Design" && npm install && npm run build`
* **Publish Directory:** `Improve UI Design/dist`
* **Auto-Deploy:** Enabled from the `claude/deploy-render-frontend-01GqjkPnWmWhseaMU36B4rnB` branch

The build output is optimized for production with code splitting and tree shaking.

## Author

**Patrisiya Rumyantseva** - Version 3.0 (November 2025)
