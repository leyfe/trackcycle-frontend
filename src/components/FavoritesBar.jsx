import React, { useEffect, useState } from "react";
import { Button, Tooltip } from "@nextui-org/react";
import { useToast } from "./Toast";

export default function FavoritesBar({
  entries = [],
  settings,
  onSelectFavorite,
  activeEntry,
}) {
  const [favorites, setFavorites] = useState([]);
  const { showToast } = useToast();

  /* ───────────── Favoriten kombinieren ───────────── */
  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem("timetracko.projects") || "[]");

    const entryMap = entries.reduce((acc, e) => {
      const key = `${e.projectId}::${e.description}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          projectId: e.projectId,
          projectName: e.projectName,
          description: e.description,
          activityId: e.activityId || "",
          customerId: e.customerId || "",
          hours: e.hours || "",
          source: "entry",
        };
      }
      return acc;
    }, {});

    let favoritesList = [];

    if (settings.manualFavorites?.length > 0) {
      favoritesList = settings.manualFavorites
        .map((key) => {
          const f = settings.favoriteDetails?.[key];
          if (f) {
            const proj = projects.find((p) => p.id === f.projectId);
            return {
              key,
              projectId: f.projectId,
              projectName: proj?.name || "–",
              description: f.description,
              activityId: f.activityId,
              customerId: f.customerId,
              hours: f.hours,
              source: "manual",
            };
          }

          const fromEntry = entryMap[key];
          if (fromEntry) {
            return { ...fromEntry, source: "manual-fallback" };
          }

          return null;
        })
        .filter(Boolean);
    } else {
      favoritesList = Object.values(entryMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }

    setFavorites(favoritesList);
  }, [entries, settings]);

  /* ───────────── Favorit auswählen ───────────── */
  function handleSelect(fav) {
    const projects = JSON.parse(localStorage.getItem("timetracko.projects") || "[]");
    const project = projects.find((p) => p.id === fav.projectId);

    if (project?.endDate && new Date(project.endDate) < new Date()) {
      showToast("Projekt ist beendet", "OK", null, 3000, "warning");
      return;
    }

    onSelectFavorite?.(fav);
  }

  /* ───────────── RENDER ───────────── */
  if (!settings.showFavorites || favorites.length === 0) return null;

  return (
    <div
      className="
        flex items-center gap-2 mt-2 
        overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800
        px-1 py-1 rounded-lg
      "
    >
      {favorites.map((fav, index) => {
        const isActive =
          activeEntry &&
          activeEntry.projectId === fav.projectId &&
          activeEntry.description === fav.description;

        return (
          <Tooltip
            key={fav.key || index}
            content={`${fav.projectName || "Unbekannt"}${
              fav.hours ? ` – ${fav.hours}h` : ""
            }`}
            className="text-xs"
          >
            <Button
              onPress={() => handleSelect(fav)}
              size="sm"
              variant={isActive ? "solid" : "flat"}
              className={`!min-w-fit transition-all border border-slate-700 
                bg-slate-800/50 hover:bg-slate-700/60 text-slate-200 px-3 py-1
              `}
            >
              <span className="truncate max-w-[140px] text-xs font-medium">
                {fav.description}
              </span>
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );
}