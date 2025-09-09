// components/EmbeddedSignupButton.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type TokenExchangeSuccess = {
    access_token: string;
    token_type: string;
    expires_in: number;
};

const CONFIG_ID = process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI!;

export default function EmbeddedSignupButton() {
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<TokenExchangeSuccess | null>(null);

    // Wait for window.FB to load
    useEffect(() => {
        const id = setInterval(() => {
            if (typeof window !== "undefined" && window.FB && typeof window.FB.login === "function") {
                setReady(true);
                clearInterval(id);
            }
        }, 200);
        return () => clearInterval(id);
    }, []);

    // NON-async callback passed to FB.login
    const handleFbLogin = useCallback((response: FBLoginResponse) => {
        // run async work inside an IIFE to keep the outer callback sync
        void (async () => {
            try {
                const code = response?.authResponse?.code;
                if (!code) {
                    setError("No authorization code returned (user canceled or flow failed).");
                    return;
                }

                const r = await fetch("/api/meta/exchange", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, redirectUri: REDIRECT_URI }),
                });

                const json = (await r.json()) as TokenExchangeSuccess & { error?: string };
                if (!r.ok || "error" in json) {
                    throw new Error(json.error ?? "Token exchange failed");
                }

                setResult({
                    access_token: json.access_token,
                    token_type: json.token_type,
                    expires_in: json.expires_in,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
                setBusy(false);
            }
        })();
    }, []);

    const launch = useCallback(() => {
        if (!window.FB || busy) return;
        setBusy(true);
        setError(null);

        console.log({
            appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
            pageOrigin: window.location.origin,
            redirectUri: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI,
        });

        window.FB.login(
            handleFbLogin,
            {
                config_id: CONFIG_ID,
                response_type: "code",
                override_default_response_type: true,
                redirect_uri: REDIRECT_URI,
                extras: { sessionInfoVersion: "3" },
            }
        );
    }, [busy, handleFbLogin]);

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
