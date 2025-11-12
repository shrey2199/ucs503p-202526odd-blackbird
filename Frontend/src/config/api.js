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
  
  // Default for development - use HTTPS if page is served over HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'https://localhost:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

export const API_URL = getApiUrl();

