// Verifies a Google Identity Services credential (ID token) by asking
// Google's tokeninfo endpoint to validate the signature/expiry for us,
// rather than pulling in google-auth-library + its JWKS-verification
// machinery for a project this size. Documented by Google for exactly this
// use case: https://developers.google.com/identity/sign-in/web/backend-auth
const verifyGoogleToken = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const err = new Error('Google sign-in is not configured on this server');
    err.status = 501;
    throw err;
  }

  let response;
  try {
    response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
  } catch {
    const err = new Error('Could not reach Google to verify sign-in');
    err.status = 502;
    throw err;
  }

  if (!response.ok) {
    const err = new Error('Invalid or expired Google credential');
    err.status = 401;
    throw err;
  }

  const payload = await response.json();

  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    const err = new Error('This Google credential was not issued for this site');
    err.status = 401;
    throw err;
  }

  if (payload.email_verified !== 'true' || !payload.email) {
    const err = new Error('Google account email is not verified');
    err.status = 401;
    throw err;
  }

  return payload; // { email, name, sub, email_verified, ... }
};

module.exports = { verifyGoogleToken };
