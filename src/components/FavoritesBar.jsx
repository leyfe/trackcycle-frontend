import React, { useEffect, useState } from "react";
import { Button, Tooltip } from "@nextui-org/react";
import { Star, Play, Pause, Clock } from "lucide-react";
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

    // 🔹 Map aus entries erstellen (zum Fallback)
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

    // 🟢 Wenn manuelle Favoriten vorhanden → nimm diese (mit Fallback auf entries)
    if (settings.manualFavorites?.length > 0) {
      favoritesList = settings.manualFavorites
        .map((key) => {
          // 1️⃣ versuche Details aus favoriteDetails zu holen
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

          // 2️⃣ falls keine Details gespeichert → Fallback aus entries
          const fromEntry = entryMap[key];
          if (fromEntry) {
            return {
              ...fromEntry,
              source: "manual-fallback",
            };
          }

          // 3️⃣ falls gar nichts gefunden → null
          return null;
        })
        .filter(Boolean);
    } else {
      // 🔹 Fallback: häufige Tasks aus entries, wenn keine Favoriten existieren
      favoritesList = Object.values(entryMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    }

    setFavorites(favoritesList);
  }, [entries, settings]);

  /* ───────────── Favorit auswählen ───────────── */
  function handleSelect(fav) {
    const projects = JSON.parse(localStorage.getItem("timetracko.projects") || "[]");
    const project = projects.find(p => p.id === fav.projectId);

    // ⛔ Projekt-Enddatum prüfen
    if (project?.endDate && new Date(project.endDate) < new Date()) {
      showToast("Projekt ist beendet", "OK", null, 3000, "warning");
      return;
    }

    onSelectFavorite?.(fav);
  }

  /* ───────────── RENDER ───────────── */
  if (!settings.showFavorites || favorites.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
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
              className={`transition-all border border-slate-700 bg-slate-800/50 hover:bg-slate-700/60 text-slate-200`}
            >
              <span className="truncate max-w-[130px] text-xs font-medium">
                {fav.description}
              </span>
            </Button>
          </Tooltip>
        );
      })}
    </div>
  );
}