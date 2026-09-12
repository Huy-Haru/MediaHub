import type { Database } from "./database.types.js";
export type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  service_id: string | null;
  project_type: string;
  message: string;
  budget_range: string;
  deadline: string | null;
  source: "CONTACT" | "PROJECT_REQUEST";
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
  notes: string;
  customer_id: string | null;
  assigned_to: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
};
type LeadInsert = Pick<Lead, "full_name" | "email" | "message" | "source"> &
  Partial<Omit<Lead, "full_name" | "email" | "message" | "source">>;
type Stamped = { id: string; created_at: string; updated_at: string };
type Partner = Stamped & {
  name: string;
  logo: string;
  website: string;
  description: string;
  industry: string;
  display_order: number;
  active: boolean;
};
type Process = Stamped & {
  title: string;
  description: string;
  step: number;
  icon: string;
  image: string;
  active: boolean;
  display_order: number;
};
type Setting = Stamped & {
  key: string;
  title: string;
  content: string;
  image: string;
  published: boolean;
};
type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};
type Milestone = Stamped & {
  project_id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  display_order: number;
};
type Audit = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
};
type Table<T, Required extends keyof T> = {
  Row: T;
  Insert: Pick<T, Required> & Partial<Omit<T, Required>>;
  Update: Partial<T>;
  Relationships: [];
};
type ServiceExtra = {
  featured: boolean;
  display_order: number;
  features: string[];
  deliverables: string[];
  price_max: number | null;
  seo_title: string;
  seo_description: string;
};
type PortfolioExtra = {
  slug: string;
  industry: string;
  year: number | null;
  duration: string;
  challenge: string;
  solution: string;
  result: string;
  gallery: string[];
  deliverables: string[];
  seo_title: string;
  seo_description: string;
};
type Extended<
  T extends { Row: object; Insert: object; Update: object },
  Extra extends object,
> = Omit<T, "Row" | "Insert" | "Update"> & {
  Row: T["Row"] & Extra;
  Insert: T["Insert"] & Partial<Extra>;
  Update: T["Update"] & Partial<Extra>;
};
// Additive migrations extend the generated baseline without overwriting it.
export type PlatformDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      save_quotation: {
        Args: {
          actor_id: string;
          pid: string;
          payload: import("./database.types.js").Json;
          send_now: boolean;
        };
        Returns: { id: string; project_id: string };
      };
      manage_quotation: {
        Args: { actor_id: string; qid: string; operation: string };
        Returns: { id: string; project_id: string };
      };
      edit_project: {
        Args: {
          actor_id: string;
          pid: string;
          payload: import("./database.types.js").Json;
        };
        Returns: { id: string };
      };
      convert_lead: {
        Args: { actor_id: string; lid: string; cid: string };
        Returns: { customer_id: string };
      };
      manage_user: {
        Args: {
          actor_id: string;
          target_id: string;
          new_role: string;
          new_active: boolean;
        };
        Returns: { id: string };
      };
      update_profile: {
        Args: { actor_id: string; payload: import("./database.types.js").Json };
        Returns: { id: string };
      };
    };
    Tables: Omit<
      Database["public"]["Tables"],
      | "profiles"
      | "invoices"
      | "revision_requests"
      | "services"
      | "portfolio"
      | "projects"
      | "quotations"
    > & {
      quotations: Omit<Database["public"]["Tables"]["quotations"], "Row"> & {
        Row: Omit<
          Database["public"]["Tables"]["quotations"]["Row"],
          "status"
        > & {
          status:
            | "DRAFT"
            | "SENT"
            | "ACCEPTED"
            | "REJECTED"
            | "EXPIRED"
            | "CANCELLED";
          quotation_number: string;
          tax_rate: number;
          tax: number;
        };
      };
      projects: Extended<
        Database["public"]["Tables"]["projects"],
        { progress: number; scope: string }
      >;
      services: Extended<
        Database["public"]["Tables"]["services"],
        ServiceExtra
      >;
      portfolio: Extended<
        Database["public"]["Tables"]["portfolio"],
        PortfolioExtra
      >;
      profiles: Omit<
        Database["public"]["Tables"]["profiles"],
        "Row" | "Update"
      > & {
        Row: Database["public"]["Tables"]["profiles"]["Row"] & {
          active: boolean;
          notification_preferences: { email: boolean; in_app: boolean };
        };
        Update: Database["public"]["Tables"]["profiles"]["Update"] & {
          active?: boolean;
          notification_preferences?: { email: boolean; in_app: boolean };
        };
      };
      invoices: Omit<Database["public"]["Tables"]["invoices"], "Row"> & {
        Row: Omit<Database["public"]["Tables"]["invoices"]["Row"], "status"> & {
          status:
            "DRAFT" | "ISSUED" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
          due_date: string | null;
          quotation_id: string | null;
        };
      };
      revision_requests: Omit<
        Database["public"]["Tables"]["revision_requests"],
        "Row"
      > & {
        Row: Omit<
          Database["public"]["Tables"]["revision_requests"]["Row"],
          "status"
        > & {
          status:
            | "PENDING"
            | "REQUESTED"
            | "IN_PROGRESS"
            | "RESOLVED"
            | "REJECTED"
            | "CANCELLED";
          deliverable_id: string | null;
        };
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
        Relationships: [];
      };
      partners: Table<Partner, "name">;
      work_processes: Table<Process, "title" | "description" | "step">;
      website_settings: Table<Setting, "key" | "title">;
      project_messages: Table<Message, "project_id" | "sender_id" | "message">;
      project_milestones: Table<Milestone, "project_id" | "title">;
      audit_logs: Table<Audit, "action" | "entity" | "entity_id">;
    };
  };
};
