import handleApiRequest from "@/lib/handleApiRequest";
import { authorizedAPI } from "@/lib/api";

// Product types from backend API
export type ProductStatus = "active" | "draft" | "out_of_stock";

export interface ProductBase {
  name: string;
  description?: string | null;
  short_description?: string | null;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  sku?: string | null;
  barcode?: string | null;
  weight_kg?: number | null;
  dimensions?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  categories?: string[];
  subcategories?: string[];
  brand?: string | null;
  tags?: string[] | null;
  featured?: boolean;
  status?: ProductStatus;
  track_quantity?: boolean;
  continue_selling_when_oos?: boolean;
  requires_shipping?: boolean;
  taxable?: boolean;
  stock?: number;
  main_image_url?: string | null;
  social_media_link?: string | null;
}

export interface Product
  extends Omit<ProductBase, "categories" | "subcategories"> {
  id: string;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
  subcategory?: { id: string; name: string } | null;
  categories?: { id: string; name: string }[];
  subcategories?: { id: string; name: string }[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  product_variation_id?: string | null;
  url: string;
  is_primary: boolean;
  position: number;
}

export interface ProductVariation {
  id?: string;
  product_id?: string;
  price?: number | null;
  stock?: number;
  sku?: string | null;
  barcode?: string | null;
  attributes: Record<string, string>;
  images?: ProductImage[];
}

export interface Category {
  id: string;
  name: string;
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export interface ProductListPageFilters {
  search?: string;
  category?: string;
  status?: ProductStatus | "all";
}

export interface ProductQueryOptions {
  filters?: ProductListPageFilters;
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    column: string;
    direction: "asc" | "desc";
  };
}

export interface ProductReview {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  image_url: string | null;
  created_at: string;
  author: {
    full_name: string | null;
  } | null;
}

// Store-specific types
export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  main_image_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  brand: string | null;
  category: { id: string; name: string } | null;
  stock?: number | null | undefined;
}

export interface StoreCategory {
  id: string;
  name: string;
  products_count: number;
}

export interface StoreSubcategory {
  id: string;
  name: string;
  category_id: string;
  products_count: number;
}

export interface StoreCategorySimple {
  id: string;
  name: string;
}

export interface CategoryLight {
  id: string;
  name: string;
  icon_url?: string | null;
}

export interface StoreFilters {
  categories?: string[];
  subcategories?: string[];
  rating?: number;
}

export interface StoreQueryOptions {
  search?: string;
  filters?: StoreFilters;
  sort?: { column: string; direction: "asc" | "desc" };
  pagination: { page: number; limit: number };
}

/**
 * Fetch paginated products from the local backend
 */
export async function fetchProductsPage({
  filters = {},
  pagination = { page: 1, limit: 10 },
  sort = { column: "created_at", direction: "desc" },
}: ProductQueryOptions) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", String(filters.search));
  if (filters.category) params.append("category", String(filters.category));
  if (filters.status) params.append("status", String(filters.status));
  params.append("page", String(pagination.page));
  params.append("limit", String(pagination.limit));
  params.append("sortColumn", sort.column);
  params.append("sortDirection", sort.direction);

  const queryString = params.toString();
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/products${queryString ? `?${queryString}` : ""}`)
  );

  // Backend should return { data: Product[], count: number }
  return result;
}

/**
 * Fetch all products for export (no pagination)
 */
export async function fetchAllProductsForExport({
  filters = {},
  sort = { column: "created_at", direction: "desc" },
}: Omit<ProductQueryOptions, "pagination">) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", String(filters.search));
  if (filters.category) params.append("category", String(filters.category));
  if (filters.status) params.append("status", String(filters.status));
  params.append("sortColumn", sort.column);
  params.append("sortDirection", sort.direction);
  params.append("limit", "5000");

  const queryString = params.toString();
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/products/export${queryString ? `?${queryString}` : ""}`)
  );

  return result;
}

/**
 * Create a product
 */
export async function createProduct(
  product: ProductBase,
  variations?: ProductVariation[]
) {
  const result = await handleApiRequest(() =>
    authorizedAPI.post("/products", { product, variations })
  );
  return result;
}

/**
 * Create a product with images
 */
export async function createProductWithImages(
  productData: ProductBase,
  mainImageFiles: File[],
  variationsData: any[],
  selectedMainImageIndex: number = 0
) {
  const formData = new FormData();
  formData.append("product", JSON.stringify(productData));
  formData.append("selectedMainImageIndex", String(selectedMainImageIndex));

  mainImageFiles.forEach((file) => {
    formData.append("mainImages", file);
  });

  variationsData.forEach((variation, index) => {
    formData.append(`variations[${index}]`, JSON.stringify(variation));
    if (variation.imageFiles) {
      variation.imageFiles.forEach((file: File) => {
        formData.append(`variationImages[${index}]`, file);
      });
    }
  });

  const result = await handleApiRequest(() =>
    authorizedAPI.post("/products/with-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
  return result;
}

/**
 * Update a product
 */
export async function updateProduct(id: string, updates: Partial<ProductBase>) {
  const result = await handleApiRequest(() =>
    authorizedAPI.patch(`/products/${id}`, updates)
  );
  return result;
}

/**
 * Update a product with images
 */
export async function updateProductWithImages(
  productId: string,
  productData: Partial<ProductBase>,
  mainImages: { url: string; file?: File; isExisting?: boolean }[],
  variationsData: any[],
  selectedMainImageIndex: number = 0
) {
  const formData = new FormData();
  formData.append("product", JSON.stringify(productData));
  formData.append("selectedMainImageIndex", String(selectedMainImageIndex));

  mainImages.forEach((img) => {
    if (img.file) {
      formData.append("mainImages", img.file);
    } else if (img.isExisting) {
      formData.append("existingMainImages", img.url);
    }
  });

  variationsData.forEach((variation, index) => {
    formData.append(`variations[${index}]`, JSON.stringify(variation));
    if (variation.imageFiles) {
      variation.imageFiles.forEach((file: File) => {
        formData.append(`variationImages[${index}]`, file);
      });
    }
  });

  const result = await handleApiRequest(() =>
    authorizedAPI.patch(`/products/${productId}/with-images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );
  return result;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string) {
  const result = await handleApiRequest(() =>
    authorizedAPI.delete(`/products/${id}`)
  );
  return result;
}

/**
 * Fetch product for editing
 */
export async function fetchProductForEdit(id: string) {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/products/${id}/edit`)
  );
  return result;
}

/**
 * Fetch product with reviews
 */
export async function fetchProductWithReviews(productId: string) {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/products/${productId}/reviews`)
  );
  return result;
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string) {
  const result = await handleApiRequest(() =>
    authorizedAPI.delete(`/reviews/${reviewId}`)
  );
  return result;
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const result = await handleApiRequest(() => authorizedAPI.get("/categories"));
  return result;
}

/**
 * Fetch categories with subcategories
 */
export async function fetchCategoriesWithSubcategories(): Promise<
  CategoryWithSubcategories[]
> {
  const result = await handleApiRequest(() =>
    authorizedAPI.get("/categories/with-subcategories")
  );
  return result;
}

/**
 * Create bulk products
 */
export async function createBulkProducts(products: ProductBase[]) {
  const result = await handleApiRequest(() =>
    authorizedAPI.post("/products/bulk", { products })
  );
  return result;
}

/**
 * Fetch products light (id, name, price, main_image_url only)
 */
export async function fetchProductsLight(limit = 500) {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/products/light?limit=${limit}`)
  );
  return result;
}

// ============ STORE FRONTEND FUNCTIONS ============

/**
 * Fetch paginated store products (for public product listing page)
 */
export async function fetchStoreProducts(options: StoreQueryOptions) {
  const params = new URLSearchParams();

  if (options.search) params.append("search", String(options.search));

  if (options.filters) {
    if (options.filters.categories?.length) {
      options.filters.categories.forEach((cat) =>
        params.append("categories", cat)
      );
    }
    if (options.filters.subcategories?.length) {
      options.filters.subcategories.forEach((subcat) =>
        params.append("subcategories", subcat)
      );
    }
    if (options.filters.rating) {
      params.append("rating", String(options.filters.rating));
    }
  }

  if (options.pagination) {
    params.append("page", String(options.pagination.page));
    params.append("limit", String(options.pagination.limit));
  }

  if (options.sort) {
    params.append("sortColumn", options.sort.column);
    params.append("sortDirection", options.sort.direction);
  }

  const queryString = params.toString();
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/store/products${queryString ? `?${queryString}` : ""}`)
  );

  return result as { data: StoreProduct[]; count: number };
}

/**
 * Fetch all categories with subcategories
 */
export async function fetchAllCategoriesWithSubcategories() {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/store/categories/with-subcategories`)
  );

  return result as {
    categories: StoreCategory[];
    subcategories: StoreSubcategory[];
  };
}

/**
 * Fetch categories light (for landing page)
 */
export async function fetchCategoriesLight(): Promise<CategoryLight[]> {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/store/categories/light`)
  );

  return result;
}

/**
 * Fetch simple categories (name, id only)
 */
export async function fetchStoreCategories(): Promise<StoreCategorySimple[]> {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/store/categories`)
  );

  return result;
}

/**
 * Fetch products under 15k RWF
 */
export async function fetchProductsUnder15k(
  categoryId?: string
): Promise<StoreProduct[]> {
  const params = new URLSearchParams();
  if (categoryId) params.append("categoryId", categoryId);
  params.append("maxPrice", "15000");

  const queryString = params.toString();
  const result = await handleApiRequest(() =>
    authorizedAPI.get(
      `/store/products/featured/under-limit${queryString ? `?${queryString}` : ""}`
    )
  );

  return result;
}

/**
 * Fetch landing page products with filtering
 */
export async function fetchLandingPageProducts(options: {
  featured?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
}): Promise<StoreProduct[]> {
  const params = new URLSearchParams();

  if (options.featured !== undefined) {
    params.append("featured", String(options.featured));
  }
  if (options.limit) {
    params.append("limit", String(options.limit));
  }
  if (options.offset) {
    params.append("offset", String(options.offset));
  }
  if (options.sortBy) {
    params.append("sortBy", options.sortBy);
  }

  const queryString = params.toString();
  const result = await handleApiRequest(() =>
    authorizedAPI.get(
      `/store/products/landing${queryString ? `?${queryString}` : ""}`
    )
  );

  return result;
}
