"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { MoaDesignElement } from "../moa-design-palette";
import {
  createTemplateFromDesign,
  createTemplateFromElements,
  deleteMoaComponentTemplate,
  listMoaComponentTemplates,
  loadCustomMoaComponentTemplates,
  renameMoaComponentTemplate,
  saveCustomMoaComponentTemplates,
  updateCustomTemplateFromDesign,
  type MoaComponentTemplate,
} from "@/lib/moa/component-templates";
import type { MoaDesignBlob } from "@/lib/moa";
import { TransactionConfirmModal } from "@/components/shared/transaction-confirm-modal";
import { TabHint } from "./ui";

type PendingConfirm = {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void;
};

export function MoaTemplatesTab({
  enabled,
  searchQuery = "",
  currentDesign,
  selectedElements,
  onApplyPack,
  onApplyFull,
}: {
  enabled: boolean;
  searchQuery?: string;
  currentDesign: MoaDesignBlob;
  selectedElements: MoaDesignElement[];
  /** Append a pack of elements to the canvas */
  onApplyPack: (template: MoaComponentTemplate) => void;
  /** Replace the whole canvas with a full template */
  onApplyFull: (template: MoaComponentTemplate) => void;
}) {
  const [custom, setCustom] = useState<MoaComponentTemplate[]>([]);
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );

  useEffect(() => {
    setCustom(loadCustomMoaComponentTemplates());
  }, []);

  const persist = (next: MoaComponentTemplate[]) => {
    const onlyCustom = next.filter((t) => !t.builtin);
    setCustom(onlyCustom);
    saveCustomMoaComponentTemplates(onlyCustom);
  };

  const all = useMemo(() => {
    const builtins = listMoaComponentTemplates().filter((t) => t.builtin);
    // Custom first (newest on top), then built-ins
    const customSorted = [...custom].sort((a, b) =>
      String(b.updatedAt).localeCompare(String(a.updatedAt)),
    );
    return [...customSorted, ...builtins];
  }, [custom]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.kind.toLowerCase().includes(q),
    );
  }, [all, searchQuery]);

  const handleSaveCanvas = () => {
    if (!enabled) return;
    const name = saveName.trim() || `My slip ${custom.length + 1}`;
    const created = createTemplateFromDesign(
      name,
      currentDesign,
      "full",
      "Saved from canvas",
    );
    persist([created, ...custom]);
    setSaveName("");
  };

  const handleSaveSelection = () => {
    if (!enabled || selectedElements.length === 0) return;
    const name = saveName.trim() || `My pack ${custom.length + 1}`;
    const created = createTemplateFromElements(
      name,
      selectedElements,
      `${selectedElements.length} selected component(s)`,
    );
    persist([created, ...custom]);
    setSaveName("");
  };

  const handleDuplicate = (template: MoaComponentTemplate) => {
    if (!enabled) return;
    const copy = createTemplateFromElements(
      `${template.name} (copy)`,
      template.elements,
      template.description,
    );
    // Preserve full metadata when duplicating a full template
    const saved: MoaComponentTemplate =
      template.kind === "full"
        ? {
            ...createTemplateFromDesign(
              `${template.name} (copy)`,
              {
                elements: template.elements,
                pageSizeId: template.pageSizeId ?? currentDesign.pageSizeId,
                pageCount: template.pageCount ?? currentDesign.pageCount,
                watermark: template.watermark ?? currentDesign.watermark,
                margins: template.margins ?? currentDesign.margins,
              },
              "full",
              template.description,
            ),
          }
        : copy;
    persist([saved, ...custom]);
  };

  const handleDelete = (id: string) => {
    if (!enabled) return;
    setPendingConfirm({
      title: "Delete template",
      message: "This template will be permanently removed. This action cannot be undone.",
      confirmLabel: "Delete",
      action: () => {
        persist(deleteMoaComponentTemplate(custom, id));
        if (editingId === id) setEditingId(null);
      },
    });
  };

  const handleRenameCommit = (id: string) => {
    if (!enabled) return;
    persist(renameMoaComponentTemplate(custom, id, editName));
    setEditingId(null);
    setEditName("");
  };

  const handleUpdateFromCanvas = (id: string) => {
    if (!enabled) return;
    setPendingConfirm({
      title: "Update template",
      message: "Replace this template with the current canvas layout?",
      confirmLabel: "Update",
      action: () => {
        persist(updateCustomTemplateFromDesign(custom, id, currentDesign));
      },
    });
  };

  const handleApply = (template: MoaComponentTemplate) => {
    if (!enabled) return;
    if (template.kind === "full") {
      setPendingConfirm({
        title: "Apply full layout",
        message:
          "Replace the entire canvas with this template? Your current layout will be overwritten.",
        confirmLabel: "Apply layout",
        action: () => onApplyFull(template),
      });
      return;
    }
    onApplyPack(template);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
          Component templates
        </h3>
        <TabHint>
          Ready-made blocks you can drop on the canvas. Save your own, rename, or
          delete anytime.
        </TabHint>
      </div>

      <div className="space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
        <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
          Save as template
        </p>
        <input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          disabled={!enabled}
          placeholder="Template name…"
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-emerald-500 disabled:opacity-50"
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={!enabled}
            onClick={handleSaveCanvas}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            <Plus className="h-3 w-3" />
            Save whole canvas
          </button>
          <button
            type="button"
            disabled={!enabled || selectedElements.length === 0}
            onClick={handleSaveSelection}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-zinc-700 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            Save selection ({selectedElements.length})
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="rounded-md bg-zinc-50 px-2 py-3 text-center text-[10px] text-zinc-500">
            No templates match your search.
          </p>
        ) : (
          filtered.map((template) => {
            const isEditing = editingId === template.id;
            return (
              <div
                key={template.id}
                className="rounded-lg border border-zinc-200 bg-white p-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameCommit(template.id);
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditName("");
                          }
                        }}
                        autoFocus
                        className="w-full rounded border border-emerald-400 px-1.5 py-1 text-[11px] font-bold outline-none"
                      />
                    ) : (
                      <p className="truncate text-[11px] font-bold text-zinc-800">
                        {template.name}
                      </p>
                    )}
                    <p className="mt-0.5 text-[9px] leading-snug text-zinc-500">
                      {template.description ||
                        `${template.elements.length} component(s)`}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                          template.kind === "full"
                            ? "bg-sky-50 text-sky-800"
                            : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {template.kind === "full" ? "Full layout" : "Pack"}
                      </span>
                      {template.builtin ? (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-zinc-500">
                          Built-in
                        </span>
                      ) : (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-800">
                          Custom
                        </span>
                      )}
                      <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-[8px] font-medium text-zinc-400">
                        {template.elements.length} items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => handleApply(template)}
                    className="rounded-md border border-emerald-600 bg-emerald-600 px-2 py-1 text-[9px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {template.kind === "full" ? "Apply layout" : "Add to canvas"}
                  </button>

                  <button
                    type="button"
                    disabled={!enabled}
                    title="Duplicate as custom"
                    onClick={() => handleDuplicate(template)}
                    className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>

                  {!template.builtin ? (
                    <>
                      {isEditing ? (
                        <button
                          type="button"
                          disabled={!enabled}
                          onClick={() => handleRenameCommit(template.id)}
                          className="rounded-md border border-sky-600 bg-sky-50 px-2 py-1 text-[9px] font-bold text-sky-800 disabled:opacity-50"
                        >
                          Done
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!enabled}
                          title="Rename"
                          onClick={() => {
                            setEditingId(template.id);
                            setEditName(template.name);
                          }}
                          className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!enabled}
                        title="Update from current canvas"
                        onClick={() => handleUpdateFromCanvas(template.id)}
                        className="inline-flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Update
                      </button>
                      <button
                        type="button"
                        disabled={!enabled}
                        title="Delete template"
                        onClick={() => handleDelete(template.id)}
                        className="inline-flex items-center gap-0.5 rounded-md border border-red-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <TransactionConfirmModal
        isOpen={pendingConfirm !== null}
        title={pendingConfirm?.title ?? ""}
        message={pendingConfirm?.message ?? ""}
        confirmLabel={pendingConfirm?.confirmLabel ?? "Confirm"}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => {
          pendingConfirm?.action();
          setPendingConfirm(null);
        }}
      />
    </div>
  );
}
