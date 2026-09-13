import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../contexts/AuthContext";
import {
  ActionForm,
  Field,
  State,
  Page,
  Pagination,
  Status,
  money,
} from "../../components/ui";
import { post, patch } from "../../services/api";
type Collection<T> = { items: T[]; total: number };
type Invoice = {
  id: string;
  invoice_number: string;
  project_id: string;
  amount: number;
  status: string;
  issued_at: string;
  paid_at: string | null;
  projects: { title: string };
};
type Quote = {
  id: string;
  project_id: string;
  status: string;
  total: number;
  valid_until: string;
  created_at: string;
  projects: { title: string };
};
export function CustomerInvoices({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(1);
  const query = useApi<Collection<Invoice>>(
    `${admin ? "/admin" : "/customer"}/invoices?page=${page}`,
  );
  return (
    <Page title="Hóa đơn">
      <State query={query}>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Dự án</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày lập</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      to={`${admin ? "/admin" : "/customer"}/invoices/${row.id}`}
                    >
                      {row.invoice_number}
                    </Link>
                  </td>
                  <td>{row.projects.title}</td>
                  <td>{money(row.amount)}</td>
                  <td>
                    <Status value={row.status} />
                  </td>
                  <td>{new Date(row.issued_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!query.data?.items.length && <p>Chưa có hóa đơn.</p>}
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
    </Page>
  );
}
export function CustomerInvoice({ admin = false }: { admin?: boolean }) {
  const { id } = useParams();
  const query = useApi<Invoice>(
    `${admin ? "/admin" : "/customer"}/invoices/${id}`,
  );
  const invoice = query.data;
  return (
    <Page title="Chi tiết hóa đơn">
      <State query={query}>
        {invoice && (
          <article className="panel invoice-print">
            <h2>{invoice.invoice_number}</h2>
            <p>{invoice.projects.title}</p>
            <p>
              Ngày lập:{" "}
              {new Date(invoice.issued_at).toLocaleDateString("vi-VN")}
            </p>
            <Status value={invoice.status} />
            <h3>{money(invoice.amount)}</h3>
            {admin && invoice.status === "DRAFT" && (
              <ActionForm
                label="Phát hành hóa đơn"
                onSubmit={(data) =>
                  post(
                    "/admin/projects/" + invoice.project_id + "/issue-invoice",
                    { due_date: data.get("due_date") },
                  )
                }
                onSuccess={query.reload}
              >
                <Field name="due_date" label="Hạn thanh toán" type="date" />
              </ActionForm>
            )}
            {invoice.paid_at && (
              <p>
                Đã ghi nhận thanh toán:{" "}
                {new Date(invoice.paid_at).toLocaleDateString("vi-VN")}
              </p>
            )}
            {invoice.status === "PENDING" && (
              <p>
                Vui lòng liên hệ MediaHub để xác nhận hướng dẫn và thông tin
                thanh toán.
              </p>
            )}
            <button
              className="btn btn-primary no-print"
              onClick={() => window.print()}
            >
              In / Lưu PDF
            </button>
            <Link
              className="btn btn-ghost no-print"
              to={`${admin ? "/admin" : "/customer"}/projects/${invoice.project_id}/messages`}
            >
              Liên hệ về dự án
            </Link>
          </article>
        )}
      </State>
    </Page>
  );
}
export function CustomerQuotations({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(1);
  const query = useApi<Collection<Quote>>(
    `${admin ? "/admin" : "/customer"}/quotations?page=${page}`,
  );
  return (
    <Page title="Báo giá">
      <State query={query}>
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dự án</th>
                <th>Tổng cộng</th>
                <th>Trạng thái</th>
                <th>Hiệu lực đến</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((row) => (
                <tr key={row.id}>
                  <td>{row.projects.title}</td>
                  <td>{money(row.total)}</td>
                  <td>
                    <Status value={row.status} />
                  </td>
                  <td>{row.valid_until}</td>
                  <td>
                    <Link
                      to={
                        admin
                          ? `/admin/quotations/${row.id}`
                          : `/customer/projects/${row.project_id}/quotation`
                      }
                    >
                      Xem báo giá
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!query.data?.items.length && <p>Chưa có báo giá.</p>}
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
    </Page>
  );
}
type Message = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
};
export function ProjectMessages({ projectId }: { projectId?: string }) {
  const { id } = useParams();
  const pid = projectId ?? id;
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const query = useApi<Collection<Message>>(
    `/projects/${pid}/messages?page=${page}`,
  );
  return (
    <section className="panel">
      <h2>Trao đổi dự án</h2>
      <State query={query}>
        {query.data?.items.map((row) => (
          <article className="message" key={row.id}>
            <b>
              {row.sender_id === auth.profile?.id ? "Bạn" : "Thành viên dự án"}
            </b>
            <time dateTime={row.created_at}>
              {" "}
              · {new Date(row.created_at).toLocaleString("vi-VN")}
            </time>
            <p className="preserve-lines">{row.message}</p>
          </article>
        ))}
        {!query.data?.items.length && <p>Chưa có trao đổi.</p>}
        <Pagination
          page={page}
          total={query.data?.total ?? 0}
          onChange={setPage}
        />
      </State>
      <ActionForm
        label="Gửi tin nhắn"
        onSubmit={(data) =>
          post(`/projects/${pid}/messages`, { message: data.get("message") })
        }
        onSuccess={query.reload}
      >
        <Field name="message" label="Nội dung trao đổi" type="textarea" />
      </ActionForm>
    </section>
  );
}
type Milestone = {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: string;
};
export function ProjectMilestones({
  projectId,
  admin = false,
}: {
  projectId: string;
  admin?: boolean;
}) {
  const query = useApi<Collection<Milestone>>(
    `/projects/${projectId}/milestones`,
  );
  return (
    <section className="panel">
      <h2>Mốc tiến độ</h2>
      <State query={query}>
        {query.data?.items.map((row) => (
          <article className="message" key={row.id}>
            <h3>{row.title}</h3>
            <Status value={row.status} />
            <p>{row.description}</p>
            {row.due_date && <p>{row.due_date}</p>}
            {admin && (
              <ActionForm
                onSubmit={(data) =>
                  patch(`/projects/${projectId}/milestones/${row.id}`, {
                    status: data.get("status"),
                  })
                }
                onSuccess={query.reload}
              >
                <label className="field">
                  Trạng thái
                  <select name="status" defaultValue={row.status}>
                    {["PENDING", "IN_PROGRESS", "COMPLETED"].map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </ActionForm>
            )}
          </article>
        ))}
        {!query.data?.items.length && <p>Chưa có mốc tiến độ.</p>}
      </State>
      {admin && (
        <ActionForm
          label="Thêm mốc tiến độ"
          onSubmit={(data) =>
            post(`/projects/${projectId}/milestones`, {
              title: data.get("milestone_title"),
              description: data.get("milestone_description"),
              due_date: data.get("due_date") || null,
            })
          }
          onSuccess={query.reload}
        >
          <Field name="milestone_title" label="Tên mốc" />
          <Field name="milestone_description" label="Mô tả" required={false} />
          <Field
            name="due_date"
            label="Hạn hoàn thành"
            type="date"
            required={false}
          />
        </ActionForm>
      )}
    </section>
  );
}
