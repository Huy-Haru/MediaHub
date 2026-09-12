import { useParams, Link } from "react-router-dom";
import { useApi } from "./hooks/useApi";
import { Page, State, Status, ActionForm, money } from "./components/ui";
import { post } from "./services/api";
type Quote = {
  id: string;
  project_id: string;
  quotation_number: string;
  status: string;
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax: number;
  total: number;
  notes: string;
  created_at: string;
  valid_until: string;
  projects: { title: string };
  quotation_items: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
};
export function AdminQuotation() {
  const { id } = useParams();
  const query = useApi<Quote>(`/admin/quotations/${id}`);
  const q = query.data;
  return (
    <Page title="Chi tiết báo giá">
      <State query={query}>
        {q && (
          <article className="panel">
            <h2>{q.quotation_number}</h2>
            <p>{q.projects.title}</p>
            <Status value={q.status} />
            <p>
              Ngày lập: {new Date(q.created_at).toLocaleDateString("vi-VN")} ·
              Hiệu lực: {q.valid_until}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Hạng mục</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {q.quotation_items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unit_price)}</td>
                      <td>{money(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Tạm tính: {money(q.subtotal)}</p>
            <p>Giảm giá: {money(q.discount)}</p>
            <p>
              Thuế ({q.tax_rate}%): {money(q.tax)}
            </p>
            <h3>Tổng cộng: {money(q.total)}</h3>
            <p className="preserve-lines">{q.notes}</p>
            <Link
              className="btn btn-ghost"
              to={`/admin/projects/${q.project_id}`}
            >
              Mở dự án / Chỉnh sửa bản nháp
            </Link>
            {q.status === "DRAFT" && (
              <ActionForm
                label="Gửi báo giá"
                onSubmit={() => {
                  if (!window.confirm("Gửi báo giá này cho khách hàng?"))
                    throw new Error("Chưa gửi báo giá.");
                  return post(`/admin/quotations/${id}/send`);
                }}
                onSuccess={query.reload}
              />
            )}{" "}
            {["DRAFT", "SENT"].includes(q.status) && (
              <ActionForm
                label="Hủy báo giá"
                onSubmit={() => {
                  if (
                    !window.confirm(
                      q.status === "SENT"
                        ? "Hủy báo giá đã gửi sẽ hủy dự án. Tiếp tục?"
                        : "Hủy bản nháp báo giá?",
                    )
                  )
                    throw new Error("Chưa hủy báo giá.");
                  return post(`/admin/quotations/${id}/cancel`);
                }}
                onSuccess={query.reload}
              />
            )}
          </article>
        )}
      </State>
    </Page>
  );
}
