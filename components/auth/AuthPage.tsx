"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import PlatformLogo from "@/components/brand/PlatformLogo";
import { loginAccount, registerAccount } from "@/lib/auth-client";

type Platform = "supabase" | "directus" | "pocketbase";
type AuthMode = "login" | "register";

const platformContent: Record<
  Platform,
  { name: string; tagline: string; description: string }
> = {
  supabase: {
    name: "supabase",
    tagline: "A little more room to build.",
    description: "Pick up where your next great idea begins.",
  },
  directus: {
    name: "directus",
    tagline: "Make space for good ideas.",
    description: "Your content workspace is ready when you are.",
  },
  pocketbase: {
    name: "PocketBase",
    tagline: "Small start. Big possibilities.",
    description: "Step into your all-in-one project space.",
  },
};

type AuthPageProps = {
  platform: Platform;
  mode: AuthMode;
};

export default function AuthPage({ platform, mode }: AuthPageProps) {
  const content = platformContent[platform];
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [verifiedNotice, setVerifiedNotice] = useState(false);

  useEffect(() => {
    setVerifiedNotice(new URLSearchParams(window.location.search).get("verified") === "1");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (isRegister && password !== confirmPassword) {
      setErrorMessage("Your passwords do not match. Please check and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await registerAccount({ name, email, password });
        setAccountCreated(true);
      } else {
        await loginAccount(email, password);
        window.location.assign(`/${platform}`);
      }
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error && error.message === "Failed to authenticate."
          ? "We couldn't sign you in. Check your email and password, and verify your email if you just registered."
          : error instanceof Error
            ? error.message
            : "We couldn't complete that request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`auth-page cms-landing cms-landing-${platform}`}>
      <div className="auth-shell">
        <section className="auth-showcase" aria-label={`${content.name} welcome`}>
          <Link className="auth-brand" href={`/${platform}`}>
            <span className={`landing-logo landing-logo-${platform}`} aria-hidden="true">
              <PlatformLogo className="platform-logo" platform={platform} />
            </span>
            <strong>{content.name}</strong>
          </Link>

          <div className="auth-showcase-art" aria-hidden="true">
            <span className="auth-art-orbit auth-art-orbit-one" />
            <span className="auth-art-orbit auth-art-orbit-two" />
            <span className="auth-art-orbit auth-art-orbit-three" />
            <span className="auth-art-core">
              <PlatformLogo className="auth-art-logo" platform={platform} />
            </span>
            <span className="auth-art-spark auth-art-spark-one">✳</span>
            <span className="auth-art-spark auth-art-spark-two">✦</span>
            <span className="auth-art-caption">YOUR NEXT CHAPTER</span>
          </div>

          <div className="auth-showcase-copy">
            <p className="landing-eyebrow">WELCOME TO {content.name.toUpperCase()}</p>
            <h1>{content.tagline}</h1>
            <p>{content.description}</p>
          </div>
          <div className="auth-showcase-footer">
            <span>Thoughtfully made for your workflow.</span>
            <Link href="/">All workspaces <span aria-hidden="true">↗</span></Link>
          </div>
        </section>

        <section className="auth-panel" aria-labelledby="auth-heading">
          <Link className="auth-mobile-brand" href={`/${platform}`}>
            <span className={`landing-logo landing-logo-${platform}`} aria-hidden="true">
              <PlatformLogo className="platform-logo" platform={platform} />
            </span>
            <strong>{content.name}</strong>
          </Link>

          {accountCreated ? (
            <div className="auth-success-panel" role="status">
              <span className="auth-success-mark" aria-hidden="true">✓</span>
              <p className="landing-eyebrow">YOU&apos;RE ON YOUR WAY</p>
              <h1 id="auth-heading">Check your email.</h1>
              <p>
                Your shared PocketBase account was saved and a verification link was
                sent to {email.trim()}. Verify your email before signing in.
              </p>
              <Link className="auth-submit" href={`/${platform}/login`}>
                Go to sign in <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-panel-heading">
                <p className="landing-eyebrow">{isRegister ? "YOUR SPACE AWAITS" : "GOOD TO SEE YOU AGAIN"}</p>
                <h1 id="auth-heading">{isRegister ? "Create your account" : "Welcome back"}</h1>
                <p>
                  {isRegister
                    ? "A few details and you’re ready to get started."
                    : "Sign in to return to your workspace."}
                </p>
                {!isRegister && verifiedNotice && (
                  <p className="auth-success-panel" role="status">
                    Email verified. You can now sign in.
                  </p>
                )}
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {isRegister && (
                  <label className="auth-field">
                    <span>Your name</span>
                    <input
                      autoComplete="name"
                      maxLength={100}
                      minLength={2}
                      name="name"
                      onChange={(event) => setName(event.target.value)}
                      placeholder="How should we call you?"
                      required
                      value={name}
                    />
                  </label>
                )}

                <label className="auth-field">
                  <span>Email address</span>
                  <input
                    autoComplete="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </label>

                <label className="auth-field">
                  <span>Password</span>
                  <span className="auth-password-control">
                    <input
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      minLength={8}
                      name="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((visible) => !visible)}
                      type="button"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>

                {isRegister && (
                  <label className="auth-field">
                    <span>Confirm password</span>
                    <input
                      autoComplete="new-password"
                      minLength={8}
                      name="confirmPassword"
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Enter your password again"
                      required
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                    />
                  </label>
                )}

                {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}

                <button className="auth-submit" disabled={isSubmitting} type="submit">
                  {isSubmitting
                    ? "One moment..."
                    : isRegister
                      ? "Create account"
                      : "Sign in"}
                  <span aria-hidden="true">↗</span>
                </button>
              </form>

              <p className="auth-switch">
                {isRegister ? "Already have an account?" : "New around here?"}{" "}
                <Link href={`/${platform}/${isRegister ? "login" : "register"}`}>
                  {isRegister ? "Sign in" : "Create an account"}
                </Link>
              </p>

              <p className="auth-privacy">
                Your account works across the Fieldnotes workspaces.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
