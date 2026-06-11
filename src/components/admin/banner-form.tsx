"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBanner } from "@/lib/admin-actions";
import type { Banner } from "@prisma/client";

type ImageUploadProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  recommendedSize: string;
  required?: boolean;
};

function ImageUpload({ name, label, defaultValue, recommendedSize, required }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "url">(!defaultValue ? "upload" : "url");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const src = preview || defaultValue || null;

  return (
    <div className="banner-upload-field">
      <div className="banner-upload-field__head">
        <label className="banner-upload-field__label">
          {label}
          {required ? <span className="banner-upload-field__required"> *</span> : null}
        </label>
        <span className="banner-upload-field__size-hint">{recommendedSize}</span>
      </div>

      <div className="banner-upload-field__tabs">
        <button
          type="button"
          className={`banner-upload-field__tab${mode === "upload" ? " active" : ""}`}
          onClick={() => setMode("upload")}
        >
          رفع صورة
        </button>
        <button
          type="button"
          className={`banner-upload-field__tab${mode === "url" ? " active" : ""}`}
          onClick={() => {
            setMode("url");
            setPreview(null);
            setFileName(null);
          }}
        >
          رابط URL
        </button>
      </div>

      {mode === "upload" ? (
        <div
          className="banner-upload-field__dropzone"
          onClick={() => inputRef.current?.click()}
        >
          {src ? (
            <div className="banner-upload-field__preview-wrap">
              <img src={src} alt="" className="banner-upload-field__preview" />
              {fileName ? (
                <span className="banner-upload-field__filename">{fileName}</span>
              ) : null}
              <button
                type="button"
                className="banner-upload-field__remove"
                onClick={handleRemove}
              >
                إزالة
              </button>
            </div>
          ) : (
            <div className="banner-upload-field__placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>اختر صورة أو اسحبها هنا</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      ) : (
        <input
          type="text"
          name={name}
          className="banner-upload-field__url-input"
          defaultValue={defaultValue ?? ""}
          placeholder="https://..."
          dir="ltr"
        />
      )}
    </div>
  );
}

type BannerFormProps = {
  editBanner?: Banner | null;
  nextSortOrder?: number;
};

export function BannerForm({ editBanner, nextSortOrder = 0 }: BannerFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    if (submitting) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const result = await saveBanner(formData);
      if (result && "success" in result) {
        if (result.success) {
          const param = result.isEdit ? "updated" : "added";
          setSuccess(result.message || (result.isEdit ? "تم تحديث البنر بنجاح" : "تمت إضافة البنر بنجاح"));
          setSubmitting(false);
          setTimeout(() => {
            router.push(`/admin/banners?success=${param}`);
            router.refresh();
          }, 1500);
        } else {
          setError(result.message || "حدث خطأ غير متوقع.");
          setSubmitting(false);
        }
      }
    } catch (err) {
      console.error("[BannerForm] submit error:", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("413") || msg.includes("Body exceeded") || msg.includes("too large")) {
        setError("حجم الصورة كبير جداً. الحد الأقصى 3 ميغابايت.");
      } else if (msg.includes("timeout") || msg.includes("Timeout")) {
        setError("انتهت مهلة الحفظ. تحقق من حجم الصورة وحاول مرة أخرى.");
      } else {
        setError("تعذر الاتصال بالخادم. تحقق من حجم الصورة وحاول مرة أخرى.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="admin-form-box banner-form">
      <input name="id" type="hidden" value={editBanner?.id ?? ""} />
      <input name="existingImageUrl" type="hidden" value={editBanner?.imageUrl ?? ""} />
      <input name="existingDesktopImageUrl" type="hidden" value={editBanner?.desktopImageUrl ?? ""} />
      <input name="existingMobileImageUrl" type="hidden" value={editBanner?.mobileImageUrl ?? ""} />

      <div className="banner-form__header">
        <h3>{editBanner ? "تعديل Banner" : "إضافة Banner جديد"}</h3>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {success ? <div className="form-success">{success}</div> : null}

      <div className="banner-form__section">
        <h4 className="banner-form__section-title">معلومات أساسية</h4>
        <div className="banner-form__row">
          <label className="banner-form__field">
            <span className="banner-form__field-label">العنوان</span>
            <input name="title" defaultValue={editBanner?.title ?? ""} placeholder="مثل: عروض الصيف" />
          </label>
          <label className="banner-form__field">
            <span className="banner-form__field-label">العنوان الفرعي</span>
            <input name="subtitle" defaultValue={editBanner?.subtitle ?? ""} placeholder="مثل: خصم يصل إلى 50%" />
          </label>
        </div>
      </div>

      <div className="banner-form__section">
        <h4 className="banner-form__section-title">الصور</h4>
        <div className="banner-form__guidance">
          <strong>إرشادات الصور:</strong>
          <ul>
            <li>الصيغ المدعومة: <strong>WebP</strong>، <strong>JPG</strong>، <strong>PNG</strong></li>
            <li>الحد الأقصى للحجم: <strong>3 ميغابايت</strong></li>
            <li>حافظ على العناصر المهمة في وسط الصورة، وتجنب الحواف</li>
          </ul>
        </div>
        <ImageUpload
          name="imageUrl"
          label="الصورة الرئيسية"
          recommendedSize="1600 × 500 بكسل"
          defaultValue={editBanner?.imageUrl}
          required
        />
        <div className="banner-form__row">
          <ImageUpload
            name="desktopImageUrl"
            label="صورة سطح المكتب"
            recommendedSize="1600 × 500 بكسل"
            defaultValue={editBanner?.desktopImageUrl}
          />
          <ImageUpload
            name="mobileImageUrl"
            label="صورة الجوال"
            recommendedSize="900 × 900 / 900 × 600 بكسل"
            defaultValue={editBanner?.mobileImageUrl}
          />
        </div>
      </div>

      <div className="banner-form__section">
        <h4 className="banner-form__section-title">الرابط والزر</h4>
        <div className="banner-form__row">
          <label className="banner-form__field">
            <span className="banner-form__field-label">رابط النقرة</span>
            <input name="linkUrl" defaultValue={editBanner?.linkUrl ?? ""} placeholder="https://..." dir="ltr" />
          </label>
          <label className="banner-form__field">
            <span className="banner-form__field-label">نص الزر</span>
            <input name="buttonText" defaultValue={editBanner?.buttonText ?? ""} placeholder="مثل: تسوق الآن" />
          </label>
        </div>
      </div>

      <div className="banner-form__section">
        <h4 className="banner-form__section-title">الحالة والترتيب</h4>
        <div className="banner-form__row">
          <label className="banner-form__field">
            <span className="banner-form__field-label">الترتيب</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={editBanner?.sortOrder ?? nextSortOrder}
            />
            <span className="banner-form__field-hint">الترتيب يحدد تسلسل ظهور البنرات في السلايدر</span>
          </label>
          <label className="banner-form__field banner-form__field--checkbox">
            <input name="isActive" type="checkbox" defaultChecked={editBanner?.isActive ?? true} />
            <span>فعال</span>
          </label>
        </div>
      </div>

      <div className="banner-form__actions">
        <button type="submit" className="banner-form__submit" disabled={submitting}>
          {submitting ? "جاري الحفظ..." : editBanner ? "حفظ التغييرات" : "إضافة Banner"}
        </button>
        {editBanner ? (
          <a href="/admin/banners" className="banner-form__cancel">إلغاء</a>
        ) : null}
      </div>
    </form>
  );
}
