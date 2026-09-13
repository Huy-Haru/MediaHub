// Application roles, with STAFF limited to the support workspace.
export type Identity = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  notification_preferences: { email: boolean; in_app: boolean };
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "BUSINESS" | "CREATOR" | "STUDENT_CREATOR";
  customer_id: string | null;
};
