/**
 * Cloudflare Turnstile — canonical server-side siteverify
 * Docs: https://developers.cloudflare.com/turnstile/
 *
 * Requires env:
 *   TURNSTILE_SECRET     — widget secret (never expose to frontend)
 *   TURNSTILE_HOSTNAMES  — comma-separated allowed front-end hostnames
 *                          e.g. kreditseva.com,www.kreditseva.com
 *                          (do NOT put localhost in production)
 */

async function verifyTurnstileToken({ token, remoteip, expectedAction }) {
  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES || '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
  );

  const secret = (process.env.TURNSTILE_SECRET || '').trim();

  // Basic token + config guards (fail closed)
  if (!secret || expectedHostnames.size === 0) {
    console.error(
      'Turnstile misconfigured: set TURNSTILE_SECRET and TURNSTILE_HOSTNAMES in backend/.env (include localhost for local testing)'
    );
    return { ok: false, reason: 'misconfigured' };
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return { ok: false, reason: 'missing_token' };
  }

  let result;
  try {
    const body = new URLSearchParams({
      secret,
      response: token
    });
    if (remoteip) body.set('remoteip', remoteip);

    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    result = await r.json();
  } catch (err) {
    console.error('Turnstile siteverify error:', err.message || err);
    return { ok: false, reason: 'siteverify_error' };
  }

  // Must succeed + match expected action + hostname allowlist
  if (!result.success) {
    console.error('Turnstile rejected token:', result['error-codes'] || []);
    return {
      ok: false,
      reason: 'verification_failed',
      errorCodes: result['error-codes'] || []
    };
  }

  if (result.action !== expectedAction) {
    console.error('Turnstile action mismatch:', result.action, 'expected:', expectedAction);
    return { ok: false, reason: 'action_mismatch', got: result.action };
  }

  if (!expectedHostnames.has(result.hostname)) {
    console.error(
      'Turnstile hostname not allowed:',
      result.hostname,
      'allowed:',
      [...expectedHostnames]
    );
    return { ok: false, reason: 'hostname_mismatch', got: result.hostname };
  }

  return { ok: true, result };
}

module.exports = { verifyTurnstileToken };
