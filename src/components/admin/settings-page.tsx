"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentAccount } from "@prisma/client";
import { saveSettings, saveWhatsappSettings, savePaymentAccount, deletePaymentAccount, sendTestWhatsApp, wahaStartSessionAction, wahaGetQRAction, wahaGetStatusAction, wahaLogoutAction, wahaResetSessionAction } from "@/lib/admin-actions";

type Props = {
  settings: Map<string, string>;
  accounts: PaymentAccount[];
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

export function SettingsPageClient({ settings, accounts }: Props) {
  const [activeTab, setActiveTab] = useState<"general" | "whatsapp" | "payment">("general");
  const [editAccount, setEditAccount] = useState<PaymentAccount | null>(null);

  const generalKeys = [
    ["site.name", "اسم الموقع"],
    ["site.description", "وصف الموقع"],
    ["tax.rate", "الضريبة"],
    ["company.phone", "الهاتف"],
    ["company.whatsapp", "واتساب"],
    ["company.email", "البريد الإلكتروني"],
    ["company.address", "العنوان"],
    ["store.status", "حالة المتجر"],
  ] as const;

  const tabClass = (tab: string) =>
    `settings-tab${activeTab === tab ? " settings-tab--active" : ""}`;

  return (
    <div className="settings-page">
      <nav className="settings-tabs">
        <button className={tabClass("general")} onClick={() => setActiveTab("general")}>عام</button>
        <button className={tabClass("whatsapp")} onClick={() => setActiveTab("whatsapp")}>واتساب</button>
        <button className={tabClass("payment")} onClick={() => setActiveTab("payment")}>حسابات الدفع</button>
      </nav>

      <div className="settings-panel">
        {activeTab === "general" && (
          <form action={saveSettings} className="admin-settings-form">
            {generalKeys.map(([key, label]) => (
              <label key={key}>
                {label}
                <input name={key} defaultValue={settings.get(key) ?? ""} />
              </label>
            ))}
            <button>حفظ الإعدادات العامة</button>
          </form>
        )}

        {activeTab === "whatsapp" && (
          <WhatsappSettingsSection settings={settings} />
        )}

        {activeTab === "payment" && (
          <PaymentAccountsSection accounts={accounts} editAccount={editAccount} onEdit={setEditAccount} />
        )}
      </div>
    </div>
  );
}

const PREVIEW_ITEMS = `- كيسبورد ميكانيكي (KB-001)
  الكمية: 1 | السعر: 25,000 د.ع | المجموع: 25,000 د.ع
- ماوس لاسلكي (MS-002)
  الكمية: 2 | السعر: 15,000 د.ع | المجموع: 30,000 د.ع`;

const PREVIEW_ACCOUNTS = `- زين كاش: 07801234567
اسم صاحب الحساب: علي محمد
- آسيا حوالة: 9647801234567
اسم صاحب الحساب: علي محمد`;

function WhatsappSettingsSection({ settings }: { settings: Map<string, string> }) {
  const [template, setTemplate] = useState(settings.get("whatsapp.template") || DEFAULT_TEMPLATE);
  const [enabled, setEnabled] = useState(settings.get("whatsapp.enabled") === "true");
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);
  const [testSending, setTestSending] = useState(false);
  const testPhoneRef = useRef<HTMLInputElement>(null);

  // WAHA state
  const [sessionStatus, setSessionStatus] = useState(settings.get("waha.session_status") || "");
  const [connectedPhone, setConnectedPhone] = useState(settings.get("waha.connected_phone") || "");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [wahaError, setWahaError] = useState("");
  const [sessionNameInput, setSessionNameInput] = useState(settings.get("waha.session_name") || "dr-it");

  const storeWhatsapp = settings.get("whatsapp.store_whatsapp") || "07XXXXXXXXX";
  const siteName = settings.get("site.name") || "DR.IT";

  const preview = useMemo(() => {
    return template
      .replaceAll("{customerName}", "أحمد")
      .replaceAll("{orderNumber}", "DRIT-XXXXX-XXXX")
      .replaceAll("{items}", PREVIEW_ITEMS)
      .replaceAll("{totalPrice}", "55,000")
      .replaceAll("{phone}", "9647801234567")
      .replaceAll("{orderStatus}", "PENDING")
      .replaceAll("{paymentAccounts}", PREVIEW_ACCOUNTS)
      .replaceAll("{storeWhatsapp}", storeWhatsapp)
      .replaceAll("{siteName}", siteName);
  }, [template, storeWhatsapp, siteName]);

  const statusLabel: Record<string, string> = {
    STARTING: "جارٍ التشغيل...",
    SCAN_QR_CODE: "انتظار مسح QR",
    AUTHENTICATED: "متصل ✅",
    DISCONNECTED: "غير متصل",
    FAILED: "فشل الاتصال",
  };

  const statusClass: Record<string, string> = {
    AUTHENTICATED: "waha-badge--success",
    SCAN_QR_CODE: "waha-badge--warning",
    STARTING: "waha-badge--info",
    DISCONNECTED: "waha-badge--muted",
    FAILED: "waha-badge--error",
  };

  const handleGenerateQR = async () => {
    setQrLoading(true);
    setQrCode(null);
    setWahaError("");
    try {
      const statusRes = await wahaGetStatusAction();
      let currentStatus = statusRes.success ? statusRes.status : "";

      // If stopped/failed/not found → start the session
      if (!currentStatus || currentStatus === "STOPPED" || currentStatus === "DISCONNECTED" || currentStatus === "FAILED") {
        const start = await wahaStartSessionAction();
        if (!start.success) {
          setWahaError(start.error || "فشل بدء الجلسة");
          return;
        }
        currentStatus = "STARTING";
      }

      // Retry up to 3 times waiting for session to reach SCAN_QR_CODE
      for (let i = 0; i < 3; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const check = await wahaGetStatusAction();
        if (check.success) {
          currentStatus = check.status || "";
          if (currentStatus === "SCAN_QR_CODE") break;
        }
      }

      if (currentStatus === "STOPPED") {
        setWahaError("الجلسة لم تبدأ بعد، اضغط Reset Session ثم حاول مرة أخرى");
        return;
      }

      const qr = await wahaGetQRAction();
      if (qr.success && qr.qr) {
        setQrCode(qr.qr);
        setSessionStatus("SCAN_QR_CODE");
      } else {
        setWahaError(qr.error || "فشل جلب QR");
      }
    } catch {
      setWahaError("فشل الاتصال بالخادم");
    } finally {
      setQrLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setStatusLoading(true);
    setWahaError("");
    try {
      const res = await wahaGetStatusAction();
      if (res.success) {
        setSessionStatus(res.status || "");
        setConnectedPhone(res.phone || "");
        if (res.status === "AUTHENTICATED") setQrCode(null);
      } else {
        setWahaError(res.error || "فشل جلب الحالة");
      }
    } catch {
      setWahaError("فشل الاتصال بالخادم");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("تسجيل الخروج من واتساب؟")) return;
    setWahaError("");
    try {
      const res = await wahaLogoutAction();
      if (res.success) {
        setSessionStatus("DISCONNECTED");
        setConnectedPhone("");
        setQrCode(null);
      } else {
        setWahaError(res.error || "فشل تسجيل الخروج");
      }
    } catch {
      setWahaError("فشل الاتصال بالخادم");
    }
  };

  const handleResetSession = async () => {
    if (!confirm("إعادة تعيين الجلسة بالكامل؟\nسيتم حذف الجلسة الحالية وإنشاء جلسة جديدة.")) return;
    setResetLoading(true);
    setWahaError("");
    try {
      const res = await wahaResetSessionAction();
      if (res.success) {
        setSessionStatus("STARTING");
        setConnectedPhone("");
        setQrCode(null);
      } else {
        setWahaError(res.error || "فشل إعادة تعيين الجلسة");
      }
    } catch {
      setWahaError("فشل الاتصال بالخادم");
    } finally {
      setResetLoading(false);
    }
  };

  const handleTestSend = async () => {
    const phone = testPhoneRef.current?.value?.trim();
    if (!phone) return;
    setTestSending(true);
    setTestResult(null);
    const fd = new FormData();
    fd.set("testPhone", phone);
    try {
      const data = await sendTestWhatsApp(fd);
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "", error: "فشل الاتصال بالخادم" });
    } finally {
      setTestSending(false);
    }
  };

  const handleSaveWhatsapp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveResult(null);
    setWahaError("");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await saveWhatsappSettings(formData);
      setSaveResult(res);
      if (res.success) {
        router.refresh();
      }
    } catch {
      setSaveResult({ success: false, message: "حدث خطأ أثناء حفظ الإعدادات" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveWhatsapp} className="admin-settings-form">
      {/* ── WAHA Connection Section ── */}
      <div className="waha-section">
        <h3>إعدادات WAHA (WhatsApp HTTP API)</h3>

        <label>
          WAHA Base URL
          <input name="waha.base_url" dir="ltr" defaultValue={settings.get("waha.base_url") ?? "http://localhost:3002"} placeholder="http://localhost:3002" />
        </label>
        <label>
          Session Name
          <input name="waha.session_name" dir="ltr" value={sessionNameInput} onChange={(e) => setSessionNameInput(e.target.value)} placeholder="default" />
        </label>
        {sessionNameInput !== "default" && (
          <div className="waha-warning">
            ⚠️ نسخة WAHA المجانية تدعم جلسة واحدة فقط باسم <strong>default</strong>
          </div>
        )}
        <label>
          WAHA API Key
          <input name="waha.api_key" type="password" dir="ltr" defaultValue={settings.get("waha.api_key") ?? ""} placeholder={settings.get("waha.api_key") ? "••••••••" : "أدخل مفتاح API"} />
        </label>

        <div className="waha-status-bar">
          <div className="waha-status-info">
            <span className="waha-label">حالة الجلسة:</span>
            <span className={`waha-badge ${statusClass[sessionStatus] || "waha-badge--muted"}`}>
              {statusLabel[sessionStatus] || sessionStatus || "غير معروفة"}
            </span>
          </div>
          {connectedPhone && (
            <div className="waha-status-info">
              <span className="waha-label">الرقم المتصل:</span>
              <span className="waha-phone" dir="ltr">{connectedPhone}</span>
            </div>
          )}
        </div>

        {wahaError && <div className="waha-error">{wahaError}</div>}

        <div className="waha-actions">
          {sessionStatus === "AUTHENTICATED" ? (
            <button type="button" className="waha-btn" onClick={handleRefreshStatus} disabled={statusLoading}>
              {statusLoading ? "..." : "🔄 Refresh Status"}
            </button>
          ) : (
            <>
              <button type="button" className="waha-btn waha-btn--primary" onClick={handleGenerateQR} disabled={qrLoading}>
                {qrLoading ? "جاري التحميل..." : qrCode ? "🔄 توليد رمز جديد" : "🔗 Generate QR"}
              </button>
              <button type="button" className="waha-btn" onClick={handleRefreshStatus} disabled={statusLoading}>
                {statusLoading ? "..." : "🔄 Refresh Status"}
              </button>
            </>
          )}
          {(sessionStatus === "FAILED" || sessionStatus === "STOPPED" || sessionStatus === "DISCONNECTED") && (
            <button type="button" className="waha-btn waha-btn--danger" onClick={handleResetSession} disabled={resetLoading}>
              {resetLoading ? "..." : "🔄 Reset Session"}
            </button>
          )}
          {sessionStatus === "AUTHENTICATED" && (
            <button type="button" className="waha-btn waha-btn--danger" onClick={handleLogout}>
              🚪 Logout Session
            </button>
          )}
        </div>

        {sessionStatus === "AUTHENTICATED" && !qrLoading && (
          <div className="waha-qr-connected">
            <div className="waha-connected-icon">✅</div>
            <div className="waha-connected-text">
              <strong>تم ربط واتساب بنجاح</strong>
              {connectedPhone && <span>الرقم المتصل: {connectedPhone}</span>}
            </div>
          </div>
        )}

        {qrCode && (
          <div className="waha-qr-box">
            <h4>امسح هذا الرمز من واتساب</h4>
            <img src={qrCode} alt="WhatsApp QR Code" className="waha-qr-img" />
            <div className="waha-qr-steps">
              <div className="waha-qr-step">1. افتح واتساب على هاتفك</div>
              <div className="waha-qr-step">2. اذهب إلى {`"الإعدادات ← الأجهزة المرتبطة"`}</div>
              <div className="waha-qr-step">3. اضغط {`"ربط جهاز"`}</div>
              <div className="waha-qr-step">4. امسح الرمز الظاهر على الشاشة</div>
            </div>
            <p className="waha-qr-hint">إذا انتهت صلاحية الرمز اضغط &quot;توليد رمز جديد&quot;</p>
          </div>
        )}
      </div>

      {/* ── Notification Settings ── */}
      <div className="waha-section">
        <h3>إعدادات الإشعارات</h3>

        <label className="checkbox-label">
          <input type="checkbox" name="whatsapp.enabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          تفعيل إرسال رسائل واتساب تلقائياً بعد الطلب
        </label>

        <label>
          رقم واتساب المتجر (الظاهر في الرسالة)
          <input name="whatsapp.store_whatsapp" dir="ltr" defaultValue={settings.get("whatsapp.store_whatsapp") ?? ""} placeholder="07XXXXXXXXX" />
        </label>
      </div>

      {/* ── Template ── */}
      <div className="waha-section">
        <h3>قالب الرسالة</h3>
        <label>
          <div className="template-vars-hint">
            المتغيرات المتاحة: {`{customerName} {orderNumber} {items} {totalPrice} {phone} {orderStatus} {paymentAccounts} {storeWhatsapp} {siteName}`}
          </div>
          <textarea
            name="whatsapp.template"
            className="template-textarea"
            rows={12}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
        </label>
      </div>

      <button type="submit" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ جميع الإعدادات"}</button>

      {saveResult && (
        <div className={`payment-result ${saveResult.success ? "payment-result--success" : "payment-result--error"}`} style={{ marginTop: 12 }}>
          {saveResult.message}
        </div>
      )}

      <div className="preview-box">
        <h3>معاينة الرسالة:</h3>
        <pre className="preview-message">{preview}</pre>
      </div>

      {/* Test message */}
      <div className="test-message-section">
        <h3>إرسال رسالة اختبار</h3>
        <div className="test-message-row">
          <input ref={testPhoneRef} type="text" dir="ltr" placeholder="07XXXXXXXXX" className="test-phone-input" />
          <button type="button" className="btn-send-test" onClick={handleTestSend} disabled={testSending}>
            {testSending ? "جاري الإرسال..." : "إرسال رسالة اختبار"}
          </button>
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? "test-result--success" : "test-result--error"}`}>
            <p className="test-result__status">
              {testResult.success ? "✅ تم إرسال الرسالة بنجاح" : "❌ فشل الإرسال"}
            </p>
            {testResult.error && <p className="test-result__error">السبب: {testResult.error}</p>}
            <details className="test-result__details">
              <summary>عرض نص الرسالة المرسلة</summary>
              <pre className="test-result__message">{testResult.message}</pre>
            </details>
          </div>
        )}
      </div>
    </form>
  );
}

function PaymentAccountsSection({
  accounts,
  editAccount,
  onEdit,
}: {
  accounts: PaymentAccount[];
  editAccount: PaymentAccount | null;
  onEdit: (a: PaymentAccount | null) => void;
}) {
  return (
    <div className="payment-accounts-section">
      <h3>حسابات الدفع</h3>

      {editAccount ? (
        <PaymentAccountForm account={editAccount} onCancel={() => onEdit(null)} />
      ) : (
        <button className="btn-add" onClick={() => onEdit({} as PaymentAccount)}>إضافة حساب دفع</button>
      )}

      <table className="payment-accounts-table">
        <thead>
          <tr>
            <th>الترتيب</th>
            <th>الاسم</th>
            <th>رقم الحساب</th>
            <th>صاحب الحساب</th>
            <th>افتراضي</th>
            <th>نشط</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id}>
              <td>{acc.sortOrder}</td>
              <td>{acc.name}</td>
              <td dir="ltr">{acc.accountNumber}</td>
              <td>{acc.accountHolder || "—"}</td>
              <td>{acc.isDefault ? "✓" : ""}</td>
              <td>{acc.isActive ? "نشط" : "معطل"}</td>
              <td>
                <button className="btn-sm" onClick={() => onEdit(acc)}>تعديل</button>
                <form action={deletePaymentAccount} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={acc.id} />
                  <button className="btn-sm btn-danger" onClick={(e) => { if (!confirm("حذف هذا الحساب؟")) e.preventDefault(); }}>حذف</button>
                </form>
              </td>
            </tr>
          ))}
          {accounts.length === 0 && (
            <tr><td colSpan={7}>لا توجد حسابات دفع. أضف حساباً جديداً.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaymentAccountForm({ account, onCancel }: { account: PaymentAccount | null; onCancel: () => void }) {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const a = account?.id ? account : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await savePaymentAccount(formData);
      setResult(res);
      if (res.success) {
        router.refresh();
        onCancel();
      }
    } catch {
      setResult({ success: false, message: "حدث خطأ أثناء حفظ الحساب" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="payment-account-form">
        {a && <input type="hidden" name="id" value={a.id} />}
        <div className="form-row">
          <label>اسم الحساب
            <input name="name" defaultValue={a?.name ?? ""} required placeholder="مثال: زين كاش" />
          </label>
          <label>رقم الحساب
            <input name="accountNumber" defaultValue={a?.accountNumber ?? ""} required dir="ltr" placeholder="رقم الحساب أو المعرف" />
          </label>
        </div>
        <div className="form-row">
          <label>اسم صاحب الحساب
            <input name="accountHolder" defaultValue={a?.accountHolder ?? ""} placeholder="اختياري" />
          </label>
          <label>الترتيب
            <input name="sortOrder" type="number" defaultValue={a?.sortOrder ?? 0} />
          </label>
        </div>
        <div className="form-row">
          <label>ملاحظات
            <input name="notes" defaultValue={a?.notes ?? ""} placeholder="اختياري" />
          </label>
        </div>
        <div className="form-row checkboxes">
          <label>
            <input type="checkbox" name="isActive" defaultChecked={a?.isActive ?? true} />
            نشط
          </label>
          <label>
            <input type="checkbox" name="isDefault" defaultChecked={a?.isDefault ?? false} />
            حساب افتراضي
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? "جارٍ الحفظ..." : a ? "تحديث" : "إضافة"}</button>
          <button type="button" onClick={onCancel}>إلغاء</button>
        </div>
      </form>
      {result && (
        <div className={`payment-result ${result.success ? "payment-result--success" : "payment-result--error"}`}>
          {result.message}
        </div>
      )}
    </>
  );
}
