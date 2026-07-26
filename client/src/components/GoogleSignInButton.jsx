import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptLoadPromise = null;
const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptLoadPromise;
};

// Renders Google's own "Sign in with Google" button via Google Identity
// Services (loaded on demand — no @react-oauth/google dependency needed).
// Silently renders nothing if VITE_GOOGLE_CLIENT_ID hasn't been configured
// yet, so the rest of the auth pages work fine before Google OAuth is set up.
const GoogleSignInButton = ({ onCredential, onError }) => {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 320,
          shape: 'pill',
        });
        setReady(true);
      })
      .catch(() => onError?.());

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={buttonRef} className={`flex justify-center ${ready ? '' : 'h-10'}`} />;
};

export default GoogleSignInButton;
