const entries = [
  {
    "date": "x",
    "hours": "0,00",
    "customer": "x",
    "project": "x",
    "activity": "x",
    "description": "x"
  },
];

// 🧩 Eingabe-Helfer
async function typeLikeHuman(el, text, delay = 60) {
  el.focus();
  el.value = "";
  for (const char of text) {
    el.value += char;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise(r => setTimeout(r, delay));
  }
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 🧠 DOM-Stabilität prüfen
async function waitForDomStable(selector = "form", quietTime = 1000, timeout = 10000) {
  return new Promise((resolve) => {
    const target = document.querySelector(selector);
    if (!target) return resolve();

    let lastMutation = Date.now();
    const observer = new MutationObserver(() => {
      lastMutation = Date.now();
    });

    observer.observe(target, { childList: true, subtree: true });

    const interval = setInterval(() => {
      if (Date.now() - lastMutation > quietTime) {
        clearInterval(interval);
        observer.disconnect();
        resolve();
      }
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      observer.disconnect();
      resolve();
    }, timeout);
  });
}

// 🧪 Wert prüfen und ggf. neu setzen
async function ensureValue(el, expected, label, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    if (!el) return false;
    if (el.value?.trim() === expected) {
      return true;
    }
    console.warn(`⚠️ ${label} stimmt nicht (${el.value}) → retry ${i + 1}/${maxRetries}`);
    await typeLikeHuman(el, expected);
    await wait(500);
  }
  return el.value?.trim() === expected;
}

// 🧠 Hauptfunktion
async function fillEntry(entry, index) {
  console.log(`➡️ [${index + 1}] Buche:`, entry);

  // ➕ Neues Formular öffnen
  const newBtn = document.querySelector('a[au-target-id="1015"]');
  if (!newBtn) {
    console.warn("❌ '+'-Button nicht gefunden!");
    return;
  }
  newBtn.click();
  console.log("➕ Formular wird geöffnet...");
  await waitForDomStable();
  await wait(2000);
  console.log("🆕 Formular bereit");

  // 📁 Projekt
  const projectField = document.querySelector('input[placeholder="Projekt"]');
  if (projectField) {
    console.log("📁 Projekt:", entry.project);
    await typeLikeHuman(projectField, entry.project);
    await waitForDomStable();
    await wait(2500);
  }

  // 💼 Tätigkeit
  const activityField = document.querySelector('input[placeholder="Position"]');
  if (activityField) {
    console.log("💼 Tätigkeit:", entry.activity);
    await typeLikeHuman(activityField, entry.activity);
    await waitForDomStable();
    await wait(2500);
  }

  // 🗓️ Datum
  const dateField = document.querySelector('input[name*="KA_Endetag"]');
  if (dateField) {
    await typeLikeHuman(dateField, entry.date);
    await ensureValue(dateField, entry.date, "Datum");
  }

  await wait(800);

  // ⏱️ Stunden
  const hoursField = document.querySelector('input[name*="KA_Anzahl"]');
  if (hoursField) {
    await typeLikeHuman(hoursField, entry.hours);
    await ensureValue(hoursField, entry.hours, "Stunden");
  }

  await wait(800);

  // 📝 Beschreibung
  const descField = document.querySelector('textarea[name*="KA_Beschreibung"]');
  if (descField) {
    await typeLikeHuman(descField, entry.description);
    await ensureValue(descField, entry.description, "Beschreibung");
  }

  // ✅ 🔍 Validierung VOR dem Speichern
  console.log("🧾 Validierung vor Speichern...");
  const dateOK = dateField && dateField.value.trim() === entry.date;
  const hoursOK = hoursField && hoursField.value.trim() === entry.hours;
  const descOK = descField && descField.value.trim() === entry.description;

  if (!dateOK || !hoursOK || !descOK) {
    console.warn("⚠️ Validierung fehlgeschlagen. Erneuter Versuch...");
    if (!dateOK && dateField) await typeLikeHuman(dateField, entry.date);
    if (!hoursOK && hoursField) await typeLikeHuman(hoursField, entry.hours);
    if (!descOK && descField) await typeLikeHuman(descField, entry.description);
    await wait(1500);
  } else {
    console.log("✅ Validierung erfolgreich – alle Werte korrekt.");
  }

  // 💾 Speichern & Schließen
  const saveBtn = Array.from(document.querySelectorAll('a.button'))
    .find(btn => btn.textContent.includes("Speichern und Schließen"));
  if (saveBtn) {
    console.log("💾 Speichere Eintrag...");
    saveBtn.click();
    await waitForDomStable();
    await wait(2500);
  } else {
    console.warn("❌ Kein 'Speichern und Schließen'-Button gefunden");
  }

  console.log("✅ Eintrag abgeschlossen\n");
  await wait(1500);
}

// 🚀 Alle nacheinander
(async () => {
  console.log("🚀 Starte automatischen ConAktiv-Zeiteintrag...");
  for (let i = 0; i < entries.length; i++) {
    await fillEntry(entries[i], i);
  }
  console.log("✅ Alle Einträge erfolgreich eingetragen!");
})();