// src/config.js
const config = {
  // For development
  development: {
    API_BASE_URL: 'http://localhost:5000/api',
    IMAGE_BASE_URL: 'http://localhost:5000'
  },
  // For production
  production: {
    API_BASE_URL: 'https://your-backend-app.onrender.com/api',
    IMAGE_BASE_URL: 'https://your-backend-app.onrender.com'
  }
};

// Choose the appropriate configuration based on environment
const environment = process.env.NODE_ENV || 'development';

export const API_URL = config[environment].API_BASE_URL;
export const IMAGE_BASE_URL = config[environment].IMAGE_BASE_URL;