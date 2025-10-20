import React, { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Flame, Diamond, Brain, Clock } from "lucide-react";
import PageHeader from "./components/PageHeader";

const COLORS = ["#6366f1", "#8b5cf6", "#14b8a6", "#f59e0b", "#f43f5e"];
const roundToQuarter = (minutes) => Math.ceil(minutes / 15) * 15;

export default function StatsPage({ entries = [], settings: incomingSettings, onBack }) {
  /* ────────────── SETTINGS ────────────── */
  const storedSettings = (() => {
    try {
      return JSON.parse(localStorage.getItem("timetracko.settings") || "{}");
    } catch {
      return {};
    }
  })();

  const settings = incomingSettings ?? storedSettings ?? {};
  const roundEnabled = !!settings.roundToQuarter;
  const workdays = settings.workdays ?? ["mon", "tue", "wed", "thu", "fri"];

  const [timeframe, setTimeframe] = useState("7d");

  /* ────────────── ENTRIES ────────────── */
  const filteredEntries = useMemo(() => {
    const cutoff = new Date();
    if (timeframe === "7d") cutoff.setDate(cutoff.getDate() - 7);
    else if (timeframe === "30d") cutoff.setDate(cutoff.getDate() - 30);
    else if (timeframe === "90d") cutoff.setDate(cutoff.getDate() - 90);
    return entries.filter((e) => new Date(e.start) >= cutoff);
  }, [entries, timeframe]);

  // Markiere Arbeitstage
  const entriesWithFlags = filteredEntries.map((e) => {
    const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(e.start).getDay()];
    return { ...e, isWorkday: workdays.includes(weekday) };
  });

  /* ────────────── KENNZAHLEN ────────────── */
  const workEntries = entriesWithFlags.filter((e) => e.isWorkday);

  // Gruppierung & Rundung
  const dayMap = {};
  for (const e of workEntries) {
    const dayKey = new Date(e.start).toDateString();
    const taskKey = `${dayKey}__${e.projectName || "?"}__${e.description || "?"}`;
    const durMin = (parseFloat(e.duration) || 0) * 60;
    if (!dayMap[taskKey]) dayMap[taskKey] = 0;
    dayMap[taskKey] += durMin;
  }

  const dailyTotals = {};
  for (const key in dayMap) {
    const [day] = key.split("__");
    const totalMin = roundEnabled ? roundToQuarter(dayMap[key]) : dayMap[key];
    dailyTotals[day] = (dailyTotals[day] || 0) + totalMin;
  }

  const totalDays = Object.keys(dailyTotals).length;
  const totalMinutes = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
  const totalHours = totalMinutes / 60;
  const avgHours = totalDays ? (totalHours / totalDays).toFixed(2) : "0.00";
  const perfectDays = Object.values(dailyTotals).filter((m) => m / 60 >= 8).length;
  const streak = calcStreak(workEntries);
  const focusScore = calcFocus(workEntries);

  /* ────────────── WÖCHENTLICHE DATEN ────────────── */
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const weekday = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
    return { label: weekday, date: d };
  }).reverse();

  const weeklyData = last7Days.map(({ label, date }) => {
    const weekday = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];
    const isWorkday = workdays.includes(weekday);

    const dayEntries = filteredEntries.filter(
      (e) => new Date(e.start).toDateString() === date.toDateString()
    );
    const total = dayEntries.reduce((sum, e) => sum + (parseFloat(e.duration) || 0) * 60, 0);
    const rounded = roundEnabled ? roundToQuarter(total) : total;

    return {
      day: label,
      hours: rounded / 60,
      isWorkday,
    };
  });

  /* ────────────── PROJEKTVERTEILUNG ────────────── */
  const projectData = useMemo(() => {
    const projMap = {};
    for (const e of workEntries) {
      if (!e.projectName) continue;
      const key = `${e.projectName}__${e.description || "?"}`;
      const durMin = (parseFloat(e.duration) || 0) * 60;
      if (!projMap[key]) projMap[key] = 0;
      projMap[key] += durMin;
    }
    const projectTotals = {};
    for (const key in projMap) {
      const [project] = key.split("__");
      const total = roundEnabled ? roundToQuarter(projMap[key]) : projMap[key];
      projectTotals[project] = (projectTotals[project] || 0) + total;
    }
    return Object.entries(projectTotals)
      .map(([project, minutes]) => ({ project, hours: minutes / 60 }))
      .sort((a, b) => b.hours - a.hours);
  }, [workEntries, roundEnabled]);

  /* ────────────── SUMMARY ────────────── */
  const summaryText = `
Du hast in diesem Zeitraum ${totalDays} Arbeitstage erfasst, durchschnittlich ${avgHours} h pro Tag.
Dein längster Streak beträgt ${streak} Tage 🔥.
${perfectDays > 0 ? `Du hattest ${perfectDays} perfekte Tage 💎 – stark!` : ""}
Dein Fokus-Score liegt bei ${focusScore}% 🧠.
`;

  /* ────────────── RENDER ────────────── */
  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader title="Statistiken" onBack={onBack}>
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              size="sm"
              className="text-slate-300 border border-slate-700 bg-slate-800 hover:bg-slate-700"
            >
              Zeitraum:{" "}
              {timeframe === "7d"
                ? "7 Tage"
                : timeframe === "30d"
                ? "30 Tage"
                : "90 Tage"}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Zeitraum wählen"
            onAction={(key) => setTimeframe(key)}
            selectedKeys={[timeframe]}
            selectionMode="single"
          >
            <DropdownItem key="7d">Letzte 7 Tage</DropdownItem>
            <DropdownItem key="30d">Letzte 30 Tage</DropdownItem>
            <DropdownItem key="90d">Letzte 90 Tage</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </PageHeader>

      {roundEnabled && (
        <p className="text-xs text-slate-400 italic -mt-4 mb-2">
          ⏱ Werte inkl. Rundung auf 15-Minuten-Blöcke
        </p>
      )}

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Flame />} label="Streak" value={`${streak} Tage`} />
        <StatCard icon={<Diamond />} label="Perfekte Tage" value={perfectDays} />
        <StatCard icon={<Brain />} label="Fokus-Score" value={`${focusScore}%`} />
        <StatCard icon={<Clock />} label="Ø Arbeitszeit" value={`${avgHours} h`} />
      </div>

      {/* Wochenbalken */}
      <Card className="bg-slate-900/70 border border-slate-700">
        <CardBody>
          <h2 className="text-slate-100 font-semibold mb-3">Arbeitszeit (letzte 7 Tage)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fill: "#94a3b8" }} />
              <Tooltip
                formatter={(v, _, { payload }) =>
                  payload.isWorkday
                    ? `${v} h`
                    : `${v} h (nicht als Arbeitstag definiert)`
                }
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  color: "#f8fafc",
                }}
              />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {weeklyData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      entry.isWorkday
                        ? entry.hours >= 8
                          ? "#14b8a6"
                          : "#6366f1"
                        : "rgba(100,116,139,0.4)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-500 mt-2">
            * Nicht-Arbeitstage werden angezeigt, aber nicht in Kennzahlen einbezogen.
          </p>
        </CardBody>
      </Card>

      {/* Projektverteilung */}
      <Card className="bg-slate-900/70 border border-slate-700">
        <CardBody>
          <h2 className="text-slate-100 font-semibold mb-3">Projektverteilung</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={projectData}
                dataKey="hours"
                nameKey="project"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {projectData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${v} h`}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  color: "#f8fafc",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* ⚠️ Auffälligkeiten */}
      <Card className="bg-slate-900/70 border border-slate-700">
        <CardBody>
          <h2 className="text-slate-100 font-semibold mb-2 flex items-center gap-2">
            ⚠️ Auffälligkeiten
          </h2>
          {(() => {
            const shortDays = weeklyData
              .filter((d) => d.isWorkday && d.hours > 0 && d.hours < 8)
              .map((d) => d.day);
            const heavyProjects = projectData.filter((p) => p.hours >= 4);

            if (shortDays.length === 0 && heavyProjects.length === 0)
              return (
                <p className="text-slate-400 text-sm">
                  Keine Auffälligkeiten 👌
                </p>
              );

            return (
              <div className="text-slate-400 text-sm space-y-1 leading-relaxed">
                {shortDays.length > 0 && (
                  <div>
                    Weniger als 8 h an:{" "}
                    <span className="text-slate-200 font-medium">
                      {shortDays.join(", ")}
                    </span>
                  </div>
                )}
                {heavyProjects.length > 0 && (
                  <div>
                    Mehr als 4 h für{" "}
                    <span className="text-slate-200 font-medium">
                      {heavyProjects.map((p) => p.project).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </CardBody>
      </Card>

      {/* 🧠 Zusammenfassung */}
      <Card className="bg-slate-900/70 border border-slate-700">
        <CardBody>
          <h2 className="text-slate-100 font-semibold mb-2 flex items-center gap-2">
            🧠 Zusammenfassung
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
            {summaryText}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

/* ────────────── Helper-Komponenten ────────────── */
function StatCard({ icon, label, value }) {
  return (
    <Card className="bg-slate-900/60 border border-slate-700 p-3 text-center hover:bg-slate-800/60 transition-all duration-300">
      <CardBody>
        <div className="flex flex-col items-center space-y-1">
          <div className="text-indigo-400">{icon}</div>
          <div className="text-xs text-slate-400">{label}</div>
          <div className="text-base font-semibold text-slate-100">{value}</div>
        </div>
      </CardBody>
    </Card>
  );
}

/* ────────────── Helper-Funktionen ────────────── */
function calcStreak(entries) {
  const days = Array.from(
    new Set(entries.map((e) => new Date(e.start).toDateString()))
  ).sort((a, b) => new Date(a) - new Date(b));
  let longest = 0,
    current = 0,
    prev = null;
  for (const d of days) {
    if (prev && new Date(d) - new Date(prev) === 86400000) current++;
    else current = 1;
    longest = Math.max(longest, current);
    prev = d;
  }
  return longest;
}

function calcFocus(entries) {
  const finished = entries.filter(
    (e) => e.start && e.end && parseFloat(e.duration) > 0
  );
  if (finished.length === 0) return 100;

  const sorted = finished.sort(
    (a, b) => new Date(a.start) - new Date(b.start)
  );
  const total = sorted.reduce(
    (s, e) => s + (parseFloat(e.duration) || 0) * 60,
    0
  );
  if (total === 0) return 100;

  let gap = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const end = new Date(sorted[i].end);
    const nextStart = new Date(sorted[i + 1].start);
    const diff = (nextStart - end) / 60000;
    if (diff > 15 && diff < 600) gap += diff;
  }

  const focus = ((total - gap) / total) * 100;
  return Math.round(Math.min(Math.max(focus, 0), 100));
}