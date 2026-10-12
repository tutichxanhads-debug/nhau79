export const MENU_GROUPS = [
  "Món nhậu - món ăn nhanh",
  "Món lẩu - nướng",
  "Đồ uống",
];

export function menuGroup(category) {
  if (MENU_GROUPS.includes(category)) return category;
  if (category === "Đồ uống") return MENU_GROUPS[2];
  if (["Canh - Lẩu", "Món nướng"].includes(category)) return MENU_GROUPS[1];
  return MENU_GROUPS[0];
}

// Chỉ chuyển danh mục; giữ nguyên mọi trường khác trong cấu hình và món ăn.
export function normalizeMenuGroups(config) {
  return {
    ...config,
    categories: [...MENU_GROUPS],
    menu: (config.menu || []).map((item) => ({
      ...item,
      category: menuGroup(item.category),
    })),
  };
}
