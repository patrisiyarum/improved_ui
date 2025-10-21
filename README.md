# FCR Feedback Categorization Frontend

This repository contains the React frontend for the "FCR Feedback Categorization Tool." This is a modern, responsive web application designed to interact with a machine learning backend API.

The purpose of this tool is to automate and scale the analysis of operational feedback, specifically for categorizing comments from Delta crew members about on-board meals. It takes unstructured text and uses an AI model to classify it into a relevant **Main Category** and **Sub-Category**.

This frontend is built to communicate with a separate [FastAPI backend](https://github.com/patrisiyarum/feedback_webapp) (hosted at `https://feedback-webapp-5zc2.onrender.com`).

## Technology Stack

This project is a modern frontend application built with:

* **Framework:** **React**
* **Language:** **TypeScript**
* **Build Tool:** **Vite**
* **UI Components:** **Shadcn/ui** (using Radix UI components)
* **Data Visualization:** **Recharts** (for the analytics dashboard)
* **Icons:** **Lucide React**

## Core Features

The application is organized into three main tabs:

### 1. Analyze Tab
* **Single Comment Analysis:** A text area allows users to enter a single piece of feedback for instant classification.
* **Prediction Display:** Results are shown in a clean "Prediction Card" that details the predicted Main and Sub-Categories.
* **Bulk CSV Upload:** Users can upload a CSV file with a 'text' column for batch processing. The app calls the API for each row, appends the predictions, and provides the results as a downloadable CSV.
* **Sample Comments:** Includes a component with pre-filled example comments to demonstrate the model's capabilities.

### 2. Analytics Tab
* **Dynamic Dashboard:** After a bulk CSV upload is processed, this tab populates with interactive bar charts.
* **Data Visualization:** Displays charts for "Main Category Distribution" and "Subcategory Distribution" based on the uploaded data, helping to identify trends.

### 3. About Tab
* **Project Context:** Provides a detailed explanation of the project's business purpose (automating feedback on Delta crew meals).
* **Model Architecture:** Describes how the AI model works, including its **Fine-Tuned BERT** base and **Dual-Output Architecture**.
* **Technology Stack:** Lists the full stack for both the frontend (React) and the backend (FastAPI, TensorFlow/Keras).

### API Connection
* **Health Check:** The app automatically pings the backend's `/health` endpoint to show the connection status ("API Connected" and "Model Loaded") in the header.

## Running Locally

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/patrisiyarum/improved_ui.git](https://github.com/patrisiyarum/improved_ui.git)
    cd improved_ui
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    (This command reads `package.json` and installs all required libraries like React, Vite, etc.)

3.  **Set up the Backend API URL:**
    This application requires a running backend API. The code will look for a URL at `https://feedback-webapp-5zc2.onrender.com`.

    If you are running the [backend server](https://github.com/patrisiyarum/feedback_webapp) locally (e.g., at `http://localhost:8000`), you will need to update the `API_URL` variable in `src/App.tsx` or `src/lib/api.ts`.

4.  **Start the development server:**
    ```bash
    npm run dev
    ```
    (This command runs the Vite development server).

    Open your browser to `http://localhost:5173` (or the URL shown in your terminal) to view the application.
