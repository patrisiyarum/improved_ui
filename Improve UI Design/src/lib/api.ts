/**
 * API Client for FCR Feedback Categorization
 * 
 * Configure the API_URL based on your environment:
 * - Development: http://localhost:8000
 * - Production: Your deployed backend URL
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Prediction {
  label: string;
  probability: number;
}

export interface PredictionResponse {
  mainPredictions: Prediction[];
  subPredictions: Prediction[];
}

export interface BulkPredictionResponse {
  predictions: PredictionResponse[];
}

/**
 * Predict category for a single text input
 */
export async function predictText(text: string): Promise<PredictionResponse> {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Prediction API error:', error);
    throw error;
  }
}

/**
 * Predict categories for multiple text inputs
 */
export async function predictBulk(texts: string[]): Promise<BulkPredictionResponse> {
  try {
    const response = await fetch(`${API_URL}/predict/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Bulk prediction API error:', error);
    throw error;
  }
}

/**
 * Check if API is healthy
 */
export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  try {
    const response = await fetch(`${API_URL}/health`);
    
    if (!response.ok) {
      return { status: 'unhealthy', model_loaded: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return { status: 'offline', model_loaded: false };
  }
}

/**
 * Get available categories
 */
export async function getCategories(): Promise<{ mainCategories: string[]; subCategories: string[] }> {
  try {
    const response = await fetch(`${API_URL}/categories`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get categories error:', error);
    throw error;
  }
}
