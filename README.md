# Nhậu 79 — Hướng dẫn xuất bản bản thật (không cần biết code)

Làm theo đúng thứ tự 3 phần dưới đây. Mỗi phần chỉ cần bấm chuột / copy-paste, không cần cài phần mềm hay gõ lệnh gì trên máy tính.

---

## PHẦN 1 — Tạo database thật (Supabase), khoảng 5 phút

1. Vào https://supabase.com → bấm **Start your project** → đăng ký (có thể dùng tài khoản GitHub cho nhanh).
2. Sau khi đăng nhập, bấm **New project**.
3. Điền: tên project (VD: `quan-nhau-47`), bấm **Generate a password** rồi **Copy** để lưu lại (không dùng đến sau này nhưng nên lưu phòng khi cần), chọn Region gần Việt Nam nhất (Singapore).
4. Bấm **Create new project**, đợi khoảng 1–2 phút để Supabase khởi tạo xong.
5. Ở menu bên trái, bấm vào biểu tượng **SQL Editor** → **New query**.
6. Mở file `supabase/schema.sql` trong thư mục dự án này, copy toàn bộ nội dung, dán vào ô SQL Editor.
7. Bấm nút **Run** (hoặc Ctrl+Enter). Thấy thông báo "Success" là xong — database đã sẵn sàng.
8. Vào **Project Settings** (biểu tượng bánh răng) → **API**. Bạn sẽ thấy 2 giá trị cần lấy:
   - **Project URL** (dạng `https://xxxxx.supabase.co`)
   - **anon public key** (chuỗi ký tự dài)
   
   Copy 2 giá trị này ra, lát nữa sẽ dùng ở Phần 3.

---

## PHẦN 2 — Đưa code lên GitHub, khoảng 5 phút

1. Vào https://github.com → đăng ký tài khoản nếu chưa có.
2. Bấm nút **+** góc trên bên phải → **New repository**.
3. Đặt tên repo, VD: `quan-nhau-47` → chọn **Public** hoặc **Private** đều được → bấm **Create repository**.
4. Ở trang repo vừa tạo, bấm **uploading an existing file** (hoặc **Add file** → **Upload files**).
5. Kéo thả **toàn bộ nội dung** thư mục dự án (tất cả file/folder bên trong, KHÔNG kéo cả thư mục cha vào) vào ô upload của GitHub. Trình duyệt hiện đại sẽ giữ nguyên cấu trúc thư mục con.
6. Cuộn xuống, bấm **Commit changes**.

> Lưu ý: không cần upload thư mục `node_modules` (dự án này chưa có sẵn thư mục đó — Vercel sẽ tự cài ở bước sau).

---

## PHẦN 3 — Deploy lên Vercel (tạo website thật), khoảng 5 phút

1. Vào https://vercel.com → bấm **Sign Up** → chọn **Continue with GitHub** (đăng nhập bằng tài khoản GitHub ở Phần 2).
2. Sau khi vào Dashboard, bấm **Add New...** → **Project**.
3. Tìm và bấm **Import** ở đúng repo `quan-nhau-47` bạn vừa tạo.
4. Ở màn hình cấu hình, mở phần **Environment Variables**, thêm đúng 2 biến sau (copy từ Phần 1, bước 8):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL của bạn |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key của bạn |

5. Bấm **Deploy**. Đợi khoảng 1–2 phút.
6. Khi thấy pháo hoa 🎉 là xong! Vercel sẽ cho bạn 1 đường link dạng `https://quan-nhau-47.vercel.app` — đây chính là **website thật**, ai cũng vào được, chạy 24/7 miễn phí.

---

## Dùng thử sau khi deploy

- `https://<domain-cua-ban>.vercel.app` → màn chọn vai trò
- `https://<domain-cua-ban>.vercel.app/admin` → Chủ quán
- `https://<domain-cua-ban>.vercel.app/staff` → Nhân viên
- `https://<domain-cua-ban>.vercel.app/menu/1` → Khách bàn số 1

Vào `/admin` → tab **Bàn** → bấm nút **QR** ở từng bàn để lấy mã QR thật (đã tự trỏ đúng domain vừa deploy) — in ra dán lên bàn là dùng được ngay.

---

## Deploy thêm cho quán thứ 2, thứ 3 (test nhiều quán cùng lúc)

Không cần tạo lại GitHub repo. Chỉ cần lặp lại như sau cho mỗi quán mới:

1. **Tạo 1 Supabase project mới** cho quán đó (lặp lại PHẦN 1 ở trên) → chạy `supabase/schema.sql` → lấy Project URL + Publishable key riêng của quán này.
2. Trong Vercel, bấm **Add New → Project → Import** và chọn **lại đúng repo GitHub cũ** (Vercel cho phép import cùng 1 repo nhiều lần, tạo ra project độc lập).
3. Đặt **Project Name** riêng cho quán này (VD: `quan-abc`).
4. Ở phần Environment Variables, điền:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` → của Supabase project mới ở bước 1 (không dùng lại của quán cũ).
   - `NEXT_PUBLIC_APP_NAME` → tên quán mới, VD: `Quán ABC`
   - `NEXT_PUBLIC_APP_TAGLINE` → khẩu hiệu riêng nếu muốn (không bắt buộc).
   - `NEXT_PUBLIC_APP_LOGO` → **đặt `none`** nếu quán này không dùng logo Nhậu 79 (app sẽ hiện biểu tượng ly bia). Muốn dùng logo riêng: bỏ file ảnh tròn vào thư mục `public` (VD `logo-quan-abc.png`) rồi điền `/logo-quan-abc.png`.
5. Bấm **Deploy**.

Kết quả: mỗi quán có 1 link riêng (`quan-abc.vercel.app`), 1 database riêng, dữ liệu hoàn toàn tách biệt — không đụng chạm gì đến quán Nhậu 79 gốc.

---

## Cập nhật V2 (BẮT BUỘC làm trước khi upload code mới)

Bản này đổi cách lưu order (mỗi order 1 dòng riêng trong database, bền khi quán chạy nhiều tháng), thêm huỷ/sửa món, ảnh món ăn, thanh toán có kiểm tra khớp tiền, và "ngày kinh doanh" tính từ 5h sáng.

**Làm theo đúng thứ tự, cho TỪNG quán (mỗi quán 1 Supabase project):**

1. Vào Supabase của quán → **SQL Editor** → **New query**.
2. Copy toàn bộ file `supabase/schema.sql`, dán vào, bấm **Run**. Thấy "Success" là xong. File này dùng được cho cả quán mới lẫn quán đang chạy, chạy lại nhiều lần vẫn an toàn; order cũ tự động được chuyển sang bảng mới.
3. **Ngay sau đó** upload code mới lên GitHub (Vercel tự deploy lại sau 1-2 phút). Nên làm lúc quán vắng vì giữa bước 2 và khi Vercel deploy xong, bản cũ sẽ báo lỗi ngắn.

Nếu quên chạy SQL, app sẽ hiện dòng cảnh báo đỏ "Database chưa được cập nhật" — chạy file SQL là hết.

---

## QR thanh toán chuyển khoản (VietQR)

Khi khách bấm "Yêu cầu thanh toán", Staff giờ có thêm nút **"QR thanh toán"** (ở banner đầu trang, hoặc trong chi tiết bàn) — hiện mã QR VietQR với đúng số tiền cần thu, khách chỉ cần quét bằng app ngân hàng bất kỳ để chuyển khoản, không cần nhập tay số tiền/nội dung.

**Cần cài đặt 1 lần:** vào **Admin → tab Nhân viên**, điền:
- Ngân hàng (chọn từ danh sách)
- Số tài khoản
- Tên chủ tài khoản

Miễn phí, không cần đăng ký gì thêm với VietQR — chỉ cần đúng thông tin tài khoản của quán.

---

## In hóa đơn ra máy in nhiệt

Nút **"In hóa đơn"** (bên Staff, trong chi tiết từng bàn) đã canh đúng khổ giấy in nhiệt (58mm hoặc 80mm — chọn ở **Admin → tab Nhân viên → "Khổ giấy in hóa đơn"**).

**Khi mua máy in, chọn loại máy in nhiệt (thermal) hỗ trợ cài như máy in thường** trên Windows/Android (qua USB hoặc Bluetooth, có driver/app đi kèm) — không cần loại chuyên dụng POS phức tạp. Cách hoạt động: bấm "In hóa đơn" → trình duyệt mở hộp thoại in → chọn đúng máy in nhiệt đó → in ra. Gợi ý dòng máy phổ biến, giá tốt tại VN: **Xprinter XP-58IIH / XP-80C** (USB), hoặc bản có Bluetooth nếu muốn in từ điện thoại/máy tính bảng cầm tay.

Nếu sau này muốn in tự động (không cần bấm xác nhận in mỗi lần) hoặc in qua mạng LAN không cần máy tính trung gian, quay lại nhắn Claude — sẽ cần thêm 1 phần mềm cầu nối nhỏ chạy trên máy tính quầy thu ngân, phức tạp hơn nên để sau khi đã có máy in thật để test.

---

## Reset ngày mới (ngày kinh doanh bắt đầu lúc 5h sáng)

Quán nhậu hay mở quá nửa đêm, nên app tính **"ngày kinh doanh" từ 5h sáng giờ Việt Nam** (không phải 0h): bàn đang ngồi lúc 1-2h sáng vẫn được giữ nguyên, tính doanh thu chung vào ngày hôm đó. Sau 5h sáng, người đầu tiên mở app (Admin/Staff/Khách) sẽ tự kích hoạt dọn các order còn treo từ hôm trước để mọi bàn về "Trống". **Doanh thu đã thanh toán không bao giờ bị xoá.** Muốn đóng ca ngay, vào **Admin → tab Tổng quan**, bấm **"Đóng ca / Reset ngay"**.

---

## Tên quán & logo

- **Tên quán** mặc định là `Nhậu 79`, **logo** là file `public/logo.png` (ảnh tròn 512px). Cả hai hiện ở thanh trên cùng, trang chủ, màn nhập PIN, biểu tượng tab trình duyệt/màn hình chính điện thoại; tên quán còn in trên hóa đơn.
- Muốn thay logo: thay file `public/logo.png` bằng ảnh mới (nên là ảnh vuông, nền đã cắt tròn hoặc nền đen) rồi upload lại lên GitHub.
- Nếu trong Vercel (Settings → Environment Variables) bạn từng thêm `NEXT_PUBLIC_APP_NAME` với tên cũ, hãy sửa lại thành `Nhậu 79` — biến này luôn được ưu tiên hơn giá trị mặc định trong code.

---

## Lưu ý quan trọng

- **Bảo mật**: `/admin` và `/staff` hiện đã yêu cầu mã PIN chung, mặc định là `1947`. Đăng nhập lần đầu bằng mã này, sau đó vào Admin → tab **Nhân viên** → đổi mã PIN mới ngay. Mã PIN chỉ cần nhập 1 lần mỗi phiên trình duyệt (đóng tab/xoá cache sẽ cần nhập lại).
- **Cập nhật code sau này**: mỗi khi muốn sửa gì, chỉ cần lên GitHub sửa/upload lại file → Vercel tự động deploy lại bản mới trong khoảng 1 phút, không cần làm lại từ đầu.
- **Chi phí**: Supabase và Vercel đều có gói miễn phí đủ dùng cho 1 quán nhậu quy mô vừa. Nếu lượng khách rất lớn, có thể cần nâng cấp gói trả phí sau này.
