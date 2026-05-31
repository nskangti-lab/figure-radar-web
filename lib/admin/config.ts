export type AdminField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "url" | "select" | "month" | "checkbox";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | boolean;
  options?: { id: string; label: string }[];
};

export type AdminEntityConfig = {
  key: string;
  title: string;
  table: string;
  path: string;
  fields: AdminField[];
  titleFields: string[];
  listColumns: string[];
};

export type AdminEntityKey =
  | "works"
  | "characters"
  | "manufacturers"
  | "shops"
  | "product_groups"
  | "product_variants"
  | "shop_listings"
  | "aliases"
  | "admin_review_queue";

export const adminEntities: Record<AdminEntityKey, AdminEntityConfig> = {
  works: {
    key: "works",
    title: "Works",
    table: "works",
    path: "/admin/works",
    fields: [
      { name: "name_kr", label: "Name KR", required: true },
      { name: "name_jp", label: "Name JP", required: true },
      { name: "name_en", label: "Name EN" },
      { name: "slug", label: "Slug", required: true }
    ],
    titleFields: ["name_kr"],
    listColumns: ["name_kr", "name_jp", "name_en", "slug"]
  },
  characters: {
    key: "characters",
    title: "Characters",
    table: "characters",
    path: "/admin/characters",
    fields: [
      { name: "work_id", label: "Work", type: "select", required: true },
      { name: "name_kr", label: "Name KR", required: true },
      { name: "name_jp", label: "Name JP", required: true },
      { name: "name_en", label: "Name EN" },
      { name: "slug", label: "Slug", required: true }
    ],
    titleFields: ["name_kr"],
    listColumns: ["name_kr", "name_jp", "name_en", "slug", "work_id"]
  },
  manufacturers: {
    key: "manufacturers",
    title: "Manufacturers",
    table: "manufacturers",
    path: "/admin/manufacturers",
    fields: [
      { name: "name_kr", label: "Name KR", required: true },
      { name: "name_jp", label: "Name JP" },
      { name: "name_en", label: "Name EN" },
      { name: "slug", label: "Slug", required: true },
      { name: "official_url", label: "Official URL", type: "url" }
    ],
    titleFields: ["name_kr"],
    listColumns: ["name_kr", "name_jp", "name_en", "slug", "official_url"]
  },
  shops: {
    key: "shops",
    title: "Shops",
    table: "shops",
    path: "/admin/shops",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "slug", label: "Slug" },
      { name: "shop_type", label: "Shop Type" },
      { name: "base_url", label: "Base URL", type: "url" },
      { name: "affiliate_supported", label: "Affiliate Supported", type: "checkbox" },
      { name: "is_trusted", label: "Trusted", type: "checkbox" },
      { name: "is_active", label: "Active", type: "checkbox" }
    ],
    titleFields: ["name"],
    listColumns: [
      "slug",
      "shop_type",
      "base_url",
      "affiliate_supported",
      "is_trusted",
      "is_active"
    ]
  },
  product_groups: {
    key: "product_groups",
    title: "Product Groups",
    table: "product_groups",
    path: "/admin/product-groups",
    fields: [
      { name: "work_id", label: "Work", type: "select", required: true },
      { name: "character_id", label: "Character", type: "select" },
      { name: "manufacturer_id", label: "Manufacturer", type: "select" },
      { name: "display_name_kr", label: "Display Name KR", required: true },
      { name: "canonical_name_jp", label: "Canonical Name JP", required: true },
      { name: "slug", label: "Slug", required: true },
      { name: "product_type", label: "Product Type", required: true, placeholder: "figure" },
      { name: "line_type", label: "Line Type", required: true, placeholder: "scale, nendoroid" },
      { name: "scale", label: "Scale", placeholder: "1/7" },
      { name: "main_image_url", label: "Main Image URL", type: "url" },
      { name: "status", label: "Status" },
      { name: "version_name_kr", label: "Version Name KR" },
      { name: "version_name_jp", label: "Version Name JP" },
      { name: "version_name_en", label: "Version Name EN" }
    ],
    titleFields: ["display_name_kr"],
    listColumns: ["canonical_name_jp", "line_type", "product_type", "scale", "status"]
  },
  product_variants: {
    key: "product_variants",
    title: "Product Variants",
    table: "product_variants",
    path: "/admin/product-variants",
    fields: [
      { name: "product_group_id", label: "Product Group", type: "select", required: true },
      { name: "variant_label_kr", label: "Variant Label KR" },
      { name: "edition_type", label: "Edition Type", placeholder: "standard, limited" },
      { name: "condition_type", label: "Condition Type" },
      { name: "jan_code", label: "JAN Code" },
      { name: "release_month_jp", label: "Release Month JP", type: "month" },
      { name: "official_price_jpy", label: "Official Price JPY", type: "number" }
    ],
    titleFields: ["variant_label_kr", "jan_code", "id"],
    listColumns: ["edition_type", "condition_type", "release_month_jp", "official_price_jpy"]
  },
  shop_listings: {
    key: "shop_listings",
    title: "Shop Listings",
    table: "shop_listings",
    path: "/admin/shop-listings",
    fields: [
      { name: "variant_id", label: "Variant", type: "select", required: true },
      { name: "shop_id", label: "Shop", type: "select", required: true },
      { name: "raw_shop_name", label: "Raw Shop Name", required: true },
      { name: "price", label: "Price", type: "number" },
      { name: "currency", label: "Currency", placeholder: "JPY" },
      { name: "stock_status", label: "Stock Status", placeholder: "preorder, in_stock, sold_out" },
      { name: "is_visible", label: "Visible", type: "checkbox", defaultValue: true },
      { name: "review_status", label: "Review Status", defaultValue: "APPROVED" },
      { name: "is_affiliate", label: "Affiliate", type: "checkbox", defaultValue: false },
      { name: "shipping_note", label: "Shipping Note" },
      { name: "listing_notes", label: "Listing Notes", type: "textarea" },
      { name: "listing_url", label: "Listing URL", type: "url", required: true },
      { name: "affiliate_url", label: "Affiliate URL", type: "url" }
    ],
    titleFields: ["raw_shop_name"],
    listColumns: [
      "raw_shop_name",
      "shop",
      "price",
      "currency",
      "stock_status",
      "is_visible",
      "review_status"
    ]
  },
  aliases: {
    key: "aliases",
    title: "Aliases",
    table: "aliases",
    path: "/admin/aliases",
    fields: [
      {
        name: "target_type",
        label: "Target Type",
        type: "select",
        required: true,
        options: [
          { id: "WORK", label: "WORK" },
          { id: "CHARACTER", label: "CHARACTER" },
          { id: "MANUFACTURER", label: "MANUFACTURER" },
          { id: "PRODUCT_GROUP", label: "PRODUCT_GROUP" }
        ]
      },
      { name: "target_id", label: "Target", type: "select", required: true },
      { name: "alias", label: "Alias", required: true },
      {
        name: "alias_type",
        label: "Alias Type",
        type: "select",
        options: [
          { id: "OFFICIAL", label: "OFFICIAL" },
          { id: "COMMON", label: "COMMON" },
          { id: "ABBREVIATION", label: "ABBREVIATION" },
          { id: "MISSPELLING", label: "MISSPELLING" },
          { id: "JP", label: "JP" },
          { id: "EN", label: "EN" },
          { id: "KR", label: "KR" }
        ]
      },
      { name: "language", label: "Language", defaultValue: "ko" }
    ],
    titleFields: ["alias"],
    listColumns: ["target_type", "target_id", "alias_type", "language"]
  },
  admin_review_queue: {
    key: "admin_review_queue",
    title: "Review Queue",
    table: "admin_review_queue",
    path: "/admin/review-queue",
    fields: [{ name: "review_status", label: "Review Status", required: true }],
    titleFields: ["review_status", "id"],
    listColumns: ["review_status", "created_at", "source_table", "source_id"]
  }
};

export const adminNav = [
  { href: "/admin/quick-add", label: "Quick Add" },
  { href: "/admin/bulk-add", label: "Bulk Add" },
  { href: "/admin/works", label: "Works" },
  { href: "/admin/characters", label: "Characters" },
  { href: "/admin/manufacturers", label: "Manufacturers" },
  { href: "/admin/shops", label: "Shops" },
  { href: "/admin/product-groups", label: "Product Groups" },
  { href: "/admin/product-variants", label: "Product Variants" },
  { href: "/admin/shop-listings", label: "Shop Listings" },
  { href: "/admin/aliases", label: "Aliases" },
  { href: "/admin/review-queue", label: "Review Queue" }
];

export function getAdminEntity(key: string): AdminEntityConfig | undefined {
  return adminEntities[key as AdminEntityKey];
}
