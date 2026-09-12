import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="not-found" role="alert">
          <h1>Không thể hiển thị trang</h1>
          <p>Vui lòng tải lại trang để thử lại.</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Tải lại
          </button>
          <a href="/">Về trang chủ</a>
        </main>
      );
    return this.props.children;
  }
}
