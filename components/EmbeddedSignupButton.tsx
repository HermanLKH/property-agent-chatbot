// components/EmbeddedSignupButton.tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const CONFIG_ID = process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID!;

export default function EmbeddedSignupButton() {
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ access_token: string; token_type: string; expires_in: number } | null>(null);

    // Compute ONCE from the actual page origin to avoid env drift
    const redirectUriRef = useRef<string>("");
    useEffect(() => {
        if (typeof window !== "undefined") {
            // EXACT path you whitelisted (no trailing slash unless you also whitelisted it)
            redirectUriRef.current = new URL("/auth/fb/callback", window.location.origin).toString();
            // sanity log (remove later)
            console.log("redirect_uri used:", redirectUriRef.current, "origin:", window.location.origin);
        }
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            if (typeof window !== "undefined" && window.FB && typeof window.FB.login === "function") {
                setReady(true);
                clearInterval(id);
            }
        }, 200);
        return () => clearInterval(id);
    }, []);

    // sync callback; do async work inside
    const handleFbLogin = useCallback((resp: FBLoginResponse) => {
        void (async () => {
            try {
                const code = resp?.authResponse?.code;
                if (!code) { setError("No authorization code returned."); return; }

                // send the EXACT same redirect_uri we passed to FB.login
                const r = await fetch("/api/meta/exchange", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, redirectUri: redirectUriRef.current }),
                });
                const json = await r.json();
                if (!r.ok || (json && json.error)) throw new Error(json.error || "Exchange failed");

                setResult(json); // { access_token, token_type, expires_in }
            } catch (e) {
                setError(e instanceof Error ? e.message : "Unexpected error");
            } finally {
                setBusy(false);
            }
        })();
    }, []);

    const launch = useCallback(() => {
        if (!window.FB || busy) return;
        setBusy(true); setError(null);

        window.FB.login(handleFbLogin, {
            config_id: CONFIG_ID,
            response_type: "code",
            override_default_response_type: true,
            redirect_uri: redirectUriRef.current,              // EXACT same string as above
            extras: { sessionInfoVersion: "3" },
        });
    }, [busy, handleFbLogin]);

    return (
        <div className="flex flex-col gap-3">
            <button disabled={!ready || busy} onClick={launch} className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-60">
                {busy ? "Connecting…" : "Connect WhatsApp (Embedded Signup)"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {result && <pre className="text-xs bg-neutral-100 p-3 rounded-xl">{JSON.stringify(result, null, 2)}</pre>}
        </div>
    );
}
