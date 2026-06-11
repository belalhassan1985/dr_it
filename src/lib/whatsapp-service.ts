import { prisma } from "@/lib/db";

const SETTING_KEYS = {
  enabled: "whatsapp.enabled",
  template: "whatsapp.template",
  storeWhatsapp: "whatsapp.store_whatsapp",
  siteName: "site.name",
} as const;

const WAHA_SETTING_KEYS = {
  baseUrl: "waha.base_url",
  sessionName: "waha.session_name",
  apiKey: "waha.api_key",
  sessionStatus: "waha.session_status",
  connectedPhone: "waha.connected_phone",
} as const;

type OrderInfo = {
  id: string;
  orderNo: string;
  customerName: string | null;
  customerPhone: string | null;
  total: number;
  status: string;
  items: Array<{
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
  }>;
};

const DEFAULT_TEMPLATE = `مرحباً {customerName}
تم استلام طلبك بنجاح.

رقم الطلب: {orderNumber}

تفاصيل الطلب:
{items}

المجموع النهائي: {totalPrice} د.ع

معلومات الدفع:
{paymentAccounts}

بعد الدفع، يرجى إرسال صورة التحويل أو رقم العملية إلى واتساب المتجر:
{storeWhatsapp}

شكراً لتسوقك من {siteName}`;

function formatItemLine(item: OrderInfo["items"][0]): string {
  return `- ${item.name} (${item.sku})
  الكمية: ${item.quantity} | السعر: ${item.price.toLocaleString()} د.ع | المجموع: ${item.total.toLocaleString()} د.ع`;
}

function formatItems(items: OrderInfo["items"]): string {
  return items.map(formatItemLine).join("\n");
}

function formatPaymentAccounts(
  accounts: Array<{ name: string; accountNumber: string; accountHolder: string | null; notes: string | null }>,
): string {
  if (accounts.length === 0) return "";
  return accounts
    .map((a) => {
      const holder = a.accountHolder ? `\nاسم صاحب الحساب: ${a.accountHolder}` : "";
      const notes = a.notes ? `\nملاحظات: ${a.notes}` : "";
      return `- ${a.name}: ${a.accountNumber}${holder}${notes}`;
    })
    .join("\n");
}

function cleanIraqiPhone(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  if (digits.length === 11 && digits.startsWith("07")) {
    return "964" + digits.slice(1);
  }
  if (digits.length === 10 && digits.startsWith("7")) {
    return "964" + digits;
  }
  if (digits.startsWith("964") && digits.length >= 12 && digits.length <= 13) {
    return digits;
  }
  return digits;
}

function isValidPhone(phone: string): boolean {
  const cleaned = cleanIraqiPhone(phone);
  return cleaned.length >= 12 && cleaned.length <= 13 && cleaned.startsWith("964");
}

function wahaChatId(phone: string): string {
  const cleaned = cleanIraqiPhone(phone);
  return `${cleaned}@c.us`;
}

type SettingsResult = {
  enabled: boolean;
  template: string;
  storeWhatsapp: string;
  siteName: string;
};

async function readSettings(): Promise<SettingsResult | null> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: Object.values(SETTING_KEYS) } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      enabled: map.get(SETTING_KEYS.enabled) === "true",
      template: map.get(SETTING_KEYS.template) || DEFAULT_TEMPLATE,
      storeWhatsapp: map.get(SETTING_KEYS.storeWhatsapp) || "",
      siteName: map.get(SETTING_KEYS.siteName) || "DR.IT",
    };
  } catch (err) {
    console.error("[whatsapp] failed to read settings:", err);
    return null;
  }
}

async function readActivePaymentAccounts() {
  try {
    return await prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } catch (err) {
    console.error("[whatsapp] failed to read payment accounts:", err);
    return [];
  }
}

/* ── WAHA API helpers ── */

async function wahaBaseUrl(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.baseUrl } });
  return row?.value || null;
}

async function wahaSessionName(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.sessionName } });
  return row?.value || "dr-it";
}

function wahaHeaders(apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  return headers;
}

async function wahaFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  return res;
}

interface WahaSession {
  name: string;
  status: "STARTING" | "SCAN_QR_CODE" | "AUTHENTICATED" | "DISCONNECTED" | "FAILED";
  phone?: string;
}

async function handleWahaCoreError(res: Response, text: string): Promise<string | null> {
  if (res.status === 422 && text.toLowerCase().includes("default")) {
    await prisma.setting.upsert({
      where: { key: WAHA_SETTING_KEYS.sessionName },
      update: { value: "default" },
      create: { key: WAHA_SETTING_KEYS.sessionName, value: "default" },
    });
    return "نسخة WAHA المجانية تدعم جلسة واحدة فقط باسم default";
  }
  return null;
}

export async function wahaStartSession(): Promise<{ success: boolean; error?: string }> {
  const baseUrl = await wahaBaseUrl();
  const sessionName = await wahaSessionName();
  const apiKeyRow = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.apiKey } });
  const apiKey = apiKeyRow?.value || null;
  if (!baseUrl) return { success: false, error: "WAHA Base URL غير مضبوط" };
  try {
    const res = await wahaFetch(`${baseUrl}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...wahaHeaders(apiKey) },
      body: JSON.stringify({ name: sessionName }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (text.toLowerCase().includes("already started")) return { success: true };
      const coreError = await handleWahaCoreError(res, text);
      if (coreError) return { success: false, error: coreError };
      return { success: false, error: `WAHA start error: ${res.status} ${text}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: `WAHA connection failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function wahaResetSession(): Promise<{ success: boolean; error?: string }> {
  const baseUrl = await wahaBaseUrl();
  const sessionName = await wahaSessionName();
  const apiKeyRow = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.apiKey } });
  const apiKey = apiKeyRow?.value || null;
  if (!baseUrl) return { success: false, error: "WAHA Base URL غير مضبوط" };

  try {
    // Delete the session (trailing slash required by WAHA)
    await wahaFetch(`${baseUrl}/api/sessions/${sessionName}/`, {
      method: "DELETE",
      headers: { ...wahaHeaders(apiKey) },
    });

    // Clear cached state
    await prisma.setting.upsert({
      where: { key: WAHA_SETTING_KEYS.sessionStatus },
      update: { value: "DISCONNECTED" },
      create: { key: WAHA_SETTING_KEYS.sessionStatus, value: "DISCONNECTED" },
    });
    await prisma.setting.upsert({
      where: { key: WAHA_SETTING_KEYS.connectedPhone },
      update: { value: "" },
      create: { key: WAHA_SETTING_KEYS.connectedPhone, value: "" },
    });

    // Small delay to let WAHA clean up
    await new Promise((r) => setTimeout(r, 500));

    // Start fresh session
    const res = await wahaFetch(`${baseUrl}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...wahaHeaders(apiKey) },
      body: JSON.stringify({ name: sessionName }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (text.toLowerCase().includes("already started")) return { success: true };
      const coreError = await handleWahaCoreError(res, text);
      if (coreError) return { success: false, error: coreError };
      return { success: false, error: `WAHA reset error: ${res.status} ${text}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: `WAHA connection failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function wahaGetQR(): Promise<{ success: boolean; qr?: string; error?: string }> {
  const baseUrl = await wahaBaseUrl();
  const sessionName = await wahaSessionName();
  const apiKeyRow = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.apiKey } });
  const apiKey = apiKeyRow?.value || null;
  if (!baseUrl) return { success: false, error: "WAHA Base URL غير مضبوط" };

  try {
    // WAHA 2026.5.x: GET /api/{session}/auth/qr with Accept: application/json
    const res = await wahaFetch(`${baseUrl}/api/${sessionName}/auth/qr`, {
      headers: { Accept: "application/json", ...wahaHeaders(apiKey) },
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const json = await res.json();
        // WAHA returns { mimetype: "image/png", data: "base64string" }
        if (json?.data) return { success: true, qr: `data:${json.mimetype || "image/png"};base64,${json.data}` };
      }
      // If image returned directly, convert to base64
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { success: true, qr: `data:${contentType || "image/png"};base64,${base64}` };
    }

    if (res.status === 404) {
      return { success: false, error: "الجلسة غير موجودة. أنشئ جلسة أولاً." };
    }

    const text = await res.text().catch(() => "");
    const coreError = await handleWahaCoreError(res, text);
    if (coreError) return { success: false, error: coreError };
    // Session not yet in SCAN_QR_CODE state - handled gracefully
    if (res.status === 422 && text.toLowerCase().includes("scan_qr_code")) {
      return { success: false, error: "الجلسة لم تصل لحالة SCAN_QR_CODE بعد" };
    }
    return { success: false, error: `WAHA QR error: ${res.status} ${text}` };
  } catch (err) {
    return { success: false, error: `WAHA connection failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function wahaGetStatus(): Promise<{ success: boolean; status?: string; phone?: string; error?: string }> {
  const baseUrl = await wahaBaseUrl();
  const sessionName = await wahaSessionName();
  const apiKeyRow = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.apiKey } });
  const apiKey = apiKeyRow?.value || null;
  if (!baseUrl) return { success: false, error: "WAHA Base URL غير مضبوط" };

  try {
    const res = await wahaFetch(`${baseUrl}/api/sessions/${sessionName}`, {
      headers: { Accept: "application/json", ...wahaHeaders(apiKey) },
    });

    if (!res.ok) {
      if (res.status === 404) return { success: false, error: "الجلسة غير موجودة" };
      const text = await res.text().catch(() => "");
      const coreError = await handleWahaCoreError(res, text);
      if (coreError) return { success: false, error: coreError };
      return { success: false, error: `WAHA status error: ${res.status} ${text}` };
    }

    const data: WahaSession = await res.json();
    const phone = data.phone || "";

    // Save status and phone to DB for quick access
    await prisma.setting.upsert({
      where: { key: WAHA_SETTING_KEYS.sessionStatus },
      update: { value: data.status },
      create: { key: WAHA_SETTING_KEYS.sessionStatus, value: data.status },
    });
    if (phone) {
      await prisma.setting.upsert({
        where: { key: WAHA_SETTING_KEYS.connectedPhone },
        update: { value: phone },
        create: { key: WAHA_SETTING_KEYS.connectedPhone, value: phone },
      });
    }

    return { success: true, status: data.status, phone };
  } catch (err) {
    return { success: false, error: `WAHA connection failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function wahaLogout(): Promise<{ success: boolean; error?: string }> {
  const baseUrl = await wahaBaseUrl();
  const sessionName = await wahaSessionName();
  const apiKeyRow = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.apiKey } });
  const apiKey = apiKeyRow?.value || null;
  if (!baseUrl) return { success: false, error: "WAHA Base URL غير مضبوط" };

  try {
    // WAHA 2026.5.x: POST /api/sessions/logout with body { session: "name" }
    const res = await wahaFetch(`${baseUrl}/api/sessions/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...wahaHeaders(apiKey) },
      body: JSON.stringify({ session: sessionName }),
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => "");
      const coreError = await handleWahaCoreError(res, text);
      if (coreError) return { success: false, error: coreError };
      return { success: false, error: `WAHA logout error: ${res.status} ${text}` };
    }

    // Clear cached status
    await prisma.setting.upsert({
      where: { key: WAHA_SETTING_KEYS.sessionStatus },
      update: { value: "DISCONNECTED" },
      create: { key: WAHA_SETTING_KEYS.sessionStatus, value: "DISCONNECTED" },
    });
    await prisma.setting.upsert({
      where: { key: WAHA_SETTING_KEYS.connectedPhone },
      update: { value: "" },
      create: { key: WAHA_SETTING_KEYS.connectedPhone, value: "" },
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: `WAHA connection failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function wahaSendMessage(phone: string, message: string): Promise<boolean> {
  const baseUrl = await wahaBaseUrl();
  const sessionName = await wahaSessionName();
  const apiKeyRow = await prisma.setting.findUnique({ where: { key: WAHA_SETTING_KEYS.apiKey } });
  const apiKey = apiKeyRow?.value || null;

  if (!baseUrl) {
    console.warn("[waha] base URL not configured");
    return false;
  }

  try {
    const chatId = wahaChatId(phone);
    const res = await wahaFetch(`${baseUrl}/api/sendText`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...wahaHeaders(apiKey) },
      body: JSON.stringify({
        session: sessionName,
        chatId,
        text: message,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const coreError = await handleWahaCoreError(res, text);
      if (coreError) {
        console.warn("[waha]", coreError);
        return false;
      }
      console.error("[waha] send error:", res.status, text);
      return false;
    }

    console.log("[waha] message sent to", phone, "via session", sessionName);
    return true;
  } catch (err) {
    console.error("[waha] send failed:", err);
    return false;
  }
}

/* ── Order notification ── */

export async function sendOrderWhatsApp(order: OrderInfo): Promise<void> {
  const settings = await readSettings();
  if (!settings) {
    console.warn("[whatsapp] could not load settings, skipping");
    return;
  }

  if (!settings.enabled) {
    console.log("[whatsapp] disabled via settings, skipping");
    return;
  }

  const phone = order.customerPhone;
  if (!phone) {
    console.log("[whatsapp] no customer phone, skipping");
    return;
  }

  if (!isValidPhone(phone)) {
    console.log("[whatsapp] invalid phone number:", phone, "skipping");
    return;
  }

  const accounts = await readActivePaymentAccounts();
  const paymentAccountsStr = formatPaymentAccounts(accounts);
  const itemsStr = formatItems(order.items);

  const message = settings.template
    .replaceAll("{customerName}", order.customerName || "عميلنا العزيز")
    .replaceAll("{orderNumber}", order.orderNo)
    .replaceAll("{items}", itemsStr)
    .replaceAll("{totalPrice}", order.total.toLocaleString())
    .replaceAll("{phone}", phone)
    .replaceAll("{orderStatus}", order.status)
    .replaceAll("{paymentAccounts}", paymentAccountsStr || "(لن يتم طلب الدفع الآن، سيتم التواصل معك)")
    .replaceAll("{storeWhatsapp}", settings.storeWhatsapp)
    .replaceAll("{siteName}", settings.siteName);

  const cleanedPhone = cleanIraqiPhone(phone);
  const sent = await wahaSendMessage(cleanedPhone, message);

  if (!sent) {
    console.warn("[whatsapp] failed to send message for order", order.orderNo);
  }
}

/* ── Test message ── */

export type SendTestResult = {
  success: boolean;
  message: string;
  error?: string;
};

export async function sendTestMessage(phone: string): Promise<SendTestResult> {
  const settings = await readSettings();
  if (!settings) {
    return { success: false, message: "", error: "فشل قراءة إعدادات الواتساب" };
  }

  if (!phone) {
    return { success: false, message: "", error: "رقم الهاتف مطلوب" };
  }

  if (!isValidPhone(phone)) {
    return { success: false, message: "", error: "رقم الهاتف غير صالح. يجب أن يبدأ بـ 07" };
  }

  const testItems = `- كيسبورد ميكانيكي (KB-001)
  الكمية: 1 | السعر: 25,000 د.ع | المجموع: 25,000 د.ع
- ماوس لاسلكي (MS-002)
  الكمية: 2 | السعر: 15,000 د.ع | المجموع: 30,000 د.ع`;

  const testAccounts = `- زين كاش: 07801234567
اسم صاحب الحساب: علي محمد
- آسيا حوالة: 9647801234567
اسم صاحب الحساب: علي محمد`;

  const rendered = settings.template
    .replaceAll("{customerName}", "أحمد (رسالة اختبار)")
    .replaceAll("{orderNumber}", "DRIT-TEST-0001")
    .replaceAll("{items}", testItems)
    .replaceAll("{totalPrice}", "55,000")
    .replaceAll("{phone}", phone)
    .replaceAll("{orderStatus}", "PENDING")
    .replaceAll("{paymentAccounts}", testAccounts)
    .replaceAll("{storeWhatsapp}", settings.storeWhatsapp)
    .replaceAll("{siteName}", settings.siteName);

  const cleanedPhone = cleanIraqiPhone(phone);
  const sent = await wahaSendMessage(cleanedPhone, rendered);

  if (sent) {
    return { success: true, message: rendered };
  }

  const baseUrl = await wahaBaseUrl();
  if (!baseUrl) {
    return { success: false, message: rendered, error: "WAHA Base URL غير مضبوط في إعدادات الأدمن" };
  }

  return { success: false, message: rendered, error: "فشل الإرسال. تحقق من اتصال WAHA وحالة الجلسة" };
}
