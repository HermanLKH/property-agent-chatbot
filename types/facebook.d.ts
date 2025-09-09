// types/facebook.d.ts
export { };

declare global {
    type FBLoginStatus = "connected" | "not_authorized" | "unknown";

    interface FBAuthResponse {
        // For Embedded Signup we expect a "code" when response_type='code'
        code?: string;
        accessToken?: string;
        expiresIn?: number;
        signedRequest?: string;
        userID?: string;
    }

    interface FBLoginResponse {
        status?: FBLoginStatus;
        authResponse?: FBAuthResponse;
    }

    interface FBLoginOptions {
        config_id: string;                  // WhatsApp Embedded Signup configuration ID
        response_type: "code";              // we want an authorization code
        override_default_response_type: true;
        redirect_uri: string;               // must exactly match your configured redirect URI
        extras?: {
            sessionInfoVersion: "3";
            setup?: Record<string, unknown>;
        };
    }

    interface FBSDK {
        init(params: { appId: string; cookie: boolean; xfbml: boolean; version: string }): void;
        getLoginStatus(cb: (resp: FBLoginResponse) => void): void;
        login(cb: (resp: FBLoginResponse) => void, options?: FBLoginOptions): void;
    }

    interface Window {
        FB?: FBSDK;
        fbAsyncInit?: () => void;
    }
}
