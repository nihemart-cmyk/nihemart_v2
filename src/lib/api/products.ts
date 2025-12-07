import handleApiRequest from "@/lib/handleApiRequest";
import { authorizedAPI, unauthorizedAPI } from "@/lib/api";

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
  // Backend expects categoryId, not category
  if (filters.category && filters.category !== "all") {
    params.append("categoryId", String(filters.category));
  }
  if (filters.status && filters.status !== "all") {
    params.append("status", String(filters.status));
  }
  params.append("page", String(pagination.page));
  params.append("limit", String(pagination.limit));
  
  // Map frontend snake_case sort columns to backend camelCase
  const sortColumnMap: Record<string, string> = {
    created_at: "createdAt",
    updated_at: "updatedAt",
    main_image_url: "mainImageUrl",
    category_id: "categoryId",
    subcategory_id: "subcategoryId",
    short_description: "shortDescription",
    compare_at_price: "compareAtPrice",
  };
  const backendSortColumn = sortColumnMap[sort.column] || sort.column;
  params.append("sortColumn", backendSortColumn);
  params.append("sortDirection", sort.direction);

  const queryString = params.toString();
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/products${queryString ? `?${queryString}` : ""}`)
  );

  // Helper to convert relative image URLs to absolute backend URLs
  const getAbsoluteImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // If already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Convert relative path to absolute URL using backend API base
    const apiBase = typeof window !== "undefined" 
      ? (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api")
      : "http://localhost:4000/api";
    
    // Remove /api suffix if present to get base backend URL
    const backendBase = apiBase.replace(/\/api$/, "");
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${backendBase}${cleanPath}`;
  };

  // Backend returns { data: Product[], pagination: { total, ... } }
  // Transform to { data: Product[], count: number }
  // Also transform camelCase to snake_case
  if (result && result.data && Array.isArray(result.data)) {
    const transformedData = result.data.map((product: any) => {
      // Get image URL and ensure it's absolute
      const imageUrl = product.mainImageUrl || product.main_image_url || null;
      const absoluteImageUrl = getAbsoluteImageUrl(imageUrl);
      
      return {
        id: product.id,
        name: product.name || "",
        price: product.price || 0,
        stock: product.stock ?? null,
        status: product.status || "draft",
        featured: product.featured || false,
        main_image_url: absoluteImageUrl,
        brand: product.brand || null,
        category: product.category || null,
        created_at: product.createdAt || product.created_at || new Date().toISOString(),
        updated_at: product.updatedAt || product.updated_at || product.createdAt || product.created_at || new Date().toISOString(),
        // Include other fields that might be needed
        description: product.description || null,
        short_description: product.shortDescription || product.short_description || null,
        sku: product.sku || null,
        category_id: product.categoryId || product.category_id || (product.category ? product.category.id : null),
        subcategory_id: product.subcategoryId || product.subcategory_id || null,
      };
    });

    const count = result.pagination?.total ?? result.count ?? result.data.length ?? 0;

    return {
      data: transformedData,
      count: count,
    };
  }

  // Return empty result if no data or invalid response
  console.warn("fetchProductsPage: Invalid or empty response", result);
  return {
    data: [],
    count: 0,
  };
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
 * Fetch a single product by ID (for product details page)
 */
export async function fetchStoreProductById(id: string) {
  const result = await handleApiRequest(() =>
    unauthorizedAPI.get(`/products/store/${id}`)
  );

  if (!result || !result.product) {
    return null;
  }

  // Fetch similar products based on categories
  let similarProducts: StoreProduct[] = [];
  if (result?.product?.categories && result.product.categories.length > 0) {
    try {
      const categoryIds = result.product.categories.map((c: any) => c.id);
      const similarResult = await handleApiRequest(() =>
        unauthorizedAPI.get(
          `/products/store?categories=${categoryIds.join(',')}&limit=4&page=1`
        )
      );
      if (similarResult?.data) {
        // Filter out the current product
        similarProducts = similarResult.data.filter(
          (p: StoreProduct) => p.id !== id
        );
      }
    } catch (error) {
      console.error('Failed to fetch similar products:', error);
    }
  }

  return {
    ...result,
    similarProducts,
  } as {
    product: {
      id: string;
      name: string;
      description: string | null;
      short_description: string | null;
      stock: number;
      price: number;
      compare_at_price: number | null;
      main_image_url: string | null;
      average_rating: number | null;
      review_count: number;
      brand: string | null;
      social_media_link: string | null;
      category: { id: string; name: string } | null;
      categories: Array<{ id: string; name: string }>;
      subcategories: Array<{ id: string; name: string }>;
    };
    images: Array<{
      id: string;
      url: string;
      product_variation_id: string | null;
    }>;
    variations: Array<{
      id: string;
      name: string | null;
      price: number | null;
      stock: number;
      attributes: Record<string, string>;
    }>;
    reviews: Array<{
      id: string;
      rating: number;
      title: string | null;
      content: string | null;
      image_url: string | null;
      created_at: string;
      author: {
        full_name: string | null;
      };
    }>;
    similarProducts: StoreProduct[];
  };
}

/**
 * Fetch all product IDs (for static generation)
 */
export async function fetchAllProductIds(): Promise<string[]> {
  try {
    const result = await handleApiRequest(() =>
      unauthorizedAPI.get('/products/store?limit=10000&page=1')
    );
    if (result?.data) {
      return result.data.map((product: StoreProduct) => product.id);
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch product IDs:', error);
    return [];
  }
}

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
    authorizedAPI.get(`/products/store${queryString ? `?${queryString}` : ""}`)
  );

  return result as { data: StoreProduct[]; count: number };
}

/**
 * Fetch all categories with subcategories
 */
export async function fetchAllCategoriesWithSubcategories() {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/categories/with-subcategories`)
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
    authorizedAPI.get(`/categories/light`)
  );

  return result;
}

/**
 * Fetch simple categories (name, id only)
 */
export async function fetchStoreCategories(): Promise<StoreCategorySimple[]> {
  const result = await handleApiRequest(() =>
    authorizedAPI.get(`/categories`)
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
  params.append("featured", "true");

  const queryString = params.toString();
  const result = await handleApiRequest(() =>
    authorizedAPI.get(
      `/products/featured/under-limit${queryString ? `?${queryString}` : ""}`
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
      `/products/landing${queryString ? `?${queryString}` : ""}`
    )
  );

  return result;
}
