import { NextRequest, NextResponse } from "next/server";

// Vercel/Next hints
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TokenExchangeSuccess = {
    access_token: string;
    token_type: string; // usually "bearer"
    expires_in: number;
};

type TokenExchangeError = {
    error: {
        message: string;
        type?: string;
        code?: number;
        error_subcode?: number;
        fbtrace_id?: string;
    };
};

type TokenExchangeResponse = TokenExchangeSuccess | TokenExchangeError;

type ExchangeBody = {
    code: string;
    redirectUri: string;
};

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Partial<ExchangeBody>;
        const code = body.code;
        const redirectUri = body.redirectUri;

        if (!code || !redirectUri) {
            return NextResponse.json({ error: "Missing code or redirectUri" }, { status: 400 });
        }

        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
        const appSecret = process.env.FACEBOOK_APP_SECRET!;
        const version = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v23.0";

        const params = new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            code,
            redirect_uri: redirectUri, // MUST exactly match one configured in your Meta app
        });

        const url = `https://graph.facebook.com/${version}/oauth/access_token?${params.toString()}`;
        const r = await fetch(url, { method: "GET" });
        const data = (await r.json()) as TokenExchangeResponse;

        if (!r.ok || "error" in data) {
            const message = "error" in data ? data.error.message : "Exchange failed";
            return NextResponse.json({ error: message }, { status: r.status || 500 });
        }

        const { access_token, token_type, expires_in } = data;
        return NextResponse.json({ access_token, token_type, expires_in });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unexpected error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
