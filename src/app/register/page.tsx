import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إنشاء حساب | DR.IT",
  description: "إنشاء حساب جديد في متجر DR.IT.",
  robots: { index: false, follow: false },
};

import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { registerCustomer } from "@/lib/auth/actions";

export default function RegisterPage() {
  return (
    <main className="auth-admin-page">
      <section>
        <p>DR.IT Technology & Trading</p>
        <h1>Welcome to DR.IT</h1>
        <AuthForm mode="register" action={registerCustomer} />
        <Link href="/login">لديك حساب؟ تسجيل الدخول</Link>
      </section>
    </main>
  );
}