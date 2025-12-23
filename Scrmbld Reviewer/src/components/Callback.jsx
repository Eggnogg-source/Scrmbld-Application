import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAccessToken } from '../services/spotifyApi';

function Callback({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('Spotify auth error:', error);
        navigate('/');
        return;
      }

      const storedState = localStorage.getItem('spotify_auth_state');
      if (!state || state !== storedState) {
        if (localStorage.getItem('spotify_access_token')) {
          navigate('/');
          return;
        }
        console.error('State mismatch');
        navigate('/');
        return;
      }

      localStorage.removeItem('spotify_auth_state');

      if (code) {
        try {
          await getAccessToken(code);
          if (onAuthSuccess) {
            await onAuthSuccess();
          }
          navigate('/');
        } catch (err) {
          console.error('Error getting access token:', err);
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, navigate, onAuthSuccess]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>Completing authentication...</div>
    </div>
  );
}

export default Callback;

