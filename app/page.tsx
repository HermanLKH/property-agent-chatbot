"use client";

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
const CONFIG_ID = process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID!;
const API_VER = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v23.0";

export default function Page() {
  const launchManual = () => {
    const origin = window.location.origin;
    const redirectUri = `${origin}/auth/fb/callback`; // must match Valid OAuth Redirect URIs exactly
    const extras = encodeURIComponent(JSON.stringify({ sessionInfoVersion: "3" }));
    const state = encodeURIComponent(Math.random().toString(36).slice(2)); // optional CSRF token

    const url =
      `https://www.facebook.com/${API_VER}/dialog/oauth` +
      `?client_id=${encodeURIComponent(APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&config_id=${encodeURIComponent(CONFIG_ID)}` +
      `&override_default_response_type=true` +
      `&state=${state}` +
      `&extras=${extras}`;

    window.location.href = url; // perform actual redirect
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Manual WhatsApp Embedded Signup (OAuth)</h1>
      <button onClick={launchManual} style={{ padding: "8px 12px" }}>
        Start manual OAuth
      </button>
      <p style={{ opacity: 0.7, maxWidth: 600 }}>
        This uses the standard OAuth dialog (no JS SDK). Facebook will redirect back to <code>/auth/fb/callback</code> with <code>?code=…</code>.
      </p>
    </main>
  );
}
