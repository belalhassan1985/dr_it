"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { allowAuthAttempt } from "@/lib/auth/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(120),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").toLowerCase(),
  phone: z.string().trim().max(32).optional(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export type AuthActionState = {
  error?: string;
};

export async function registerCustomer(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "تعذر إنشاء الحساب بهذه البيانات" };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      role: "CUSTOMER",
      isActive: true,
    },
  });

  await createSession(user);
  redirect("/account");
}

export async function loginUser(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  return loginWithRole(formData, "CUSTOMER", "/account");
}

export async function loginAdmin(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  return loginWithRole(formData, "ADMIN", "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

async function loginWithRole(formData: FormData, requiredRole: "CUSTOMER" | "ADMIN", redirectTo: string): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "بيانات الدخول غير صحيحة" };

  if (!allowAuthAttempt(parsed.data.email)) {
    return { error: "محاولات كثيرة، حاول لاحقا" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const genericError = requiredRole === "ADMIN"
    ? "بيانات دخول الإدارة غير صحيحة"
    : "البريد الإلكتروني أو كلمة المرور غير صحيحة";

  if (!user || !user.passwordHash || !user.isActive || user.role !== requiredRole) {
    return { error: genericError };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { error: genericError };

  await createSession(user);
  redirect(redirectTo);
}
