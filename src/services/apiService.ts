// API service for disease prediction
const getApiBaseUrl = () => {
  // In production, use the environment variable or default to production backend
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://your-backend-app.railway.app';
  }
  // In development, use localhost
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

export interface PredictionResult {
  prediction: string;
  confidence: number;
  confidence_percentage: string;
  timestamp: string;
  filename: string;
  image_size: string;
  source: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  external_api_status: string;
  services: {
    image_processing: string;
    disease_prediction: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async predictDisease(file: File, cropType?: string): Promise<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (cropType) {
      formData.append('crop_type', cropType);
    }

    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }

  async getApiInfo() {
    const response = await fetch(`${this.baseUrl}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`API info failed: ${response.status}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
