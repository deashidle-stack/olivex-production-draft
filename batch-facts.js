/*
 * =====================================================================
 * OLIVE X — BATCH-TALL (rediger denne filen når en ny batch kommer inn)
 * =====================================================================
 *
 * Alle batch-avhengige tall på siden hentes herfra. Endre verdiene under,
 * lagre/push — siden oppdateres automatisk overalt (hero, nøkkeltall,
 * graf, oleocanthal-seksjonen, sensorisk profil, datablad, bestilling og
 * sticky kjøpslinje).
 *
 * Verdiene skal komme fra lab-sertifikatene for batchen som selges:
 *   - Polyfenoler og oleocanthal: World Olive Center for Health-analysen
 *   - Surhet og peroksider:       Q&Q Analysis (kjemisk sertifikat)
 *   - Frukt/bitterhet/skarphet/defekter: offisiell sensorisk analyse
 *   - Oljesyre og squalen:        produsentens datablad (ikke lab-verifisert)
 *
 * Gjeldende kilder (første batch, avling 2025–2026) — selvhostet i ./docs/:
 *   docs/olivex-polyfenol-analyse-2025-2026.pdf  (World Olive Center, sert. C2526-00609, 12.12.2025)
 *   docs/olivex-kjemisk-analyse-2025-2026.pdf    (Q&Q Analysis, protokoll 138375, 10.12.2025)
 *   docs/olivex-sensorisk-analyse-2025-2026.pdf  (offisiell panel-test nr. 251, 11.12.2025)
 *   docs/olivex-pesticid-analyse-2025-2026.pdf   (Q&Q Analysis, protokoll 138376, 14.12.2025 — null funn)
 *
 * NB: «oleocanthal-share» er oleocanthal delt på polyfenoler, i prosent
 * (270 / 737 ≈ 37). Husk å regne den ut på nytt når tallene endres.
 * «hydroxytyrosol-dose» står i kommentarfeltet på polyfenol-analysen
 * (mg hydroksytyrosol/tyrosol-derivater per 20 g olje; EU-kravet er 5).
 * Ved ny batch: legg nye PDF-er i docs/ og oppdater lenkene i Lab-seksjonen.
 */
(function () {
  "use strict";

  var BATCH = {
    "harvest": "2025–2026",       // avling/årgang
    "polyphenols": "737",         // totale polyfenoler, mg/kg  ★ lab
    "oleocanthal": "270",         // oleocanthal, mg/kg         ★ lab
    "oleocanthal-share": "37",    // oleocanthal / polyfenoler, i %
    "hydroxytyrosol-dose": "14,74", // mg hydroksytyrosol-derivater per 20 g ★ lab
    "acidity": "0,14",            // surhet, %                  ★ lab
    "peroxides": "6,09",          // peroksider, mEq O₂/kg      ★ lab
    "fruit": "4,5",               // sensorisk: fruktighet (Mf) ★ lab
    "bitter": "3,9",              // sensorisk: bitterhet (Mb)  ★ lab
    "pungent": "4,3",             // sensorisk: skarphet (Mp)   ★ lab
    "defects": "0,0",             // sensorisk: defekter (Md)   ★ lab
    "oleic": "72,41",             // oljesyre, % (produsentens spesifikasjon)
    "squalene": "5 400"           // squalen, mg/kg (produsentens spesifikasjon)
  };

  function apply() {
    document.querySelectorAll("[data-fact]").forEach(function (el) {
      var value = BATCH[el.getAttribute("data-fact")];
      if (value !== undefined && el.textContent !== value) el.textContent = value;
    });

    // Donut-grafen for oleocanthal-andelen tegnes ut fra prosentverdien.
    document.querySelectorAll("[data-fact-arc]").forEach(function (el) {
      var share = Number(String(BATCH[el.getAttribute("data-fact-arc")] || "").replace(",", "."));
      if (!isFinite(share) || share <= 0) return;
      var radius = Number(el.getAttribute("r")) || 92;
      var circumference = 2 * Math.PI * radius;
      var dash = (circumference * share / 100).toFixed(1) + " " + circumference.toFixed(1);
      if (el.getAttribute("stroke-dasharray") !== dash) el.setAttribute("stroke-dasharray", dash);
    });
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      apply();
    });
  }

  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
})();
