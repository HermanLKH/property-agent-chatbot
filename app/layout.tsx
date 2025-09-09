import type { Metadata } from "next";
import "./globals.css";
import FacebookSDKProvider from "@/components/FacebookSDKProvider";

export const metadata: Metadata = {
  title: "WhatsApp Embedded Signup",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FacebookSDKProvider />
        {children}
      </body>
    </html>
  );
}
