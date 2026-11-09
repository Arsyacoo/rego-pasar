// Shared helpers for the three mockups. Real data comes from sample-data.js (window.REGO_DATA).
(function () {
  const D = window.REGO_DATA;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const rpFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

  const byId = Object.fromEntries(D.commodities.map((c) => [c.id, c]));
  const regionById = Object.fromEntries(D.regions.map((r) => [r.id, r]));

  const R = {
    data: D,
    commodity: (id) => byId[id],
    regionName: (id) => regionById[id].name,
    subRegions: D.regions.filter((r) => !["diy", "nasional"].includes(r.id)),
    item: (region, id) => (D.latest[region] || {})[id] || { price: null, change_7d_pct: null, spike: false },
    /** "Rp 45.200" */
    rp: (n) => (n == null ? "tidak ada data" : "Rp " + rpFmt.format(n)),
    num: (n) => (n == null ? "–" : rpFmt.format(n)),
    /** "+12,0%" / "−1,7%" / "–" */
    pct: (x) => {
      if (x == null) return "–";
      const s = Math.abs(x).toFixed(1).replace(".", ",");
      return (x > 0 ? "+" : x < 0 ? "−" : "±") + s + "%";
    },
    /** "6 Nov 2026" */
    date: (iso) => {
      const [y, m, d] = iso.split("-").map(Number);
      return `${d} ${MONTHS[m - 1]} ${y}`;
    },
    /** "7 Nov 2026, 13.47 WIB" */
    updated: () => {
      const [day, time] = D.updatedAt.split("T");
      return `${R.date(day)}, ${time.slice(0, 5).replace(":", ".")} WIB`;
    },
    dataDate: () => D.latest.diy[D.commodities[0].id].date,
    direction: (x) => (x == null ? "none" : x > 0 ? "up" : x < 0 ? "down" : "flat"),
    directionWord: (x) => (x == null ? "belum ada data 7 hari" : x > 0 ? "naik" : x < 0 ? "turun" : "tetap"),
    /** Region price minus national price on the same date. */
    diffNational: (region, id) => {
      const a = R.item(region, id).price;
      const n = R.item("nasional", id).price;
      return a == null || n == null ? null : a - n;
    },
    /** DIY commodities sorted by 7-day change, biggest rise first. */
    movers: () =>
      D.commodities
        .map((c) => ({ ...c, ...R.item("diy", c.id) }))
        .filter((c) => c.change_7d_pct != null)
        .sort((a, b) => b.change_7d_pct - a.change_7d_pct),
    history: (id, days) => D.historyDiy[id].slice(-days),
    /** Arrow icon (stroke follows currentColor). */
    arrow: (dir, size = 16) => {
      if (dir === "up")
        return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
      if (dir === "down")
        return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
      return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
    },
    esc: (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]),
  };
  window.R = R;
})();
