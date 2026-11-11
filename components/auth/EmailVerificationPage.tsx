"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { verifyRegisteredEmail, type AuthPlatform } from "@/lib/auth-client";

type Props = { platform: AuthPlatform };

export default function EmailVerificationPage({ platform }: Props) {
  const [message, setMessage] = useState("Verifying your email address…");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setMessage("This verification link is incomplete or has expired.");
      return;
    }

    let isCurrent = true;
    verifyRegisteredEmail(token)
      .then(() => {
        if (!isCurrent) return;
        setVerified(true);
        setMessage("Your email is verified. You can now sign in.");
        window.setTimeout(() => {
          window.location.replace(`/${platform}/login?verified=1`);
        }, 1600);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setMessage(
          error instanceof Error
            ? error.message
            : "We couldn't verify your email. Please request a new verification email.",
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [platform]);

  return (
    <main className="auth-page cms-landing">
      <section className="auth-panel auth-success-panel" aria-live="polite">
        <p className="landing-eyebrow">{verified ? "VERIFICATION COMPLETE" : "EMAIL VERIFICATION"}</p>
        <h1>{verified ? "You’re all set." : "One quick check."}</h1>
        <p>{message}</p>
        <Link className="auth-submit" href={`/${platform}/login`}>
          Continue to sign in <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
