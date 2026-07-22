"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Category } from "@/lib/categories";

export default function CategoriesSettings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.toLowerCase() === "super_admin";
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create state
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isEditLoading, setIsEditLoading] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAllCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Category[]>("/categories");
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmitLoading(true);
    try {
      const created = await api.post<Category>("/categories", {
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      });

      if (created) {
        toast.success(`Category "${created.name}" created successfully!`);
        setNewCatName("");
        setNewCatDesc("");
        setIsAdding(false);
        fetchAllCategories();
        window.dispatchEvent(new CustomEvent("categories-updated"));
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Failed to create category";
      toast.error(msg);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDesc("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsEditLoading(true);
    try {
      const updated = await api.patch<Category>(`/categories/${id}`, {
        name: editName.trim(),
        description: editDesc.trim() || null,
      });

      if (updated) {
        toast.success(`Category updated successfully!`);
        setEditingId(null);
        fetchAllCategories();
        window.dispatchEvent(new CustomEvent("categories-updated"));
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Failed to update category";
      toast.error(msg);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/categories/${id}`);
      toast.success(`Category "${name}" deleted successfully.`);
      fetchAllCategories();
      window.dispatchEvent(new CustomEvent("categories-updated"));
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Failed to delete category";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm transition-colors duration-300">
      <div className="border-b border-border-main px-4 py-3 flex items-center justify-between">
        <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-brand-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Manage Categories
        </h2>
        {isSuperAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-green px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-110 transition-all duration-200 shadow-sm"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        )}
      </div>

      {isSuperAdmin && isAdding && (
        <form onSubmit={handleAddCategory} className="border-b border-border-main bg-surface-secondary/40 p-4 space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">New Category</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Jewelry"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                disabled={isSubmitLoading}
                className="h-9 w-full rounded-md border border-border-main bg-surface px-3 text-xs text-text-primary outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all duration-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">Description</label>
              <input
                type="text"
                placeholder="Brief details..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                disabled={isSubmitLoading}
                className="h-9 w-full rounded-md border border-border-main bg-surface px-3 text-xs text-text-primary outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1.5">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewCatName("");
                setNewCatDesc("");
              }}
              disabled={isSubmitLoading}
              className="rounded-lg border border-border-main bg-surface px-3 py-1.5 text-[11px] font-bold text-zinc-700 hover:bg-surface-hover dark:text-zinc-300 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitLoading}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-green px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-110 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              {isSubmitLoading ? "Creating..." : "Save Category"}
            </button>
          </div>
        </form>
      )}

      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-zinc-500">
            <svg className="animate-spin h-5 w-5 text-brand-green" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs">
            No categories found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-main bg-surface">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-border-main font-bold text-zinc-700 dark:text-zinc-300">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Description</th>
                  {isSuperAdmin && <th className="px-4 py-2.5 text-center w-36">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  const isDeleting = deletingId === cat.id;

                  return (
                    <tr key={cat.id} className="hover:bg-surface-secondary/30 transition-colors duration-150">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 w-full rounded border border-brand-green bg-surface px-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-brand-green"
                            disabled={isEditLoading}
                          />
                        ) : (
                          cat.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="h-8 w-full rounded border border-brand-green bg-surface px-2 text-xs text-text-primary outline-none focus:ring-1 focus:ring-brand-green"
                            disabled={isEditLoading}
                          />
                        ) : (
                          cat.description || <span className="italic text-zinc-400">No description</span>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={handleCancelEdit}
                                disabled={isEditLoading}
                                className="rounded px-2 py-1 text-[10px] font-bold border border-border-main text-zinc-600 hover:bg-surface-hover dark:text-zinc-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(cat.id)}
                                disabled={isEditLoading}
                                className="rounded bg-brand-green text-white px-2 py-1 text-[10px] font-bold hover:brightness-110"
                              >
                                {isEditLoading ? "Saving..." : "Save"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleStartEdit(cat)}
                                className="text-zinc-600 hover:text-brand-green dark:text-zinc-400 dark:hover:text-brand-green font-bold text-[11px] transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
                                    handleDeleteCategory(cat.id, cat.name);
                                  }
                                }}
                                disabled={isDeleting}
                                className="text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 font-bold text-[11px] transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
