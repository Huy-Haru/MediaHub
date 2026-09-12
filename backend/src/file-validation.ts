import { ApiError } from "./db.js";
export function fileType(file: Express.Multer.File) {
  const b = file.buffer;
  const ext = file.originalname.split(".").pop()?.toLowerCase();
  const valid =
    (file.mimetype === "image/jpeg" &&
      ["jpg", "jpeg"].includes(ext ?? "") &&
      b[0] === 255 &&
      b[1] === 216 &&
      b[2] === 255) ||
    (file.mimetype === "image/png" &&
      ext === "png" &&
      b
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (file.mimetype === "image/webp" &&
      ext === "webp" &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP") ||
    (file.mimetype === "application/pdf" &&
      ext === "pdf" &&
      b.toString("ascii", 0, 5) === "%PDF-") ||
    (["video/mp4", "video/quicktime"].includes(file.mimetype) &&
      ["mp4", "mov"].includes(ext ?? "") &&
      b.toString("ascii", 4, 8) === "ftyp");
  if (!valid || !b.length)
    throw new ApiError(
      422,
      "INVALID_FILE",
      "Chỉ hỗ trợ JPG, PNG, WEBP, MP4, MOV và PDF hợp lệ (tối đa 50 MB).",
    );
  return ext;
}
