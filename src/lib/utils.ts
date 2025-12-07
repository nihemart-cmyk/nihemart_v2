import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get absolute image URL from relative path or Supabase URL
 */
function getAbsoluteImageUrl(url: string | null | undefined): string | null {
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
}

/**
 * Optimize Supabase Storage image URLs by adding transformation parameters
 * to reduce bandwidth and improve loading speeds.
 * Also converts relative backend upload paths to absolute URLs.
 */
export function optimizeImageUrl(
  url: string | null,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  } = {}
): string {
  if (!url) return '/placeholder.svg';
  
  // If it's a relative backend upload path, convert to absolute URL
  if (url.startsWith('/uploads/')) {
    const absoluteUrl = getAbsoluteImageUrl(url);
    return absoluteUrl || '/placeholder.svg';
  }
  
  // If it's already an absolute URL (not Supabase), return as is
  if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('supabase')) {
    return url;
  }
  
  // For Supabase URLs, add transformation parameters
  if (url.includes('supabase')) {
    const { width, height, quality = 80, format = 'webp' } = options;
    const separator = url.includes('?') ? '&' : '?';
    let transformParams = `quality=${quality}&format=${format}`;

    if (width) transformParams += `&width=${width}`;
    if (height) transformParams += `&height=${height}`;

    return `${url}${separator}${transformParams}`;
  }
  
  // Fallback: try to convert to absolute URL
  const absoluteUrl = getAbsoluteImageUrl(url);
  return absoluteUrl || '/placeholder.svg';
}
