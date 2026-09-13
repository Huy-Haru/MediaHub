import { Router } from "express";
import { z } from "zod";
import { db } from "./db.js";
import { ApiError } from "./utils/api-error.js";

export const creatorRoutes = Router();
const filters = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(6),
  search: z.string().trim().max(100).default(""),
  category: z.string().trim().max(80).optional(),
  skill: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
  experience: z.enum(["STUDENT", "JUNIOR", "MID", "SENIOR", "LEAD"]).optional(),
  availability: z.enum(["AVAILABLE", "LIMITED", "BUSY", "UNAVAILABLE"]).optional(),
  verified: z.enum(["true", "false"]).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  price_max: z.coerce.number().min(0).optional(),
  sort: z.enum(["recommended", "rating", "projects", "price"]).default("recommended"),
});

creatorRoutes.get("/creators/filters", async (_req, res) => {
  const client = db as any;
  const [categories, skills] = await Promise.all([
    client.from("categories").select("id,name,slug").eq("active", true).order("display_order"),
    client.from("skills").select("id,name,slug").eq("active", true).order("name"),
  ]);
  if (categories.error || skills.error) throw new ApiError(500, "DATABASE_ERROR", "Không thể tải bộ lọc Creator.");
  res.json({ success: true, data: { categories: categories.data, skills: skills.data } });
});

creatorRoutes.get("/creators", async (req, res) => {
  const f = filters.parse(req.query);
  const client = db as any;
  let query = client.from("creator_profiles").select(
    "*,creator_categories(categories!inner(id,name,slug)),creator_skills(skills!inner(id,name,slug)),creator_portfolio(id,title,thumbnail_url,category,featured)",
    { count: "exact" },
  );
  if (f.search) query = query.or(`display_name.ilike.%${f.search.replace(/[%_,]/g, "")}%,title.ilike.%${f.search.replace(/[%_,]/g, "")}%,bio.ilike.%${f.search.replace(/[%_,]/g, "")}%`);
  if (f.category) query = query.eq("creator_categories.categories.slug", f.category);
  if (f.skill) query = query.eq("creator_skills.skills.slug", f.skill);
  if (f.location) query = query.ilike("location", `%${f.location.replace(/[%_]/g, "")}%`);
  if (f.experience) query = query.eq("experience_level", f.experience);
  if (f.availability) query = query.eq("availability", f.availability);
  if (f.verified) query = query.eq("verified", f.verified === "true");
  if (f.rating !== undefined) query = query.gte("rating", f.rating);
  if (f.price_max !== undefined) query = query.lte("price_from", f.price_max);
  const order = f.sort === "price" ? "price_from" : f.sort === "projects" ? "completed_projects" : f.sort === "rating" ? "rating" : "featured";
  const { data, error, count } = await query.order(order, { ascending: f.sort === "price", nullsFirst: false }).range((f.page - 1) * f.limit, f.page * f.limit - 1);
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Không thể tải danh sách Creator.");
  res.json({ success: true, data: { items: data, total: count, page: f.page, limit: f.limit } });
});

creatorRoutes.get("/creators/:slug", async (req, res) => {
  const slug = z.string().regex(/^[a-z0-9-]+$/).max(100).parse(req.params.slug);
  const { data, error } = await (db as any).from("creator_profiles").select("*,creator_categories(categories(id,name,slug)),creator_skills(skills(id,name,slug)),creator_portfolio(*)").eq("slug", slug).maybeSingle();
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Không thể tải hồ sơ Creator.");
  if (!data) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy Creator.");
  res.json({ success: true, data });
});
