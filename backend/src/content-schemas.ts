import { z } from "zod";
const text = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(10000).default("");
const url = z
  .union([
    z.literal(""),
    z.url().refine((value) => value.startsWith("https://"), "Use an HTTPS URL"),
  ])
  .default("");
const order = z.number().int().min(0).max(10000).default(0);
export const contentSchemas = {
  partners: z
    .object({
      name: text,
      logo: url,
      website: url,
      description: optionalText,
      industry: z.string().max(200).default(""),
      display_order: order,
      active: z.boolean().default(false),
    })
    .strict(),
  work_processes: z
    .object({
      title: text,
      description: optionalText,
      step: z.number().int().min(1).max(100),
      icon: z.string().max(100).default(""),
      image: url,
      active: z.boolean().default(false),
      display_order: order,
    })
    .strict(),
  website_settings: z
    .object({
      key: z
        .string()
        .regex(/^[a-z0-9_]+$/)
        .max(100),
      title: text,
      content: optionalText,
      image: url,
      published: z.boolean().default(false),
    })
    .strict(),
};
