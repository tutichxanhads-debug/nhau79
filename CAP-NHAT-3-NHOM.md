# Bản chia thực đơn thành 3 phần

1. Món nhậu - món ăn nhanh
2. Món lẩu - nướng
3. Đồ uống

Trang khách có 3 nút chọn nhóm. Trang quản trị hiển thị 3 phần và cho chọn đúng 3 nhóm khi thêm/sửa món.

Món đang lưu ở Món nhậu, Món chiên, Món xào sẽ vào phần 1. Món nướng và Canh - Lẩu vào phần 2. Đồ uống vào phần 3. Việc chuyển nhóm giữ nguyên mã món, tên, giá, ảnh và trạng thái. Các mục gọi thêm đã lưu trong Canh - Lẩu tiếp tục nằm trong phần 2.

Cách cập nhật website hiện tại:
- Thay components/QuanNhauKit.jsx bằng bản trong gói này.
- Thêm lib/menuGroups.mjs.
- Đưa thay đổi lên dự án Vercel đang dùng, giữ nguyên các biến môi trường Supabase hiện tại.
- Không cần chạy lại schema.sql, không tạo database mới, không reset dữ liệu.

Gói này không chứa bản sao dữ liệu Supabase. Các món đã nhập trên website vẫn được đọc từ database hiện tại. Không thay danh sách món đang lưu bằng danh sách mẫu trong code.
