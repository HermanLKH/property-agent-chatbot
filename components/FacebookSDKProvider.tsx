"use client";

import Script from "next/script";

const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
const version = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v23.0";

/**
 * Loads and initializes the Meta JS SDK once per app.
 * We set window.fbAsyncInit BEFORE loading the SDK, as Meta expects.
 */
export default function FacebookSDKProvider() {
    return (
        <>
            <Script
                id="fb-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.fbAsyncInit = function() {
              FB.init({
                appId: '${appId}',
                cookie: true,
                xfbml: false, // we trigger the flow programmatically; set true if you use XFBML tags
                version: '${version}'
              });
            };
          `,
                }}
            />
            <Script
                id="fb-sdk"
                src="https://connect.facebook.net/en_US/sdk.js"
                strategy="afterInteractive"
            />
        </>
    );
}
