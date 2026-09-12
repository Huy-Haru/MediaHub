import { Link } from "react-router-dom";
export function ErrorPage({
  kind,
}: {
  kind: "403" | "500" | "network" | "session";
}) {
  const content = {
    "403": [
      "Không có quyền truy cập",
      "Tài khoản của bạn không có quyền mở trang này.",
    ],
    "500": [
      "Không thể xử lý yêu cầu",
      "Vui lòng thử lại sau hoặc liên hệ MediaHub.",
    ],
    network: [
      "Không thể kết nối",
      "Kiểm tra kết nối mạng và thử tải lại trang.",
    ],
    session: [
      "Phiên đăng nhập đã hết hạn",
      "Vui lòng đăng nhập lại để tiếp tục.",
    ],
  }[kind];
  return (
    <main className="not-found" role="alert">
      <h1>{content[0]}</h1>
      <p>{content[1]}</p>
      <Link
        className="btn btn-primary"
        to={kind === "session" ? "/login" : "/"}
      >
        {kind === "session" ? "Đăng nhập" : "Về trang chủ"}
      </Link>
    </main>
  );
}
