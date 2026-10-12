"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MENU_GROUPS, normalizeMenuGroups } from "@/lib/menuGroups.mjs";
import {
  Beer, Utensils, ClipboardList, ShoppingCart, Plus, Minus, Trash2, Check,
  X, TrendingUp, Users, Table2, ChefHat, Receipt, Send, Clock, CheckCircle2,
  ArrowLeft, LogOut, Pencil, Save, QrCode, Flame, Wallet, BarChart3,
  ClipboardCheck, RefreshCcw, PlusCircle, AlertTriangle, Store, Bell,
  CreditCard, BellRing, Loader2, Printer, Camera
} from "lucide-react";

/* ============================================================================
   THEME TOKENS — "Quán Nhậu Đêm" (đêm nhậu vỉa hè, đèn dây, hơi khói than nướng)
   Màu: than đen ấm, gỗ nâu, vàng bia lên men, đỏ ớt, xanh lá đậu phộng
============================================================================ */
const C = {
  bg: "#181310",
  bgSoft: "#211914",
  surface: "#2A1F18",
  surfaceHi: "#352822",
  line: "#453325",
  gold: "#C98A4B",
  goldDim: "#7D5530",
  chili: "#A8471F",
  chiliDim: "#6B2E14",
  leaf: "#7C8A54",
  cream: "#F1E6D6",
  muted: "#B0A08A",
  mutedDim: "#7C6C57",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');`;

const fmt = (n) => (n || 0).toLocaleString("vi-VN") + "\u20ab";
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
/* "Ngày kinh doanh" theo giờ Việt Nam (UTC+7 cố định), BẮT ĐẦU LÚC 5H SÁNG: quán mở
   quá nửa đêm vẫn tính chung vào ngày hôm đó (doanh thu, reset). +7h -5h = +2h.
   Phải khớp với hàm qn_business_day trong database. */
const todayKey = (ts) => {
  const d = new Date(ts + 2 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* Tên quán, khẩu hiệu & logo — đọc từ biến môi trường để dùng chung 1 bộ code cho nhiều quán,
   mỗi quán chỉ cần đặt env var khác nhau lúc deploy, không cần sửa code.
   Logo mặc định là /logo.png (file nằm trong thư mục public). Quán nào không dùng logo này
   thì đặt NEXT_PUBLIC_APP_LOGO=none (hiện biểu tượng ly bia) hoặc trỏ tới ảnh khác. */
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Nhậu 79";
const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || "MỒI NGON · BIA LẠNH · BẠN HIỀN";
const APP_LOGO = process.env.NEXT_PUBLIC_APP_LOGO === "none" ? "" : process.env.NEXT_PUBLIC_APP_LOGO || "/logo.png";

/* ============================================================================
   DEFAULT DATA
============================================================================ */
const DEFAULT_CATEGORIES = MENU_GROUPS;

const DEFAULT_MENU = [
  { id: uid(), name: "Gỏi khô bò", category: "Món nhậu", price: 65000, emoji: "🥗", available: true, spicy: false },
  { id: uid(), name: "Nem chua rán", category: "Món nhậu", price: 45000, emoji: "🍢", available: true, spicy: false },
  { id: uid(), name: "Chân gà rút xương sả tắc", category: "Món nhậu", price: 85000, emoji: "🍗", available: true, spicy: true },
  { id: uid(), name: "Ốc hương rang muối", category: "Món nhậu", price: 120000, emoji: "🐚", available: true, spicy: false },
  { id: uid(), name: "Lòng heo chiên giòn", category: "Món chiên", price: 75000, emoji: "🍖", available: true, spicy: false },
  { id: uid(), name: "Đậu hũ chiên sả ớt", category: "Món chiên", price: 40000, emoji: "🧆", available: true, spicy: true },
  { id: uid(), name: "Ba chỉ nướng mọi", category: "Món nướng", price: 95000, emoji: "🥓", available: true, spicy: false },
  { id: uid(), name: "Bò lá lốt nướng", category: "Món nướng", price: 90000, emoji: "🍡", available: true, spicy: false },
  { id: uid(), name: "Ếch xào lăn", category: "Món xào", price: 110000, emoji: "🐸", available: true, spicy: true },
  { id: uid(), name: "Mực xào sa tế", category: "Món xào", price: 130000, emoji: "🦑", available: true, spicy: true },
  { id: uid(), name: "Canh chua cá lóc", category: "Canh - Lẩu", price: 95000, emoji: "🍲", available: true, spicy: false },
  { id: uid(), name: "Lẩu thái hải sản", category: "Canh - Lẩu", price: 250000, emoji: "🍜", available: true, spicy: true },
  { id: uid(), name: "Bia Sài Gòn", category: "Đồ uống", price: 20000, emoji: "🍺", available: true, spicy: false },
  { id: uid(), name: "Bia Tiger", category: "Đồ uống", price: 22000, emoji: "🍺", available: true, spicy: false },
  { id: uid(), name: "Nước ngọt", category: "Đồ uống", price: 15000, emoji: "🥤", available: true, spicy: false },
  { id: uid(), name: "Soda chanh muối", category: "Đồ uống", price: 25000, emoji: "🍋", available: true, spicy: false },
  { id: uid(), name: "Rượu đế", category: "Đồ uống", price: 30000, emoji: "🥃", available: true, spicy: false },
];

const DEFAULT_TABLES = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), name: "Bàn " + (i + 1) }));

const DEFAULT_STAFF = [
  { id: uid(), name: "Nguyễn Văn A", role: "Phục vụ" },
  { id: uid(), name: "Trần Thị B", role: "Thu ngân" },
  { id: uid(), name: "Lê Văn C", role: "Bếp" },
];

const DEFAULT_CONFIG = {
  categories: DEFAULT_CATEGORIES,
  menu: normalizeMenuGroups({ menu: DEFAULT_MENU }).menu,
  tables: DEFAULT_TABLES,
  staff: DEFAULT_STAFF,
  pin: "1947",
  receiptWidth: "80mm",
  bank: { bankId: "", accountNo: "", accountName: "" },
};

/* Danh sách ngân hàng phổ biến hỗ trợ VietQR — value là mã VietQR dùng trong link tạo QR. */
const VIETQR_BANKS = [
  { label: "Vietcombank", value: "vietcombank" },
  { label: "Techcombank", value: "techcombank" },
  { label: "MB Bank", value: "mbbank" },
  { label: "ACB", value: "acb" },
  { label: "BIDV", value: "bidv" },
  { label: "VietinBank", value: "vietinbank" },
  { label: "Sacombank", value: "sacombank" },
  { label: "TPBank", value: "tpbank" },
  { label: "VPBank", value: "vpbank" },
  { label: "Agribank", value: "agribank" },
  { label: "HDBank", value: "hdbank" },
  { label: "SHB", value: "shb" },
  { label: "MSB", value: "msb" },
  { label: "OCB", value: "ocb" },
  { label: "SeABank", value: "seabank" },
  { label: "VIB", value: "vib" },
];

/* Bỏ dấu tiếng Việt — VietQR yêu cầu accountName/addInfo không dấu, không ký tự đặc biệt. */
function stripDiacritics(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
}

/* Tạo link ảnh QR chuyển khoản VietQR (Quick Link, không cần API key). */
function vietQrUrl(bank, amount, addInfo) {
  if (!bank?.bankId || !bank?.accountNo) return null;
  const params = new URLSearchParams();
  if (amount > 0) params.set("amount", String(Math.round(amount)));
  if (addInfo) params.set("addInfo", stripDiacritics(addInfo).slice(0, 25));
  if (bank.accountName) params.set("accountName", stripDiacritics(bank.accountName));
  return `https://img.vietqr.io/image/${bank.bankId}-${bank.accountNo}-compact2.png?${params.toString()}`;
}

const STATUS_FLOW = ["pending", "confirmed", "served"];
const STATUS_LABEL = { pending: "Chờ xác nhận", confirmed: "Đang chế biến", served: "Đã phục vụ" };
const STATUS_COLOR = { pending: C.chili, confirmed: C.gold, served: C.leaf };

/* Item-level kitchen <-> service workflow (bếp & phục vụ dùng chung) */
const ITEM_STATUS_FLOW = ["received", "done", "served"];
const ITEM_STATUS_LABEL = { received: "Đã nhận món", done: "Đã xong món", served: "Đã phục vụ" };
const ITEM_STATUS_COLOR = { received: C.chili, done: C.gold, served: C.leaf };
const ITEM_STATUS_ICON_TONE = { received: "chili", done: "gold", served: "leaf" };

/* ============================================================================
   STORAGE HOOK — dùng Supabase (bảng app_state: key/value dạng JSON)
   Đọc lần đầu + lắng nghe realtime (postgres_changes) + poll dự phòng.
   Giữ nguyên interface [data, save, loaded, load] để mọi component phía dưới
   không cần đổi gì cả.
============================================================================ */
function useSharedState(key, initialValue, pollMs) {
  const [data, setData] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef(false);
  const channelId = useRef(Math.random().toString(36).slice(2, 8)); // tên kênh riêng cho từng nơi dùng, tránh trùng

  const load = useCallback(async () => {
    if (savingRef.current) return;
    try {
      const { data: row, error } = await supabase.from("app_state").select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      if (row && row.value) setData(key === "qn-config" ? normalizeMenuGroups(row.value) : row.value);
      else {
        await supabase.from("app_state").upsert({ key, value: initialValue });
        setData(initialValue);
      }
    } catch (e) {
      console.error("Supabase load failed for key " + key, e);
    } finally {
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const save = useCallback(
    async (updater) => {
      setData((prev) => {
        const updated = typeof updater === "function" ? updater(prev) : updater;
        const next = key === "qn-config" ? normalizeMenuGroups(updated) : updated;
        savingRef.current = true;
        supabase
          .from("app_state")
          .upsert({ key, value: next, updated_at: new Date().toISOString() })
          .then(({ error }) => {
            if (error) console.error("Supabase save failed for key " + key, error);
          })
          .finally(() => {
            savingRef.current = false;
          });
        return next;
      });
    },
    [key]
  );

  useEffect(() => {
    load();
    const channel = supabase
      .channel("app_state_" + key + "_" + channelId.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_state", filter: `key=eq.${key}` },
        (payload) => {
          if (savingRef.current) return;
          if (payload.new && payload.new.value) setData(key === "qn-config" ? normalizeMenuGroups(payload.new.value) : payload.new.value);
        }
      )
      .subscribe();
    // Poll dự phòng phòng khi realtime bị rớt kết nối
    const t = setInterval(load, pollMs || 15000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load, pollMs, key]);

  return [data, save, loaded, load];
}

/* ============================================================================
   SMALL UI PRIMITIVES
============================================================================ */
function GlobalStyle() {
  return (
    <style>{`
      ${FONT_IMPORT}
      .qn-root { font-family: 'Be Vietnam Pro', sans-serif; color: ${C.cream}; background: ${C.bg};
        background-image: radial-gradient(ellipse 900px 500px at 15% -10%, rgba(227,168,87,0.08), transparent 60%),
                           radial-gradient(ellipse 700px 500px at 100% 0%, rgba(193,68,46,0.08), transparent 55%);
        min-height: 100%; }
      .qn-display { font-family: 'Oswald', sans-serif; letter-spacing: 0.02em; }
      .qn-neon { text-shadow: 0 0 6px rgba(227,168,87,0.55), 0 0 18px rgba(227,168,87,0.28); }
      .qn-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
      .qn-scrollbar::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 999px; }
      .qn-flicker { animation: qnflicker 5s infinite; }
      @keyframes qnflicker {
        0%, 92%, 100% { opacity: 1; }
        93% { opacity: 0.4; }
        94% { opacity: 1; }
        95% { opacity: 0.5; }
        96% { opacity: 1; }
      }
      .qn-foam { transition: width 0.5s ease; }
      .qn-card-hover { transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease; }
      .qn-card-hover:active { transform: scale(0.97); }
      @media (min-width: 640px) {
        .qn-card-hover:hover { transform: translateY(-2px); border-color: ${C.gold}; box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
      }
      .qn-btn { transition: filter .15s ease, transform .1s ease; }
      .qn-btn:hover { filter: brightness(1.08); }
      .qn-btn:active { transform: scale(0.96); }
      input, select, textarea { font-family: 'Be Vietnam Pro', sans-serif; }
      ::placeholder { color: ${C.mutedDim}; }
      .qn-focus:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
    `}</style>
  );
}

function Logo({ size = "md" }) {
  const big = size === "lg";

  // Màn hình lớn (trang chủ, nhập PIN): hiện nguyên logo, logo đã có sẵn chữ tên quán nên chỉ thêm khẩu hiệu bên dưới.
  if (APP_LOGO && big) {
    return (
      <div className="flex flex-col items-center">
        <img
          src={APP_LOGO}
          alt={APP_NAME}
          width={160}
          height={160}
          className="rounded-full"
          style={{ width: 160, height: 160, boxShadow: "0 0 40px rgba(245,179,53,0.28)" }}
        />
        <div className="text-xs tracking-widest mt-4 text-center" style={{ color: C.muted }}>{APP_TAGLINE}</div>
      </div>
    );
  }

  // Thanh trên cùng: logo nhỏ + tên quán (logo nhỏ khó đọc chữ nên vẫn ghi tên bên cạnh).
  return (
    <div className="flex items-center gap-2">
      {APP_LOGO ? (
        <img
          src={APP_LOGO}
          alt={APP_NAME}
          width={big ? 52 : 38}
          height={big ? 52 : 38}
          className="rounded-full shrink-0"
          style={{ width: big ? 52 : 38, height: big ? 52 : 38 }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full qn-flicker"
          style={{
            width: big ? 52 : 34,
            height: big ? 52 : 34,
            background: `radial-gradient(circle, ${C.chili} 0%, ${C.chiliDim} 70%)`,
            boxShadow: `0 0 22px rgba(193,68,46,0.55)`,
          }}
        >
          <Beer size={big ? 26 : 18} color={C.cream} />
        </div>
      )}
      <div>
        <div className={"qn-display qn-neon font-semibold " + (big ? "text-2xl" : "text-base")} style={{ color: C.gold, lineHeight: 1 }}>
          {APP_NAME.toUpperCase()}
        </div>
        {big && <div className="text-xs tracking-widest" style={{ color: C.muted }}>{APP_TAGLINE}</div>}
      </div>
    </div>
  );
}

function Pill({ children, tone = "gold" }) {
  const map = {
    gold: { bg: "rgba(227,168,87,0.15)", fg: C.gold, bd: C.goldDim },
    chili: { bg: "rgba(193,68,46,0.18)", fg: "#F0937F", bd: C.chiliDim },
    leaf: { bg: "rgba(122,148,99,0.18)", fg: "#B7D19E", bd: C.leaf },
    muted: { bg: "rgba(178,161,140,0.12)", fg: C.muted, bd: C.line },
  };
  const t = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}
    >
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "solid", tone = "gold", size = "md", disabled, className = "", type = "button" }) {
  const toneColor = tone === "chili" ? C.chili : tone === "leaf" ? C.leaf : tone === "muted" ? C.surfaceHi : C.gold;
  const textOnSolid = tone === "muted" ? C.cream : "#1B1410";
  const base = "qn-btn qn-focus inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold disabled:opacity-40 disabled:pointer-events-none";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
  const style =
    variant === "solid"
      ? { background: toneColor, color: textOnSolid }
      : variant === "outline"
      ? { background: "transparent", color: toneColor, border: `1.5px solid ${toneColor}` }
      : { background: "transparent", color: toneColor };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base + " " + sizes[size] + " " + className} style={style}>
      {children}
    </button>
  );
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={"rounded-2xl " + className} style={{ background: C.surface, border: `1px solid ${C.line}`, ...style }}>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="rounded-full p-4 mb-4" style={{ background: C.surfaceHi }}>
        <Icon size={28} color={C.muted} />
      </div>
      <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>{title}</div>
      <div className="text-sm mt-1 max-w-xs" style={{ color: C.muted }}>{desc}</div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium"
      style={{ background: C.surfaceHi, border: `1px solid ${C.gold}`, color: C.cream }}
    >
      <CheckCircle2 size={16} color={C.leaf} />
      {toast}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  };
  return [toast, show];
}

/* ============================================================================
   ĐỌC ORDER TỪ BẢNG `orders` (mỗi đơn 1 dòng). Chỉ tải các đơn CHƯA thanh toán nên
   luôn nhẹ, dù lịch sử bán hàng có lớn đến đâu. tableId: chỉ lấy đơn của bàn đó.
   Cập nhật tức thì qua realtime + tự tải lại mỗi 10 giây phòng mất kết nối.
============================================================================ */
function rowToOrder(r) {
  return {
    id: r.id,
    tableId: r.table_id,
    items: Array.isArray(r.items) ? r.items : [],
    paid: !!r.paid,
    createdAt: Number(r.created_at),
    paidAt: r.paid_at == null ? null : Number(r.paid_at),
  };
}

function useOrders(tableId) {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      let q = supabase.from("orders").select("*").eq("paid", false);
      if (tableId) q = q.eq("table_id", tableId);
      const { data, error: err } = await q.order("created_at", { ascending: true });
      if (err) throw err;
      if (!alive.current) return;
      setOrders((data || []).map(rowToOrder).filter((o) => o.items.length > 0));
      setError(null);
    } catch (e) {
      console.error("Không tải được order", e);
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setLoaded(true);
    }
  }, [tableId]);

  useEffect(() => {
    alive.current = true;
    load();
    const schedule = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(load, 250);
    };
    const channel = supabase
      .channel("orders_" + (tableId || "all") + "_" + Math.random().toString(36).slice(2, 8))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", ...(tableId ? { filter: `table_id=eq.${tableId}` } : {}) },
        schedule
      )
      .subscribe();
    const poll = setInterval(load, 10000);
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [load, tableId]);

  return [orders, loaded, load, error];
}

/* Báo cáo doanh thu tổng hợp sẵn trong database (không tải lịch sử order về máy). */
function useRevenue(days = 30, pollMs = 20000) {
  const [report, setReport] = useState(null);
  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("qn_revenue_report", { p_days: days });
      if (error) throw error;
      setReport(data);
    } catch (e) {
      console.error("Không tải được báo cáo doanh thu", e);
      setReport((r) => r || { days: [], top: [], failed: true });
    }
  }, [days]);
  useEffect(() => {
    load();
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);
  return [report, load];
}

/* Cảnh báo dễ hiểu khi database chưa được cập nhật (chưa chạy file SQL V2). */
function DbWarning({ error }) {
  if (!error) return null;
  const missing = /does not exist|schema cache|PGRST20|42P01/i.test(String(error.message || "") + String(error.code || ""));
  return (
    <div className="mx-4 sm:mx-6 mt-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(193,68,46,0.16)", border: `1px solid ${C.chili}`, color: "#F0937F" }}>
      <AlertTriangle size={14} className="inline mr-1.5 mb-0.5" />
      {missing
        ? "Database chưa được cập nhật lên bản mới. Hãy chạy file supabase/schema.sql trong Supabase SQL Editor (xem README)."
        : "Đang mất kết nối tới database, đang thử lại..."}
    </div>
  );
}

/* ============================================================================
   ẢNH MÓN ĂN — nén ngay trên máy trước khi tải lên (tiết kiệm 4G của khách),
   lưu ở Supabase Storage (kho "menu-images").
============================================================================ */
const MENU_IMG_BUCKET = "menu-images";

/* Escape ký tự HTML — dùng khi in hóa đơn: ghi chú món là chữ KHÁCH tự gõ nên không được
   chèn thẳng vào trang in (tránh khách cài mã độc chạy trên máy nhân viên). */
function escapeHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function compressImage(file, maxSide = 720, quality = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Không đọc được ảnh này"));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Không nén được ảnh");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadMenuImage(blob) {
  const path = `${uid()}.jpg`;
  const { error } = await supabase.storage.from(MENU_IMG_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(MENU_IMG_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removeMenuImage(url) {
  try {
    const marker = `/${MENU_IMG_BUCKET}/`;
    const i = (url || "").indexOf(marker);
    if (i < 0) return;
    const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
    await supabase.storage.from(MENU_IMG_BUCKET).remove([path]);
  } catch (e) {
    console.warn("Không xoá được ảnh cũ (không ảnh hưởng)", e);
  }
}

/* Order helpers shared across views */
function orderTotal(order) {
  return order.items.reduce((s, it) => s + it.price * it.qty, 0);
}
function tableUnpaidOrders(orders, tableId) {
  return orders.filter((o) => o.tableId === tableId && !o.paid);
}
function tableBill(orders, tableId) {
  return tableUnpaidOrders(orders, tableId).reduce((s, o) => s + orderTotal(o), 0);
}
/* Derive a 3-stage order status (for customer / admin summaries) from item-level statuses */
function orderDerivedStatus(order) {
  const statuses = (order.items || []).map((it) => it.status || "received");
  if (statuses.length > 0 && statuses.every((s) => s === "served")) return "served";
  if (statuses.some((s) => s === "done")) return "confirmed";
  return "pending";
}
/* Flatten all items of unpaid orders into individual kitchen/service tickets */
function flattenActiveItems(orders, tables) {
  const list = [];
  (orders || []).forEach((o) => {
    if (o.paid) return;
    const t = (tables || []).find((x) => x.id === o.tableId);
    (o.items || []).forEach((it) => {
      list.push({
        orderId: o.id,
        itemId: it.itemId,
        tableId: o.tableId,
        tableName: t ? t.name : o.tableId,
        name: it.name,
        qty: it.qty,
        price: it.price,
        note: it.note,
        status: it.status || "received",
        createdAt: o.createdAt,
      });
    });
  });
  return list.sort((a, b) => a.createdAt - b.createdAt);
}

/* ============================================================================
   RESET NGÀY MỚI — mỗi "ngày kinh doanh" (bắt đầu 5h sáng) tự dọn các order CHƯA
   thanh toán còn treo từ hôm trước để bàn về "Trống". Đơn ĐÃ thanh toán giữ mãi.
   Mọi giao diện (Admin/Staff/Khách) đều tự kiểm tra; việc kiểm tra + dọn dẹp được
   làm trong database (theo giờ máy chủ) nên chỉ chạy đúng 1 lần dù nhiều người mở.
============================================================================ */
function useDailyReset(onDone) {
  const [meta, , metaLoaded, reloadMeta] = useSharedState("qn-meta", { lastResetDate: todayKey(Date.now()) }, 30000);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!metaLoaded || doneRef.current) return;
    if (meta.lastResetDate === todayKey(Date.now())) return;
    doneRef.current = true;
    supabase.rpc("qn_reset_day", { p_force: false }).then(({ data, error }) => {
      if (error) {
        console.error("Reset ngày mới thất bại", error);
        return;
      }
      if (data) {
        reloadMeta();
        if (onDone) onDone();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaLoaded, meta.lastResetDate]);
}

/* Reset thủ công (nút "Đóng ca / Reset ngay" trong Admin). */
async function manualDailyReset() {
  const { error } = await supabase.rpc("qn_reset_day", { p_force: true });
  if (error) throw error;
}

/* ============================================================================
   HOME / ROLE GATE
============================================================================ */
function RoleGate({ navigate }) {
  const [config] = useSharedState("qn-config", DEFAULT_CONFIG, 15000);
  const tables = config.tables || DEFAULT_TABLES;
  const [pickTable, setPickTable] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 qn-root">
      <GlobalStyle />
      <Logo size="lg" />
      <div className="mt-10 text-sm" style={{ color: C.muted }}>Chọn giao diện để tiếp tục</div>

      {!pickTable ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <RoleCard icon={Store} title="Admin" desc="Chủ quán — bàn, món, order, doanh thu, nhân viên" onClick={() => navigate("/admin")} />
          <RoleCard icon={ChefHat} title="Staff" desc="Nhân viên — theo dõi bàn, order, thanh toán" onClick={() => navigate("/staff")} />
          <RoleCard icon={QrCode} title="Khách hàng" desc="Quét QR tại bàn để xem menu & gọi món" onClick={() => setPickTable(true)} />
        </div>
      ) : (
        <Card className="mt-6 w-full max-w-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>Demo: chọn bàn</div>
            <button onClick={() => setPickTable(false)} className="qn-focus" style={{ color: C.muted }}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-4 gap-2 qn-scrollbar" style={{ maxHeight: 260, overflowY: "auto" }}>
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate("/menu/" + t.id)}
                className="qn-btn qn-focus rounded-xl py-3 text-sm font-semibold"
                style={{ background: C.surfaceHi, color: C.gold, border: `1px solid ${C.line}` }}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="text-xs mt-3" style={{ color: C.mutedDim }}>Trong thực tế, mỗi bàn dán mã QR trỏ thẳng tới đường dẫn menu riêng.</div>
        </Card>
      )}
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="qn-card-hover qn-focus text-left rounded-2xl p-6" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <div className="rounded-xl p-3 inline-flex mb-4" style={{ background: "rgba(227,168,87,0.12)" }}>
        <Icon size={22} color={C.gold} />
      </div>
      <div className="qn-display text-xl font-semibold" style={{ color: C.cream }}>{title}</div>
      <div className="text-sm mt-1" style={{ color: C.muted }}>{desc}</div>
    </button>
  );
}

function TopBar({ navigate, current }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3" style={{ background: "rgba(22,18,16,0.92)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${C.line}` }}>
      <button onClick={() => navigate("")} className="qn-focus"><Logo /></button>
      <div className="flex items-center gap-2">
        <Pill tone="muted">{current}</Pill>
        <button onClick={() => navigate("")} className="qn-focus rounded-lg p-2" style={{ color: C.muted }} title="Về trang chủ">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   CUSTOMER VIEW  — /menu/:table
============================================================================ */
function CustomerApp({ tableId, navigate }) {
  const [config, , configLoaded] = useSharedState("qn-config", DEFAULT_CONFIG, 6000);
  const [orders, ordersLoaded, reloadOrders, ordersError] = useOrders(tableId);
  const [requests, , requestsLoaded, reloadRequests] = useSharedState("qn-requests", [], 3500);
  useDailyReset(() => {
    reloadOrders();
    reloadRequests();
  });
  const [toast, showToast] = useToast();
  const [sending, setSending] = useState(false);
  const pendingOrderRef = useRef(null); // { sig, order } — gửi lại sau lỗi mạng dùng CÙNG mã => không tạo đơn đôi
  const [busyItem, setBusyItem] = useState(null);
  const [activeCat, setActiveCat] = useState(MENU_GROUPS[0]);
  const [cart, setCart] = useState({}); // menuItemId -> {qty, note}
  const [showCart, setShowCart] = useState(false);
  const [tab, setTab] = useState("menu"); // menu | orders

  const table = (config.tables || []).find((t) => t.id === tableId);
  const categories = MENU_GROUPS;
  const menu = (config.menu || []).filter((m) => m.available && m.category === activeCat);

  const cartItems = Object.entries(cart)
    .filter(([, v]) => v.qty > 0)
    .map(([id, v]) => {
      const item = (config.menu || []).find((m) => m.id === id);
      return item ? { ...item, qty: v.qty, note: v.note || "" } : null;
    })
    .filter(Boolean);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  const myOrders = (orders || [])
    .filter((o) => o.tableId === tableId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const unpaid = tableUnpaidOrders(orders || [], tableId);
  const billTotal = tableBill(orders || [], tableId);

  const changeQty = (item, delta) => {
    setCart((prev) => {
      const cur = prev[item.id]?.qty || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [item.id]: { qty: next, note: prev[item.id]?.note || "" } };
    });
  };
  const setNote = (id, note) => setCart((prev) => ({ ...prev, [id]: { qty: prev[id]?.qty || 0, note } }));

  const sendOrder = async () => {
    if (cartItems.length === 0 || sending) return;
    setSending(true);
    const sig = JSON.stringify([tableId, cartItems.map((i) => [i.id, i.qty, i.note, i.price])]);
    if (!pendingOrderRef.current || pendingOrderRef.current.sig !== sig) {
      pendingOrderRef.current = {
        sig,
        order: {
          id: uid(),
          tableId,
          items: cartItems.map((i) => ({ itemId: uid(), menuItemId: i.id, name: i.name, price: i.price, qty: i.qty, note: i.note, status: "received" })),
        },
      };
    }
    const newOrder = pendingOrderRef.current.order;
    try {
      const { error } = await supabase.rpc("qn_add_order", { p_order: newOrder });
      if (error) throw error;
      await reloadOrders();
    } catch (e) {
      console.error("Gửi order thất bại", e);
      showToast("Gửi order thất bại, vui lòng thử lại");
      setSending(false);
      return;
    }
    setSending(false);
    pendingOrderRef.current = null;
    setCart({});
    setShowCart(false);
    setTab("orders");
    showToast("Đã gửi order tới bếp!");
  };

  const changeSentItem = async (order, item, newQty) => {
    if (busyItem) return;
    if (newQty <= 0 && !window.confirm(`Huỷ món "${item.name}"?`)) return;
    setBusyItem(item.itemId);
    try {
      const { data, error } = await supabase.rpc("qn_set_item_qty", {
        p_order_id: order.id,
        p_item_id: item.itemId,
        p_qty: newQty,
        p_only_if_received: true,
      });
      if (error) throw error;
      if (!data) showToast("Bếp đã làm xong món này nên không sửa được nữa — vui lòng gọi nhân viên");
      else showToast(newQty <= 0 ? "Đã huỷ món" : "Đã cập nhật số lượng");
      await reloadOrders();
    } catch (e) {
      console.error("Sửa món thất bại", e);
      showToast("Chưa sửa được, vui lòng thử lại");
    } finally {
      setBusyItem(null);
    }
  };

  const pendingCall = (requests || []).find((r) => r.tableId === tableId && r.type === "call" && !r.resolved);
  const pendingPayment = (requests || []).find((r) => r.tableId === tableId && r.type === "payment" && !r.resolved);

  const requestBusyRef = useRef(false);
  const sendRequest = async (type) => {
    const already = type === "call" ? pendingCall : pendingPayment;
    if (already || requestBusyRef.current) return;
    requestBusyRef.current = true;
    try {
      const { error } = await supabase.rpc("qn_add_request", {
        p_request: { id: uid(), tableId, type, createdAt: Date.now(), resolved: false, resolvedAt: null },
      });
      if (error) throw error;
      await reloadRequests();
    } catch (e) {
      console.error("Gửi yêu cầu thất bại", e);
      showToast("Gửi yêu cầu thất bại, vui lòng thử lại");
      requestBusyRef.current = false;
      return;
    }
    requestBusyRef.current = false;
    showToast(type === "call" ? "Đã gọi nhân viên, vui lòng chờ chút nhé!" : "Đã gửi yêu cầu thanh toán!");
  };

  if (!configLoaded) return <LoadingScreen />;

  if (!table) {
    return (
      <div className="min-h-screen qn-root flex items-center justify-center px-6">
        <GlobalStyle />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy bàn" desc={`Bàn "${tableId}" không tồn tại. Vui lòng quét lại mã QR trên bàn.`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen qn-root pb-28">
      <GlobalStyle />
      <div className="sticky top-0 z-30 px-4 py-3" style={{ background: "rgba(22,18,16,0.92)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between">
          <Logo />
          <Pill tone="chili"><Table2 size={12} /> {table.name}</Pill>
        </div>
        <div className="flex mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          <button onClick={() => setTab("menu")} className="qn-focus flex-1 py-2 text-sm font-semibold" style={{ background: tab === "menu" ? C.surfaceHi : "transparent", color: tab === "menu" ? C.gold : C.muted }}>
            Thực đơn
          </button>
          <button onClick={() => setTab("orders")} className="qn-focus flex-1 py-2 text-sm font-semibold relative" style={{ background: tab === "orders" ? C.surfaceHi : "transparent", color: tab === "orders" ? C.gold : C.muted }}>
            Order của bàn {myOrders.length > 0 && <span className="ml-1 text-xs" style={{ color: C.chili }}>({myOrders.length})</span>}
          </button>
        </div>
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => sendRequest("call")}
            disabled={!!pendingCall}
            className="qn-focus qn-btn flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-70"
            style={{
              background: pendingCall ? "rgba(227,168,87,0.14)" : C.surfaceHi,
              color: pendingCall ? C.gold : C.cream,
              border: `1px solid ${pendingCall ? C.goldDim : C.line}`,
            }}
          >
            {pendingCall ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
            {pendingCall ? "Đã gọi, đang chờ..." : "Gọi nhân viên"}
          </button>
          <button
            onClick={() => sendRequest("payment")}
            disabled={!!pendingPayment || billTotal === 0}
            className="qn-focus qn-btn flex-1 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{
              background: pendingPayment ? "rgba(122,148,99,0.16)" : C.chili,
              color: pendingPayment ? "#B7D19E" : "#fff",
              border: `1px solid ${pendingPayment ? C.leaf : C.chili}`,
            }}
          >
            {pendingPayment ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
            {pendingPayment ? "Đang chờ thanh toán..." : "Yêu cầu thanh toán"}
          </button>
        </div>
      </div>

      <DbWarning error={ordersError} />

      {tab === "menu" && (
        <>
          <div className="px-4 pt-3 flex gap-2 overflow-x-auto qn-scrollbar pb-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className="qn-focus whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium"
                style={{
                  background: activeCat === c ? C.gold : C.surface,
                  color: activeCat === c ? "#1B1410" : C.muted,
                  border: `1px solid ${activeCat === c ? C.gold : C.line}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="px-4 mt-2 space-y-2.5">
            {menu.map((item) => {
              const qty = cart[item.id]?.qty || 0;
              return (
                <Card key={item.id} className="p-3 flex items-center gap-3 qn-card-hover">
                  <div className="flex items-center justify-center rounded-xl shrink-0 overflow-hidden" style={{ width: 64, height: 64, fontSize: 30, background: C.surfaceHi }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      item.emoji
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-snug truncate" style={{ color: C.cream }}>
                      {item.name} {item.spicy && <Flame size={12} className="inline mb-0.5" color={C.chili} />}
                    </div>
                    <div className="text-sm font-bold mt-0.5" style={{ color: C.gold }}>{fmt(item.price)}</div>
                  </div>
                  {qty === 0 ? (
                    <Btn size="sm" className="shrink-0" onClick={() => changeQty(item, 1)}><Plus size={14} /> Thêm</Btn>
                  ) : (
                    <div className="flex items-center gap-2.5 shrink-0 rounded-lg px-1" style={{ background: C.surfaceHi, border: `1px solid ${C.line}` }}>
                      <button onClick={() => changeQty(item, -1)} className="qn-focus p-2" style={{ color: C.cream }}><Minus size={14} /></button>
                      <span className="text-sm font-bold w-4 text-center" style={{ color: C.gold }}>{qty}</span>
                      <button onClick={() => changeQty(item, 1)} className="qn-focus p-2" style={{ color: C.cream }}><Plus size={14} /></button>
                    </div>
                  )}
                </Card>
              );
            })}
            {menu.length === 0 && <EmptyState icon={Utensils} title="Chưa có món" desc="Danh mục này hiện chưa có món ăn nào." />}
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="px-4 pt-4 space-y-3">
          {myOrders.length === 0 && <EmptyState icon={ClipboardList} title="Chưa có order" desc="Chọn món ở tab Thực đơn rồi gửi order nhé." />}
          {myOrders.map((o) => {
            const dStatus = orderDerivedStatus(o);
            return (
              <Card key={o.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs" style={{ color: C.mutedDim }}>{new Date(o.createdAt).toLocaleTimeString("vi-VN")}</div>
                  {o.paid ? <Pill tone="leaf"><Check size={11} /> Đã thanh toán</Pill> : <Pill tone={dStatus === "served" ? "leaf" : dStatus === "confirmed" ? "gold" : "chili"}>{STATUS_LABEL[dStatus]}</Pill>}
                </div>
                {!o.paid && (
                  <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: C.surfaceHi }}>
                    <div className="h-full qn-foam rounded-full" style={{ width: `${((STATUS_FLOW.indexOf(dStatus) + 1) / STATUS_FLOW.length) * 100}%`, background: STATUS_COLOR[dStatus] }} />
                  </div>
                )}
                <div className="space-y-2.5">
                  {o.items.map((it) => {
                    const canEdit = !o.paid && (it.status || "received") === "received";
                    const busy = busyItem === it.itemId;
                    return (
                      <div key={it.itemId} className="text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span style={{ color: C.cream }}>{it.qty}× {it.name}{it.note ? <span style={{ color: C.mutedDim }}> ({it.note})</span> : null}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {!o.paid && <Pill tone={ITEM_STATUS_ICON_TONE[it.status || "received"]}>{ITEM_STATUS_LABEL[it.status || "received"]}</Pill>}
                            <span style={{ color: C.muted }}>{fmt(it.price * it.qty)}</span>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-2 mt-1.5" style={{ opacity: busy ? 0.5 : 1 }}>
                            <div className="flex items-center rounded-lg" style={{ background: C.surfaceHi, border: `1px solid ${C.line}` }}>
                              <button disabled={busy || it.qty <= 1} onClick={() => changeSentItem(o, it, it.qty - 1)} className="qn-focus p-1.5 disabled:opacity-30" style={{ color: C.cream }} aria-label="Giảm số lượng"><Minus size={13} /></button>
                              <span className="text-xs font-bold w-6 text-center" style={{ color: C.gold }}>{it.qty}</span>
                              <button disabled={busy} onClick={() => changeSentItem(o, it, it.qty + 1)} className="qn-focus p-1.5" style={{ color: C.cream }} aria-label="Tăng số lượng"><Plus size={13} /></button>
                            </div>
                            <button disabled={busy} onClick={() => changeSentItem(o, it, 0)} className="qn-focus flex items-center gap-1 text-xs rounded-lg px-2 py-1.5" style={{ color: "#F0937F" }}>
                              <Trash2 size={12} /> Huỷ món
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-sm font-bold mt-2 pt-2" style={{ borderTop: `1px dashed ${C.line}`, color: C.gold }}>
                  <span>Tổng</span><span>{fmt(orderTotal(o))}</span>
                </div>
              </Card>
            );
          })}
          {unpaid.length > 0 && (
            <Card className="p-4" style={{ background: C.surfaceHi }}>
              <div className="flex justify-between text-sm font-semibold" style={{ color: C.cream }}>
                <span>Tổng cộng chưa thanh toán</span>
                <span style={{ color: C.gold }}>{fmt(billTotal)}</span>
              </div>
              <div className="text-xs mt-1" style={{ color: C.mutedDim }}>Gọi nhân viên khi cần thanh toán nhé!</div>
            </Card>
          )}
        </div>
      )}

      {/* Cart bar */}
      {tab === "menu" && cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3" style={{ background: "rgba(22,18,16,0.97)", borderTop: `1px solid ${C.line}` }}>
          <button onClick={() => setShowCart(true)} className="qn-focus qn-btn w-full rounded-xl py-3 flex items-center justify-between px-4" style={{ background: C.chili, color: "#fff" }}>
            <span className="flex items-center gap-2 font-semibold text-sm"><ShoppingCart size={16} /> Giỏ hàng ({cartCount})</span>
            <span className="font-bold">{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowCart(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto qn-scrollbar" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>Giỏ hàng — {table.name}</div>
              <button onClick={() => setShowCart(false)} className="qn-focus" style={{ color: C.muted }}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {cartItems.map((it) => (
                <div key={it.id} className="flex gap-3 items-start pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div className="rounded-lg flex items-center justify-center" style={{ width: 40, height: 40, fontSize: 20, background: C.surfaceHi }}>{it.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: C.cream }}>{it.name}</div>
                    <div className="text-xs" style={{ color: C.gold }}>{fmt(it.price)}</div>
                    <input
                      value={it.note}
                      onChange={(e) => setNote(it.id, e.target.value)}
                      placeholder="Ghi chú (VD: ít cay, không hành...)"
                      className="qn-focus mt-1.5 w-full rounded-md px-2 py-1 text-xs"
                      style={{ background: C.bgSoft, border: `1px solid ${C.line}`, color: C.cream }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg" style={{ background: C.surfaceHi }}>
                    <button onClick={() => changeQty(it, -1)} className="qn-focus p-1.5" style={{ color: C.cream }}><Minus size={13} /></button>
                    <span className="text-sm font-bold w-4 text-center" style={{ color: C.gold }}>{it.qty}</span>
                    <button onClick={() => changeQty(it, 1)} className="qn-focus p-1.5" style={{ color: C.cream }}><Plus size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-base font-bold mt-4" style={{ color: C.cream }}>
              <span>Tổng cộng</span><span style={{ color: C.gold }}>{fmt(cartTotal)}</span>
            </div>
            <Btn className="w-full mt-4" size="lg" tone="chili" disabled={sending} onClick={sendOrder}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {sending ? "Đang gửi..." : "Gửi order"}
            </Btn>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen qn-root flex items-center justify-center">
      <GlobalStyle />
      <div className="flex flex-col items-center gap-3">
        <Beer size={30} color={C.gold} className="qn-flicker" />
        <div className="text-sm" style={{ color: C.muted }}>Đang tải...</div>
      </div>
    </div>
  );
}

/* ============================================================================
   STAFF VIEW — /staff
============================================================================ */
function StaffApp({ navigate }) {
  const [config, , configLoaded] = useSharedState("qn-config", DEFAULT_CONFIG, 6000);
  const [orders, ordersLoaded, reloadOrders, ordersError] = useOrders();
  const [requests, , requestsLoaded, reloadRequests] = useSharedState("qn-requests", [], 3000);
  useDailyReset(() => {
    reloadOrders();
    reloadRequests();
  });
  const [toast, showToast] = useToast();
  const [selectedTable, setSelectedTable] = useState(null);
  const [qrTable, setQrTable] = useState(null);
  const [mainTab, setMainTab] = useState("orders"); // orders | tables

  const tableRequests = (id) => (requests || []).filter((r) => r.tableId === id && !r.resolved);
  const resolveRequest = async (id) => {
    try {
      const { error } = await supabase.rpc("qn_resolve_request", { p_request_id: id, p_resolved_at: Date.now() });
      if (error) throw error;
      await reloadRequests();
    } catch (e) {
      console.error("Xử lý yêu cầu thất bại", e);
      showToast("Có lỗi khi xử lý yêu cầu, thử lại nhé");
    }
  };

  const tables = config.tables || [];
  const getTableOrders = (id) => (orders || []).filter((o) => o.tableId === id && !o.paid).sort((a, b) => a.createdAt - b.createdAt);
  const getTableStatus = (id) => {
    const os = getTableOrders(id);
    if (os.length === 0) return "empty";
    const items = os.flatMap((o) => o.items || []);
    if (items.some((it) => (it.status || "received") === "received")) return "new";
    if (items.some((it) => it.status === "done")) return "ready";
    return "done";
  };
  const STATUS_META = {
    empty: { label: "Trống", bg: C.surface, fg: C.mutedDim, bd: C.line },
    new: { label: "Order mới", bg: "rgba(193,68,46,0.18)", fg: "#F0937F", bd: C.chili },
    ready: { label: "Sẵn sàng phục vụ", bg: "rgba(227,168,87,0.16)", fg: C.gold, bd: C.goldDim },
    done: { label: "Chờ thanh toán", bg: "rgba(122,148,99,0.18)", fg: "#B7D19E", bd: C.leaf },
  };

  const advanceItemStatus = async (orderId, itemId, dir = 1) => {
    const order = (orders || []).find((o) => o.id === orderId);
    const item = order?.items.find((it) => it.itemId === itemId);
    if (!item) return;
    const idx = ITEM_STATUS_FLOW.indexOf(item.status || "received");
    const next = ITEM_STATUS_FLOW[Math.min(Math.max(idx + dir, 0), ITEM_STATUS_FLOW.length - 1)];
    try {
      const { error } = await supabase.rpc("qn_advance_item_status", { p_order_id: orderId, p_item_id: itemId, p_new_status: next });
      if (error) throw error;
      await reloadOrders();
    } catch (e) {
      console.error("Cập nhật trạng thái món thất bại", e);
      showToast("Có lỗi khi cập nhật món, thử lại nhé");
    }
  };

  const printInvoice = (table) => {
    const tableOrders = getTableOrders(table.id);
    const allItems = tableOrders.flatMap((o) => o.items || []);
    const total = tableOrders.reduce((s, o) => s + orderTotal(o), 0);
    const now = new Date();
    const widthMm = config.receiptWidth === "58mm" ? 58 : 80;
    const rows = allItems
      .map(
        (it) =>
          `<tr><td>${it.qty}× ${escapeHtml(it.name)}${it.note ? ` <div class="note">(${escapeHtml(it.note)})</div>` : ""}</td><td class="r">${fmt(it.price * it.qty)}</td></tr>`
      )
      .join("");
    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>Hóa đơn ${escapeHtml(table.name)}</title>
      <style>
        @page { size: ${widthMm}mm auto; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: ${widthMm}mm;
          padding: 3mm 4mm 6mm;
          color: #000;
          font-size: ${widthMm === 58 ? "11px" : "12.5px"};
        }
        h1 { font-size: ${widthMm === 58 ? "15px" : "17px"}; text-align: center; margin: 0 0 2px; letter-spacing: 1.5px; }
        .sub { text-align: center; font-size: 10px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2.5px 0; vertical-align: top; }
        td.r { text-align: right; white-space: nowrap; padding-left: 6px; }
        .note { font-size: 9.5px; color: #333; padding-left: 4px; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .total { display: flex; justify-content: space-between; font-weight: bold; font-size: ${widthMm === 58 ? "13px" : "14px"}; margin-top: 6px; }
        .foot { text-align: center; font-size: 10px; margin-top: 14px; }
        @media print { body { width: ${widthMm}mm; } }
      </style></head>
      <body>
        <h1>${escapeHtml(APP_NAME.toUpperCase())}</h1>
        <div class="sub">${escapeHtml(table.name)}<br/>${now.toLocaleDateString("vi-VN")} ${now.toLocaleTimeString("vi-VN")}</div>
        <div class="line"></div>
        <table>${rows}</table>
        <div class="line"></div>
        <div class="total"><span>TỔNG CỘNG</span><span>${fmt(total)}</span></div>
        <div class="foot">Cảm ơn quý khách — hẹn gặp lại!</div>
      </body></html>`;
    const win = window.open("", "_blank", "width=420,height=640");
    if (!win) {
      showToast("Trình duyệt chặn cửa sổ in — vui lòng cho phép popup rồi thử lại");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  /* Huỷ / sửa số lượng 1 món (Staff được huỷ mọi món chưa thanh toán). */
  const staffSetItemQty = async ({ orderId, itemId, name, status }, newQty) => {
    if (newQty <= 0) {
      const served = (status || "received") === "served";
      const msg = served ? `Món "${name}" đã phục vụ rồi. Vẫn huỷ khỏi hóa đơn?` : `Huỷ món "${name}" khỏi bàn?`;
      if (!window.confirm(msg)) return;
    }
    try {
      const { data, error } = await supabase.rpc("qn_set_item_qty", {
        p_order_id: orderId,
        p_item_id: itemId,
        p_qty: newQty,
        p_only_if_received: false,
      });
      if (error) throw error;
      showToast(!data ? "Không sửa được (đơn đã thanh toán hoặc vừa thay đổi)" : newQty <= 0 ? "Đã huỷ món" : "Đã cập nhật số lượng");
      await reloadOrders();
    } catch (e) {
      console.error("Sửa món thất bại", e);
      showToast("Chưa sửa được món, thử lại nhé");
    }
  };

  /* THANH TOÁN: chỉ đóng đúng các đơn đang hiện trên hóa đơn và chỉ khi tổng tiền còn
     khớp. Nếu giữa chừng khách gọi thêm / huỷ món, database từ chối để tránh thu sai. */
  const checkout = async (tableId) => {
    const ids = getTableOrders(tableId).map((o) => o.id);
    const expected = tableBill(orders || [], tableId);
    if (ids.length === 0) {
      showToast("Bàn này chưa có order để thanh toán");
      return;
    }
    try {
      const { data: ok, error: e1 } = await supabase.rpc("qn_checkout_orders", { p_order_ids: ids, p_expected_total: expected });
      if (e1) throw e1;
      if (!ok) {
        await reloadOrders();
        window.alert("Hóa đơn của bàn này vừa thay đổi (khách gọi thêm / huỷ món, hoặc đã có người thanh toán rồi).\n\nChưa thu tiền. Hóa đơn đã được cập nhật lại — vui lòng kiểm tra rồi bấm thanh toán lần nữa.");
        return;
      }
      const { error: e2 } = await supabase.rpc("qn_resolve_table_requests", { p_table_id: tableId, p_resolved_at: Date.now() });
      if (e2) throw e2;
      await Promise.all([reloadOrders(), reloadRequests()]);
    } catch (e) {
      console.error("Thanh toán thất bại", e);
      showToast("Thanh toán thất bại, vui lòng thử lại — chưa có gì bị mất");
      return;
    }
    showToast("Đã thanh toán bàn " + (tables.find((t) => t.id === tableId)?.name || tableId));
    setSelectedTable(null);
  };

  if (!configLoaded || !ordersLoaded || !requestsLoaded) return <LoadingScreen />;

  const activeTable = tables.find((t) => t.id === selectedTable);
  const activeOrders = activeTable ? getTableOrders(activeTable.id) : [];
  const activeBill = activeTable ? tableBill(orders || [], activeTable.id) : 0;
  const allPendingRequests = (requests || []).filter((r) => !r.resolved).sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="min-h-screen qn-root">
      <GlobalStyle />
      <TopBar navigate={navigate} current="Staff" />
      <DbWarning error={ordersError} />

      {allPendingRequests.length > 0 && (
        <div className="px-4 sm:px-6 pt-4 space-y-2">
          {allPendingRequests.map((r) => {
            const t = tables.find((x) => x.id === r.tableId);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl px-4 py-2.5"
                style={{ background: "rgba(193,68,46,0.16)", border: `1px solid ${C.chili}` }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#F0937F" }}>
                  <BellRing size={16} className="qn-flicker" />
                  {t ? t.name : r.tableId} — {r.type === "call" ? "gọi nhân viên" : "yêu cầu thanh toán"}
                  <span className="text-xs font-normal" style={{ color: C.mutedDim }}>{new Date(r.createdAt).toLocaleTimeString("vi-VN")}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {r.type === "payment" && t && (
                    <>
                      <Btn size="sm" variant="outline" tone="muted" onClick={() => printInvoice(t)}><Printer size={13} /> In hóa đơn</Btn>
                      <Btn size="sm" variant="outline" tone="gold" onClick={() => setQrTable(t)}><QrCode size={13} /> QR thanh toán</Btn>
                      <Btn size="sm" variant="outline" tone="muted" onClick={() => { setMainTab("tables"); setSelectedTable(r.tableId); }}>Xem bàn</Btn>
                    </>
                  )}
                  <Btn size="sm" tone="leaf" onClick={() => resolveRequest(r.id)}><Check size={13} /> Đã xử lý</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 sm:px-6 pt-4 flex gap-2">
        <button
          onClick={() => setMainTab("orders")}
          className="qn-focus rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
          style={{ background: mainTab === "orders" ? C.gold : C.surface, color: mainTab === "orders" ? "#1B1410" : C.muted, border: `1px solid ${mainTab === "orders" ? C.gold : C.line}` }}
        >
          <ClipboardList size={15} /> Order món
        </button>
        <button
          onClick={() => { setMainTab("tables"); setSelectedTable(null); }}
          className="qn-focus rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-1.5"
          style={{ background: mainTab === "tables" ? C.gold : C.surface, color: mainTab === "tables" ? "#1B1410" : C.muted, border: `1px solid ${mainTab === "tables" ? C.gold : C.line}` }}
        >
          <Table2 size={15} /> Sơ đồ bàn
        </button>
      </div>

      {mainTab === "orders" && (
        <div className="px-4 sm:px-6 py-5">
          <div className="qn-display text-xl font-semibold mb-1" style={{ color: C.cream }}>Order món — Bếp & Phục vụ</div>
          <div className="text-sm mb-4" style={{ color: C.muted }}>Bảng theo dõi chung: bếp cập nhật món nấu xong, phục vụ biết ngay để mang ra bàn</div>

          {(() => {
            const items = flattenActiveItems(orders, tables);
            const cols = ITEM_STATUS_FLOW.map((s) => ({
              key: s,
              label: ITEM_STATUS_LABEL[s],
              tone: ITEM_STATUS_ICON_TONE[s],
              color: ITEM_STATUS_COLOR[s],
              items: items.filter((it) => it.status === s),
            }));
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {cols.map((col) => (
                  <div key={col.key} className="rounded-2xl p-3" style={{ background: C.bgSoft, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: col.color }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                        {col.label}
                      </div>
                      <Pill tone={col.tone}>{col.items.length}</Pill>
                    </div>
                    <div className="space-y-2 qn-scrollbar" style={{ maxHeight: 520, overflowY: "auto" }}>
                      {col.items.length === 0 && (
                        <div className="text-xs text-center py-6" style={{ color: C.mutedDim }}>Không có món</div>
                      )}
                      {col.items.map((it) => (
                        <Card key={it.itemId} className="p-3">
                          <button
                            onClick={() => { setMainTab("tables"); setSelectedTable(it.tableId); }}
                            className="qn-focus text-xs font-bold flex items-center gap-1 mb-1"
                            style={{ color: C.gold }}
                          >
                            <Table2 size={11} /> {it.tableName}
                          </button>
                          <div className="text-sm font-semibold" style={{ color: C.cream }}>{it.qty}× {it.name}</div>
                          {it.note && <div className="text-xs mt-0.5" style={{ color: C.mutedDim }}>Ghi chú: {it.note}</div>}
                          <div className="text-xs mt-1" style={{ color: C.mutedDim }}>{new Date(it.createdAt).toLocaleTimeString("vi-VN")}</div>
                          <div className="flex items-center gap-1.5 mt-2.5">
                            {col.key !== "received" && (
                              <button
                                onClick={() => advanceItemStatus(it.orderId, it.itemId, -1)}
                                className="qn-focus rounded-lg p-2"
                                style={{ background: C.surfaceHi, color: C.muted }}
                                title="Lùi lại"
                              >
                                <ArrowLeft size={14} />
                              </button>
                            )}
                            {col.key !== "served" && (
                              <Btn size="sm" className="flex-1" onClick={() => advanceItemStatus(it.orderId, it.itemId, 1)}>
                                <ClipboardCheck size={13} /> {ITEM_STATUS_LABEL[ITEM_STATUS_FLOW[ITEM_STATUS_FLOW.indexOf(col.key) + 1]]}
                              </Btn>
                            )}
                            <button
                              onClick={() => staffSetItemQty({ orderId: it.orderId, itemId: it.itemId, name: it.name, status: it.status }, 0)}
                              className="qn-focus rounded-lg p-2 ml-auto"
                              style={{ background: C.surfaceHi, color: "#F0937F" }}
                              title="Huỷ món"
                              aria-label="Huỷ món"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {mainTab === "tables" && (
      <>
      {!selectedTable ? (
        <div className="px-4 sm:px-6 py-5">
          <div className="qn-display text-xl font-semibold mb-1" style={{ color: C.cream }}>Sơ đồ bàn</div>
          <div className="text-sm mb-4" style={{ color: C.muted }}>Chạm vào bàn để xem order & thanh toán</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {tables.map((t) => {
              const st = getTableStatus(t.id);
              const meta = STATUS_META[st];
              const bill = tableBill(orders || [], t.id);
              const reqs = tableRequests(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t.id)}
                  className="qn-card-hover qn-focus rounded-2xl p-4 text-left relative"
                  style={{ background: meta.bg, border: `1.5px solid ${reqs.length > 0 ? C.chili : meta.bd}` }}
                >
                  {reqs.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 rounded-full p-1 qn-flicker" style={{ background: C.chili }}>
                      <BellRing size={11} color="#fff" />
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <Table2 size={18} color={meta.fg} />
                    {st === "new" && <span className="w-2 h-2 rounded-full" style={{ background: C.chili }} />}
                  </div>
                  <div className="qn-display text-lg font-bold mt-2" style={{ color: C.cream }}>{t.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: meta.fg }}>{meta.label}</div>
                  {bill > 0 && <div className="text-xs font-semibold mt-1.5" style={{ color: C.gold }}>{fmt(bill)}</div>}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-4 sm:px-6 py-5 max-w-2xl mx-auto">
          <button onClick={() => setSelectedTable(null)} className="qn-focus flex items-center gap-1.5 text-sm mb-4" style={{ color: C.muted }}>
            <ArrowLeft size={16} /> Quay lại sơ đồ bàn
          </button>
          <div className="flex items-center justify-between mb-4">
            <div className="qn-display text-2xl font-bold" style={{ color: C.cream }}>{activeTable.name}</div>
            <Pill tone="gold">{fmt(activeBill)}</Pill>
          </div>

          {tableRequests(activeTable.id).length > 0 && (
            <div className="space-y-2 mb-4">
              {tableRequests(activeTable.id).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl px-4 py-2.5 flex-wrap gap-2" style={{ background: "rgba(193,68,46,0.16)", border: `1px solid ${C.chili}` }}>
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#F0937F" }}>
                    <BellRing size={15} className="qn-flicker" /> {r.type === "call" ? "Khách gọi nhân viên" : "Khách yêu cầu thanh toán"}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.type === "payment" && (
                      <>
                        <Btn size="sm" variant="outline" tone="muted" onClick={() => printInvoice(activeTable)}><Printer size={13} /> In hóa đơn</Btn>
                        <Btn size="sm" variant="outline" tone="gold" onClick={() => setQrTable(activeTable)}><QrCode size={13} /> QR thanh toán</Btn>
                      </>
                    )}
                    <Btn size="sm" tone="leaf" onClick={() => resolveRequest(r.id)}><Check size={13} /> Đã xử lý</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeOrders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Chưa có order" desc="Bàn này hiện chưa gửi order nào." />
          ) : (
            <div className="space-y-3">
              {activeOrders.map((o) => (
                <Card key={o.id} className="p-4">
                  <div className="text-xs mb-2" style={{ color: C.mutedDim }}>{new Date(o.createdAt).toLocaleTimeString("vi-VN")}</div>
                  <div className="space-y-2">
                    {o.items.map((it) => (
                      <div key={it.itemId} className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: `1px dashed ${C.line}` }}>
                        <div className="min-w-0">
                          <div className="text-sm" style={{ color: C.cream }}>{it.qty}× {it.name}{it.note ? <span style={{ color: C.mutedDim }}> ({it.note})</span> : null}</div>
                          <div className="text-xs" style={{ color: C.muted }}>{fmt(it.price * it.qty)}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          <Pill tone={ITEM_STATUS_ICON_TONE[it.status || "received"]}>{ITEM_STATUS_LABEL[it.status || "received"]}</Pill>
                          {(it.status || "received") !== "served" && (
                            <div className="flex items-center rounded-lg" style={{ background: C.surfaceHi }}>
                              <button
                                disabled={it.qty <= 1}
                                onClick={() => staffSetItemQty({ orderId: o.id, itemId: it.itemId, name: it.name, status: it.status }, it.qty - 1)}
                                className="qn-focus p-1.5 disabled:opacity-30"
                                style={{ color: C.cream }}
                                aria-label="Giảm số lượng"
                              >
                                <Minus size={13} />
                              </button>
                              <button
                                onClick={() => staffSetItemQty({ orderId: o.id, itemId: it.itemId, name: it.name, status: it.status }, it.qty + 1)}
                                className="qn-focus p-1.5"
                                style={{ color: C.cream }}
                                aria-label="Tăng số lượng"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => staffSetItemQty({ orderId: o.id, itemId: it.itemId, name: it.name, status: it.status }, 0)}
                            className="qn-focus rounded-lg p-1.5"
                            style={{ background: C.surfaceHi, color: "#F0937F" }}
                            title="Huỷ món"
                            aria-label="Huỷ món"
                          >
                            <Trash2 size={14} />
                          </button>
                          {(it.status || "received") !== "served" && (
                            <button
                              onClick={() => advanceItemStatus(o.id, it.itemId, 1)}
                              className="qn-focus rounded-lg p-1.5"
                              style={{ background: C.surfaceHi, color: C.gold }}
                              title={"Chuyển sang " + ITEM_STATUS_LABEL[ITEM_STATUS_FLOW[ITEM_STATUS_FLOW.indexOf(it.status || "received") + 1]]}
                            >
                              <ClipboardCheck size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
              <Card className="p-4" style={{ background: C.surfaceHi }}>
                <div className="flex justify-between text-base font-bold mb-3" style={{ color: C.cream }}>
                  <span>Tổng bill</span><span style={{ color: C.gold }}>{fmt(activeBill)}</span>
                </div>
                <Btn className="w-full" size="lg" tone="leaf" onClick={() => checkout(activeTable.id)}>
                  <Wallet size={16} /> Thanh toán & dọn bàn
                </Btn>
                <Btn className="w-full mt-2" size="md" variant="outline" tone="muted" onClick={() => printInvoice(activeTable)}>
                  <Printer size={15} /> In hóa đơn
                </Btn>
                <Btn className="w-full mt-2" size="md" variant="outline" tone="gold" onClick={() => setQrTable(activeTable)}>
                  <QrCode size={15} /> QR thanh toán
                </Btn>
              </Card>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }} onClick={() => setQrTable(null)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 text-center max-w-xs w-full" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>{qrTable.name} — QR thanh toán</div>
            <div className="text-sm font-bold mt-1 mb-3" style={{ color: C.gold }}>{fmt(tableBill(orders || [], qrTable.id))}</div>
            {config.bank?.bankId && config.bank?.accountNo ? (
              <>
                <img
                  alt="QR chuyển khoản"
                  className="rounded-lg mx-auto"
                  style={{ background: "#fff", padding: 10, width: 240, height: 240, objectFit: "contain" }}
                  src={vietQrUrl(config.bank, tableBill(orders || [], qrTable.id), qrTable.name + " thanh toan")}
                />
                <div className="text-xs mt-3" style={{ color: C.mutedDim }}>
                  {VIETQR_BANKS.find((b) => b.value === config.bank.bankId)?.label || config.bank.bankId} — STK {config.bank.accountNo}
                  <br />{config.bank.accountName}
                </div>
              </>
            ) : (
              <div className="text-sm py-8" style={{ color: C.mutedDim }}>
                Chưa cài thông tin ngân hàng. Vào <span style={{ color: C.gold }}>Admin → Nhân viên</span> để thêm số tài khoản nhận chuyển khoản.
              </div>
            )}
            <Btn size="sm" className="mt-4" onClick={() => setQrTable(null)}>Đóng</Btn>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

/* ============================================================================
   ADMIN VIEW — /admin
============================================================================ */
function AdminApp({ navigate }) {
  const [config, setConfig, configLoaded] = useSharedState("qn-config", DEFAULT_CONFIG, 5000);
  const [orders, ordersLoaded, reloadOrders, ordersError] = useOrders();
  const [report, reloadReport] = useRevenue(30);
  const [meta, , metaLoaded, reloadMeta] = useSharedState("qn-meta", { lastResetDate: todayKey(Date.now()) }, 8000);
  useDailyReset(() => {
    reloadOrders();
    reloadMeta();
    reloadReport();
  });
  const [tab, setTab] = useState("overview");
  const [toast, showToast] = useToast();

  if (!configLoaded || !ordersLoaded || !metaLoaded) return <LoadingScreen />;

  const doManualReset = async () => {
    const activeCount = (orders || []).length;
    if (activeCount > 0 && !window.confirm(`Còn ${activeCount} order chưa thanh toán sẽ bị dọn khỏi danh sách (không ảnh hưởng doanh thu đã tính). Tiếp tục?`)) return;
    try {
      await manualDailyReset();
      await Promise.all([reloadOrders(), reloadMeta()]);
      showToast("Đã reset — mọi bàn đã về Trống");
    } catch (e) {
      console.error("Reset thất bại", e);
      showToast("Reset thất bại, vui lòng thử lại");
    }
  };

  const tabs = [
    { key: "overview", label: "Tổng quan", icon: BarChart3 },
    { key: "tables", label: "Bàn", icon: Table2 },
    { key: "menu", label: "Thực đơn", icon: Utensils },
    { key: "revenue", label: "Doanh thu", icon: TrendingUp },
    { key: "staff", label: "Nhân viên", icon: Users },
  ];

  return (
    <div className="min-h-screen qn-root">
      <GlobalStyle />
      <TopBar navigate={navigate} current="Admin" />
      <DbWarning error={ordersError} />
      <div className="px-4 sm:px-6 pt-4 flex gap-2 overflow-x-auto qn-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="qn-focus whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold flex items-center gap-1.5"
            style={{ background: tab === t.key ? C.gold : C.surface, color: tab === t.key ? "#1B1410" : C.muted, border: `1px solid ${tab === t.key ? C.gold : C.line}` }}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-6 py-5">
        {tab === "overview" && <AdminOverview config={config} orders={orders} report={report} meta={meta} onManualReset={doManualReset} />}
        {tab === "tables" && <AdminTables config={config} setConfig={setConfig} orders={orders} showToast={showToast} />}
        {tab === "menu" && <AdminMenu config={config} setConfig={setConfig} showToast={showToast} />}
        {tab === "revenue" && <AdminRevenue report={report} />}
        {tab === "staff" && <AdminStaff config={config} setConfig={setConfig} showToast={showToast} />}
      </div>
      <Toast toast={toast} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "gold" }) {
  const c = tone === "chili" ? C.chili : tone === "leaf" ? C.leaf : C.gold;
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="rounded-xl p-2.5" style={{ background: "rgba(227,168,87,0.12)" }}>
        <Icon size={20} color={c} />
      </div>
      <div>
        <div className="text-xs" style={{ color: C.muted }}>{label}</div>
        <div className="qn-display text-xl font-bold" style={{ color: C.cream }}>{value}</div>
      </div>
    </Card>
  );
}

function AdminOverview({ config, orders, report, meta, onManualReset }) {
  const today = todayKey(Date.now());
  const revenueToday = Number((report?.days || []).find((d) => d.day === today)?.total || 0);
  const activeOrders = [...(orders || [])];
  const occupiedTables = new Set(activeOrders.map((o) => o.tableId)).size;
  const pendingCount = activeOrders.filter((o) => orderDerivedStatus(o) === "pending").length;

  return (
    <div className="space-y-5">
      <Card className="p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: C.cream }}>Reset ngày mới</div>
          <div className="text-xs mt-0.5" style={{ color: C.mutedDim }}>
            Tự động dọn bàn về "Trống" khi sang ngày mới (ngày mới tính từ 5h sáng giờ VN, quán mở quá nửa đêm vẫn tính chung 1 ngày). Lần reset gần nhất: <span style={{ color: C.gold }}>{meta?.lastResetDate || today}</span>. Doanh thu đã thanh toán không bao giờ bị mất.
          </div>
        </div>
        <Btn size="sm" variant="outline" tone="chili" onClick={onManualReset}>
          <RefreshCcw size={14} /> Đóng ca / Reset ngay
        </Btn>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Wallet} label="Doanh thu hôm nay" value={fmt(revenueToday)} />
        <StatCard icon={Table2} label="Bàn đang phục vụ" value={`${occupiedTables}/${(config.tables || []).length}`} tone="leaf" />
        <StatCard icon={ClipboardList} label="Order chờ xác nhận" value={pendingCount} tone="chili" />
        <StatCard icon={Users} label="Nhân viên" value={(config.staff || []).length} />
      </div>

      <div>
        <div className="qn-display text-lg font-semibold mb-3" style={{ color: C.cream }}>Order đang hoạt động</div>
        {activeOrders.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Không có order nào" desc="Hiện không có bàn nào đang gọi món." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {activeOrders
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 8)
              .map((o) => {
                const t = (config.tables || []).find((x) => x.id === o.tableId);
                const dStatus = orderDerivedStatus(o);
                return (
                  <Card key={o.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: C.cream }}>{t ? t.name : o.tableId}</div>
                      <div className="text-xs" style={{ color: C.mutedDim }}>{o.items.length} món · {new Date(o.createdAt).toLocaleTimeString("vi-VN")}</div>
                    </div>
                    <Pill tone={dStatus === "served" ? "leaf" : dStatus === "confirmed" ? "gold" : "chili"}>{STATUS_LABEL[dStatus]}</Pill>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminTables({ config, setConfig, orders, showToast }) {
  const [showQr, setShowQr] = useState(null);
  const tables = config.tables || [];

  const addTable = () => {
    const n = tables.length + 1;
    let id = String(n);
    while (tables.some((t) => t.id === id)) id = id + "b";
    setConfig((prev) => ({ ...prev, tables: [...(prev.tables || []), { id, name: "Bàn " + n }] }));
    showToast("Đã thêm bàn mới");
  };
  const renameTable = (id, name) => setConfig((prev) => ({ ...prev, tables: prev.tables.map((t) => (t.id === id ? { ...t, name } : t)) }));
  const removeTable = (id) => {
    if (tableUnpaidOrders(orders || [], id).length > 0) {
      showToast("Bàn đang có order, không thể xoá");
      return;
    }
    setConfig((prev) => ({ ...prev, tables: prev.tables.filter((t) => t.id !== id) }));
  };

  const baseUrl = window.location.origin;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>Quản lý bàn ({tables.length})</div>
        <Btn size="sm" onClick={addTable}><PlusCircle size={14} /> Thêm bàn</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tables.map((t) => (
          <Card key={t.id} className="p-3.5">
            <input
              value={t.name}
              onChange={(e) => renameTable(t.id, e.target.value)}
              className="qn-focus w-full rounded-md px-2 py-1 text-sm font-semibold mb-2"
              style={{ background: C.bgSoft, border: `1px solid ${C.line}`, color: C.cream }}
            />
            <div className="flex gap-1.5">
              <Btn size="sm" variant="outline" className="flex-1" onClick={() => setShowQr(t)}><QrCode size={13} /> QR</Btn>
              <Btn size="sm" variant="outline" tone="chili" onClick={() => removeTable(t.id)}><Trash2 size={13} /></Btn>
            </div>
          </Card>
        ))}
      </div>

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowQr(null)}>
          <div onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 text-center" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <div className="qn-display text-lg font-semibold mb-3" style={{ color: C.cream }}>{showQr.name}</div>
            <img
              alt={"QR " + showQr.name}
              className="rounded-lg"
              style={{ background: "#fff", padding: 10 }}
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + "/menu/" + showQr.id)}`}
            />
            <div className="text-xs mt-3 break-all max-w-[220px]" style={{ color: C.mutedDim }}>{baseUrl}/menu/{showQr.id}</div>
            <Btn size="sm" className="mt-4" onClick={() => setShowQr(null)}>Đóng</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMenu({ config, setConfig, showToast }) {
  const [editing, setEditing] = useState(null); // item being edited/created
  const [uploading, setUploading] = useState(false);
  const origImageRef = useRef(null); // ảnh đã lưu của món đang sửa (để biết ảnh nào là "mới tải, chưa lưu")
  const fileRef = useRef(null);
  const menu = config.menu || [];
  const categories = MENU_GROUPS;

  const openEditing = (item) => {
    origImageRef.current = item.image || null;
    setEditing({ ...item });
  };
  const startNew = () => openEditing({ id: null, name: "", category: categories[0] || "", price: 0, emoji: "🍽️", available: true, spicy: false });

  // Ảnh vừa tải lên trong phiên sửa này mà không được lưu thì xoá luôn, không để rác trong kho ảnh.
  const discardUnsavedImage = (url) => {
    if (url && url !== origImageRef.current) removeMenuImage(url);
  };
  const closeEditing = () => {
    if (editing) discardUnsavedImage(editing.image);
    setEditing(null);
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const prevUrl = editing?.image;
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const url = await uploadMenuImage(blob);
      discardUnsavedImage(prevUrl);
      setEditing((prev) => (prev ? { ...prev, image: url } : prev));
    } catch (err) {
      console.error("Tải ảnh thất bại", err);
      const msg = String(err?.message || "");
      showToast(
        /bucket|not found|row-level|policy|security/i.test(msg)
          ? "Chưa cài kho ảnh: hãy chạy file supabase/schema.sql trong Supabase (xem README)"
          : "Không tải được ảnh, thử ảnh khác nhé"
      );
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    discardUnsavedImage(editing.image);
    setEditing((prev) => ({ ...prev, image: null }));
  };

  const saveItem = () => {
    if (uploading) {
      showToast("Đang tải ảnh, đợi một chút nhé");
      return;
    }
    if (!editing.name.trim() || editing.price <= 0) {
      showToast("Vui lòng nhập tên món và giá hợp lệ");
      return;
    }
    const toSave = { ...editing };
    if (!toSave.image) delete toSave.image;
    setConfig((prev) => {
      const exists = prev.menu.some((m) => m.id === toSave.id);
      const menuNext = exists
        ? prev.menu.map((m) => (m.id === toSave.id ? toSave : m))
        : [...prev.menu, { ...toSave, id: uid() }];
      return { ...prev, menu: menuNext };
    });
    // ảnh cũ đã được thay / bỏ → dọn khỏi kho
    if (origImageRef.current && origImageRef.current !== toSave.image) removeMenuImage(origImageRef.current);
    setEditing(null);
    showToast("Đã lưu món ăn");
  };

  const removeItem = (item) => {
    if (!window.confirm(`Xoá món "${item.name}" khỏi thực đơn?`)) return;
    setConfig((prev) => ({ ...prev, menu: prev.menu.filter((m) => m.id !== item.id) }));
    if (item.image) removeMenuImage(item.image);
  };

  const toggleAvail = (id) => setConfig((prev) => ({ ...prev, menu: prev.menu.map((m) => (m.id === id ? { ...m, available: !m.available } : m)) }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>Thực đơn ({menu.length} món)</div>
        <Btn size="sm" onClick={startNew}><PlusCircle size={14} /> Thêm món</Btn>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <section key={category} aria-label={category}>
            <h2 className="qn-display text-lg font-semibold mb-3" style={{ color: C.gold }}>
              {category} <span className="text-sm" style={{ color: C.muted }}>({menu.filter((m) => m.category === category).length} món)</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {menu.filter((m) => m.category === category).map((m) => (
          <Card key={m.id} className="p-3.5 flex gap-3">
            <div className="rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ width: 56, height: 56, fontSize: 24, background: C.surfaceHi, opacity: m.available ? 1 : 0.4 }}>
              {m.image ? <img src={m.image} alt={m.name} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: m.available ? C.cream : C.mutedDim }}>{m.name}</div>
              <div className="text-xs" style={{ color: C.mutedDim }}>{m.category}</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: C.gold }}>{fmt(m.price)}</div>
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => toggleAvail(m.id)} className="qn-focus text-xs px-2 py-1 rounded-md font-medium" style={{ background: m.available ? "rgba(122,148,99,0.18)" : "rgba(178,161,140,0.12)", color: m.available ? "#B7D19E" : C.mutedDim }}>
                  {m.available ? "Còn hàng" : "Hết hàng"}
                </button>
                <button onClick={() => openEditing(m)} className="qn-focus p-1.5 rounded-md" style={{ background: C.surfaceHi, color: C.gold }} aria-label="Sửa món"><Pencil size={13} /></button>
                <button onClick={() => removeItem(m)} className="qn-focus p-1.5 rounded-md" style={{ background: C.surfaceHi, color: C.chili }} aria-label="Xoá món"><Trash2 size={13} /></button>
              </div>
            </div>
          </Card>
        ))}
            </div>
            {!menu.some((m) => m.category === category) && (
              <p className="text-sm" style={{ color: C.mutedDim }}>Chưa có món trong nhóm này.</p>
            )}
          </section>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={closeEditing}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto qn-scrollbar" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <div className="qn-display text-lg font-semibold mb-4" style={{ color: C.cream }}>{editing.id ? "Sửa món" : "Thêm món mới"}</div>
            <div className="space-y-3">
              <Field label="Ảnh món (không bắt buộc)">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ width: 76, height: 76, background: C.surfaceHi, fontSize: 32 }}>
                    {editing.image ? <img src={editing.image} alt="" className="w-full h-full object-cover" /> : editing.emoji}
                  </div>
                  <div className="flex flex-col items-start gap-1.5">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
                    <Btn size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                      {uploading ? "Đang tải..." : editing.image ? "Đổi ảnh" : "Chọn ảnh"}
                    </Btn>
                    {editing.image && !uploading && (
                      <button onClick={clearImage} className="qn-focus text-xs" style={{ color: "#F0937F" }}>Bỏ ảnh</button>
                    )}
                  </div>
                </div>
                <div className="text-xs mt-1.5" style={{ color: C.mutedDim }}>Ảnh tự được thu nhỏ để khách tải nhanh. Không có ảnh thì hiện emoji.</div>
              </Field>
              <Field label="Tên món">
                <input className="qn-focus w-full rounded-md px-3 py-2 text-sm" style={inputStyle} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Giá (₫)">
                  <input type="number" className="qn-focus w-full rounded-md px-3 py-2 text-sm" style={inputStyle} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </Field>
                <Field label="Emoji (khi chưa có ảnh)">
                  <input className="qn-focus w-full rounded-md px-3 py-2 text-sm" style={inputStyle} value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
                </Field>
              </div>
              <Field label="Danh mục">
                <select className="qn-focus w-full rounded-md px-3 py-2 text-sm" style={inputStyle} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm" style={{ color: C.cream }}>
                <input type="checkbox" checked={editing.spicy} onChange={(e) => setEditing({ ...editing, spicy: e.target.checked })} /> Món cay
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <Btn variant="outline" tone="muted" className="flex-1" onClick={closeEditing}>Huỷ</Btn>
              <Btn className="flex-1" disabled={uploading} onClick={saveItem}><Save size={14} /> Lưu</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { background: C.bgSoft, border: `1px solid ${C.line}`, color: C.cream };
function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs mb-1" style={{ color: C.muted }}>{label}</div>
      {children}
    </div>
  );
}

function AdminRevenue({ report }) {
  const days = report?.days || [];
  const byDay = Object.fromEntries(days.map((d) => [d.day, d]));
  const today = todayKey(Date.now());
  const revenueToday = Number(byDay[today]?.total || 0);
  const revenue30 = days.reduce((s, d) => s + Number(d.total || 0), 0);
  const orders30 = days.reduce((s, d) => s + Number(d.bills || 0), 0);

  // 7 ngày gần nhất (theo "ngày kinh doanh" bắt đầu từ 5h sáng)
  const last7 = Array.from({ length: 7 }, (_, i) => todayKey(Date.now() - (6 - i) * 86400000));
  const revByDay = last7.map((k) => ({ day: k.slice(5), total: Number(byDay[k]?.total || 0) }));
  const maxDay = Math.max(1, ...revByDay.map((d) => d.total));

  const topItems = (report?.top || []).map((t) => [t.name, Number(t.qty)]);

  return (
    <div className="space-y-5">
      {report?.failed && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(193,68,46,0.16)", border: `1px solid ${C.chili}`, color: "#F0937F" }}>
          <AlertTriangle size={14} className="inline mr-1.5 mb-0.5" />
          Chưa tải được báo cáo doanh thu. Nếu vừa cập nhật app, hãy chạy file supabase/schema.sql trong Supabase (xem README).
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard icon={Wallet} label="Doanh thu hôm nay" value={fmt(revenueToday)} />
        <StatCard icon={TrendingUp} label="Doanh thu 30 ngày" value={fmt(revenue30)} tone="leaf" />
        <StatCard icon={Receipt} label="Số order (30 ngày)" value={orders30} tone="chili" />
      </div>

      <Card className="p-4">
        <div className="qn-display font-semibold mb-4" style={{ color: C.cream }}>Doanh thu 7 ngày gần nhất</div>
        <div className="flex items-end gap-3" style={{ height: 140 }}>
          {revByDay.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
              <div className="w-full rounded-t-md qn-foam" style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: d.total > 0 ? 4 : 0, background: `linear-gradient(180deg, ${C.gold}, ${C.chili})` }} />
              <div className="text-[10px]" style={{ color: C.mutedDim }}>{d.day}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="qn-display font-semibold mb-3" style={{ color: C.cream }}>Món bán chạy (30 ngày)</div>
        {topItems.length === 0 ? (
          <div className="text-sm" style={{ color: C.mutedDim }}>Chưa có dữ liệu.</div>
        ) : (
          <div className="space-y-2">
            {topItems.map(([name, qty], i) => (
              <div key={name} className="flex items-center gap-3">
                <div className="w-5 text-xs font-bold" style={{ color: C.gold }}>{i + 1}</div>
                <div className="flex-1 text-sm" style={{ color: C.cream }}>{name}</div>
                <Pill>{qty} suất</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminStaff({ config, setConfig, showToast }) {
  const [editing, setEditing] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const staff = config.staff || [];
  const roles = ["Phục vụ", "Bếp", "Thu ngân", "Quản lý"];

  const startNew = () => setEditing({ id: null, name: "", role: roles[0] });
  const saveStaff = () => {
    if (!editing.name.trim()) { showToast("Vui lòng nhập tên nhân viên"); return; }
    setConfig((prev) => {
      const exists = prev.staff.some((s) => s.id === editing.id);
      const next = exists ? prev.staff.map((s) => (s.id === editing.id ? { ...editing } : s)) : [...prev.staff, { ...editing, id: uid() }];
      return { ...prev, staff: next };
    });
    setEditing(null);
    showToast("Đã lưu nhân viên");
  };
  const removeStaff = (id) => setConfig((prev) => ({ ...prev, staff: prev.staff.filter((s) => s.id !== id) }));

  const savePin = () => {
    if (!/^\d{4,8}$/.test(pinInput)) {
      showToast("Mã PIN phải là 4-8 chữ số");
      return;
    }
    setConfig((prev) => ({ ...prev, pin: pinInput }));
    setPinInput("");
    showToast("Đã đổi mã PIN — dùng chung cho cả Admin & Staff");
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="qn-display font-semibold mb-1" style={{ color: C.cream }}>Mã PIN đăng nhập (Admin & Staff)</div>
        <div className="text-xs mb-3" style={{ color: C.mutedDim }}>
          Mã hiện tại: <span style={{ color: C.gold, fontWeight: 700 }}>{config.pin || "1947"}</span> — dùng chung cho cả trang Admin và Staff. Đổi mã mới bên dưới.
        </div>
        <div className="flex gap-2 max-w-xs">
          <input
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="Mã PIN mới (4-8 số)"
            inputMode="numeric"
            className="qn-focus flex-1 rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
          <Btn size="sm" onClick={savePin}><Save size={13} /> Lưu</Btn>
        </div>
      </Card>

      <Card className="p-4">
        <div className="qn-display font-semibold mb-1" style={{ color: C.cream }}>Tài khoản nhận chuyển khoản (QR thanh toán)</div>
        <div className="text-xs mb-3" style={{ color: C.mutedDim }}>
          Điền đúng thông tin để tạo mã QR chuyển khoản VietQR cho khách quét thanh toán (bên Staff, khi xử lý yêu cầu thanh toán).
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          <select
            value={config.bank?.bankId || ""}
            onChange={(e) => setConfig((prev) => ({ ...prev, bank: { ...prev.bank, bankId: e.target.value } }))}
            className="qn-focus rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          >
            <option value="">— Chọn ngân hàng —</option>
            {VIETQR_BANKS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          <input
            value={config.bank?.accountNo || ""}
            onChange={(e) => setConfig((prev) => ({ ...prev, bank: { ...prev.bank, accountNo: e.target.value.replace(/\D/g, "") } }))}
            placeholder="Số tài khoản"
            inputMode="numeric"
            className="qn-focus rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
          <input
            value={config.bank?.accountName || ""}
            onChange={(e) => setConfig((prev) => ({ ...prev, bank: { ...prev.bank, accountName: e.target.value } }))}
            placeholder="Tên chủ tài khoản"
            className="qn-focus rounded-md px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="text-xs mt-2" style={{ color: C.mutedDim }}>Tự lưu ngay khi bạn nhập xong, không cần bấm nút Lưu.</div>
      </Card>

      <Card className="p-4">
        <div className="qn-display font-semibold mb-1" style={{ color: C.cream }}>Khổ giấy in hóa đơn</div>
        <div className="text-xs mb-3" style={{ color: C.mutedDim }}>
          Chọn đúng khổ giấy của máy in nhiệt bạn dùng — hóa đơn (nút "In hóa đơn" bên Staff) sẽ tự canh đúng khổ này khi in.
        </div>
        <div className="flex gap-2">
          {["58mm", "80mm"].map((w) => (
            <button
              key={w}
              onClick={() => setConfig((prev) => ({ ...prev, receiptWidth: w }))}
              className="qn-focus rounded-lg px-4 py-2 text-sm font-semibold"
              style={{
                background: (config.receiptWidth || "80mm") === w ? C.gold : C.surfaceHi,
                color: (config.receiptWidth || "80mm") === w ? "#1B1410" : C.muted,
                border: `1px solid ${(config.receiptWidth || "80mm") === w ? C.gold : C.line}`,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>Nhân viên ({staff.length})</div>
        <Btn size="sm" onClick={startNew}><PlusCircle size={14} /> Thêm nhân viên</Btn>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {staff.map((s) => (
          <Card key={s.id} className="p-3.5 flex items-center gap-3">
            <div className="rounded-full flex items-center justify-center font-bold shrink-0" style={{ width: 40, height: 40, background: C.surfaceHi, color: C.gold }}>
              {s.name.trim().charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: C.cream }}>{s.name}</div>
              <Pill tone="muted">{s.role}</Pill>
            </div>
            <button onClick={() => setEditing(s)} className="qn-focus p-1.5 rounded-md" style={{ background: C.surfaceHi, color: C.gold }}><Pencil size={13} /></button>
            <button onClick={() => removeStaff(s.id)} className="qn-focus p-1.5 rounded-md" style={{ background: C.surfaceHi, color: C.chili }}><Trash2 size={13} /></button>
          </Card>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <div className="qn-display text-lg font-semibold mb-4" style={{ color: C.cream }}>{editing.id ? "Sửa nhân viên" : "Thêm nhân viên"}</div>
            <div className="space-y-3">
              <Field label="Họ tên">
                <input className="qn-focus w-full rounded-md px-3 py-2 text-sm" style={inputStyle} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Vai trò">
                <select className="qn-focus w-full rounded-md px-3 py-2 text-sm" style={inputStyle} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex gap-2 mt-5">
              <Btn variant="outline" tone="muted" className="flex-1" onClick={() => setEditing(null)}>Huỷ</Btn>
              <Btn className="flex-1" onClick={saveStaff}><Save size={14} /> Lưu</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PIN GATE — bảo vệ /admin và /staff bằng mã PIN chung (lưu trong config.pin).
   Sau khi nhập đúng, lưu trạng thái "đã mở khoá" vào sessionStorage của trình
   duyệt (chỉ tồn tại trong phiên đó) để không phải nhập lại PIN mỗi lần bấm.
============================================================================ */
function PinGate({ storageKey, title, children }) {
  const [config, , configLoaded] = useSharedState("qn-config", DEFAULT_CONFIG, 15000);
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey) === "1") setUnlocked(true);
    } catch (e) {}
    setChecked(true);
  }, [storageKey]);

  if (!configLoaded || !checked) return <LoadingScreen />;

  if (unlocked) return children;

  const correctPin = config.pin || "1947";

  const submit = (e) => {
    e.preventDefault();
    if (input === correctPin) {
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch (e) {}
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 900);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 qn-root">
      <GlobalStyle />
      <Logo size="lg" />
      <form
        onSubmit={submit}
        className="mt-8 w-full max-w-xs rounded-2xl p-6"
        style={{ background: C.surface, border: `1px solid ${C.line}`, animation: error ? "qnshake 0.4s" : "none" }}
      >
        <style>{`@keyframes qnshake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }`}</style>
        <div className="text-center mb-4">
          <div className="qn-display text-lg font-semibold" style={{ color: C.cream }}>{title}</div>
          <div className="text-xs mt-1" style={{ color: C.muted }}>Nhập mã PIN để tiếp tục</div>
        </div>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="••••"
          className="qn-focus w-full rounded-lg px-3 py-3 text-center text-2xl tracking-[0.4em]"
          style={{ background: C.bgSoft, border: `1px solid ${error ? C.chili : C.line}`, color: C.cream }}
        />
        {error && <div className="text-xs text-center mt-2" style={{ color: "#F0937F" }}>Sai mã PIN, thử lại nhé.</div>}
        <Btn type="submit" className="w-full mt-4" size="lg">Xác nhận</Btn>
      </form>
    </div>
  );
}

/* ============================================================================
   EXPORTS — mỗi route trong app/ Next.js sẽ import trực tiếp component cần dùng
============================================================================ */
export { RoleGate, AdminApp, StaffApp, CustomerApp, PinGate };
