import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { State, Pagination, Page } from "../../components/ui";
type Collection<T> = { items: T[]; total: number };
type Setting = { key: string; title: string; content: string; image: string };
export function ContentPage({ name, title }: { name: string; title: string }) {
  const query = useApi<Setting | null>(`/public/pages/${name}`);
  return (
    <section className="page section">
      <State query={query}>
        <h1>{query.data?.title ?? title}</h1>
        {query.data ? (
          <>
            {query.data.image && (
              <img
                className="catalog-image"
                src={query.data.image}
                alt={query.data.title}
              />
            )}
            <article className="preserve-lines">{query.data.content}</article>
          </>
        ) : (
          <p>
            Nội dung chưa được công bố. Vui lòng liên hệ MediaHub để được hỗ
            trợ.
          </p>
        )}
        <Link className="btn btn-primary" to="/contact">
          Liên hệ MediaHub
        </Link>
      </State>
    </section>
  );
}
type Partner = {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  industry: string;
};
export function PartnersPage({ embedded = false }: { embedded?: boolean }) {
  const [page, setPage] = useState(1);
  const query = useApi<Collection<Partner>>(`/public/partners?page=${page}`);
  if (embedded && !query.loading && !query.error && !query.data?.items.length)
    return null;
  return (
    <section className={embedded ? "section" : "page section"}>
      {embedded ? <h2>Đối tác MediaHub</h2> : <h1>Đối tác MediaHub</h1>}
      <State query={query}>
        <div className="service-grid">
          {query.data?.items.map((partner) => (
            <article className="service-card" key={partner.id}>
              {partner.logo && (
                <img
                  className="partner-logo"
                  src={partner.logo}
                  alt={partner.name}
                  loading="lazy"
                />
              )}
              <h2>{partner.name}</h2>
              <p>{partner.industry}</p>
              <p>{partner.description}</p>
              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website đối tác
                </a>
              )}
            </article>
          ))}
        </div>
        {!query.data?.items.length && <p>Chưa có đối tác được công bố.</p>}
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
    </section>
  );
}
type Process = {
  id: string;
  title: string;
  description: string;
  step: number;
  image: string;
};
export function ProcessPage({ embedded = false }: { embedded?: boolean }) {
  const [page, setPage] = useState(1);
  const query = useApi<Collection<Process>>(`/public/process?page=${page}`);
  return (
    <section className={embedded ? "section" : "page section"}>
      {embedded ? <h2>Quy trình thực hiện</h2> : <h1>Quy trình thực hiện</h1>}
      <State query={query}>
        <div className="steps">
          {query.data?.items.map((step) => (
            <article className="step" key={step.id}>
              <span>{String(step.step).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {step.image && (
                <img
                  className="catalog-image"
                  src={step.image}
                  alt={step.title}
                  loading="lazy"
                />
              )}
            </article>
          ))}
        </div>
        {!query.data?.items.length && (
          <p>
            Liên hệ MediaHub để trao đổi quy trình phù hợp với dự án của bạn.
          </p>
        )}
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
    </section>
  );
}
type Audit = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
};
export function ActivityLogs() {
  const [page, setPage] = useState(1);
  const query = useApi<Collection<Audit>>(`/admin/activity-logs?page=${page}`);
  return (
    <Page title="Nhật ký hoạt động">
      <State query={query}>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Người thực hiện</th>
                <th>Thao tác</th>
                <th>Đối tượng</th>
                <th>Mã</th>
                <th>Thời điểm</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.actor_id ?? "Hệ thống / API"}</td>
                  <td>{row.action}</td>
                  <td>{row.entity}</td>
                  <td>{row.entity_id}</td>
                  <td>{new Date(row.created_at).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!query.data?.items.length && <p>Chưa có hoạt động.</p>}
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
    </Page>
  );
}
export function Metadata({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  useEffect(() => {
    document.title = `${title} | MediaHub`;
    const values: Record<string, string> = {
      description:
        description ??
        "MediaHub — dịch vụ truyền thông được quản lý từ brief đến bàn giao.",
      "og:title": `${title} | MediaHub`,
      "og:description": description ?? "Dịch vụ truyền thông MediaHub",
      "og:url": window.location.origin + window.location.pathname,
      robots:
        window.location.pathname.startsWith("/admin") ||
        window.location.pathname.startsWith("/customer")
          ? "noindex,nofollow"
          : "index,follow",
    };
    for (const [key, content] of Object.entries(values)) {
      const attribute = key.startsWith("og:") ? "property" : "name";
      let node = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${key}"]`,
      );
      if (!node) {
        node = document.createElement("meta");
        node.setAttribute(attribute, key);
        document.head.append(node);
      }
      node.content = content;
    }
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = window.location.origin + window.location.pathname;
  }, [title, description]);
  return null;
}
export function RouteMetadata() {
  const { pathname } = useLocation();
  const titles: Record<string, string> = {
    "/": "Dịch vụ truyền thông",
    "/about": "Về MediaHub",
    "/services": "Dịch vụ",
    "/portfolio": "Portfolio",
    "/projects": "Portfolio",
    "/partners": "Đối tác",
    "/process": "Quy trình",
    "/contact": "Liên hệ",
    "/request-project": "Bắt đầu dự án",
    "/login": "Đăng nhập",
    "/register": "Đăng ký",
    "/forgot-password": "Quên mật khẩu",
    "/reset-password": "Đặt lại mật khẩu",
    "/privacy": "Chính sách bảo mật",
    "/terms": "Điều khoản sử dụng",
  };
  return (
    <Metadata
      key={pathname}
      title={
        titles[pathname] ??
        (pathname.startsWith("/admin")
          ? "Quản trị"
          : pathname.startsWith("/customer")
            ? "Không gian khách hàng"
            : "MediaHub")
      }
    />
  );
}
