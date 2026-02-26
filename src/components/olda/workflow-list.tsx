"use client";

/**
 * WorkflowList — 4 production lists (ACHAT, STANDARD, ATELIER, DTF)
 * with drag & drop (framer-motion Reorder), swipe-to-delete, and Prisma persistence.
 * Light mode only — zero dark: variants.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Reorder } from "framer-motion";
import { Plus, X } from "lucide-react";
import { motion, useMotionValue, useTransform, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type WorkflowType = "ACHAT" | "STANDARD" | "ATELIER" | "DTF";

interface WorkflowItem {
  id: string;
  content: string;
  type: WorkflowType;
  position: number;
  done: boolean;
}

interface WorkflowData {
  ACHAT: WorkflowItem[];
  STANDARD: WorkflowItem[];
  ATELIER: WorkflowItem[];
  DTF: WorkflowItem[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const LIST_CONFIG: Record<WorkflowType, { label: string; color: string; dot: string }> = {
  ACHAT: { label: "LISTE D'ACHAT", color: "#007AFF", dot: "bg-blue-500" },
  STANDARD: { label: "LISTE STANDARD", color: "#8B5CF6", dot: "bg-violet-500" },
  ATELIER: { label: "ATELIER À FAIRE", color: "#FF9500", dot: "bg-orange-400" },
  DTF: { label: "LISTE DTF", color: "#34C759", dot: "bg-green-500" },
} as const;

// ── Hook: useWorkflowData ──────────────────────────────────────────────────

function useWorkflowData() {
  const [data, setData] = useState<WorkflowData>({
    ACHAT: [],
    STANDARD: [],
    ATELIER: [],
    DTF: [],
  });
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetch("/api/workflow")
      .then((r) => r.json())
      .then((result) => {
        if (result.items) {
          setData(result.items);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Debounced persist
  const persist = useCallback(
    (callback: () => Promise<void>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await callback();
        } catch (error) {
          console.error("Persist error:", error);
        }
      }, 600);
    },
    []
  );

  // Add item
  const addItem = useCallback(
    (type: WorkflowType, content: string) => {
      if (!content.trim()) return;

      const newItem: WorkflowItem = {
        id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        content,
        type,
        position: data[type].length,
        done: false,
      };

      setData((prev) => ({
        ...prev,
        [type]: [...prev[type], newItem],
      }));

      persist(async () => {
        await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, type }),
        });
      });
    },
    [data, persist]
  );

  // Remove item
  const removeItem = useCallback(
    (id: string, type: WorkflowType) => {
      setData((prev) => ({
        ...prev,
        [type]: prev[type].filter((item) => item.id !== id),
      }));

      persist(async () => {
        await fetch(`/api/workflow/${id}`, { method: "DELETE" });
      });
    },
    [persist]
  );

  // Toggle done
  const toggleDone = useCallback(
    (id: string, type: WorkflowType) => {
      setData((prev) => ({
        ...prev,
        [type]: prev[type].map((item) =>
          item.id === id ? { ...item, done: !item.done } : item
        ),
      }));

      persist(async () => {
        const item = data[type].find((i) => i.id === id);
        if (item) {
          await fetch(`/api/workflow/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: !item.done }),
          });
        }
      });
    },
    [data, persist]
  );

  // Reorder items
  const reorder = useCallback(
    (type: WorkflowType, newOrder: WorkflowItem[]) => {
      setData((prev) => ({
        ...prev,
        [type]: newOrder,
      }));

      persist(async () => {
        const ids = newOrder.map((item) => item.id);
        await fetch("/api/workflow/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ids }),
        });
      });
    },
    [persist]
  );

  return { data, loading, addItem, removeItem, toggleDone, reorder };
}

// ── Component: SwipeableWorkflowRow ────────────────────────────────────────

function SwipeableWorkflowRow({
  item,
  type,
  onDelete,
  onToggleDone,
}: {
  item: WorkflowItem;
  type: WorkflowType;
  onDelete: () => void;
  onToggleDone: () => void;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-80, 0], [0, 1]);
  const scale = useTransform(x, [-80, 0], [0.8, 1]);

  const handleSwipeEnd = () => {
    if (Math.abs(x.get()) > 40) {
      onDelete();
    } else {
      x.set(0);
    }
  };

  return (
    <motion.div
      drag="x"
      dragElastic={0.2}
      dragConstraints={{ left: -80, right: 0 }}
      onDragEnd={handleSwipeEnd}
      style={{ x, opacity, scale }}
      className="flex items-center gap-2 w-full cursor-pointer rounded-md -mx-1 px-1 py-[3px] hover:bg-gray-50 transition-colors"
      onClick={onToggleDone}
    >
      {/* Dot */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone();
        }}
        className={cn(
          "shrink-0 h-[14px] w-[14px] rounded-full border transition-all duration-200",
          item.done
            ? "bg-gray-300 border-gray-300"
            : "border-gray-300 hover:border-gray-500"
        )}
      />
      {/* Text */}
      <span
        className={cn(
          "flex-1 text-[14px] leading-snug transition-all duration-200",
          item.done ? "line-through text-gray-300" : "text-gray-700"
        )}
      >
        {item.content}
      </span>
    </motion.div>
  );
}

// ── Component: WorkflowCard ────────────────────────────────────────────────

function WorkflowCard({
  type,
  items,
  onAddItem,
  onRemoveItem,
  onToggleDone,
  onReorder,
}: {
  type: WorkflowType;
  items: WorkflowItem[];
  onAddItem: (content: string) => void;
  onRemoveItem: (id: string) => void;
  onToggleDone: (id: string) => void;
  onReorder: (newOrder: WorkflowItem[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const config = LIST_CONFIG[type];

  const commitDraft = useCallback(() => {
    const text = draft.trim();
    if (!text) {
      setEditing(false);
      setDraft("");
      return;
    }
    onAddItem(text);
    setDraft("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [draft, onAddItem]);

  const openEdit = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  return (
    <div className="rounded-[18px] bg-white border border-[#E5E5E5] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-3 md:p-4 flex flex-col min-h-[96px] md:min-h-[110px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {config.label}
        </span>
        <button
          onClick={openEdit}
          aria-label="Ajouter un item"
          className="flex items-center justify-center -mr-1.5 -mt-1 h-[44px] w-[44px] rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Plus size={13} strokeWidth={1.8} />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1.5">
        {items.length === 0 && !editing && (
          <p className="text-[13px] italic text-gray-300 pl-[22px]">
            Aucun item…
          </p>
        )}

        <Reorder.Group
          axis="y"
          values={items}
          onReorder={onReorder}
          className="space-y-0"
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className="cursor-grab active:cursor-grabbing"
            >
              <SwipeableWorkflowRow
                item={item}
                type={type}
                onDelete={() => onRemoveItem(item.id)}
                onToggleDone={() => onToggleDone(item.id)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Inline add input */}
        {editing && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="shrink-0 h-[14px] w-[14px] rounded-full border border-gray-200" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDraft();
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraft("");
                }
              }}
              onBlur={() => {
                commitDraft();
                setEditing(false);
              }}
              placeholder="Nouvel item…"
              className="flex-1 text-[14px] text-gray-700 placeholder:text-gray-300 bg-transparent outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export: WorkflowList ──────────────────────────────────────────────

export function WorkflowList() {
  const { data, loading, addItem, removeItem, toggleDone, reorder } = useWorkflowData();

  if (loading) {
    return (
      <div className="text-[14px] text-gray-500 py-8 text-center">
        Chargement…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
      {(["ACHAT", "STANDARD", "ATELIER", "DTF"] as WorkflowType[]).map((type) => (
        <WorkflowCard
          key={type}
          type={type}
          items={data[type]}
          onAddItem={(content) => addItem(type, content)}
          onRemoveItem={(id) => removeItem(id, type)}
          onToggleDone={(id) => toggleDone(id, type)}
          onReorder={(newOrder) => reorder(type, newOrder)}
        />
      ))}
    </div>
  );
}
