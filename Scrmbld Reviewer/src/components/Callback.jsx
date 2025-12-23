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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Callback.jsx:15',message:'Spotify auth error received',data:{error:error,errorDescription:searchParams.get('error_description'),currentURL:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Spotify auth error:', error);
        navigate('/');
        return;
      }

      const storedState = localStorage.getItem('spotify_auth_state');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Callback.jsx:24',message:'State validation',data:{hasState:!!state,hasStoredState:!!storedState,stateMatch:state===storedState,hasCode:!!code,hasToken:!!localStorage.getItem('spotify_access_token')},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      if (!state || state !== storedState) {
        // If we already have a token, the auth might have completed - just navigate home
        if (localStorage.getItem('spotify_access_token')) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Callback.jsx:28',message:'State mismatch but token exists',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-debug',hypothesisId:'L'})}).catch(()=>{});
          // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Callback.jsx:38',message:'Token exchange error',data:{error:err.message,errorStack:err.stack?.substring(0,200),errorName:err.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
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

