// Configuration utility for environment-based URLs
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  // Server-side fallback
  return process.env.NODE_ENV === 'production' 
    ? 'https://resume-rank-vercel.vercel.app'
    : 'http://localhost:5001';
};

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin for API calls
    return window.location.hostname === 'localhost' 
      ? 'http://localhost:5000'  // Local backend always on 5000
      : window.location.origin;  // Production - use current domain
  }
  // Server-side fallback
  return process.env.NODE_ENV === 'production' 
    ? 'https://resume-rank-vercel.vercel.app'
    : 'http://localhost:5000';
};

export const config = {
  baseUrl: getBaseUrl(),
  apiUrl: getApiUrl(),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
};
