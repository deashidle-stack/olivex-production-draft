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
 * Gjeldende kilder (første batch, avling 2025–2026):
 *   https://www.myrolion.com/wp-content/uploads/2026/02/Myrolion-Polyphenols-Analysis-2025-2026-en.webp
 *   https://www.myrolion.com/wp-content/uploads/2025/12/Chemical-Analysis-Certification-2025-2026.webp
 *   https://www.myrolion.com/wp-content/uploads/2025/12/Myrolion-Sensory-Analysis-2025-2026.webp
 *
 * NB: «oleocanthal-share» er oleocanthal delt på polyfenoler, i prosent
 * (270 / 737 ≈ 37). Husk å regne den ut på nytt når tallene endres.
 * Husk også å oppdatere sertifikat-lenkene i Lab-seksjonen hvis de nye
 * sertifikatene har andre URL-er.
 */
(function () {
  "use strict";

  var BATCH = {
    "harvest": "2025–2026",       // avling/årgang
    "polyphenols": "737",         // totale polyfenoler, mg/kg  ★ lab
    "oleocanthal": "270",         // oleocanthal, mg/kg         ★ lab
    "oleocanthal-share": "37",    // oleocanthal / polyfenoler, i %
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
