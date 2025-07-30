import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function GoogleAuth({ onAuthSuccess, onAuthError }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const accessToken = localStorage.getItem('google_access_token');
    if (accessToken) {
      setIsAuthenticated(true);
      if (onAuthSuccess) {
        onAuthSuccess(accessToken);
      }
    }
  }, [onAuthSuccess]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Redirect to Google OAuth
      const authUrl = `${window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin}/auth/google`;
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate Google authentication');
      if (onAuthError) {
        onAuthError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    setIsAuthenticated(false);
    if (onAuthSuccess) {
      onAuthSuccess(null);
    }
  };

  // Check for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const error = urlParams.get('error');

    if (accessToken) {
      // Handle successful OAuth callback with tokens
      handleOAuthSuccess(accessToken, refreshToken);
    } else if (error) {
      setError('Google authentication failed: ' + error);
      if (onAuthError) {
        onAuthError(error);
      }
      // Clean up URL after error
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleOAuthSuccess = (accessToken, refreshToken) => {
    console.log('Handling OAuth success with tokens...');
    
    // Store tokens securely
    localStorage.setItem('google_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('google_refresh_token', refreshToken);
    }

    setIsAuthenticated(true);
    if (onAuthSuccess) {
      onAuthSuccess(accessToken);
    }

    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Google Drive Connected
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Connect Google Drive
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your Google Drive is connected. You can now access any folder in your Drive without manual sharing.
            </p>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full"
            >
              Disconnect Google Drive
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your Google Drive to automatically access any folder without manual sharing permissions.
            </p>
                         <Button 
               onClick={handleGoogleAuth}
               disabled={isLoading}
               className="w-full"
             >
               {isLoading ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Connecting...
                 </>
               ) : (
                 'Connect Google Drive'
               )}
             </Button>
             <Button 
               variant="outline"
               onClick={() => {
                 localStorage.removeItem('google_access_token');
                 localStorage.removeItem('google_refresh_token');
                 window.history.replaceState({}, document.title, window.location.pathname);
                 window.location.reload();
               }}
               className="w-full"
             >
               Clear & Retry
             </Button>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 