import {z} from 'zod';
const text=z.string().trim().min(1).max(5000);const money=z.number().min(0).max(1e12);export const uuid=z.string().uuid();
export const projectSchema=z.object({title:text.max(200),description:text,category:text.max(100),budget:money,deadline:z.iso.date(),service_ids:z.array(uuid).min(1).max(20),status:z.enum(['DRAFT','SUBMITTED']).default('SUBMITTED')}).strict();
export const quoteSchema=z.object({items:z.array(z.object({service_id:uuid,description:text,quantity:z.number().int().min(1).max(10000),unit_price:money}).strict()).min(1).max(50),discount:money.default(0),valid_until:z.iso.date(),notes:z.string().max(5000).default('')}).strict();
export const reviewSchema=z.object({rating:z.number().int().min(1).max(5),quality_rating:z.number().int().min(1).max(5),communication_rating:z.number().int().min(1).max(5),value_rating:z.number().int().min(1).max(5),comment:text}).strict();
export const revisionSchema=z.object({description:text,attachment_url:z.string().max(1000).optional()}).strict();
export const statusSchema=z.object({status:z.enum(['REVIEWING','IN_PROGRESS','WAITING_REVIEW','COMPLETED','CANCELLED']),note:z.string().max(2000).default('')}).strict();
const url=z.union([z.string().url().refine(v=>v.startsWith('https://')||v.startsWith('http://localhost')),z.literal('')]);
export const resources={
 employees:z.object({name:text,email:z.email(),phone:z.string().max(30).default(''),position:text,department:text,skills:z.array(text).default([]),status:z.enum(['ACTIVE','INACTIVE']).default('ACTIVE'),joined_at:z.iso.date()}),
 services:z.object({name:text,slug:z.string().regex(/^[a-z0-9-]+$/),description:text,category:text,starting_price:money,estimated_days:z.number().int().min(1),thumbnail_url:url.default(''),active:z.boolean().default(true)}),
 portfolio:z.object({title:text,client:text,description:text,category:text,image_url:url.default(''),published:z.boolean().default(false),featured:z.boolean().default(false)}),
 testimonials:z.object({review_id:uuid,content:text,status:z.enum(['PENDING','APPROVED','REJECTED']).default('PENDING')})
};
