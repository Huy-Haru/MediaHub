import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles, LockKeyhole } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { authService } from "./services";
import { patch } from "./services/api";
import { ActionForm, Field, Page, State, Pagination } from "./components/ui";
import { useApi } from "./hooks/useApi";

export function Login() {
  return <AuthScreen mode="login" />;
}
export function Register() {
  return <AuthScreen mode="register" />;
}
export function ForgotPassword() {
  return <AuthScreen mode="forgot" />;
}
export function ResetPassword() {
  return <AuthScreen mode="reset" />;
}
function AuthScreen({
  mode,
}: {
  mode: "login" | "register" | "forgot" | "reset";
}) {
  const auth = useAuth();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const title = {
    login: "Chào mừng trở lại!",
    register: "Bắt đầu cùng MediaHub",
    forgot: "Quên mật khẩu?",
    reset: "Tạo mật khẩu mới",
  }[mode];
  const destination = (location.state as { from?: string } | null)?.from;
  const prefix = auth.role === "ADMIN" ? "/admin/" : "/customer/";
  if (auth.role && (mode === "login" || mode === "register"))
    return (
      <Navigate
        to={
          destination?.startsWith(prefix) ? destination : prefix + "dashboard"
        }
        replace
      />
    );
  return (
    <div className="auth-page">
      <section className="auth-art">
        <span className="eyebrow">YOUR NEXT CREATIVE CHAPTER</span>
        <h1>
          Kết nối sáng tạo.
          <br />
          <span>Kiến tạo dấu ấn.</span>
        </h1>
        <p>
          Từ ý tưởng đầu tiên đến sản phẩm hoàn chỉnh, MediaHub đồng hành cùng
          bạn trên mỗi bước đi.
        </p>
        <div className="auth-benefit">
          <Sparkles />
          <div>
            <b>Nội dung xứng tầm thương hiệu</b>
            <p>Kết nối đội ngũ sáng tạo phù hợp với dự án.</p>
          </div>
        </div>
        <div className="auth-benefit">
          <ShieldCheck />
          <div>
            <b>An tâm trong từng bước</b>
            <p>
              Quy trình rõ ràng, theo dõi tiến độ và duyệt sản phẩm tại một nơi.
            </p>
          </div>
        </div>
        <img
          className="auth-preview"
          src="/assets/project-2.png"
          alt="Sản phẩm sáng tạo của MediaHub"
        />
      </section>
      <section className="auth-card" key={mode}>
        <span className="auth-symbol">
          <LockKeyhole />
        </span>
        <h2>{title}</h2>
        <p>
          {mode === "forgot"
            ? "Nhập email tài khoản để nhận liên kết khôi phục mật khẩu."
            : "Không gian dành cho những ý tưởng lớn tiếp theo của bạn."}
        </p>
        {(mode === "login" || mode === "register") && (
          <div className="auth-tabs">
            <Link className={mode === "login" ? "active" : ""} to="/login">
              Đăng nhập
            </Link>
            <Link
              className={mode === "register" ? "active" : ""}
              to="/register"
            >
              Đăng ký
            </Link>
          </div>
        )}
        <ActionForm
          showSuccess={false}
          label={
            {
              login: "Đăng nhập",
              register: "Tạo tài khoản",
              forgot: "Gửi liên kết khôi phục",
              reset: "Cập nhật mật khẩu",
            }[mode]
          }
          onSubmit={async (data) => {
            setMessage("");
            const email = String(data.get("email") ?? ""),
              password = String(data.get("password") ?? "");
            if (
              (mode === "register" || mode === "reset") &&
              password !== data.get("confirm")
            )
              throw new Error("Mật khẩu xác nhận chưa khớp.");
            const result =
              mode === "login"
                ? await authService.login(email, password)
                : mode === "register"
                  ? await authService.register(
                      email,
                      password,
                      String(data.get("full_name")),
                    )
                  : mode === "forgot"
                    ? await authService.forgot(email)
                    : await authService.reset(password);
            if (result.error) throw result.error;
            setMessage(
              mode === "forgot"
                ? "Nếu email đã được đăng ký, bạn sẽ nhận được liên kết khôi phục. Vui lòng kiểm tra cả thư rác."
                : mode === "register"
                  ? "Tài khoản đã được tạo. Vui lòng kiểm tra email để xác nhận đăng ký."
                  : mode === "reset"
                    ? "Đã cập nhật mật khẩu. Bạn có thể tiếp tục đăng nhập."
                    : "Đăng nhập thành công. Đang tải tài khoản…",
            );
          }}
        >
          {mode === "register" && <Field name="full_name" label="Họ và tên" />}
          {mode !== "reset" && (
            <Field name="email" label="Địa chỉ email" type="email" />
          )}
          {mode !== "forgot" && (
            <Field name="password" label="Mật khẩu" type="password" />
          )}
          {(mode === "register" || mode === "reset") && (
            <Field name="confirm" label="Xác nhận mật khẩu" type="password" />
          )}
          {mode === "login" && (
            <p className="auth-foot">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </p>
          )}
        </ActionForm>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {auth.error && (
          <p className="error" role="alert">
            {auth.error}
            <button className="btn btn-ghost" onClick={auth.refresh}>
              Thử tải lại tài khoản
            </button>
          </p>
        )}
        <p className="auth-foot">
          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login"
              ? "Chưa có tài khoản? Đăng ký ngay"
              : "Trở về đăng nhập"}{" "}
            <ArrowRight size={13} />
          </Link>
        </p>
      </section>
    </div>
  );
}
export function Profile() {
  const auth = useAuth();
  return (
    <Page title="Hồ sơ người dùng & Bảo mật">
      <p>Quản lý thông tin cá nhân và bảo vệ tài khoản của bạn.</p>
      <div className="split">
        <section className="panel">
          <h2>Thông tin tài khoản</h2>
          <p>{auth.profile?.email}</p>
          <ActionForm
            onSubmit={async (data) => {
              await patch("/auth/me", {
                full_name: String(data.get("full_name")),
                phone: String(data.get("phone")),
              });
              await auth.refresh();
            }}
          >
            <Field
              name="full_name"
              label="Họ và tên"
              value={auth.profile?.full_name}
            />
            <Field
              name="phone"
              label="Số điện thoại"
              type="tel"
              required={false}
              value={(auth.profile as { phone?: string } | null)?.phone}
            />
          </ActionForm>
        </section>
        <section className="panel">
          <h2>Đổi mật khẩu</h2>
          <p>Sử dụng mật khẩu có ít nhất 8 ký tự.</p>
          <ActionForm
            label="Đổi mật khẩu"
            onSubmit={async (data) => {
              if (data.get("password") !== data.get("confirm"))
                throw new Error("Mật khẩu xác nhận chưa khớp.");
              const result = await authService.reset(
                String(data.get("password")),
              );
              if (result.error) throw result.error;
            }}
          >
            <Field name="password" label="Mật khẩu mới" type="password" />
            <Field name="confirm" label="Xác nhận mật khẩu" type="password" />
          </ActionForm>
        </section>
      </div>
    </Page>
  );
}
export function Notifications() {
  const [page, setPage] = useState(1);
  const query = useApi("/notifications?page=" + page);
  return (
    <Page title="Thông báo">
      <p>Cập nhật mới nhất về dự án và tài khoản của bạn.</p>
      <State query={query}>
        <div className="notification-list">
          {query.data?.items.map((n: any) => (
            <article className="panel" key={n.id}>
              <span className="eyebrow">{n.read_at ? "ĐÃ ĐỌC" : "MỚI"}</span>
              <h2>{n.title}</h2>
              <p>{n.message}</p>
              <small>{new Date(n.created_at).toLocaleString("vi-VN")}</small>
              {!n.read_at && (
                <ActionForm
                  label="Đánh dấu đã đọc"
                  onSubmit={() => patch("/notifications/" + n.id, {})}
                  onSuccess={query.reload}
                />
              )}
            </article>
          ))}
        </div>
        {!query.data?.items.length && (
          <div className="empty-state">Bạn chưa có thông báo mới.</div>
        )}
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
    </Page>
  );
}
