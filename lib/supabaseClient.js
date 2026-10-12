import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Không throw để tránh crash toàn app khi build — nhưng sẽ log rõ lỗi ra console.
  console.error(
    "Thiếu biến môi trường NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Vào Vercel > Settings > Environment Variables để thêm."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
