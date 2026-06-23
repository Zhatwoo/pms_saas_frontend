import { api } from "./api";

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

let cachedCategories: string[] = [];

export async function fetchCategories(): Promise<Category[]> {
  try {
    const data = await api.get<Category[]>("/categories");
    if (data && Array.isArray(data)) {
      cachedCategories = data.map(c => c.name);
      return data;
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }
  return [];
}

export function getCategoriesSync(): string[] {
  return cachedCategories;
}
