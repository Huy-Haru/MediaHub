import fs from "node:fs/promises";
import { db } from "../dist/config/database.js";

if (!process.argv.includes("--apply"))
  throw new Error("Use --apply to write clearly labelled demo content.");

const reference = new URL(
  "../../design-reference/stitch_mediahub_creative_agency_web_platform/mediahub_homepage_desktop/code.html",
  import.meta.url,
);
const html = await fs.readFile(reference, "utf8");
const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(
  (match) => match[1],
);
if (images.length < 9) throw new Error("Design reference does not contain images.");
const image = (index) => images[index];
const check = ({ error }) => {
  if (error) throw error;
};

const services = [
  ["Sản xuất video quảng cáo", "video-production", "Video", 12000000, 14, 4],
  ["Chụp ảnh thương hiệu", "brand-photography", "Photography", 6500000, 7, 5],
  ["Quản trị nội dung mạng xã hội", "social-content", "Marketing", 9000000, 30, 6],
  ["Thiết kế nhận diện", "brand-identity", "Design", 15000000, 21, 7],
];
for (const [name, slug, category, price, days, imageIndex] of services) {
  check(
    await db.from("services").upsert(
      {
        name,
        slug,
        category,
        description: `Dữ liệu demo từ mẫu thiết kế MediaHub: ${name}.`,
        starting_price: price,
        price_max: price * 2,
        estimated_days: days,
        thumbnail_url: image(imageIndex),
        featured: true,
        display_order: imageIndex,
        features: ["Brief rõ ràng", "Quản lý tiến độ", "Nghiệm thu minh bạch"],
        deliverables: ["Tệp bàn giao", "Bản tối ưu cho kênh số"],
        active: true,
      },
      { onConflict: "slug" },
    ),
  );
}

const portfolio = [
  ["Video quảng cáo The Coffee House", "the-coffee-house-demo", "The Coffee House", "Video", 5],
  ["Chụp ảnh sản phẩm Lamer Perfume", "lamer-perfume-demo", "Lamer Perfume", "Photography", 6],
  ["TVC giới thiệu TechTalk Live", "techtalk-live-demo", "TechTalk Live", "Video", 7],
  ["Poster sự kiện Summer Vibes", "summer-vibes-demo", "Summer Vibes", "Design", 8],
];
for (const [title, slug, client, category, imageIndex] of portfolio) {
  check(
    await db.from("portfolio").upsert(
      {
        title,
        slug,
        client,
        category,
        description: `Dự án demo trình bày theo nội dung trong mẫu thiết kế MediaHub.`,
        image_url: image(imageIndex),
        gallery: [image(imageIndex), image(4)],
        industry: "Thương hiệu & bán lẻ",
        year: 2026,
        duration: "3 tuần",
        challenge: "Cần một câu chuyện thương hiệu dễ nhận biết trên kênh số.",
        solution: "Kết hợp định hướng sáng tạo, sản xuất hình ảnh và nội dung đa định dạng.",
        result: "Dữ liệu demo để xem bố cục case study và gallery.",
        deliverables: ["Video/ảnh hoàn thiện", "Tệp thiết kế", "Hướng dẫn sử dụng"],
        featured: true,
        published: true,
      },
      { onConflict: "slug" },
    ),
  );
}

const settings = [
  ["hero", "Kết nối sáng tạo – Bứt phá nội dung", "MediaHub đồng hành cùng doanh nghiệp từ ý tưởng, báo giá đến sản xuất và bàn giao nội dung.", image(4)],
  ["company_name", "Tên doanh nghiệp", "MediaHub Creative Media Agency", ""],
  ["company_email", "Email liên hệ", "hello@mediahub.demo", ""],
  ["company_phone", "Điện thoại", "0900 000 000", ""],
  ["company_address", "Địa chỉ", "TP. Hồ Chí Minh, Việt Nam", ""],
  ["about", "Về MediaHub", "MediaHub là không gian quản lý sản xuất nội dung minh bạch cho doanh nghiệp.", image(4)],
];
for (const [key, title, content, settingImage] of settings) {
  check(
    await db.from("website_settings").upsert(
      { key, title, content, image: settingImage, published: true },
      { onConflict: "key" },
    ),
  );
}

for (const [step, title, description] of [
  [1, "Gửi yêu cầu", "Chia sẻ mục tiêu, ngân sách và mốc thời gian."],
  [2, "Nhận báo giá", "MediaHub tư vấn phương án và phạm vi thực hiện."],
  [3, "Sản xuất", "Theo dõi tiến độ, phản hồi và các mốc bàn giao."],
  [4, "Nghiệm thu", "Duyệt kết quả rồi nhận tệp hoàn chỉnh."],
]) {
  const existing = await db.from("work_processes").select("id").eq("step", step).maybeSingle();
  check(existing);
  if (existing.data) check(await db.from("work_processes").update({ title, description, active: true, display_order: step, image: image(4) }).eq("id", existing.data.id));
  else check(await db.from("work_processes").insert({ step, title, description, icon: String(step), image: image(4), active: true, display_order: step }));
}

console.log(JSON.stringify({ seeded: true, services: services.length, portfolio: portfolio.length, imagesImportedFromReference: images.length }));
