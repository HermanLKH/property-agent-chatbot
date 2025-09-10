// app/auth/fb/callback/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Token = { access_token: string; token_type: string; expires_in: number };

export default function FbCallback({
    searchParams,
}: {
    searchParams: { code?: string; state?: string; error?: string };
}) {
    const [res, setRes] = useState<Token | { error: string } | null>(null);

    useEffect(() => {
        const code = searchParams.code;
        const err = searchParams.error;
        if (err) {
            setRes({ error: err });
            return;
        }
        if (!code) {
            setRes({ error: "Missing code" });
            return;
        }

        const redirectUri = `${window.location.origin}/auth/fb/callback`; // must match allow-listed URL exactly
        (async () => {
            const r = await fetch("/api/meta/exchange", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, redirectUri }),
            });
            const json = await r.json();
            setRes(json);
        })();
    }, [searchParams.code, searchParams.error]);

    return (
        <main style={{ padding: 24 }}>
            <h1>Facebook Callback</h1>
            <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8 }}>
                {JSON.stringify(res, null, 2)}
            </pre>
            <Link href="/">Back</Link>
        </main>
    );
}
