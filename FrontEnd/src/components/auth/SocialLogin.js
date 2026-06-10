import React, { useEffect, useRef, useState } from "react";
import { api, auth } from "../../lib/api";
import {
  GOOGLE_CLIENT_ID,
  isGoogleConfigured,
  isFacebookConfigured,
  loadGoogle,
  loadFacebook,
} from "../../lib/socialSdk";

// One-stop component for the social-login section. Renders only the buttons
// for providers that are configured in the env, so dev/staging without
// secrets doesn't show dead UI.
//
// `onSuccess` receives the same session payload the email/password flow
// returns: { user, accessToken, ... }.
const SocialLogin = ({ onSuccess, onError }) => {
  const googleRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const showGoogle = isGoogleConfigured();
  const showFacebook = isFacebookConfigured();

  useEffect(() => {
    if (!showGoogle) return;
    let mounted = true;
    (async () => {
      try {
        const google = await loadGoogle();
        if (!mounted || !googleRef.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response || !response.credential) return;
            setBusy(true);
            try {
              const data = await api("/auth/oauth/google", {
                method: "POST",
                body: { credential: response.credential },
              });
              auth.set(data);
              onSuccess && onSuccess(data);
            } catch (err) {
              onError && onError(err.message || "Google sign-in failed");
            } finally {
              setBusy(false);
            }
          },
        });
        google.accounts.id.renderButton(googleRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
        });
      } catch (err) {
        onError && onError(err.message);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGoogle]);

  const handleFacebook = async () => {
    setBusy(true);
    try {
      const FB = await loadFacebook();
      FB.login(
        async (response) => {
          if (!response || !response.authResponse) {
            setBusy(false);
            return;
          }
          try {
            const data = await api("/auth/oauth/facebook", {
              method: "POST",
              body: { credential: response.authResponse.accessToken },
            });
            auth.set(data);
            onSuccess && onSuccess(data);
          } catch (err) {
            onError && onError(err.message || "Facebook sign-in failed");
          } finally {
            setBusy(false);
          }
        },
        { scope: "email,public_profile" }
      );
    } catch (err) {
      onError && onError(err.message);
      setBusy(false);
    }
  };

  if (!showGoogle && !showFacebook) {
    return (
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Social sign-in not configured. Set <code>REACT_APP_GOOGLE_CLIENT_ID</code> /
        <code> REACT_APP_FACEBOOK_APP_ID</code> to enable.
      </p>
    );
  }

  return (
    <div className="social-login">
      <div className="divider"><span>or continue with</span></div>
      <div className="social-buttons">
        {showGoogle && <div ref={googleRef} aria-disabled={busy} />}
        {showFacebook && (
          <button
            type="button"
            className="btn btn-facebook"
            onClick={handleFacebook}
            disabled={busy}
          >
            Continue with Facebook
          </button>
        )}
      </div>
    </div>
  );
};

export default SocialLogin;
