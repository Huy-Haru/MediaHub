import { Routes, Route, Navigate } from "react-router-dom";
import { PublicLayout, CustomerLayout, AdminLayout } from "./layouts";
import { CustomerRoute, AdminRoute } from "./contexts/AuthContext";
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  Profile,
  Notifications,
} from "./account-pages";
import {
  CustomerDashboard,
  CreateProject,
  CustomerProject,
  AdminDashboard,
  AdminProjects,
  AdminProjectDetail,
} from "./workspace-pages";
import {
  AdminCustomers,
  AdminRevenue,
  AdminEmployees,
  AdminServices,
  AdminPortfolio,
  AdminTestimonials,
} from "./admin-pages";
import { Home, Projects, ProjectDetail, NotFound } from "./pages";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
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
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/:id" element={<AdminProjectDetail />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="portfolio" element={<AdminPortfolio />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
