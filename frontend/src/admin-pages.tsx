import { useState } from "react";
import { Plus, Search, Pencil, X } from "lucide-react";
import { useApi } from "./hooks/useApi";
import {
  ActionForm,
  Field,
  Page,
  State,
  Pagination,
  Status,
  money,
} from "./components/ui";
import { adminService } from "./services";
import { date } from "./workspace-pages";

type ResourceField = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  optional?: boolean;
};
const schemas: Record<string, { title: string; fields: ResourceField[] }> = {
  services: {
    title: "Quản lý dịch vụ",
    fields: [
      { name: "name", label: "Tên dịch vụ" },
      { name: "slug", label: "Đường dẫn (ví dụ: video-production)" },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "category", label: "Danh mục" },
      { name: "starting_price", label: "Giá khởi điểm (VNĐ)", type: "number" },
      { name: "estimated_days", label: "Số ngày dự kiến", type: "number" },
      { name: "thumbnail_url", label: "URL ảnh", type: "url", optional: true },
      { name: "active", label: "Hiển thị dịch vụ", type: "checkbox" },
    ],
  },
  employees: {
    title: "Quản lý nhân viên",
    fields: [
      { name: "name", label: "Họ và tên" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Điện thoại", optional: true },
      { name: "position", label: "Vị trí" },
      { name: "department", label: "Bộ phận" },
      {
        name: "skills",
        label: "Kỹ năng (phân cách bằng dấu phẩy)",
        optional: true,
      },
      { name: "joined_at", label: "Ngày tham gia", type: "date" },
      { name: "status", label: "Trạng thái", options: ["ACTIVE", "INACTIVE"] },
    ],
  },
  portfolio: {
    title: "Hồ sơ dự án",
    fields: [
      { name: "title", label: "Tên dự án" },
      { name: "client", label: "Khách hàng" },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "category", label: "Danh mục" },
      { name: "image_url", label: "URL ảnh", type: "url", optional: true },
      { name: "published", label: "Công khai", type: "checkbox" },
      { name: "featured", label: "Dự án nổi bật", type: "checkbox" },
    ],
  },
  testimonials: {
    title: "Quản lý đánh giá",
    fields: [
      { name: "review_id", label: "Mã đánh giá gốc (UUID)" },
      { name: "content", label: "Nội dung", type: "textarea" },
      {
        name: "status",
        label: "Trạng thái",
        options: ["PENDING", "APPROVED", "REJECTED"],
      },
    ],
  },
};
export function AdminEmployees() {
  return <ResourcePage resource="employees" />;
}
export function AdminServices() {
  return <ResourcePage resource="services" />;
}
export function AdminPortfolio() {
  return <ResourcePage resource="portfolio" />;
}
export function AdminTestimonials() {
  return <ResourcePage resource="testimonials" />;
}
function ResourcePage({ resource }: { resource: string }) {
  const schema = schemas[resource],
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState<any | null>(null);
  const query = useApi(
    `/admin/${resource}?page=${page}&search=${encodeURIComponent(search)}`,
  );
  return (
    <Page title={schema.title}>
      <p>Quản lý nội dung và thông tin trên nền tảng MediaHub.</p>
      <div className="toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Tìm kiếm"
            maxLength={100}
            placeholder="Tìm kiếm…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={17} /> Thêm mới
        </button>
      </div>
      {editing && (
        <section className="panel editor-panel">
          <div className="panel-head">
            <h2>{editing.id ? "Chỉnh sửa thông tin" : "Thêm mới"}</h2>
            <button
              className="icon-btn"
              aria-label="Đóng biểu mẫu"
              onClick={() => setEditing(null)}
            >
              <X />
            </button>
          </div>
          <ActionForm
            key={editing.id ?? "new"}
            onSubmit={(data) => {
              const body: Record<string, unknown> = {};
              for (const f of schema.fields)
                body[f.name] =
                  f.type === "checkbox"
                    ? data.has(f.name)
                    : f.type === "number"
                      ? Number(data.get(f.name))
                      : f.name === "skills"
                        ? String(data.get(f.name))
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        : String(data.get(f.name) ?? "");
              if (
                resource === "services" &&
                (!Number.isInteger(body.estimated_days) ||
                  Number(body.estimated_days) < 1)
              )
                throw new Error(
                  "Số ngày dự kiến phải là số nguyên từ 1 trở lên.",
                );
              return adminService.save(resource, editing.id, body);
            }}
            onSuccess={() => {
              setEditing(null);
              query.reload();
            }}
          >
            <div className="form-grid">
              {schema.fields.map((f) =>
                f.type === "checkbox" ? (
                  <label className="checkbox-field" key={f.name}>
                    <input
                      type="checkbox"
                      name={f.name}
                      defaultChecked={editing[f.name] ?? f.name === "active"}
                    />
                    {f.label}
                  </label>
                ) : f.options ? (
                  <label className="field" key={f.name}>
                    {f.label}
                    <select
                      name={f.name}
                      defaultValue={editing[f.name] ?? f.options[0]}
                    >
                      {f.options.map((v) => (
                        <option key={v} value={v}>
                          {
                            (
                              {
                                ACTIVE: "Hoạt động",
                                INACTIVE: "Ngừng hoạt động",
                                PENDING: "Chờ duyệt",
                                APPROVED: "Đã duyệt",
                                REJECTED: "Từ chối",
                              } as Record<string, string>
                            )[v]
                          }
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <Field
                    key={f.name}
                    name={f.name}
                    label={f.label}
                    type={f.type}
                    required={!f.optional}
                    value={
                      Array.isArray(editing[f.name])
                        ? editing[f.name].join(", ")
                        : editing[f.name]
                    }
                  />
                ),
              )}
            </div>
          </ActionForm>
        </section>
      )}
      <State query={query}>
        <div className="resource-grid">
          {query.data?.items.map((row: any) => (
            <article className="panel resource-card" key={row.id}>
              {(row.image_url || row.thumbnail_url) && (
                <img
                  src={row.image_url || row.thumbnail_url}
                  alt={row.title || row.name}
                  loading="lazy"
                />
              )}
              <span className="eyebrow">
                {row.category || row.department || "MEDIAHUB"}
              </span>
              <h2>{row.name || row.title || "Đánh giá khách hàng"}</h2>
              <p>{row.description || row.content || row.position}</p>
              {row.email && <p>{row.email}</p>}
              {row.starting_price !== undefined && (
                <h3>
                  {money(row.starting_price)} <small>/ từ</small>
                </h3>
              )}
              {row.client && <p>Khách hàng: {row.client}</p>}
              <Status
                value={
                  row.status ||
                  (row.active !== undefined
                    ? row.active
                      ? "ACTIVE"
                      : "INACTIVE"
                    : row.published
                      ? "Đã công khai"
                      : "Bản nháp")
                }
              />
              <div className="toolbar">
                <button
                  className="btn btn-ghost"
                  onClick={() => setEditing(row)}
                >
                  <Pencil size={15} /> Chỉnh sửa
                </button>
                <ActionForm
                  label="Xóa"
                  onSubmit={() => {
                    if (
                      !window.confirm(
                        "Xóa mục này? Thao tác không thể hoàn tác.",
                      )
                    )
                      throw new Error("Chưa xóa mục này.");
                    return adminService.remove(resource, row.id);
                  }}
                  onSuccess={query.reload}
                />
              </div>
            </article>
          ))}
        </div>
        {!query.data?.items.length && (
          <div className="empty-state">
            Chưa có dữ liệu phù hợp. Bạn có thể thêm mới hoặc thay đổi từ khóa.
          </div>
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
export function AdminCustomers() {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState("");
  const query = useApi(
    `/admin/customers?page=${page}&search=${encodeURIComponent(search)}`,
  );
  return (
    <Page title="Quản lý khách hàng">
      <p>Thông tin doanh nghiệp và lịch sử hợp tác.</p>
      <div className="toolbar">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Tìm khách hàng"
            placeholder="Tìm tên doanh nghiệp…"
            maxLength={100}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <State query={query}>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Doanh nghiệp</th>
                <th>Email</th>
                <th>Ngày tham gia</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.profiles?.full_name}</b>
                  </td>
                  <td>{c.company_name || "—"}</td>
                  <td>{c.profiles?.email}</td>
                  <td>{date(c.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setSelected(c.id)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!query.data?.items.length && (
            <div className="empty-state">Chưa có khách hàng phù hợp.</div>
          )}
        </div>
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
      {selected && (
        <CustomerDetails
          key={selected}
          id={selected}
          close={() => setSelected("")}
        />
      )}
    </Page>
  );
}
function CustomerDetails({ id, close }: { id: string; close: () => void }) {
  const query = useApi("/admin/customers/" + id);
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Thông tin khách hàng</h2>
        <button className="icon-btn" aria-label="Đóng chi tiết" onClick={close}>
          <X />
        </button>
      </div>
      <State query={query}>
        <h3>{query.data?.customer.profiles?.full_name}</h3>
        <p>
          {query.data?.customer.profiles?.email} ·{" "}
          {query.data?.customer.profiles?.phone || "Chưa có số điện thoại"}
        </p>
        <p>{query.data?.projects.total ?? 0} dự án</p>
        {query.data?.projects.items.map((p: any) => (
          <p key={p.id}>
            {p.title} · <Status value={p.status} />
          </p>
        ))}
      </State>
    </section>
  );
}
export function AdminRevenue() {
  const query = useApi("/admin/revenue"),
    [page, setPage] = useState(1),
    invoices = useApi("/admin/invoices?page=" + page);
  return (
    <Page title="Doanh thu & Thanh toán">
      <p>Theo dõi doanh thu đã thu và các hóa đơn đang chờ thanh toán.</p>
      <State query={query}>
        <div className="kpi-grid">
          {[
            ["Tổng doanh thu", "total_revenue"],
            ["Tháng hiện tại", "monthly_revenue"],
            ["Năm hiện tại", "yearly_revenue"],
            ["Chờ thanh toán", "pending_payment"],
          ].map(([label, key]) => (
            <div className="kpi" key={key}>
              <div>
                <small>{label}</small>
                <b>{money(query.data?.[key])}</b>
              </div>
            </div>
          ))}
        </div>
        <div className="admin-grid">
          <section className="panel">
            <h2>Doanh thu theo tháng</h2>
            <div className="revenue-list">
              {query.data?.by_month.map((m: any) => (
                <div key={m.label}>
                  <span>{m.label}</span>
                  <meter
                    min={0}
                    max={Math.max(
                      1,
                      ...query.data.by_month.map((x: any) => Number(x.value)),
                    )}
                    value={Number(m.value)}
                    aria-label={`Doanh thu ${m.label}`}
                  />
                  <b>{money(m.value)}</b>
                </div>
              ))}
            </div>
            {!query.data?.by_month.length && <p>Chưa ghi nhận doanh thu.</p>}
          </section>
          <section className="panel">
            <h2>Theo dịch vụ</h2>
            {query.data?.by_service.map((s: any) => (
              <div className="panel-head" key={s.label}>
                <p>{s.label}</p>
                <b>{money(s.value)}</b>
              </div>
            ))}
            {!query.data?.by_service.length && <p>Chưa có dữ liệu dịch vụ.</p>}
          </section>
        </div>
      </State>
      <h2>Danh sách hóa đơn</h2>
      <State query={invoices}>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Số tiền</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {invoices.data?.items.map((i: any) => (
                <tr key={i.id}>
                  <td>{i.invoice_number}</td>
                  <td>{money(i.amount)}</td>
                  <td>{date(i.issued_at)}</td>
                  <td>
                    <Status value={i.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!invoices.data?.items.length && (
            <div className="empty-state">Chưa có hóa đơn.</div>
          )}
        </div>
        <Pagination
          page={page}
          total={invoices.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
    </Page>
  );
}
