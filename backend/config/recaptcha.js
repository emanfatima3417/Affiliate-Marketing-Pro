// Same pattern as config/stripe.js and config/cloudinary.js: this degrades
// gracefully when unconfigured. Without RECAPTCHA_SECRET_KEY set, every
// verification call passes automatically (relying on the honeypot field and
// rate limiting alone), so registration keeps working in local dev without
// requiring a Google account. Set the key to enable real bot scoring.
const isConfigured = Boolean(process.env.RECAPTCHA_SECRET_KEY);

/**
 * Verifies a reCAPTCHA v3 token with Google. Returns true if the request
 * looks human enough (score >= threshold) or if reCAPTCHA isn't configured.
 */
async function verifyRecaptcha(token, minScore = 0.5) {
  if (!isConfigured) return true;

  if (!token) return false;

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });
    const data = await response.json();
    return Boolean(data.success) && (data.score === undefined || data.score >= minScore);
  } catch (err) {
    console.error(`[recaptcha] verification request failed: ${err.message}`);
    // Fail open rather than locking out every registration if Google's API
    // is temporarily unreachable - the honeypot + rate limit still apply.
    return true;
  }
}

module.exports = { verifyRecaptcha, isRecaptchaConfigured: isConfigured };
