// app/api/meta/exchange/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenExchangeSuccess = { access_token: string; token_type: string; expires_in: number };
type Body = { code?: string; redirectUri?: string };

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}
function extractGraphError(d: unknown): string | undefined {
    if (!isRecord(d)) return;
    const e = d["error"];
    if (!isRecord(e)) return;
    const m = e["message"];
    return typeof m === "string" ? m : undefined;
}

export async function POST(req: NextRequest) {
    const { code, redirectUri } = (await req.json()) as Body;
    if (!code || !redirectUri) {
        return NextResponse.json({ error: "Missing code or redirectUri" }, { status: 400 });
    }

    // Log what we're actually using (compare with the client log)
    console.log("EXCHANGE appId:", process.env.NEXT_PUBLIC_FACEBOOK_APP_ID);
    console.log("EXCHANGE redirect_uri:", redirectUri);

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
    const appSecret = process.env.FACEBOOK_APP_SECRET!;
    const version = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v23.0";

    const body = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        code,
        redirect_uri: redirectUri, // must be byte-for-byte identical to the one used in FB.login
    });

    const r = await fetch(`https://graph.facebook.com/${version}/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    const data: unknown = await r.json();
    const err = extractGraphError(data);
    if (!r.ok || err) {
        return NextResponse.json(
            { error: err ?? "Exchange failed", used: { appId, redirectUri, version } },
            { status: r.status || 500 }
        );
    }

    const { access_token, token_type, expires_in } = data as TokenExchangeSuccess;
    return NextResponse.json({ access_token, token_type, expires_in });
}
