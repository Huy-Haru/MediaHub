import { RouteMetadata } from "./content-pages";
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout, CustomerLayout, AdminLayout } from "./layouts";
import { CustomerRoute, AdminRoute } from "./contexts/AuthContext";
const Login = lazy(() =>
  import("./account-pages").then((module) => ({ default: module.Login })),
);
const Register = lazy(() =>
  import("./account-pages").then((module) => ({ default: module.Register })),
);
const ForgotPassword = lazy(() =>
  import("./account-pages").then((module) => ({
    default: module.ForgotPassword,
  })),
);
const ResetPassword = lazy(() =>
  import("./account-pages").then((module) => ({
    default: module.ResetPassword,
  })),
);
const Profile = lazy(() =>
  import("./account-pages").then((module) => ({ default: module.Profile })),
);
const Notifications = lazy(() =>
  import("./account-pages").then((module) => ({
    default: module.Notifications,
  })),
);
const ProjectList = lazy(() =>
  import("./workspace-pages").then((module) => ({
    default: module.ProjectList,
  })),
);
const CustomerDashboard = lazy(() =>
  import("./workspace-pages").then((module) => ({
    default: module.CustomerDashboard,
  })),
);
const CreateProject = lazy(() =>
  import("./workspace-pages").then((module) => ({
    default: module.CreateProject,
  })),
);
const CustomerProject = lazy(() =>
  import("./workspace-pages").then((module) => ({
    default: module.CustomerProject,
  })),
);
const AdminDashboard = lazy(() =>
  import("./workspace-pages").then((module) => ({
    default: module.AdminDashboard,
  })),
);
const AdminProjects = lazy(() =>
  import("./workspace-pages").then((module) => ({
    default: module.AdminProjects,
  })),
);
const AdminProjectDetail = lazy(() =>
  import("./workspace-pages").then((module) => ({
    default: module.AdminProjectDetail,
  })),
);
const AdminContent = lazy(() =>
  import("./admin-pages").then((module) => ({ default: module.AdminContent })),
);
const AdminCustomers = lazy(() =>
  import("./admin-pages").then((module) => ({
    default: module.AdminCustomers,
  })),
);
const AdminRevenue = lazy(() =>
  import("./admin-pages").then((module) => ({ default: module.AdminRevenue })),
);
const AdminEmployees = lazy(() =>
  import("./admin-pages").then((module) => ({
    default: module.AdminEmployees,
  })),
);
const AdminServices = lazy(() =>
  import("./admin-pages").then((module) => ({ default: module.AdminServices })),
);
const AdminPortfolio = lazy(() =>
  import("./admin-pages").then((module) => ({
    default: module.AdminPortfolio,
  })),
);
const AdminTestimonials = lazy(() =>
  import("./admin-pages").then((module) => ({
    default: module.AdminTestimonials,
  })),
);
const Home = lazy(() =>
  import("./pages").then((module) => ({ default: module.Home })),
);
const Projects = lazy(() =>
  import("./pages").then((module) => ({ default: module.Projects })),
);
const ProjectDetail = lazy(() =>
  import("./pages").then((module) => ({ default: module.ProjectDetail })),
);
const NotFound = lazy(() =>
  import("./pages").then((module) => ({ default: module.NotFound })),
);
const Services = lazy(() =>
  import("./public-pages").then((module) => ({ default: module.Services })),
);
const ServiceDetail = lazy(() =>
  import("./public-pages").then((module) => ({
    default: module.ServiceDetail,
  })),
);
const Enquiry = lazy(() =>
  import("./public-pages").then((module) => ({ default: module.Enquiry })),
);
const AdminLeads = lazy(() =>
  import("./public-pages").then((module) => ({ default: module.AdminLeads })),
);
const AdminLeadDetail = lazy(() =>
  import("./public-pages").then((module) => ({
    default: module.AdminLeadDetail,
  })),
);

const CustomerInvoices = lazy(() =>
  import("./customer-pages").then((module) => ({
    default: module.CustomerInvoices,
  })),
);
const CustomerInvoice = lazy(() =>
  import("./customer-pages").then((module) => ({
    default: module.CustomerInvoice,
  })),
);
const CustomerQuotations = lazy(() =>
  import("./customer-pages").then((module) => ({
    default: module.CustomerQuotations,
  })),
);
const ProjectMessages = lazy(() =>
  import("./customer-pages").then((module) => ({
    default: module.ProjectMessages,
  })),
);
const ContentPage = lazy(() =>
  import("./content-pages").then((module) => ({ default: module.ContentPage })),
);
const PartnersPage = lazy(() =>
  import("./content-pages").then((module) => ({
    default: module.PartnersPage,
  })),
);
const ProcessPage = lazy(() =>
  import("./content-pages").then((module) => ({ default: module.ProcessPage })),
);
const ActivityLogs = lazy(() =>
  import("./content-pages").then((module) => ({
    default: module.ActivityLogs,
  })),
);
const AdminUsers = lazy(() =>
  import("./admin-account-pages").then((module) => ({
    default: module.AdminUsers,
  })),
);
const AdminFiles = lazy(() =>
  import("./project-management").then((module) => ({
    default: module.AdminFiles,
  })),
);
const AdminQuotation = lazy(() =>
  import("./quotation-page").then((module) => ({
    default: module.AdminQuotation,
  })),
);
const ErrorPage = lazy(() =>
  import("./error-page").then((module) => ({ default: module.ErrorPage })),
);
export default function App() {
  return (
    <>
      <RouteMetadata />
      <Suspense
        fallback={
          <div className="panel skeleton" role="status">
            Đang tải trang…
          </div>
        }
      >
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/about"
              element={<ContentPage name="about" title="Về MediaHub" />}
            />
            <Route
              path="/privacy"
              element={
                <ContentPage name="privacy" title="Chính sách bảo mật" />
              }
            />
            <Route
              path="/terms"
              element={<ContentPage name="terms" title="Điều khoản sử dụng" />}
            />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/process" element={<ProcessPage />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/contact" element={<Enquiry contact />} />
            <Route path="/request-project" element={<Enquiry />} />
            <Route path="/portfolio" element={<Projects />} />
            <Route path="/portfolio/:id" element={<ProjectDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route element={<CustomerRoute />}>
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="invoices" element={<CustomerInvoices />} />
              <Route path="invoices/:id" element={<CustomerInvoice />} />
              <Route path="quotations" element={<CustomerQuotations />} />
              <Route
                path="projects/:id/messages"
                element={<ProjectMessages />}
              />
              {["quotation", "files", "revisions"].map((path) => (
                <Route
                  key={path}
                  path={`projects/:id/${path}`}
                  element={<CustomerProject />}
                />
              ))}
              <Route path="projects/new" element={<CreateProject />} />
              <Route path="projects/:id" element={<CustomerProject />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="files" element={<AdminFiles />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="invoices" element={<CustomerInvoices admin />} />
              <Route path="invoices/:id" element={<CustomerInvoice admin />} />
              <Route path="quotations" element={<CustomerQuotations admin />} />
              <Route path="quotations/:id" element={<AdminQuotation />} />
              <Route
                path="partners"
                element={<AdminContent resource="partners" />}
              />
              <Route
                path="process"
                element={<AdminContent resource="work_processes" />}
              />
              <Route
                path="settings"
                element={<AdminContent resource="website_settings" />}
              />
              <Route path="activity-logs" element={<ActivityLogs />} />
              <Route
                path="projects/:id/messages"
                element={<ProjectMessages />}
              />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="leads/:id" element={<AdminLeadDetail />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="projects/:id" element={<AdminProjectDetail />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="services/new" element={<AdminServices />} />
              <Route path="services/:id/edit" element={<AdminServices />} />
              <Route path="portfolio" element={<AdminPortfolio />} />
              <Route path="portfolio/new" element={<AdminPortfolio />} />
              <Route path="portfolio/:id/edit" element={<AdminPortfolio />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>
          <Route path="/403" element={<ErrorPage kind="403" />} />
          <Route path="/500" element={<ErrorPage kind="500" />} />
          <Route path="/network-error" element={<ErrorPage kind="network" />} />
          <Route
            path="/session-expired"
            element={<ErrorPage kind="session" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
