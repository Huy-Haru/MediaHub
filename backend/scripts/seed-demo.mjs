import fs from "node:fs/promises";
import { db } from "../dist/config/database.js";

if (!process.argv.includes("--apply"))
  throw new Error("Use --apply to write clearly labelled demo content.");

const reference = new URL(
  "../../reference/stitch_mediahub_creative_agency_web_platform/mediahub_homepage_desktop/code.html",
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
  ["Web & Landing Page", "web-landing-page", "Web Design", 10000000, 14, 8],
  ["Livestream & Media sự kiện", "livestream-event", "Livestream", 8500000, 5, 9],
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

// Marketplace data is deterministic and safe to rerun. Demo identities are real
// Supabase Auth users so every role can be tested end-to-end.
const demoPassword = "MediaHub@2026";
const demoAccounts = [
  ["admin@mediahub.vn", "Quản trị MediaHub", "ADMIN"],
  ["business@mediahub.vn", "Nguyễn Thu Hà", "BUSINESS"],
  ["creator@mediahub.vn", "Đặng Minh Quân", "CREATOR"],
  ...Array.from({ length: 22 }, (_, i) => [`demo${i + 1}@mediahub.vn`, `Thành viên MediaHub ${i + 1}`, i < 7 ? "BUSINESS" : i < 18 ? "CREATOR" : "STUDENT_CREATOR"]),
];
for (const [email, fullName, role] of demoAccounts) {
  const created = await db.auth.admin.createUser({ email, password: demoPassword, email_confirm: true, user_metadata: { full_name: fullName } });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) throw created.error;
  const profile = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  check(profile);
  if (profile.data) check(await db.from("profiles").update({ role, full_name: fullName, active: true }).eq("id", profile.data.id));
}

const categoryNames = ["Thiết kế sáng tạo","Video & TVC","Marketing & Truyền thông số","Content & PR","Web & Landing Page","Livestream & Sự kiện","Photography","Social Content","Motion Graphics","Branding"];
for (const [i, name] of categoryNames.entries()) check(await db.from("categories").upsert({ name, slug: `category-${i + 1}`, description: `Nhóm chuyên môn ${name} của MediaHub`, display_order: i + 1, active: true }, { onConflict: "slug" }));
const skillNames = ["Video Editing","Premiere Pro","After Effects","Photoshop","Illustrator","Figma","Photography","Copywriting","TikTok","Social Media","Motion Graphics","UI/UX","Web Design","Color Grading","Cinematography","DaVinci Resolve","Studio Lighting","Brand Strategy","Art Direction","Storyboarding","Sound Design","Livestream OBS","Food Styling","Product Photography","Content Strategy","SEO Content","3D Visual","Blender","Cinema 4D","Brand Guideline","Packaging","Reels Production"];
for (const [i, name] of skillNames.entries()) check(await db.from("skills").upsert({ name, slug: `skill-${i + 1}`, active: true }, { onConflict: "slug" }));
const categoriesResult = await db.from("categories").select("id,slug").order("display_order"); check(categoriesResult);
const skillsResult = await db.from("skills").select("id,slug").order("name"); check(skillsResult);
const creatorNames = ["Hoàng Linh Chi","Đặng Minh Quân","Nguyễn Thảo Vy","Lê Tuấn Hưng","Trần Quốc Bảo","Mai Phương Thảo","Phạm Gia Huy","Vũ Khánh Linh","Ngô Đức Anh","Bùi Minh Trang","Đỗ Nhật Nam","Trương Mỹ Duyên","Lâm Hoài An","Nguyễn Hải Đăng","Phan Thùy Dương","Đinh Quang Vinh","Võ Ngọc Mai","Lý Tuấn Kiệt"];
const titles = ["Senior Motion Designer","Director of Photography (DoP)","Brand Identity & UI Designer","Commercial Photographer","Video Editor & Sound Designer","Creative Copywriter & Social Lead","UI/UX Designer","Content Creator","Livestream Operator"];
const locations = ["TP. Hồ Chí Minh","Hà Nội","Đà Nẵng","Cần Thơ","Remote toàn quốc"];
for (const [i, displayName] of creatorNames.entries()) {
  const email = i === 1 ? "creator@mediahub.vn" : i < 12 ? `demo${9 + i}@mediahub.vn` : null;
  const profile = email ? await db.from("profiles").select("id").eq("email", email).maybeSingle() : { data: null, error: null }; check(profile);
  const creator = await db.from("creator_profiles").upsert({ profile_id: profile.data?.id ?? null, slug: `creator-${i + 1}`, display_name: displayName, title: titles[i % titles.length], bio: `${displayName} có kinh nghiệm triển khai dự án truyền thông thực tế cho thương hiệu Việt Nam, từ brief đến nghiệm thu.`, avatar_url: image(i % images.length), cover_url: image((i + 4) % images.length), location: locations[i % locations.length], university: i % 3 === 0 ? "Đại học RMIT Việt Nam" : i % 3 === 1 ? "Đại học FPT" : "Đại học Sân khấu Điện ảnh", major: "Truyền thông đa phương tiện", study_year: i % 4 === 0 ? 4 : null, experience_level: ["LEAD","SENIOR","MID","JUNIOR","STUDENT"][i % 5], tools: skillNames.slice(i % 8, i % 8 + 5), languages: ["Tiếng Việt", ...(i % 2 ? ["English"] : [])], rating: i % 7 === 0 ? null : 4 + (i % 11) / 10, review_count: i % 7 === 0 ? 0 : 8 + i * 3, completed_projects: 5 + i * 2, completion_rate: 96 + (i % 5), response_rate: 92 + (i % 9), response_time: i % 3 === 0 ? "Trong 30 phút" : "Trong 2 giờ", availability: ["AVAILABLE","AVAILABLE","LIMITED","BUSY"][i % 4], price_from: 1800000 + i * 350000, verified: i % 5 !== 4, featured: i < 4, social_links: { behance: `https://behance.net/mediahub-creator-${i + 1}` } }, { onConflict: "slug" }).select("id").single(); check(creator);
  for (const category of categoriesResult.data.slice(i % 5, i % 5 + 2)) check(await db.from("creator_categories").upsert({ creator_id: creator.data.id, category_id: category.id }));
  for (const skill of skillsResult.data.slice(i % 15, i % 15 + (i % 4 === 0 ? 8 : 4))) check(await db.from("creator_skills").upsert({ creator_id: creator.data.id, skill_id: skill.id, proficiency: 3 + (i % 3) }));
  for (let n = 0; n < 3; n++) check(await db.from("creator_portfolio").upsert({ id: `${(i + 1).toString(16).padStart(8,"0")}-0000-4000-8000-${(n + 1).toString().padStart(12,"0")}`, creator_id: creator.data.id, title: `${["Chiến dịch","TVC","Bộ nhận diện","Social Series"][n]} — ${["The Coffee House","TechTalk Live","Summer Vibes","Lamer Perfume"][i % 4]}`, description: "Dự án thực tế được triển khai và nghiệm thu bởi MediaHub.", thumbnail_url: image((i + n + 3) % images.length), gallery: [image((i + n + 3) % images.length)], category: categoryNames[(i + n) % categoryNames.length], skills: skillNames.slice(i % 10, i % 10 + 3), client: ["The Coffee House","Coolmate","TechTalk Live","Lamer Perfume"][i % 4], project_year: 2024 + (i % 3), featured: n === 0 }));
}

// Expand public case studies to exercise long lists and pagination.
for (let i = 4; i < 24; i++) check(await db.from("portfolio").upsert({ title: `${["TVC thương hiệu","Bộ ảnh sản phẩm","Chiến dịch Social","Nhận diện sự kiện"][i % 4]} — Dự án ${i + 1}`, slug: `mediahub-case-${i + 1}`, client: ["Coolmate","Highlands Coffee","VinFast","PNJ","Sapo"][i % 5], category: categoryNames[i % categoryNames.length], description: i % 5 === 0 ? "Một case study có mô tả dài nhằm kiểm tra khả năng co giãn của card, giới hạn dòng và bố cục responsive khi nội dung thực tế thay đổi đáng kể trên nhiều kích thước màn hình." : "Case study thực tế của đội ngũ sáng tạo MediaHub.", image_url: image(i % images.length), gallery: [image(i % images.length),image((i + 2) % images.length)], industry: "Hàng tiêu dùng & Công nghệ", year: 2024 + i % 3, duration: `${2 + i % 7} tuần`, challenge: "Tạo khác biệt trong thị trường cạnh tranh và đảm bảo nhận diện nhất quán.", solution: "Nghiên cứu insight, phát triển concept, sản xuất đa định dạng và kiểm soát chất lượng.", result: "Tăng độ nhận biết và hiệu quả tương tác trên các kênh số.", deliverables: ["Master video 4K","Ảnh social","Source file"], featured: i < 8, published: true }, { onConflict: "slug" }));

console.log(JSON.stringify({ marketplaceSeeded: true, users: demoAccounts.length, creators: creatorNames.length, creatorPortfolio: creatorNames.length * 3, categories: categoryNames.length, skills: skillNames.length, publicProjects: 24, demoPassword }));

const businessProfiles = await db.from("profiles").select("id,customers(id)").in("role", ["BUSINESS", "CUSTOMER"]); check(businessProfiles);
const usableCustomers = businessProfiles.data.flatMap((p) => p.customers?.id ? [{ profileId: p.id, customerId: p.customers.id }] : []);
const creatorsResult = await db.from("creator_profiles").select("id").order("created_at"); check(creatorsResult);
const seededProjects = [];
for (let i = 0; i < 24 && usableCustomers.length; i++) {
  const id = `${(5000 + i).toString(16).padStart(8,"0")}-1000-4000-8000-000000000001`;
  const customer = usableCustomers[i % usableCustomers.length];
  const row = { id, customer_id: customer.customerId, title: `${["TVC ra mắt sản phẩm","Chiến dịch TikTok","Bộ ảnh thương hiệu","Landing page sự kiện"][i % 4]} ${i + 1}`, description: i % 6 === 0 ? "Dự án có phần mô tả dài để kiểm thử hiển thị thực tế, quy trình phê duyệt, trao đổi giữa doanh nghiệp và creator cũng như nhiều mốc bàn giao liên tiếp." : "Dự án truyền thông thực tế dành cho thương hiệu Việt.", category: categoryNames[i % categoryNames.length], budget: 8000000 + i * 1750000, deadline: new Date(Date.now() + (i + 10) * 86400000).toISOString().slice(0,10), status: ["DRAFT","SUBMITTED","REVIEWING","IN_PROGRESS","COMPLETED","CANCELLED"][i % 6], progress: [0,10,25,65,100,0][i % 6], scope: "Concept, tiền kỳ, sản xuất, hậu kỳ và nghiệm thu." };
  check(await db.from("projects").upsert(row)); seededProjects.push({ id, ...customer });
}
for (const [i, name] of ["The Coffee House","Glowry","Coolmate","TikTok Shop","Hikari","Sapo"].entries()) check(await db.from("partners").upsert({ id: `${(6000 + i).toString(16).padStart(8,"0")}-1000-4000-8000-000000000001`, name, logo: "", website: "", description: `Đối tác thương hiệu ${name}`, industry: "Thương hiệu Việt", display_order: i + 1, active: true }));
for (let i = 0; i < seededProjects.length; i += 6) {
  const project=seededProjects[i + 4]; if(!project) continue;
  const reviewId=`${(6500 + i).toString(16).padStart(8,"0")}-1000-4000-8000-000000000001`;
  check(await db.from("reviews").upsert({ id: reviewId, project_id: project.id, customer_id: project.customerId, rating: 5, quality_rating: 5, communication_rating: 5, value_rating: 5, comment: "MediaHub làm việc chuyên nghiệp, quy trình rõ ràng và chất lượng đầu ra vượt mong đợi." }));
  check(await db.from("testimonials").upsert({ review_id: reviewId, content: "MediaHub giúp chúng tôi biến brief thành chiến dịch hoàn chỉnh rất nhanh. Đội ngũ trẻ, sáng tạo nhưng quy trình làm việc chặt chẽ, minh bạch và luôn đảm bảo chất lượng.", status: "APPROVED", published_at: new Date().toISOString() }, { onConflict: "review_id" }));
}
for (let i = 0; i < 36 && seededProjects.length; i++) {
  const project = seededProjects[i % seededProjects.length], creator = creatorsResult.data[i % creatorsResult.data.length];
  check(await db.from("project_applications").upsert({ creator_id: creator.id, project_id: project.id, cover_letter: `Tôi đề xuất hướng triển khai phù hợp insight và ngân sách của dự án. Hồ sơ ứng tuyển ${i + 1}.`, proposed_price: 5000000 + i * 250000, proposed_duration: `${5 + i % 15} ngày`, status: ["PENDING","SHORTLISTED","ACCEPTED","REJECTED"][i % 4] }, { onConflict: "creator_id,project_id" }));
  check(await db.from("creator_reviews").upsert({ id: `${(7000 + i).toString(16).padStart(8,"0")}-1000-4000-8000-000000000001`, creator_id: creator.id, reviewer_id: project.profileId, project_id: project.id, rating: i % 8 === 0 ? 3 : 4 + i % 2, content: i % 5 === 0 ? "Creator giao tiếp rõ ràng, chủ động đề xuất phương án và xử lý phản hồi nhanh. Sản phẩm cuối cùng bám sát brief, có chất lượng hình ảnh tốt và file bàn giao đầy đủ." : "Làm việc chuyên nghiệp, đúng tiến độ và phối hợp tốt cùng MediaHub." }));
}
const allProfiles = await db.from("profiles").select("id").limit(30); check(allProfiles);
for (let i = 0; i < 30 && allProfiles.data.length; i++) check(await db.from("notifications").upsert({ id: `${(8000 + i).toString(16).padStart(8,"0")}-1000-4000-8000-000000000001`, user_id: allProfiles.data[i % allProfiles.data.length].id, title: ["Có ứng tuyển mới","Dự án được duyệt","Tin nhắn mới","Thanh toán thành công","Đánh giá mới"][i % 5], message: `Thông báo demo số ${i + 1} với nội dung thực tế để kiểm tra trạng thái đã đọc và chưa đọc.`, type: ["PROJECT_APPLICATION","PROJECT_APPROVED","MESSAGE","PAYMENT","REVIEW"][i % 5], read_at: i % 3 === 0 ? new Date().toISOString() : null }));
for (let i = 0; i < 12 && seededProjects.length; i++) {
  const project = seededProjects[i], conversationId = `${(9000 + i).toString(16).padStart(8,"0")}-1000-4000-8000-000000000001`;
  check(await db.from("conversations").upsert({ id: conversationId, subject: `Trao đổi dự án ${i + 1}`, project_id: project.id }));
  const recipient = allProfiles.data.find((candidate) => candidate.id !== project.profileId);
  if (recipient) check(await db.from("conversation_members").upsert([{ conversation_id: conversationId, profile_id: project.profileId, last_read_at: i % 3 === 0 ? new Date().toISOString() : null }, { conversation_id: conversationId, profile_id: recipient.id, last_read_at: null }]));
  for (let n = 0; n < 4 && recipient; n++) check(await db.from("conversation_messages").upsert({ id: `${(10000 + i * 4 + n).toString(16).padStart(8,"0")}-1000-4000-8000-000000000001`, conversation_id: conversationId, sender_id: n % 2 ? project.profileId : recipient.id, content: ["MediaHub đã nhận brief và đang rà soát yêu cầu.","Mình gửi thêm tài liệu tham khảo cho đội ngũ.","Bản preview mới đã sẵn sàng để nhận phản hồi.","Đã xác nhận, vui lòng tiếp tục mốc tiếp theo."][n] }));
}
console.log(JSON.stringify({ workflowSeeded: true, projects: seededProjects.length, applications: 36, creatorReviews: 36, notifications: 30, conversations: 12, messages: 48 }));
