import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول | DR.IT",
  description: "تسجيل الدخول إلى حسابك في متجر DR.IT.",
  robots: { index: false, follow: false },
};

import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { loginUser } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <main className="auth-admin-page">
      <section>
        <p>DR.IT Technology & Trading</p>
        <h1>Welcome to DR.IT</h1>
        <AuthForm mode="login" action={loginUser} />
        <Link href="/register">إنشاء حساب جديد</Link>
      </section>
    </main>
  );
}