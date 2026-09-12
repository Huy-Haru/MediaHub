import { randomUUID } from "node:crypto";
import { db } from "../dist/config/database.js";
const bytes = Buffer.from(
  "%PDF-1.4\n% MediaHub temporary storage check\n%%EOF",
);
for (const bucket of ["project-files", "deliverables", "lead-attachments"]) {
  const path = `qa/${randomUUID()}.pdf`;
  let uploaded = false;
  try {
    const upload = await db.storage
      .from(bucket)
      .upload(path, bytes, { contentType: "application/pdf" });
    if (upload.error) throw new Error("Upload failed");
    uploaded = true;
    const signed = await db.storage
      .from(bucket)
      .createSignedUrl(path, 30, { download: true });
    if (signed.error) throw new Error("Signed URL failed");
    const response = await fetch(signed.data.signedUrl);
    if (
      !response.ok ||
      !Buffer.from(await response.arrayBuffer()).equals(bytes)
    )
      throw new Error("Signed download failed");
    const publicUrl = db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    const anonymous = await fetch(publicUrl);
    if (anonymous.ok) throw new Error("Private object is publicly readable");
    console.log(
      `PASS ${bucket}: signed download works; anonymous public URL denied.`,
    );
  } catch (error) {
    console.error(`${bucket}: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (uploaded) {
      const removed = await db.storage.from(bucket).remove([path]);
      if (removed.error) {
        console.error(`Cleanup failed for ${bucket}/${path}`);
        process.exitCode = 1;
      }
    }
  }
}
