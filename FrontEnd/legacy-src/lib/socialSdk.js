// Lazy-loaders for the Google and Facebook JS SDKs. We don't ship them in
// the bundle — they're injected once on demand. Each loader returns the
// global handle so callers can ignore script-tag lifecycle.

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || "";

let googlePromise = null;
let facebookPromise = null;

function injectScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const el = document.createElement("script");
    el.id = id;
    el.async = true;
    el.defer = true;
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export function isGoogleConfigured() {
  return Boolean(GOOGLE_CLIENT_ID);
}
export function isFacebookConfigured() {
  return Boolean(FACEBOOK_APP_ID);
}

export async function loadGoogle() {
  if (!isGoogleConfigured()) {
    throw new Error("Google sign-in is not configured");
  }
  if (!googlePromise) {
    googlePromise = injectScript(
      "https://accounts.google.com/gsi/client",
      "google-gsi-script"
    ).then(() => window.google);
  }
  return googlePromise;
}

export async function loadFacebook() {
  if (!isFacebookConfigured()) {
    throw new Error("Facebook sign-in is not configured");
  }
  if (!facebookPromise) {
    facebookPromise = new Promise((resolve, reject) => {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: false,
          xfbml: false,
          version: "v18.0",
        });
        resolve(window.FB);
      };
      injectScript("https://connect.facebook.net/en_US/sdk.js", "fb-sdk").catch(reject);
    });
  }
  return facebookPromise;
}

export { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID };
