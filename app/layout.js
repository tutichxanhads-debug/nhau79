import "./globals.css";

const NAME = process.env.NEXT_PUBLIC_APP_NAME || "Nhậu 79";
const LOGO = process.env.NEXT_PUBLIC_APP_LOGO === "none" ? "" : process.env.NEXT_PUBLIC_APP_LOGO || "/logo.png";

export const metadata = {
  title: NAME,
  description: "Web order món ăn cho quán nhậu " + NAME + " — Admin / Staff / Khách hàng",
  // Logo quán dùng luôn làm biểu tượng tab trình duyệt và biểu tượng khi thêm vào màn hình chính điện thoại.
  ...(LOGO ? { icons: { icon: LOGO, apple: LOGO } } : {}),
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
