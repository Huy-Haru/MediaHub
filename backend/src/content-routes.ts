import { Router } from "express";
import { db, result, ApiError } from "./db.js";
import { z } from "zod";
import { uuid } from "./validators.js";
import { contentSchemas } from "./content-schemas.js";
export const publicContentRoutes = Router();
export const adminContentRoutes = Router();
publicContentRoutes.get("/pages/:key", async (req, res) => {
  const key = z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .max(100)
    .parse(req.params.key);
  const data = await result(
    db
      .from("website_settings")
      .select("key,title,content,image")
      .eq("key", key)
      .eq("published", true)
      .maybeSingle(),
  );
  res.json({ success: true, data });
});
const paging = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().max(100).default(""),
});
publicContentRoutes.get("/partners", async (req, res) => {
  const { page } = paging.parse(req.query);
  const { data, error, count } = await db
    .from("partners")
    .select("*", { count: "exact" })
    .eq("active", true)
    .order("display_order")
    .range((page - 1) * 20, page * 20 - 1);
  if (error)
    throw new ApiError(500, "DATABASE_ERROR", "Unable to load content.");
  res.json({
    success: true,
    data: { items: data, total: count, page, limit: 20 },
  });
});
adminContentRoutes.get("/partners", async (req, res) => {
  const { page, search } = paging.parse(req.query);
  const { data, error, count } = await db
    .from("partners")
    .select("*", { count: "exact" })
    .ilike("name", "%" + search.replace(/[%_]/g, "") + "%")
    .order("display_order")
    .range((page - 1) * 20, page * 20 - 1);
  if (error)
    throw new ApiError(500, "DATABASE_ERROR", "Unable to load content.");
  res.json({
    success: true,
    data: { items: data, total: count, page, limit: 20 },
  });
});
adminContentRoutes.post("/partners", async (req, res) => {
  const body = contentSchemas.partners.parse(req.body);
  const data = await result(db.from("partners").insert(body).select().single());
  res.status(201).json({ success: true, data });
});
adminContentRoutes.patch("/partners/:id", async (req, res) => {
  const body = contentSchemas.partners.partial().parse(req.body);
  const data = await result(
    db
      .from("partners")
      .update(body)
      .eq("id", uuid.parse(req.params.id))
      .select()
      .maybeSingle(),
  );
  if (!data) throw new ApiError(404, "NOT_FOUND", "Content not found.");
  res.json({ success: true, data });
});
adminContentRoutes.delete("/partners/:id", async (req, res) => {
  await result(
    db.from("partners").delete().eq("id", uuid.parse(req.params.id)),
  );
  res.json({ success: true, data: { deleted: true } });
});
publicContentRoutes.get("/process", async (req, res) => {
  const { page } = paging.parse(req.query);
  const { data, error, count } = await db
    .from("work_processes")
    .select("*", { count: "exact" })
    .eq("active", true)
    .order("display_order")
    .range((page - 1) * 20, page * 20 - 1);
  if (error)
    throw new ApiError(500, "DATABASE_ERROR", "Unable to load content.");
  res.json({
    success: true,
    data: { items: data, total: count, page, limit: 20 },
  });
});
adminContentRoutes.get("/work_processes", async (req, res) => {
  const { page, search } = paging.parse(req.query);
  const { data, error, count } = await db
    .from("work_processes")
    .select("*", { count: "exact" })
    .ilike("title", "%" + search.replace(/[%_]/g, "") + "%")
    .order("display_order")
    .range((page - 1) * 20, page * 20 - 1);
  if (error)
    throw new ApiError(500, "DATABASE_ERROR", "Unable to load content.");
  res.json({
    success: true,
    data: { items: data, total: count, page, limit: 20 },
  });
});
adminContentRoutes.post("/work_processes", async (req, res) => {
  const body = contentSchemas.work_processes.parse(req.body);
  const data = await result(
    db.from("work_processes").insert(body).select().single(),
  );
  res.status(201).json({ success: true, data });
});
adminContentRoutes.patch("/work_processes/:id", async (req, res) => {
  const body = contentSchemas.work_processes.partial().parse(req.body);
  const data = await result(
    db
      .from("work_processes")
      .update(body)
      .eq("id", uuid.parse(req.params.id))
      .select()
      .maybeSingle(),
  );
  if (!data) throw new ApiError(404, "NOT_FOUND", "Content not found.");
  res.json({ success: true, data });
});
adminContentRoutes.delete("/work_processes/:id", async (req, res) => {
  await result(
    db.from("work_processes").delete().eq("id", uuid.parse(req.params.id)),
  );
  res.json({ success: true, data: { deleted: true } });
});
publicContentRoutes.get("/settings", async (req, res) => {
  const { page } = paging.parse(req.query);
  const { data, error, count } = await db
    .from("website_settings")
    .select("*", { count: "exact" })
    .eq("published", true)
    .order("created_at")
    .range((page - 1) * 20, page * 20 - 1);
  if (error)
    throw new ApiError(500, "DATABASE_ERROR", "Unable to load content.");
  res.json({
    success: true,
    data: { items: data, total: count, page, limit: 20 },
  });
});
adminContentRoutes.get("/website_settings", async (req, res) => {
  const { page, search } = paging.parse(req.query);
  const { data, error, count } = await db
    .from("website_settings")
    .select("*", { count: "exact" })
    .ilike("title", "%" + search.replace(/[%_]/g, "") + "%")
    .order("created_at")
    .range((page - 1) * 20, page * 20 - 1);
  if (error)
    throw new ApiError(500, "DATABASE_ERROR", "Unable to load content.");
  res.json({
    success: true,
    data: { items: data, total: count, page, limit: 20 },
  });
});
adminContentRoutes.post("/website_settings", async (req, res) => {
  const body = contentSchemas.website_settings.parse(req.body);
  const data = await result(
    db.from("website_settings").insert(body).select().single(),
  );
  res.status(201).json({ success: true, data });
});
adminContentRoutes.patch("/website_settings/:id", async (req, res) => {
  const body = contentSchemas.website_settings.partial().parse(req.body);
  const data = await result(
    db
      .from("website_settings")
      .update(body)
      .eq("id", uuid.parse(req.params.id))
      .select()
      .maybeSingle(),
  );
  if (!data) throw new ApiError(404, "NOT_FOUND", "Content not found.");
  res.json({ success: true, data });
});
adminContentRoutes.delete("/website_settings/:id", async (req, res) => {
  await result(
    db.from("website_settings").delete().eq("id", uuid.parse(req.params.id)),
  );
  res.json({ success: true, data: { deleted: true } });
});
adminContentRoutes.get("/activity-logs", async (req, res) => {
  const { page } = paging.parse(req.query);
  const { data, error, count } = await db
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (error)
    throw new ApiError(500, "DATABASE_ERROR", "Unable to load activity.");
  res.json({
    success: true,
    data: { items: data, total: count, page, limit: 20 },
  });
});
