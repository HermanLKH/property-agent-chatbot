"use client";

import { useCallback, useEffect, useState } from "react";

const CONFIG_ID = process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || "";

export default function EmbeddedSignupButton() {
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);

    // Wait for window.FB to exist
    useEffect(() => {
        const t = setInterval(() => {
            if (typeof window !== "undefined" && (window as any).FB) {
                setReady(true);
                clearInterval(t);
            }
        }, 200);
        return () => clearInterval(t);
    }, []);

    const launch = useCallback(() => {
        if (!ready) return;
        setBusy(true);
        setError(null);

        (window as any).FB.login(
            async (response: any) => {
                try {
                    // With Embedded Signup, we want a CODE, not a user token:
                    // response_type: 'code' + override_default_response_type: true
                    const code = response?.authResponse?.code;
                    if (!code) {
                        setError("No authorization code returned (user cancelled or flow failed).");
                        setBusy(false);
                        return;
                    }

                    // Exchange the code on the server (must send the SAME redirect_uri you configured)
                    const r = await fetch("/api/meta/exchange", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code, redirectUri: REDIRECT_URI }),
                    });

                    const data = await r.json();
                    if (!r.ok) throw new Error(data?.error || "Token exchange failed");
                    setResult(data); // contains access_token, expires_in, etc. (use on backend to continue onboarding)
                } catch (e: any) {
                    setError(e.message || "Something went wrong");
                } finally {
                    setBusy(false);
                }
            },
            {
                config_id: CONFIG_ID,
                response_type: "code",
                override_default_response_type: true,
                extras: {
                    // You can prefill business details here if desired
                    setup: {},
                    // Many folks miss this; required for the latest flow
                    sessionInfoVersion: "3",
                },
            }
        );
    }, [ready]);

    return (
        <div className="flex flex-col items-start gap-3">
            <button
                onClick={launch}
                disabled={!ready || busy}
                className="rounded-xl px-4 py-2 text-white bg-black/90 disabled:opacity-60"
                aria-busy={busy}
            >
                {busy ? "Connecting…" : "Connect WhatsApp (Embedded Signup)"}
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {result && (
                <pre className="text-xs bg-neutral-100 p-3 rounded-xl overflow-auto max-w-full">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}

            {!ready && <p className="text-sm opacity-70">Loading Facebook SDK…</p>}
        </div>
    );
}
