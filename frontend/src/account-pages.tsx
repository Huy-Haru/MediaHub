import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
  Mail,
  Palette,
  School,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
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
  const [role, setRole] = useState<"client" | "creator">("client");
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
        <div className="auth-network-tag">
          <span /> Mạng lưới sáng tạo toàn quốc
        </div>
        <h1>
          Kết nối sáng tạo — <span>Bứt phá</span> nội dung truyền thông
        </h1>
        <p>
          MediaHub đồng hành cùng doanh nghiệp tối ưu chi phí sản xuất và trao
          cơ hội dự án thực chiến chuẩn agency cho thế hệ tài năng trẻ.
        </p>
        <div className="auth-audience-grid">
          <article>
            <span className="auth-audience-icon orange"><Building2 /></span>
            <h3>Dành cho Doanh nghiệp</h3>
            <p>Tiết kiệm <b>40-50% chi phí</b> sản xuất truyền thông.</p>
            <small><BadgeCheck /> Bảo chứng nghiệm thu QA 100%</small>
          </article>
          <article>
            <span className="auth-audience-icon violet"><Palette /></span>
            <h3>Dành cho Creator &amp; SV</h3>
            <p>Thực chiến với nhãn hàng lớn &amp; nhận thù lao minh bạch.</p>
            <small><CreditCard /> Thanh toán ký quỹ Escrow an toàn</small>
          </article>
        </div>
        <img
          className="auth-preview"
          src="/assets/project-1.png"
          alt="Đội ngũ sáng tạo đang thực hiện dự án"
        />
        <div className="auth-trust-row">
          <div><strong>500+ Creator đã gia nhập</strong><span>120+ Dự án hoàn thành xuất sắc</span></div>
          <span><ShieldCheck /> Hợp đồng pháp lý minh bạch</span>
        </div>
      </section>
      <section className="auth-card" key={mode}>
        {(mode === "login" || mode === "register") && (
          <div className="auth-tabs">
            <Link className={mode === "login" ? "active" : ""} to="/login">
              <LockKeyhole /> Đăng nhập
            </Link>
            <Link className={mode === "register" ? "active" : ""} to="/register">
              <UserRound /> Đăng ký
            </Link>
          </div>
        )}
        <h2>{title}</h2>
        <p>
          {mode === "forgot"
            ? "Nhập email tài khoản để nhận liên kết khôi phục mật khẩu."
            : "Không gian dành cho những ý tưởng lớn tiếp theo của bạn."}
        </p>
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
                      {
                        audience: role,
                        organization: String(data.get("organization") ?? ""),
                      },
                    )
                  : mode === "forgot"
                    ? await authService.forgot(email)
                    : await authService.reset(password);
            if (result.error) throw result.error;
            if (mode === "login") await auth.refresh();
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
          {mode === "register" && (
            <>
              <div className="auth-role-label">Bạn đăng ký với tư cách nào?</div>
              <div className="auth-role-grid">
                <button
                  type="button"
                  className={role === "client" ? "selected" : ""}
                  onClick={() => setRole("client")}
                >
                  <Building2 /><strong>Doanh nghiệp</strong><small>Tìm giải pháp &amp; nhân tài</small>
                  {role === "client" && <CheckCircle2 className="role-check" />}
                </button>
                <button
                  type="button"
                  className={role === "creator" ? "selected" : ""}
                  onClick={() => setRole("creator")}
                >
                  <Palette /><strong>Creator / Sinh viên</strong><small>Thực chiến dự án có phí</small>
                  {role === "creator" && <CheckCircle2 className="role-check" />}
                </button>
              </div>
              <AuthField name="full_name" label="Họ và tên" icon={<UserRound />} placeholder="Nguyễn Văn A" />
              <AuthField
                name="organization"
                label={role === "client" ? "Tên thương hiệu / Công ty" : "Trường ĐH / Chuyên ngành sáng tạo"}
                icon={role === "client" ? <Building2 /> : <School />}
                placeholder={role === "client" ? "VD: The Coffee House, Glowy Cosmetics..." : "VD: ĐH FPT (Truyền thông số)..."}
                required={false}
              />
            </>
          )}
          {mode !== "reset" && (
            <AuthField name="email" label="Email doanh nghiệp / cá nhân" type="email" icon={<Mail />} placeholder="name@company.com" />
          )}
          {mode !== "forgot" && (
            <AuthField name="password" label="Mật khẩu" type="password" icon={<Lock />} placeholder="Ít nhất 8 ký tự" />
          )}
          {(mode === "register" || mode === "reset") && (
            <AuthField name="confirm" label="Xác nhận mật khẩu" type="password" icon={<Lock />} placeholder="Nhập lại mật khẩu" />
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
        <div className="auth-security"><Shield /> Dữ liệu được mã hóa 256-bit SSL tiêu chuẩn Enterprise</div>
      </section>
    </div>
  );
}
function AuthField({
  name,
  label,
  icon,
  type = "text",
  placeholder,
  required = true,
}: {
  name: string;
  label: string;
  icon: ReactNode;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <div className="auth-field field">
      <label htmlFor={name}>{label}</label>
      <div className="auth-input-wrap">
        <span className="auth-input-icon">{icon}</span>
        <input id={name} name={name} type={password && visible ? "text" : type} placeholder={placeholder} required={required} minLength={password ? 8 : undefined} />
        {password && (
          <button type="button" className="auth-password-toggle" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>
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
