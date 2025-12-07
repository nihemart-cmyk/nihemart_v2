import { authorizedAPI } from "@/lib/api";
import handleApiRequest from "@/lib/handleApiRequest";

export interface Category {
  id: string;
  name: string;
  icon_url?: string | null;
  products_count?: number;
  created_at?: string;
}

export interface CategoryInput {
  name: string;
  icon_url?: string | null;
}

export interface CategoryQueryOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchCategories(options: CategoryQueryOptions = {}): Promise<{ data: Category[]; count: number }> {
  const { search = '', page = 1, limit = 10 } = options;
  const result = await handleApiRequest(() =>
    authorizedAPI.get("/categories/admin", {
      params: { search, page, limit },
    })
  );

  // Transform category data to ensure icon_url is absolute
  if (result && result.data && Array.isArray(result.data)) {
    return {
      ...result,
      data: result.data.map((category: Category) => ({
        ...category,
        icon_url: getAbsoluteImageUrl(category.icon_url),
      })),
    };
  }

  return result;
}

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

export async function fetchCategoriesLight(): Promise<Category[]> {
  const result = await handleApiRequest(() =>
    authorizedAPI.get("/categories/light")
  );
  
  // Transform category data to ensure icon_url is absolute
  if (Array.isArray(result)) {
    return result.map((category: Category) => ({
      ...category,
      icon_url: getAbsoluteImageUrl(category.icon_url),
    }));
  }
  
  return result;
}

export async function createCategory(categoryData: CategoryInput): Promise<Category> {
  const result = await handleApiRequest(() =>
    authorizedAPI.post("/categories/admin", categoryData)
  );
  
  // Transform to ensure icon_url is absolute
  if (result) {
    return {
      ...result,
      icon_url: getAbsoluteImageUrl(result.icon_url),
    };
  }
  
  return result;
}

export async function updateCategory(id: string, updates: Partial<CategoryInput>): Promise<Category> {
  const result = await handleApiRequest(() =>
    authorizedAPI.put(`/categories/admin/${id}`, updates)
  );
  
  // Transform to ensure icon_url is absolute
  if (result) {
    return {
      ...result,
      icon_url: getAbsoluteImageUrl(result.icon_url),
    };
  }
  
  return result;
}

export async function deleteCategory(id: string): Promise<void> {
  await handleApiRequest(() =>
    authorizedAPI.delete(`/categories/admin/${id}`)
  );
}

