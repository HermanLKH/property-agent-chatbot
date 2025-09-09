import EmbeddedSignupButton from "@/components/EmbeddedSignupButton";

export default function Page() {
  return (
    <main className="min-h-dvh p-8 flex flex-col items-start gap-6">
      <h1 className="text-2xl font-semibold">Connect your WhatsApp</h1>
      <p className="opacity-80 max-w-prose">
        This launches Meta’s WhatsApp Embedded Signup (v3). After completing the flow,
        we’ll exchange the authorization code on the server and continue onboarding.
      </p>
      <EmbeddedSignupButton />
    </main>
  );
}
