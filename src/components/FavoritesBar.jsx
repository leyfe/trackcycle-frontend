import React, { useMemo, useRef } from "react";
import { Button } from "@nextui-org/react";
import { useToast } from "./Toast";

export default function FavoritesBar({ entries = [], settings = {}, activeEntry, onSelect }) {
  const {
    showFavorites = true,
    manualMode = false,
    manualFavorites = [],
    customLabels = {},
  } = settings;

  const scrollRef = useRef(null);
  const { showToast } = useToast();

  // 🧠 Häufig genutzte Tasks (Top 10 für Scrollbarkeit)
  const topTasks = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const counts = entries.reduce((acc, e) => {
      if (!e.projectId || !e.description) return acc;
      const key = `${e.projectId}::${e.description}`;
      if (!acc[key])
        acc[key] = {
          key,
          projectId: e.projectId,
          projectName: e.projectName,
          description: e.description,
          count: 0,
        };
      acc[key].count++;
      return acc;
    }, {});
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [entries]);

  // 🧩 Manuelle Favoriten (falls aktiv)
  const manualTasks = useMemo(() => {
    if (!manualMode || !entries) return [];
    const allTasks = entries.reduce((acc, e) => {
      const key = `${e.projectId}::${e.description}`;
      if (!acc[key])
        acc[key] = {
          key,
          projectId: e.projectId,
          projectName: e.projectName,
          description: e.description,
        };
      return acc;
    }, {});
    return manualFavorites.map((key) => allTasks[key]).filter(Boolean);
  }, [entries, manualFavorites, manualMode]);

  const displayTasks =
    manualMode && manualTasks.length > 0 ? manualTasks : topTasks;

  // 🔹 Scrollen per Klick
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  const uniqueDisplayTasks = useMemo(() => {
    const seen = new Set();
    return displayTasks.filter((t) => {
      if (seen.has(t.key)) return false;
      seen.add(t.key);
      return true;
    });
  }, [displayTasks]);

  // 🟢 Frühestens jetzt: Return, wenn nix zu zeigen ist
  if (!showFavorites || uniqueDisplayTasks.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Scrollbarer Bereich */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-1 scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {uniqueDisplayTasks.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant="flat"
            className="bg-slate-700 text-slate-200 hover:bg-slate-600 transition-all px-3 rounded-lg shadow-sm hover:shadow-md flex-shrink-0"
            onPress={() => {
              if (!t.projectId) return;
              onSelect({
                projectId: t.projectId.toString(),
                projectName: t.projectName,
                description: t.description,
              });
            }}
            title={`${t.projectName} — ${t.description}`}
          >
            {customLabels[t.key] || t.description}
          </Button>
        ))}
      </div>
    </div>
  );
}