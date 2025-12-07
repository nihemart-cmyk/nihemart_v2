import { authorizedAPI } from "@/lib/api";
import handleApiRequest from "@/lib/handleApiRequest";

/**
 * Upload a file to the backend
 * @param file - The file to upload
 * @param category - Category of the file (e.g., 'product', 'rider', 'general')
 * @param entityType - Type of entity (e.g., 'product', 'rider')
 * @param entityId - ID of the entity (optional)
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  category: "product" | "rider" | "general" | "blog" | "directorate" = "general",
  entityType?: string,
  entityId?: string
): Promise<string> {
  const formData = new FormData();
  
  // Determine the correct endpoint and field name based on category
  let endpoint = "/uploads";
  let fieldName = "file";
  
  if (category === "product") {
    endpoint = "/uploads/products";
    fieldName = "files"; // Backend expects 'files' array for products
    formData.append(fieldName, file);
  } else if (category === "rider") {
    endpoint = "/uploads/riders";
    formData.append("file", file);
  } else if (category === "blog") {
    endpoint = "/uploads/blogs";
    formData.append("file", file);
  } else if (category === "directorate") {
    endpoint = "/uploads/directorates";
    formData.append("file", file);
  } else {
    formData.append("file", file);
  }
  
  if (entityType) formData.append("entityType", entityType);
  if (entityId) formData.append("entityId", entityId);
  if (category) formData.append("category", category);

  const result = await handleApiRequest(() =>
    authorizedAPI.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  );

  // Handle different response formats
  if (category === "product" && result.images && Array.isArray(result.images)) {
    // Product uploads return { images: [...] }
    return result.images[0]?.url || result.images[0]?.path || "";
  }
  
  // Return the full URL
  return result.url || result.path || "";
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  category: "product" | "rider" | "general" | "blog" | "directorate" = "general",
  entityType?: string,
  entityId?: string
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadFile(file, category, entityType, entityId)
  );
  return Promise.all(uploadPromises);
}

