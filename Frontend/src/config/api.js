// API Configuration
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // If it's a relative path (starts with /), use as-is
    if (envUrl.startsWith('/')) {
      return envUrl;
    }
    // Otherwise, use the full URL
    return envUrl;
  }
  
  // In production, default to relative path (same domain)
  if (import.meta.env.PROD) {
    return '/api/v1';
  }
  
  // Default for development
  return 'http://localhost:8000/api/v1';
};

export const API_URL = getApiUrl();

