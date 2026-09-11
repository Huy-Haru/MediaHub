import { useRef, useState, type ReactNode, type FormEvent } from "react";
import { useApi } from "../hooks/useApi";
export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value ?? 0,
  );
export const labels: Record<string, string> = {
  DRAFT: "Bản nháp",
  SUBMITTED: "Đã gửi",
  REVIEWING: "Đang xem xét",
  QUOTATION_SENT: "Đã gửi báo giá",
  QUOTATION_ACCEPTED: "Đã nhận báo giá",
  IN_PROGRESS: "Đang thực hiện",
  WAITING_REVIEW: "Chờ duyệt",
  REVISION: "Đang chỉnh sửa",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  SENT: "Đã gửi",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Từ chối",
  EXPIRED: "Hết hạn",
  PENDING: "Đang chờ",
  PAID: "Đã thanh toán",
  APPROVED: "Đã duyệt",
  PENDING_APPROVAL: "Chờ duyệt",
  REVISION_REQUIRED: "Cần chỉnh sửa",
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngừng hoạt động",
  RESOLVED: "Đã giải quyết",
};
export const Status = ({ value }: { value: string }) => (
  <span className="status">{labels[value] ?? value}</span>
);
export function State({
  query,
  children,
}: {
  query: ReturnType<typeof useApi>;
  children: ReactNode;
}) {
  if (query.loading)
    return (
      <div className="panel skeleton" role="status">
        Đang tải dữ liệu…
      </div>
    );
  if (query.error)
    return (
      <div className="panel error" role="alert">
        {query.error}
        <button className="btn btn-ghost" onClick={query.reload}>
          Thử lại
        </button>
      </div>
    );
  return <>{children}</>;
}
export function Page({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="dash-page">
      <div className="dash-header">
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
export function ActionForm({
  onSubmit,
  children,
  label = "Lưu",
  onSuccess,
  showSubmit = true,
  showSuccess = true,
}: {
  onSubmit: (data: FormData) => Promise<unknown>;
  children?: ReactNode;
  label?: string;
  onSuccess?: () => void;
  showSubmit?: boolean;
  showSuccess?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  const lock = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    const data = new FormData(e.currentTarget);
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      await onSubmit(data);
      setSuccess(true);
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        {children}
        {showSubmit && (
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Đang xử lý…" : label}
          </button>
        )}
      </fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && showSuccess && <p role="status">Thao tác thành công.</p>}
    </form>
  );
}
export function Field({
  name,
  label,
  type = "text",
  value,
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          defaultValue={value}
          required={required}
          maxLength={5000}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          min={type === "number" ? 0 : undefined}
          maxLength={type === "password" ? undefined : 5000}
          minLength={type === "password" ? 8 : undefined}
          step={type === "number" ? "0.01" : undefined}
        />
      )}
    </div>
  );
}
export function Pagination({
  page,
  total,
  limit = 20,
  onChange,
}: {
  page: number;
  total: number;
  limit?: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="toolbar">
      <button
        className="btn btn-ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </button>
      <span>
        Trang {page} · {total ?? 0} kết quả
      </span>
      <button
        className="btn btn-ghost"
        disabled={page * limit >= (total ?? 0)}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </button>
    </div>
  );
}
