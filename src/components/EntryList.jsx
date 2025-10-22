import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { Trash2, Edit, RotateCw, Download } from "lucide-react";
import { useToast } from "./Toast";
import DayOverview from "./DayOverview";
import { exportEntriesConaktiv } from "../utils/exportData";

/* ----------------------------- EntryList ----------------------------- */
export default function EntryList({
  entries,
  activeEntry,
  onEdit,
  onDelete,
  onRestart,
  onAdd,
  settings,
  onConvertToPause,
  suggestions
}) {
  const [collapsedTasks, setCollapsedTasks] = useState({});
  const [visibleDays, setVisibleDays] = useState(7);
  const [hasMore, setHasMore] = useState(false);
  const { showToast } = useToast();

  const roundEnabled = settings?.roundToQuarter ?? false;

  if (!entries.length)
    return (
      <div className="text-slate-500 text-center mt-4">
        Noch keine Zeiteinträge vorhanden.
      </div>
    );

  const roundToQuarter = (minutes) => Math.ceil(minutes / 15) * 15;

  // 🧠 Helper: Pausen-Erkennung
  const isPauseEntry = (entry) =>
    entry.projectId === "PAUSE" || entry.projectName?.toLowerCase() === "pause";

  const getRoundedDurationsByTask = (dayEntries) => {
    const grouped = {};
    dayEntries.forEach((e) => {
      if (!e.projectName && !e.description) return;
      const key = `${e.projectName || ""}__${e.description || ""}`;
      const dur = (parseFloat(e.duration) || 0) * 60;
      grouped[key] = (grouped[key] || 0) + dur;
    });
    return Object.entries(grouped).map(([key, totalMin]) => ({
      key,
      totalMinutes: roundToQuarter(totalMin),
      totalHours: roundToQuarter(totalMin) / 60,
    }));
  };

  const groupedByDate = entries.reduce((acc, e) => {
    const date = new Date(e.start).toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    const parseDate = (str) => {
      const parts = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      return parts ? new Date(`${parts[3]}-${parts[2]}-${parts[1]}`) : new Date();
    };
    return parseDate(b) - parseDate(a);
  });

  useEffect(
    () => setHasMore(visibleDays < sortedDates.length),
    [visibleDays, sortedDates.length]
  );
  const visibleDates = sortedDates.slice(0, visibleDays);

  const groupTasks = (dayEntries) => {
    const map = {};
    for (const e of dayEntries) {
      const key = `${e.projectName}-${e.description}`;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    Object.values(map).forEach((list) =>
      list.sort((a, b) => new Date(a.start) - new Date(b.start))
    );
    return map;
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const fmtDuration = (hours) => {
    const totalSec = Math.round(hours * 3600);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  const fmtDurationReadable = (hours) => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h} h ${m} min`;
    if (h > 0) return `${h} h`;
    return `${m} min`;
  };

  const isToday = (dateString) => {
    const today = new Date();
    const parts = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!parts) return false;
    const parsed = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
    return (
      parsed.getDate() === today.getDate() &&
      parsed.getMonth() === today.getMonth() &&
      parsed.getFullYear() === today.getFullYear()
    );
  };

  const formatTotalTime = (decimalHours) => {
    const totalSeconds = Math.round(decimalHours * 3600);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleRestart = (entry) => {
    if (activeEntry) {
      showToast("Es läuft bereits ein Timer!", "OK", null, 5000, "warning");
      return;
    }
    onRestart?.(entry);
  };

  return (
    <div className="space-y-8">
      {visibleDates.map((date) => {
        const entriesForDay = groupedByDate[date];
        const dayLabel = isToday(date) ? "Heute" : date;

        // 🔹 Arbeitszeit ohne Pausen
        const workingEntries = entriesForDay.filter((e) => !isPauseEntry(e));
        const pauseEntries = entriesForDay.filter(isPauseEntry);

        // 🔹 Arbeitszeit-Summe
        const roundedTasks = roundEnabled
          ? getRoundedDurationsByTask(workingEntries)
          : workingEntries.map((e) => ({
              key: `${e.projectName || ""}__${e.description || ""}`,
              totalHours: parseFloat(e.duration || 0),
            }));
        const dayRoundedTotal = roundedTasks.reduce(
          (sum, t) => sum + t.totalHours,
          0
        );

        // 🔸 Pausensumme
        const pauseTotal = pauseEntries.reduce(
          (sum, e) => sum + parseFloat(e.duration || 0),
          0
        );

        const grouped = groupTasks(entriesForDay);

        // 🔹 Lücken finden
        const allEntries = entriesForDay
          .filter((e) => e.start && e.end)
          .sort((a, b) => new Date(a.start) - new Date(b.start));

        const gaps = [];
        for (let i = 0; i < allEntries.length - 1; i++) {
          const end = new Date(allEntries[i].end);
          const nextStart = new Date(allEntries[i + 1].start);
          const gapMin = (nextStart - end) / 60000;
          if (gapMin >= 15) {
            const h = Math.floor(gapMin / 60);
            const m = Math.floor(gapMin % 60);
            gaps.push({
              from: end,
              to: nextStart,
              text:
                h > 0
                  ? `${h} h${m > 0 ? ` ${m} min` : ""}`
                  : `${m} min`,
            });
          }
        }

        return (
          <div key={date}>
            {/* 🧾 Tagesüberschrift mit Download */}
            <div className="flex justify-between items-center mb-3 group">
              <div className="flex items-center gap-2 ml-4">
                <h3 className="text-slate-400 text-xs font-semibold">{dayLabel}</h3>

                {/* 📥 Download-Icon (nur bei Hover sichtbar) */}
                <button
                  onClick={() => {
                    // 🔹 Konvertiere das deutsche Datum (z. B. "20.10.2025") zu ISO
                    const [d, m, y] = date.match(/(\d{2})\.(\d{2})\.(\d{4})/).slice(1);
                    const isoDate = `${y}-${m}-${d}`;

                    try {
                      exportEntriesConaktiv({ mode: "day", startDate: isoDate });
                      showToast("Tagesexport erstellt", "OK", null, 3000, "success");
                    } catch (err) {
                      console.error("Export-Fehler:", err);
                      showToast("Fehler beim Export", "OK", null, 3000, "error");
                    }
                  }}
                  title="Tagesexport für ConAktiv"
                  className="
                    opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300
                    text-slate-500 hover:text-indigo-400
                  "
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="mr-4 text-xs text-slate-400 flex items-center gap-2">
                <span>{formatTotalTime(dayRoundedTotal)} h</span>
              </div>
            </div>

            <DayOverview
              gaps={gaps}
              totalHours={dayRoundedTotal}
              dayEntries={entriesForDay} 
              onAddGapEntry={(entry) => onAdd(entry)}
              onConvertToPause={onConvertToPause}
              suggestions={suggestions}
            />

            {Object.entries(grouped)
              .sort(([, listA], [, listB]) => {
                const lastA = new Date(listA[listA.length - 1]?.end || listA[listA.length - 1]?.start || 0);
                const lastB = new Date(listB[listB.length - 1]?.end || listB[listB.length - 1]?.start || 0);
                return lastB - lastA; // 🔹 neueste Gruppen zuerst
              })
              .map(([key, list]) => {
                const totalDuration = roundEnabled
                  ? roundToQuarter(
                      list.reduce(
                        (sum, e) => sum + parseFloat(e.duration || 0) * 60,
                        0
                      )
                    ) / 60
                  : list.reduce(
                      (sum, e) => sum + parseFloat(e.duration || 0),
                      0
                    );

                const { projectName, description } = list[0];
                const collapsed = collapsedTasks[key] ?? true;
                const toggle = () =>
                  setCollapsedTasks((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }));

                const isPauseGroup = isPauseEntry(list[0]);

                return (
                  <div
                    key={key}
                    className={`group rounded-xl p-4 mb-3 border transition-all duration-300 relative ${
                      isPauseGroup
                        ? "bg-slate-600/30 border-slate-600/40 text-amber-200"
                        : "bg-slate-900/70 border-slate-800 text-slate-100"
                    }`}
                  >
                    <div
                      className="flex justify-between items-start cursor-pointer select-none"
                      onClick={toggle}
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div
                          className={`w-6 h-6 flex items-center justify-center rounded-md text-xs ${
                            isPauseGroup
                              ? "bg-slate-800/60 text-slate-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {list.length}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-semibold leading-snug ${
                              isPauseGroup ? "text-slate-400" : "text-white"
                            }`}
                          >
                            {isPauseGroup ? "☕ Pause" : description}
                          </div>
                          <div
                            className={`text-sm ${
                              isPauseGroup
                                ? "text-slate-500/80"
                                : "text-slate-400"
                            }`}
                          >
                            {isPauseGroup
                              ? fmtDurationReadable(totalDuration)
                              : projectName}
                          </div>
                        </div>
                      </div>

                      {/* 🔸 Nur wenn kein Pause-Block */}
                      {!isPauseGroup && (
                        <div className="flex items-center gap-3">
                          <div
                            className="relative w-6 h-6 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                              onPress={() =>
                                handleRestart(list[list.length - 1])
                              }
                            >
                              <RotateCw
                                className={`w-4 h-4 text-${settings.accentColor}-400`}
                              />
                            </Button>
                          </div>
                          <span className="text-sm text-slate-400 whitespace-nowrap">
                            {fmtDuration(totalDuration)} h
                          </span>
                        </div>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="space-y-2 mt-3">
                        {list.map((e) => (
                          <div
                            key={e.id}
                            className="flex justify-between items-center bg-slate-800/40 rounded-lg px-3 py-2"
                          >
                            <span className="text-xs text-slate-300">
                              {formatTime(e.start)} – {formatTime(e.end)} (
                              {fmtDurationReadable(e.duration)})
                            </span>
                            <div className="flex gap-1">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => onEdit(e)}
                              >
                                <Edit className="w-4 h-4 text-slate-400" />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => onDelete(e.id)}
                              >
                                <Trash2 className="w-4 h-4 text-slate-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            <hr className="my-12 h-0.5 border-none bg-slate-600/50" />
          </div>
        );
      })}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="flat"
            color="secondary"
            onPress={() => setVisibleDays((v) => v + 7)}
            className="text-slate-300 mt-2 hover:bg-slate-700/60"
          >
            Mehr Tage anzeigen
          </Button>
        </div>
      )}
    </div>
  );
}