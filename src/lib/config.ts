export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
// Default to mock API locally; can override with NEXT_PUBLIC_USE_MOCK_API=false
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API
  ? process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'
  : true;
