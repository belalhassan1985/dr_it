"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/lib/auth/actions";

type AuthFormProps = {
  mode: "login" | "register" | "admin";
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form className="login-form" action={formAction}>
      {state.error ? <div className="form-error">{state.error}</div> : null}
      {mode === "register" ? <input name="name" placeholder="الاسم" autoComplete="name" required /> : null}
      <input name="email" placeholder="البريد الإلكتروني" type="email" autoComplete="email" required />
      {mode === "register" ? <input name="phone" placeholder="الهاتف" autoComplete="tel" /> : null}
      <input name="password" placeholder="كلمة المرور" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required />
      {mode === "register" ? <input name="confirmPassword" placeholder="تأكيد كلمة المرور" type="password" autoComplete="new-password" required /> : null}
      <button type="submit" disabled={pending}>{pending ? "جاري المعالجة..." : submitLabel(mode)}</button>
    </form>
  );
}

function submitLabel(mode: AuthFormProps["mode"]) {
  if (mode === "register") return "إنشاء حساب";
  if (mode === "admin") return "دخول الإدارة";
  return "تسجيل الدخول";
}
