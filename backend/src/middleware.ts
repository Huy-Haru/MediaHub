import type {RequestHandler} from 'express';
import {db,result,ApiError} from './db.js';
export type Identity={id:string;auth_user_id:string;role:'CUSTOMER'|'ADMIN';full_name:string;email:string;customer_id:string|null};
declare global {namespace Express {interface Request {identity:Identity}}}
export const authenticate:RequestHandler=async(req,_res,next)=>{try{
 const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token) throw new ApiError(401,'UNAUTHENTICATED','Vui lòng đăng nhập.');
 const {data,error}=await db.auth.getUser(token);if(error||!data.user) throw new ApiError(401,'UNAUTHENTICATED','Phiên đăng nhập đã hết hạn.');
 const p=await result(db.from('profiles').select('*').eq('auth_user_id',data.user.id).maybeSingle());
 if(!p||!['CUSTOMER','ADMIN'].includes(p.role)) throw new ApiError(403,'FORBIDDEN','Tài khoản không có quyền truy cập.');
 const c=await result(db.from('customers').select('id').eq('profile_id',p.id).maybeSingle());req.identity={...p,customer_id:c?.id??null};next();
 }catch(e){next(e)}};
export const requireRole=(role:string):RequestHandler=>(req,_res,next)=>req.identity.role===role?next():next(new ApiError(403,'FORBIDDEN','Bạn không có quyền thực hiện thao tác này.'));
