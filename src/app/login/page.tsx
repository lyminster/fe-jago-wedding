"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
import {
  getBackendErrorMessage,
  getStoredBackendSession,
  loginBackendUser,
} from "@/lib/backend-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (getStoredBackendSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await loginBackendUser({ email, password });
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(getBackendErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Masuk dashboard"
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-[#2d6844]">
            Register
          </Link>
        </>
      }
      title="Login"
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          icon={Mail}
          label="Email"
          onChange={setEmail}
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="current-password"
          icon={LockKeyhole}
          label="Password"
          onChange={setPassword}
          type="password"
          value={password}
        />
        {errorMessage ? (
          <p className="rounded-lg border border-[#efd2cc] bg-[#fff5f2] px-3 py-2 text-sm text-[#a64f3f]">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-[#1c2421] disabled:cursor-wait disabled:bg-[#59645d]"
        >
          {isSubmitting ? "Memproses..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}

function AuthShell({
  children,
  eyebrow,
  footer,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  footer: React.ReactNode;
  title: string;
}) {
  return (
    <main className="grid min-h-screen bg-[#f8f4ec] text-ink lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/wedding-cover.png"
          alt="Preview undangan online"
          fill
          priority
          sizes="52vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#111714]/34" />
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px] rounded-lg border border-[#ded1bb] bg-white p-6 shadow-soft">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Jago Wedding</span>
              <span className="block text-xs text-[#758178]">
                Online Invitation
              </span>
            </span>
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9a6e20]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          {children}
          <p className="mt-5 text-center text-sm text-[#667269]">{footer}</p>
        </div>
      </section>
    </main>
  );
}

function AuthField({
  autoComplete,
  icon: Icon,
  label,
  onChange,
  type,
  value,
}: {
  autoComplete: string;
  icon: typeof Mail;
  label: string;
  onChange: (value: string) => void;
  type: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#59645d]">
        <Icon size={16} className="text-[#2d6844]" aria-hidden="true" />
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        className="block min-h-11 w-full rounded-lg border border-[#e4dfd4] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold text-ink outline-none focus:border-[#bd8b32]"
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
