import type { Response } from "express";
export const send = <T>(res: Response, data: T) =>
  res.json({ success: true, data });
