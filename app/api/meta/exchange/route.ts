import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { code, redirectUri } = await req.json();

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
            redirect_uri: redirectUri, // MUST exactly match the one configured in Meta app settings
        });

        const url = `https://graph.facebook.com/${version}/oauth/access_token?${params.toString()}`;
        const r = await fetch(url);
        const data = await r.json();

        if (!r.ok) {
            return NextResponse.json({ error: data?.error?.message || "Exchange failed" }, { status: r.status });
        }

        // data: { access_token, token_type, expires_in }
        // From here, on the SERVER you typically:
        //  - call /debug_token (optional) to inspect token
        //  - call WhatsApp Business endpoints to read WABA, phone_number_id etc., and store per-tenant
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Unexpected error" }, { status: 500 });
    }
}
