import { db } from "./config/database.js";
export { db } from "./config/database.js";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function result(query: PromiseLike<any>) {
  const { data, error } = await query;
  if (error) {
    console.error("Database error", error.code);
    throw new ApiError(
      error.code === "P0001" ? 409 : 500,
      error.code === "P0001" ? "INVALID_WORKFLOW" : "DATABASE_ERROR",
      error.code === "P0001"
        ? error.message
        : "Không thể xử lý dữ liệu. Vui lòng thử lại.",
    );
  }
  return data;
}
