-- ============================================================================
-- NHẬU 79 — SCRIPT DATABASE (1 FILE DUY NHẤT, dùng cho CẢ quán mới LẪN quán đang chạy)
--
-- CÁCH DÙNG: copy toàn bộ file này → Supabase > SQL Editor > New query → Run.
-- Mỗi quán (mỗi Supabase project) chạy 1 lần. AN TOÀN KHI CHẠY LẠI nhiều lần.
--
-- File này làm 3 việc:
--   1. Tạo/giữ bảng cấu hình (menu, bàn, nhân viên...).
--   2. Lưu order thành TỪNG DÒNG riêng + các hàm ghi dữ liệu an toàn (thanh toán chính
--      xác, huỷ/sửa món, reset ngày, báo cáo doanh thu). Order cũ (nếu có) được TỰ ĐỘNG
--      chuyển sang bảng mới, không mất dữ liệu.
--   3. Tạo kho ảnh món ăn.
-- ============================================================================

create table if not exists app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_state enable row level security;

drop policy if exists "public read app_state" on app_state;
create policy "public read app_state" on app_state for select using (true);

drop policy if exists "public insert app_state" on app_state;
create policy "public insert app_state" on app_state for insert with check (true);

drop policy if exists "public update app_state" on app_state;
create policy "public update app_state" on app_state for update using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table app_state;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Bảng orders: mỗi đơn hàng là 1 dòng riêng (thay cho 1 khối JSON khổng lồ)
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id text primary key,
  table_id text not null,
  items jsonb not null default '[]'::jsonb,
  paid boolean not null default false,
  created_at bigint not null,
  paid_at bigint
);

create index if not exists orders_unpaid_idx on orders (table_id) where paid = false;
create index if not exists orders_paid_at_idx on orders (paid_at) where paid = true;

alter table orders enable row level security;

-- để realtime báo được cả khi 1 đơn bị xoá (VD huỷ hết món), kể cả với bộ lọc theo bàn
alter table orders replica identity full;

-- Ai cũng ĐỌC được (để Staff/Khách xem order). KHÔNG có quyền ghi trực tiếp:
-- mọi thao tác ghi bắt buộc đi qua các hàm qn_* bên dưới (có kiểm tra hợp lệ).
drop policy if exists "public read orders" on orders;
create policy "public read orders" on orders for select using (true);

-- Bật realtime cho bảng orders
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Chuyển order cũ (từ khối JSON) sang bảng mới, rồi dọn khối cũ
-- ---------------------------------------------------------------------------
insert into orders (id, table_id, items, paid, created_at, paid_at)
select
  e->>'id',
  e->>'tableId',
  coalesce(e->'items', '[]'::jsonb),
  coalesce((e->>'paid')::boolean, false),
  coalesce((e->>'createdAt')::numeric::bigint, (extract(epoch from now()) * 1000)::bigint),
  (e->>'paidAt')::numeric::bigint
from (
  select value from app_state
  where key = 'qn-orders' and jsonb_typeof(value) = 'array'
) s
cross join lateral jsonb_array_elements(s.value) e
where (e->>'id') is not null
  and (e->>'tableId') is not null
on conflict (id) do nothing;

update app_state
set value = '[]'::jsonb, updated_at = now()
where key = 'qn-orders'
  and jsonb_typeof(value) = 'array'
  and jsonb_array_length(value) > 0;

-- ---------------------------------------------------------------------------
-- 3. Hàm tiện ích: giờ máy chủ (không phụ thuộc đồng hồ điện thoại khách/nhân viên)
--    và "ngày kinh doanh" (bắt đầu lúc 5h sáng giờ VN, để quán mở quá nửa đêm
--    vẫn tính chung vào ngày hôm đó).
-- ---------------------------------------------------------------------------
create or replace function qn_now_ms()
returns bigint language sql volatile as $$
  select (extract(epoch from clock_timestamp()) * 1000)::bigint
$$;

create or replace function qn_business_day(p_ms bigint)
returns text language sql immutable as $$
  -- +7h (giờ VN) - 5h (mốc 5h sáng) = +2h
  select to_char(to_timestamp((p_ms + 7200000) / 1000.0) at time zone 'UTC', 'YYYY-MM-DD')
$$;

-- ---------------------------------------------------------------------------
-- 4. Các hàm ghi dữ liệu (chạy nguyên tử trong database)
-- ---------------------------------------------------------------------------

-- Thêm 1 order mới (khách gửi). Gửi trùng cùng mã sẽ bị bỏ qua, không tạo đơn đôi.
create or replace function qn_add_order(p_order jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_order->>'id', '') = '' or coalesce(p_order->>'tableId', '') = '' then
    raise exception 'Order không hợp lệ';
  end if;
  if jsonb_typeof(p_order->'items') <> 'array' or jsonb_array_length(p_order->'items') = 0 then
    raise exception 'Order trống';
  end if;
  insert into orders (id, table_id, items, paid, created_at, paid_at)
  values (p_order->>'id', p_order->>'tableId', p_order->'items', false, qn_now_ms(), null)
  on conflict (id) do nothing;
end $$;

-- Đổi trạng thái 1 món (bếp / phục vụ)
create or replace function qn_advance_item_status(p_order_id text, p_item_id text, p_new_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_new_status not in ('received', 'done', 'served') then
    raise exception 'Trạng thái không hợp lệ';
  end if;
  update orders o
  set items = (
    select coalesce(jsonb_agg(
      case when it->>'itemId' = p_item_id then it || jsonb_build_object('status', p_new_status) else it end
      order by ord
    ), '[]'::jsonb)
    from jsonb_array_elements(o.items) with ordinality as t(it, ord)
  )
  where o.id = p_order_id and o.paid = false;
end $$;

-- Sửa số lượng 1 món, hoặc HUỶ món (p_qty <= 0).
-- p_only_if_received = true (khách tự sửa): chỉ cho phép khi bếp CHƯA làm xong món đó.
-- Trả về true nếu thực hiện được, false nếu không (món đã xong / đã thanh toán...).
create or replace function qn_set_item_qty(
  p_order_id text, p_item_id text, p_qty int, p_only_if_received boolean default false
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_items jsonb;
  v_status text;
  v_qty int := least(p_qty, 99);
begin
  select items into v_items from orders where id = p_order_id and paid = false for update;
  if not found then return false; end if;

  select it->>'status' into v_status
  from jsonb_array_elements(v_items) it
  where it->>'itemId' = p_item_id
  limit 1;
  if not found then return false; end if;

  if p_only_if_received and coalesce(v_status, 'received') <> 'received' then
    return false;
  end if;

  if v_qty <= 0 then
    update orders
    set items = (
      select coalesce(jsonb_agg(it order by ord), '[]'::jsonb)
      from jsonb_array_elements(v_items) with ordinality as t(it, ord)
      where it->>'itemId' <> p_item_id
    )
    where id = p_order_id;
    -- huỷ hết món của đơn thì xoá luôn đơn rỗng
    delete from orders where id = p_order_id and jsonb_array_length(items) = 0;
  else
    update orders
    set items = (
      select coalesce(jsonb_agg(
        case when it->>'itemId' = p_item_id then it || jsonb_build_object('qty', v_qty) else it end
        order by ord
      ), '[]'::jsonb)
      from jsonb_array_elements(v_items) with ordinality as t(it, ord)
    )
    where id = p_order_id;
  end if;
  return true;
end $$;

-- THANH TOÁN: chỉ đóng đúng những đơn nhân viên đang thấy trên hóa đơn, và chỉ khi
-- tổng tiền còn khớp. Nếu giữa chừng khách gọi thêm / huỷ món (tổng thay đổi) thì
-- KHÔNG thanh toán, trả về false để nhân viên xem lại hóa đơn mới.
create or replace function qn_checkout_orders(p_order_ids text[], p_expected_total numeric)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_total numeric;
begin
  -- khoá các đơn này để không ai sửa/huỷ món trong lúc tính tiền
  perform 1 from orders where id = any(p_order_ids) and paid = false for update;

  select coalesce(sum((it->>'price')::numeric * (it->>'qty')::numeric), 0)
  into v_total
  from orders o cross join lateral jsonb_array_elements(o.items) it
  where o.id = any(p_order_ids) and o.paid = false;

  if v_total <> p_expected_total then
    return false;
  end if;

  update orders
  set paid = true, paid_at = qn_now_ms()
  where id = any(p_order_ids) and paid = false and jsonb_array_length(items) > 0;

  delete from orders
  where id = any(p_order_ids) and paid = false and jsonb_array_length(items) = 0;

  return true;
end $$;

-- Reset ngày mới: dọn các order CHƯA thanh toán còn treo + yêu cầu cũ.
-- Đơn đã thanh toán giữ nguyên mãi mãi. Tự động chỉ chạy 1 lần mỗi "ngày kinh doanh".
create or replace function qn_reset_day(p_force boolean default false)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_today text := qn_business_day(qn_now_ms());
  v_cur text;
begin
  -- khoá dòng này: nếu 2 máy gọi cùng lúc, máy sau phải đợi rồi thấy "hôm nay đã reset" => không xoá chồng
  select value->>'lastResetDate' into v_cur from app_state where key = 'qn-meta' for update;
  if not p_force and v_cur = v_today then
    return false;
  end if;

  delete from orders where paid = false;

  insert into app_state (key, value, updated_at) values ('qn-requests', '[]'::jsonb, now())
  on conflict (key) do update set value = '[]'::jsonb, updated_at = now();

  insert into app_state (key, value, updated_at)
  values ('qn-meta', jsonb_build_object('lastResetDate', v_today), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();

  return true;
end $$;

-- Báo cáo doanh thu tổng hợp ngay trong database (nhẹ, không tải cả lịch sử về máy)
create or replace function qn_revenue_report(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_from bigint := qn_now_ms() - p_days::bigint * 86400000;
begin
  return jsonb_build_object(
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', d, 'total', t, 'bills', b) order by d)
      from (
        select qn_business_day(o.paid_at) as d, sum(x.total) as t, count(*) as b
        from orders o
        cross join lateral (
          select coalesce(sum((it->>'price')::numeric * (it->>'qty')::numeric), 0) as total
          from jsonb_array_elements(o.items) it
        ) x
        where o.paid and o.paid_at >= v_from
        group by 1
      ) s
    ), '[]'::jsonb),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('name', n, 'qty', q) order by q desc)
      from (
        select it->>'name' as n, sum((it->>'qty')::numeric) as q
        from orders o cross join lateral jsonb_array_elements(o.items) it
        where o.paid and o.paid_at >= v_from
        group by 1
        order by q desc
        limit 5
      ) y
    ), '[]'::jsonb)
  );
end $$;

-- ---------------------------------------------------------------------------
-- 5. Yêu cầu của khách (gọi nhân viên / thanh toán) — giữ nguyên cách lưu cũ
-- ---------------------------------------------------------------------------
create or replace function qn_add_request(p_request jsonb)
returns void language plpgsql as $$
begin
  insert into app_state (key, value, updated_at)
  values ('qn-requests', jsonb_build_array(p_request), now())
  on conflict (key) do update
    set value = coalesce(app_state.value, '[]'::jsonb) || jsonb_build_array(p_request),
        updated_at = now();
end $$;

create or replace function qn_resolve_request(p_request_id text, p_resolved_at bigint)
returns void language plpgsql as $$
begin
  update app_state
  set value = (
    select coalesce(jsonb_agg(
      case when (elem->>'id') = p_request_id
        then elem || jsonb_build_object('resolved', true, 'resolvedAt', p_resolved_at)
        else elem end
      order by ord
    ), '[]'::jsonb)
    from jsonb_array_elements(coalesce(value, '[]'::jsonb)) with ordinality as t(elem, ord)
  ),
  updated_at = now()
  where key = 'qn-requests';
end $$;

create or replace function qn_resolve_table_requests(p_table_id text, p_resolved_at bigint)
returns void language plpgsql as $$
begin
  update app_state
  set value = (
    select coalesce(jsonb_agg(
      case when (elem->>'tableId') = p_table_id and coalesce((elem->>'resolved')::boolean, false) = false
        then elem || jsonb_build_object('resolved', true, 'resolvedAt', p_resolved_at)
        else elem end
      order by ord
    ), '[]'::jsonb)
    from jsonb_array_elements(coalesce(value, '[]'::jsonb)) with ordinality as t(elem, ord)
  ),
  updated_at = now()
  where key = 'qn-requests';
end $$;

-- Dọn các hàm phiên bản cũ không còn dùng
drop function if exists qn_checkout_table(text, bigint);

-- ============================================================================
-- 3. Kho ảnh món ăn: kho công khai tên menu-images (khách xem được ảnh), tối đa 2MB/ảnh,
--    chỉ nhận JPG/PNG/WEBP. Ảnh được app tự thu nhỏ trước khi tải lên.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "menu images public read" on storage.objects;
create policy "menu images public read"
  on storage.objects for select
  using (bucket_id = 'menu-images');

drop policy if exists "menu images public upload" on storage.objects;
create policy "menu images public upload"
  on storage.objects for insert
  with check (bucket_id = 'menu-images');

drop policy if exists "menu images public delete" on storage.objects;
create policy "menu images public delete"
  on storage.objects for delete
  using (bucket_id = 'menu-images');
