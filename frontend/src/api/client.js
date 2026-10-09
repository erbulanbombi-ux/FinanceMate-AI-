import axios from 'axios';

// Storage keys for runtime configuration overrides
const STORAGE_KEYS = {
  MOCK_MODE: 'finmate_mock_mode',
};

if (typeof window !== 'undefined') {
  localStorage.removeItem('finmate_api_url');
  localStorage.removeItem('finmate_api_key');
  localStorage.removeItem('finmate_access_token');
}

export const getApiBaseUrl = () => '';

export const isMockMode = () => {
  return localStorage.getItem(STORAGE_KEYS.MOCK_MODE) === 'true';
};

export const setMockMode = (enabled) => {
  localStorage.setItem(STORAGE_KEYS.MOCK_MODE, enabled ? 'true' : 'false');
};

// Create Axios Instance
const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The session is held in an HttpOnly cookie, not JavaScript-accessible storage.
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = '';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: friendly error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Backend returned 4xx or 5xx
      const detail =
        error.response.data?.detail ||
        error.response.data?.message ||
        `Server error: ${error.response.status} ${error.response.statusText}`;
      const customError = new Error(
        typeof detail === 'object' ? JSON.stringify(detail) : detail
      );
      customError.status = error.response.status;
      customError.data = error.response.data;
      return Promise.reject(customError);
    } else if (error.request) {
      // No response received (network error / CORS / backend offline)
      const currentUrl = getApiBaseUrl();
      const customError = new Error(
        `Unable to connect to the FinMate API at ${currentUrl || 'the same-origin /api proxy'}. Please verify the backend and frontend proxy are running.`
      );
      customError.isNetworkError = true;
      return Promise.reject(customError);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
