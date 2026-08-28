import axios from 'axios';

// Default to localhost:8000 for backend-NEW unless specified otherwise
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }
  
  async lock() {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  
  unlock() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }
}

const apiMutex = new Mutex();

// Interceptor to inject the JWT token if available and serialize requests
apiClient.interceptors.request.use(
  async (config) => {
    // Only lock heavy ML requests, skip fast/read-only endpoints like health to avoid freezing UI status
    const isHeavy = !config.url.includes('/health') && !config.url.includes('/api/auth');
    if (isHeavy) {
      await apiMutex.lock();
      config.isHeavy = true;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (error.config?.isHeavy) apiMutex.unlock();
    return Promise.reject(error);
  }
);

// Global response interceptor for handling 401s and other standard errors
apiClient.interceptors.response.use(
  (response) => {
    if (response.config?.isHeavy) apiMutex.unlock();
    return response;
  },
  (error) => {
    if (error.config?.isHeavy) apiMutex.unlock();
    
    if (error.response) {
      // If we get a 401 Unauthorized, we should clear the token and force re-login
      if (error.response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        // Dispatch custom event so React can catch it and route to login
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);
