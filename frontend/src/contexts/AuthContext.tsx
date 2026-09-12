import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { authService } from "../services";
type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "STAFF";
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  notification_preferences: { email: boolean; in_app: boolean };
};
const Context = createContext<{
  currentUser: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  currentUser: null,
  profile: null,
  role: null,
  loading: true,
  error: "",
  refresh: async () => {},
  logout: async () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function refresh() {
    try {
      setError("");
      setProfile(await authService.me());
    } catch (e) {
      setProfile(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function logout() {
    const result = await authService.logout();
    if (result.error) throw result.error;
    setUser(null);
    setProfile(null);
    setError("");
    setLoading(false);
  }
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    let generation = 0;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = ++generation;
      setUser(session?.user ?? null);
      setProfile(null);
      setError("");
      if (!session) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setTimeout(() => {
        authService
          .me()
          .then((p) => {
            if (active && current === generation) setProfile(p);
          })
          .catch((e) => {
            if (active && current === generation) setError(e.message);
          })
          .finally(() => {
            if (active && current === generation) setLoading(false);
          });
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return (
    <Context.Provider
      value={{
        currentUser,
        profile,
        role: profile?.role ?? null,
        loading,
        error,
        refresh,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
function Protected({ role }: { role: string }) {
  const auth = useAuth();
  const location = useLocation();
  const [logoutError, setLogoutError] = useState("");
  if (auth.loading)
    return (
      <div className="panel skeleton" role="status">
        Đang xác thực…
      </div>
    );
  if (!auth.currentUser)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (auth.error)
    return (
      <div className="panel" role="alert">
        {auth.error}
        <button className="btn btn-ghost" onClick={auth.refresh}>
          Thử lại
        </button>
        <button
          className="btn btn-ghost"
          onClick={() =>
            auth.logout().catch((e) => setLogoutError((e as Error).message))
          }
        >
          Đăng xuất
        </button>
        {logoutError && <p className="error">{logoutError}</p>}
      </div>
    );
  if (auth.role !== role)
    return (
      <Navigate
        to={auth.role === "ADMIN" ? "/admin/dashboard" : auth.role === "STAFF" ? "/staff/dashboard" : "/customer/dashboard"}
        replace
      />
    );
  return <Outlet />;
}
export const CustomerRoute = () => <Protected role="CUSTOMER" />;
export const AdminRoute = () => <Protected role="ADMIN" />;

export const StaffRoute = () => <Protected role="STAFF" />;
