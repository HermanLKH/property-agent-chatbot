// app/api/meta/exchange/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenExchangeSuccess = {
    access_token: string;
    token_type: string;
    expires_in: number;
};

type Body = { code?: string; redirectUri?: string };

// helpers
function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}
function extractGraphError(d: unknown): string | undefined {
    if (!isRecord(d)) return undefined;
    const err = d["error"];
    if (!isRecord(err)) return undefined;
    const msg = err["message"];
    return typeof msg === "string" ? msg : undefined;
}

export async function POST(req: NextRequest) {
    const { code, redirectUri } = (await req.json()) as Body;

    if (!code || !redirectUri) {
        return NextResponse.json({ error: "Missing code or redirectUri" }, { status: 400 });
    }

    // sanity log (remove later)
    console.log("exchange redirect_uri:", redirectUri);

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
    const appSecret = process.env.FACEBOOK_APP_SECRET!;
    const version = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v23.0";

    const params = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        code,
        redirect_uri: redirectUri, // must be IDENTICAL to the one used in FB.login
    });

    const url = `https://graph.facebook.com/${version}/oauth/access_token?${params.toString()}`;
    const r = await fetch(url, { method: "GET" });

    const data: unknown = await r.json();
    const errMsg = extractGraphError(data);

    if (!r.ok || errMsg) {
        return NextResponse.json(
            {
                error: errMsg ?? "Exchange failed",
                used: { redirectUri, version },
                // uncomment to inspect full payload while debugging:
                // details: data,
            },
            { status: r.status || 500 },
        );
    }

    // data is the success shape here
    const { access_token, token_type, expires_in } = data as TokenExchangeSuccess;
    return NextResponse.json({ access_token, token_type, expires_in });
}
