import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, Search, PlayCircle } from "lucide-react";
import { useApi } from "./hooks/useApi";
import { State, Pagination } from "./components/ui";
export function Home() {
  const catalog = useApi("/public/services?limit=100"),
    portfolio = useApi("/public/portfolio?limit=4"),
    testimonials = useApi("/public/testimonials?limit=6");
  const services = catalog.data?.items ?? [];
  const projects = (portfolio.data?.items ?? []).map(mapPortfolio);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">CREATIVE MEDIA AGENCY · FOR SME</span>
          <h1>
            Kết nối sáng tạo
            <br />
            <span>– Bứt phá nội dung</span>
          </h1>
          <p>
            MediaHub giúp doanh nghiệp nhỏ sở hữu nội dung truyền thông chuyên
            nghiệp với ngân sách hợp lý — và tạo cơ hội để tài năng trẻ làm dự
            án thật.
          </p>
          <div className="hero-actions">
            <Link to="/customer/projects/new" className="btn btn-primary">
              Đăng dự án ngay <ArrowRight size={17} />
            </Link>
            <Link to="/projects" className="btn btn-ghost">
              Xem dự án <PlayCircle size={17} />
            </Link>
          </div>
          <p>
            MediaHub quản lý dự án và chịu trách nhiệm về chất lượng sản phẩm
            cuối cùng.
          </p>
        </div>
        <div className="hero-visual">
          <div className="hero-orb" />
          <div className="hero-image">
            <img
              src="/assets/project-1.png"
              alt="Dự án sản xuất nội dung MediaHub"
            />
            <div className="image-overlay" />
          </div>
          <div className="float-card fc1">
            <span>✦</span>
            <b>Video Production</b>
            <small>Creative team</small>
          </div>
          <div className="float-card fc2">
            <span>◉</span>
            <b>98%</b>
            <small>Khách hàng hài lòng</small>
          </div>
        </div>
      </section>
      <form className="search-strip" action="/projects">
        <div className="search-box">
          <Search />
          <input
            name="search"
            maxLength={100}
            aria-label="Tìm kiếm dự án"
            placeholder="Tìm dự án, thương hiệu, nội dung sáng tạo…"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Tìm kiếm <ArrowRight size={16} />
        </button>
      </form>
      <section className="feature-row">
        {[
          ["✦", "Creator chất lượng", "Được tuyển chọn và đánh giá"],
          ["◎", "Quy trình chuyên nghiệp", "MediaHub trực tiếp quản lý"],
          ["◈", "Chi phí hợp lý", "Tối ưu ngân sách SME"],
          ["✓", "Hỗ trợ tận tâm", "Đồng hành đến khi bàn giao"],
        ].map((x) => (
          <div className="feature" key={x[1]}>
            <span>{x[0]}</span>
            <div>
              <b>{x[1]}</b>
              <small>{x[2]}</small>
            </div>
          </div>
        ))}
      </section>
      <section className="section" id="services">
        <SectionTitle
          kicker="DỊCH VỤ"
          title="Giải pháp truyền thông trọn gói"
          sub="Một đầu mối. Một quy trình. Một sản phẩm được MediaHub chịu trách nhiệm đến cùng."
        />
        <State query={catalog}>
          <div className="service-grid">
            {services.map((s: any, i: number) => (
              <div className="service-card" key={s.id}>
                <span>0{i + 1}</span>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <Link to="/customer/projects/new">
                  Đăng yêu cầu <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
          {!services.length && <p>Chưa có dịch vụ.</p>}
        </State>
      </section>
      <section className="section" id="du-an">
        <SectionTitle
          kicker="DỰ ÁN NỔI BẬT"
          title="Những sản phẩm tạo dấu ấn"
          sub="Case study thực tế từ mạng lưới sáng tạo của MediaHub."
        />
        <State query={portfolio}>
          <div className="project-grid">
            {projects.map((p: any) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
          {!projects.length && <p>Chưa có dự án công khai.</p>}
        </State>
        <div className="center">
          <Link className="btn btn-ghost" to="/projects">
            Xem tất cả dự án <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="process section" id="process">
        <SectionTitle
          kicker="QUY TRÌNH"
          title="5 bước – Minh bạch & hiệu quả"
        />
        <div className="steps">
          {[
            "Doanh nghiệp gửi yêu cầu",
            "MediaHub tư vấn & báo giá",
            "Chọn đội ngũ phù hợp",
            "Thực hiện & quản lý tiến độ",
            "QC & bàn giao sản phẩm",
          ].map((s, i) => (
            <div className="step" key={s}>
              <span>0{i + 1}</span>
              <h3>{s}</h3>
              <p>
                {
                  [
                    "Brief nhu cầu, ngân sách và deadline.",
                    "Chốt scope, timeline và quotation.",
                    "MediaHub chuẩn bị creative team.",
                    "Theo dõi, review và xử lý revision.",
                    "Kiểm soát chất lượng trước bàn giao.",
                  ][i]
                }
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionTitle kicker="KHÁCH HÀNG" title="Đánh giá về MediaHub" />
        <State query={testimonials}>
          <div className="creator-grid">
            {(testimonials.data?.items ?? []).map((t: any) => (
              <div className="creator-card" key={t.id}>
                <p>{t.content}</p>
              </div>
            ))}
          </div>
          {!testimonials.data?.items.length && (
            <p>Chưa có đánh giá công khai.</p>
          )}
        </State>
      </section>
      <section className="cta">
        <div>
          <span className="eyebrow">FOR SMALL BUSINESS</span>
          <h2>
            Bạn có ý tưởng.
            <br />
            <span>MediaHub biến nó thành nội dung.</span>
          </h2>
          <p>
            Không cần ngân sách lớn để sở hữu một sản phẩm truyền thông chuyên
            nghiệp.
          </p>
        </div>
        <Link to="/customer/projects/new" className="btn btn-primary">
          Bắt đầu dự án <ArrowRight />
        </Link>
      </section>
    </>
  );
}
function SectionTitle({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">{kicker}</span>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}
function ProjectCard({ p }: { p: any }) {
  return (
    <Link to={`/projects/${p.id}`} className="project-card">
      <div className="project-img">
        <img
          src={p.image || "/assets/project-1.png"}
          alt={p.title}
          loading="lazy"
        />
        <span>{p.category}</span>
      </div>
      <div className="project-info">
        <div>
          <h3>{p.title}</h3>
          <p>{p.client}</p>
        </div>
      </div>
    </Link>
  );
}
function mapPortfolio(p: any) {
  return { ...p, image: p.image_url, desc: p.description };
}
export function Projects() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("search") ?? ""),
    [page, setPage] = useState(1);
  const query = useApi(
    "/public/portfolio?page=" + page + "&search=" + encodeURIComponent(q),
  );
  return (
    <div className="page section">
      <SectionTitle
        kicker="HỒ SƠ DỰ ÁN"
        title="Dự án nổi bật"
        sub="Những sản phẩm được MediaHub quản lý và triển khai."
      />
      <div className="toolbar">
        <div className="search-input">
          <Search />
          <input
            aria-label="Tìm dự án"
            maxLength={100}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm dự án…"
          />
        </div>
      </div>
      <State query={query}>
        <div className="project-grid">
          {query.data?.items.map((p: any) => (
            <ProjectCard key={p.id} p={mapPortfolio(p)} />
          ))}
        </div>
        {!query.data?.items.length && <p>Chưa có dự án phù hợp.</p>}
        <Pagination page={page} total={query.data?.total} onChange={setPage} />
      </State>
    </div>
  );
}
export function ProjectDetail() {
  const { id } = useParams();
  const query = useApi("/public/portfolio/" + id);
  const p = query.data;
  return (
    <div className="page section">
      <Link to="/projects" className="back">
        ← Tất cả dự án
      </Link>
      <State query={query}>
        {p && (
          <>
            <div className="detail-hero">
              <div>
                <span className="eyebrow">{p.category}</span>
                <h1>{p.title}</h1>
                <p>{p.description}</p>
                <Link to="/customer/projects/new" className="btn btn-primary">
                  Bắt đầu dự án tương tự <ArrowRight />
                </Link>
              </div>
              <img src={p.image_url || "/assets/project-1.png"} alt={p.title} />
            </div>
            <div className="detail-grid">
              <article>
                <h2>Quy trình sáng tạo</h2>
                <p>
                  MediaHub xây dựng ý tưởng từ nhu cầu kinh doanh, quản lý tiến
                  độ và kiểm soát chất lượng trước khi bàn giao.
                </p>
              </article>
              <aside className="detail-side">
                <b>Thông tin dự án</b>
                <p>Khách hàng: {p.client}</p>
                <p>Dịch vụ: {p.category}</p>
              </aside>
            </div>
          </>
        )}
      </State>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>Trang bạn tìm không tồn tại.</p>
      <Link to="/" className="btn btn-primary">
        Về trang chủ
      </Link>
    </div>
  );
}
