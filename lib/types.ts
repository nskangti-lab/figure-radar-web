export type AnyRecord = Record<string, unknown>;

export type ProductCardItem = AnyRecord & {
  id?: string;
  product_group_id?: string;
  slug?: string;
  display_name_kr?: string;
  canonical_name_jp?: string;
  work_name_kr?: string;
  character_name_kr?: string;
  manufacturer_name_kr?: string;
  line_type?: string;
  product_type?: string;
  release_month_jp?: string;
  official_price_jpy?: number | string;
  image_url?: string;
  thumbnail_url?: string;
  representative_image_url?: string;
  main_image_url?: string;
  created_at?: string;
  stock_status?: string;
  listing_count?: number;
  representative_listing?: {
    price?: number | string | null;
    currency?: string | null;
    stock_status?: string | null;
    shop_name?: string | null;
  };
};

export type AdminOption = {
  id: string;
  label: string;
  group?: string;
};
