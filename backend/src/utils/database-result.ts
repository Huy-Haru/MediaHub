import { ApiError } from './api-error.js';
type DatabaseError = { code?: string; message: string };
export async function result<T>(query: PromiseLike<{ data: T; error: DatabaseError | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) {
    console.error('Database error', error.code);
    throw new ApiError(error.code === 'P0001' ? 409 : 500, error.code === 'P0001' ? 'INVALID_WORKFLOW' : 'DATABASE_ERROR', error.code === 'P0001' ? error.message : 'Không thể xử lý dữ liệu. Vui lòng thử lại.');
  }
  return data;
}
