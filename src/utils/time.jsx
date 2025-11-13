export function formatTotalTime(decimalHours) {
    const totalSeconds = Math.round(decimalHours * 3600);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    return `${h}:${m}`;
}

// Gruppierte Tagesstunden berechnen (ungarundet & gerundet)
export function calcDayHours(entries, roundToQuarter, projById) {
  if (!entries || entries.length === 0) {
    return {
      rawMinutes: 0,
      rawHours: 0,
      roundedMinutes: 0,
      roundedHours: 0
    };
  }

  // Pausen raus
  const work = entries.filter(e => e.projectId !== "PAUSE");

  // Gruppieren nach task (wie ConAktiv)
  const groups = {};
  for (const e of work) {
    const key = `${e.projectId || ""}__${e.description || ""}`;
    const minutes = Math.round((parseFloat(e.duration) || 0) * 60);
    groups[key] = (groups[key] || 0) + minutes;
  }

  // ❗ UNGERUNDETE Minuten (Summe der echten Minuten)
  const rawMinutes = Object.values(groups).reduce((a, b) => a + b, 0);

  // ❗ GERUNDETE Minuten (nur wenn aktiviert)
  const roundedMinutes = Object.values(groups).reduce((sum, m) => {
    if (!roundToQuarter) return sum + m;           // keine Rundung → raw übernehmen
    const rounded = Math.ceil(m / 15) * 15;        // Runde jede Gruppe separat
    return sum + rounded;
  }, 0);

  return {
    rawMinutes,
    rawHours: rawMinutes / 60,
    roundedMinutes,
    roundedHours: roundedMinutes / 60
  };
}