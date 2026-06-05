import { api } from "./api";

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Fallback default categories
export const DEFAULT_CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "Gaming Console",
  "Appliances",
  "Cameras",
  "Smartwatches",
  "Audio & Earphones",
  "Other Items",
  "Miscellaneous"
];

let cachedCategories: string[] = [...DEFAULT_CATEGORIES];

export async function fetchCategories(): Promise<Category[]> {
  try {
    const data = await api.get<Category[]>("/categories");
    if (data && Array.isArray(data)) {
      cachedCategories = data.map(c => c.name);
      return data;
    }
  } catch (error) {
    console.error("Failed to fetch categories, using defaults:", error);
  }
  return DEFAULT_CATEGORIES.map((name, index) => ({
    id: `default-${index}`,
    name,
    description: `Default category ${name}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export function getCategoriesSync(): string[] {
  return cachedCategories;
}
