import { AuthForm } from "@/components/auth-form";
import { loginAdmin } from "@/lib/auth/actions";

export default function AdminLoginPage() {
  return (
    <main className="auth-admin-page">
      <section>
        <p>DR.IT Technology & Trading</p>
        <h1>DR.IT Admin Dashboard</h1>
        <span>تسجيل دخول الإدارة</span>
        <AuthForm mode="admin" action={loginAdmin} />
      </section>
    </main>
  );
}
