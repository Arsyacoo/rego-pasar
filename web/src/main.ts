import "@fontsource-variable/archivo/wdth.css";
import "./style.css";
import { renderProfile } from "./chart";
import { NO_DATA, basePoint, date, direction, directionWord, esc, num, pct, rp, signed, stamp } from "./format";
import { BANDS, BAND_EDGES, counterScale, renderMap } from "./map";
import type { Commodity, History, Latest, LatestItem, Meta, Point } from "./types";

type Sort = { key: string; dir: number };
const state = {
  region: "diy",
  category: "semua",
  commodity: "",
  range: 30,
  sort: { key: "price", dir: 1 } as Sort, // region table
  listSort: { key: "", dir: 1 } as Sort, // commodity list; "" = config order
};
const SUB_REGIONS = ["kota-yogyakarta", "sleman", "bantul", "kulon-progo", "gunungkidul"];
const RANGES = [7, 30, 90];
const SPIKE_HINT = "Naik lebih dari 10% dalam seminggu";
const ARROW_PATH = { up: "M8 13V3M3.5 7.5 8 3l4.5 4.5", down: "M8 3v10M3.5 8.5 8 13l4.5-4.5", flat: "M3 8h10", none: "M3 8h10" };
const SORT_PATH = { up: "M8 13V3M4 7l4-4 4 4", down: "M8 3v10M4 9l4 4 4-4", both: "M5 6l3-3 3 3M5 10l3 3 3-3" };
const SORT_LABEL: Record<string, string> = { name: "nama", price: "harga", change: "perubahan 7 hari", diff: "selisih dari nasional" };
const ONE_COLUMN = matchMedia("(max-width: 960px)"); // same breakpoint as style.css

let latest: Latest;
let meta: Meta;
const histories = new Map<string, History>();
const failed = new Set<string>(); // histories whose last fetch failed; picking the commodity again retries

const $ = <T extends Element = HTMLElement>(id: string) => document.getElementById(id) as unknown as T;
const arrow = (dir: keyof typeof ARROW_PATH, size = 14) =>
  `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true"><path d="${ARROW_PATH[dir]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
const sortIcon = (dir: keyof typeof SORT_PATH) =>
  `<svg class="sort-ico" width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="${SORT_PATH[dir]}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-cache", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}
async function loadHistory(id: string): Promise<History> {
  const cached = histories.get(id);
  if (cached) return cached;
  try {
    const h = await getJSON<History>(`./history/${id}.json`);
    histories.set(id, h);
    failed.delete(id);
    return h;
  } catch (err) {
    failed.add(id);
    throw err;
  }
}

/* ---------- focus and announcements ---------- */
const FOCUS_ATTRS = ["data-r", "data-c", "data-k", "data-d", "data-sort"];
/** A selector that finds the same control again after its container is redrawn. */
function focusKey(el: Element | null): string | null {
  if (!el || el === document.body) return null;
  if (el.id) return `#${el.id}`;
  const host = el.closest("[id]");
  if (!host) return null;
  const row = el.closest("tr[data-c], tr[data-r]");
  if (row) {
    const attr = row.hasAttribute("data-c") ? "data-c" : "data-r";
    return `#${host.id} tr[${attr}="${row.getAttribute(attr)}"] .rowbtn`;
  }
  const attr = FOCUS_ATTRS.find((a) => el.hasAttribute(a));
  return attr ? `#${host.id} [${attr}="${el.getAttribute(attr)}"]` : null;
}
/** Redraw without dropping keyboard focus back to <body>. */
function redraw(fn: () => void): void {
  const key = focusKey(document.activeElement);
  fn();
  if (key && !document.activeElement?.matches(key)) document.querySelector<HTMLElement>(key)?.focus({ preventScroll: true });
}
let announceTimer = 0;
/** One polite live region for the result of each action (cleared first so a repeat is read again). */
function announce(msg: string): void {
  const el = $("announce");
  el.textContent = "";
  clearTimeout(announceTimer);
  announceTimer = window.setTimeout(() => (el.textContent = msg), 120);
}

/* ---------- sorting ---------- */
type Val = string | number | null;
/** Comparator on one field; missing values always sort last. */
function compareBy<T>(get: (t: T) => Val, dir: number): (a: T, b: T) => number {
  return (a, b) => {
    const av = get(a);
    const bv = get(b);
    if (av == null || bv == null) return av == null ? (bv == null ? 0 : 1) : -1;
    return (typeof av === "string" ? av.localeCompare(String(bv), "id") : av - Number(bv)) * dir;
  };
}
/** Same column again flips; a new column starts A–Z for names, largest first for numbers. */
const nextSort = (cur: Sort, key: string): Sort => (cur.key === key ? { key, dir: -cur.dir } : { key, dir: key === "name" ? 1 : -1 });
const sortMessage = ({ key, dir }: Sort): string =>
  `Diurutkan menurut ${SORT_LABEL[key] ?? key}, ${key === "name" ? (dir > 0 ? "A sampai Z" : "Z sampai A") : dir > 0 ? "terkecil dulu" : "terbesar dulu"}.`;
/** Sync aria-sort and the visible direction icon on a table's sort buttons. */
function sortHeads(table: HTMLElement, sort: Sort, onSort: (key: string) => void): void {
  table.querySelectorAll<HTMLButtonElement>("th button[data-sort]").forEach((b) => {
    const k = b.dataset.sort ?? "";
    const on = k === sort.key;
    const th = b.parentElement;
    if (on) th?.setAttribute("aria-sort", sort.dir > 0 ? "ascending" : "descending");
    else th?.removeAttribute("aria-sort");
    b.querySelector(".sort-ico")?.remove();
    b.insertAdjacentHTML("beforeend", sortIcon(on ? (sort.dir > 0 ? "up" : "down") : "both"));
    b.onclick = () => onSort(k);
  });
}

/* ---------- data helpers ---------- */
const EMPTY: LatestItem = { date: "", price: null, unit: "", change_7d_pct: null, spike: false };
const item = (region: string, id: string): LatestItem => latest.regions[region]?.[id] ?? EMPTY;
const commodity = (id: string): Commodity => meta.commodities.find((c) => c.id === id) ?? { id, name: id, category: "", unit: "kg" };
const regionName = (id: string): string => (id === "diy" ? "Rata-rata DIY" : meta.regions.find((r) => r.id === id)?.name ?? id);
const dataDate = (): string => Object.values(latest.regions.diy ?? {}).reduce((max, v) => (v.date > max ? v.date : max), "");
const priceText = (region: string, id: string): string => {
  const p = item(region, id).price;
  return p == null ? NO_DATA : `${rp(p)}/${commodity(id).unit}`;
};

/** Region price minus national price, only when both are for the same date. */
function diffNational(region: string, id: string): number | null {
  const a = item(region, id);
  const n = item("nasional", id);
  return a.price == null || n.price == null || a.date !== n.date ? null : a.price - n.price;
}
/** The same difference as a share of the national price, so different commodities compare. */
function diffNationalPct(region: string, id: string): number | null {
  const d = diffNational(region, id);
  const n = item("nasional", id).price;
  return d == null || n == null ? null : (d / n) * 100;
}
/** Difference from national in rupiah, with the percentage under it. Sign carries the meaning, so no hue. */
function diffCell(region: string, id: string): string {
  const d = diffNational(region, id);
  const p = diffNationalPct(region, id);
  return d == null || p == null ? "–" : `<span class="diff">${signed(d)}<small>${pct(p)}</small></span>`;
}
function movers(region: string): (Commodity & LatestItem & { change_7d_pct: number })[] {
  return meta.commodities
    .map((c) => ({ ...c, ...item(region, c.id) }))
    .filter((c): c is Commodity & LatestItem & { change_7d_pct: number } => c.change_7d_pct != null)
    .sort((a, b) => b.change_7d_pct - a.change_7d_pct);
}
const hasWeek = (region: string) => movers(region).length > 0;
const addDays = (iso: string, n: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** Points over the last `days` days, counted like the 7-day change: the end day and `days` days before it. */
function lastDays(series: Point[], days: number): Point[] {
  const end = series[series.length - 1]?.date;
  if (!end) return [];
  const from = addDays(end, -days);
  return series.filter((p) => p.date >= from);
}
function historyStart(h: History | undefined): string | null {
  const first = h?.series["sleman"]?.[0]?.date;
  return first ?? null;
}
/** First day a regency can have a 7-day change ("" while the history is not loaded). */
function weekFrom(): string {
  const start = historyStart(histories.get(state.commodity));
  return start ? date(addDays(start, 7)) : "";
}
const motion = (): ScrollBehavior => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

/* ---------- rendering ---------- */
function renderHeader(): void {
  $("stamp").innerHTML = `<span class="on">Harga ${date(dataDate())}</span><span class="run">Diperbarui ${stamp(latest.updated_at)}</span>`;
  $("footStamp").textContent = `Terakhir diperbarui ${stamp(latest.updated_at)}. Data diambil otomatis tiap pagi.`;
  const tabs = $("regionTabs");
  tabs.innerHTML = ["diy", ...SUB_REGIONS]
    .map((id) => `<button type="button" aria-pressed="${id === state.region}" data-r="${id}">${esc(regionName(id))}</button>`)
    .join("");
  tabs.querySelectorAll<HTMLButtonElement>("button").forEach((b) => (b.onclick = () => setRegion(b.dataset.r ?? "diy")));
  // the short regency history, said once for the province; a picked regency explains its own fallback in the hero and chart
  const when = weekFrom();
  const waiting = SUB_REGIONS.some((r) => !hasWeek(r));
  $("tabNote").textContent = waiting && when && state.region === "diy" ? `Angka 7 hari per kabupaten/kota paling cepat muncul ${when}.` : "";
}

let answerHtml = "";
function renderAnswer(): void {
  const regionWeek = hasWeek(state.region);
  const basis = regionWeek ? state.region : "diy";
  const list = movers(basis);
  const top = list[0];
  let html: string;
  if (!top) {
    html = `<h2 class="lead-h">Harga per ${date(dataDate())}</h2><p class="lead-sub">Perubahan 7 hari belum bisa dihitung.</p>`;
  } else {
    const c = commodity(top.id);
    const h = histories.get(top.id);
    if (!h) void loadHistory(top.id).then(() => redraw(renderAnswer), () => undefined);
    const base = h ? basePoint(h.series[basis] ?? [], top.date) : null;
    const dir = direction(top.change_7d_pct);
    const rises = list.filter((m) => m.change_7d_pct > 0).slice(1, 4);
    const falls = list.filter((m) => m.change_7d_pct < 0).slice(-3).reverse();
    const li = (m: (typeof list)[number]) => {
      const d = direction(m.change_7d_pct);
      return `<li><button type="button" data-c="${m.id}"${m.id === state.commodity ? ' aria-current="true"' : ""}>${esc(m.name)}</button><span class="v ${d}-t">${arrow(d)}${pct(m.change_7d_pct)}</span></li>`;
    };
    const where = basis === "diy" ? "di DIY" : `di ${esc(regionName(basis))}`;
    // a picked regency without week data: its own price today, and when its 7-day numbers start
    const when = weekFrom();
    const own = basis === state.region ? "" : ` Di ${esc(regionName(state.region))} hari ini ${priceText(state.region, top.id)}${when ? `; angka 7 harinya paling cepat muncul ${when}` : ""}.`;
    html = `
    <h2 class="lead-h">${esc(c.name)} <span class="${dir}">${directionWord(top.change_7d_pct)} ${pct(top.change_7d_pct).replace("+", "")}</span> dalam seminggu</h2>
    <p class="lead-sub">${dir === "up" ? "Kenaikan terbesar" : "Perubahan terbesar"} ${where}${base ? `, dibanding ${date(base.date)}` : ""}.${own}</p>
    <div class="lead-price"><strong>${rp(top.price)}/${c.unit}</strong>${base ? `<span class="from">dari ${rp(base.price)}</span>` : ""}${top.spike ? `<span class="spike" title="${SPIKE_HINT}">${arrow("up", 12)}Lonjakan</span>` : ""}</div>
    ${top.spike ? `<p class="spike-def">Lonjakan: ${SPIKE_HINT.toLowerCase()}.</p>` : ""}
    <div class="movers">
      ${rises.length ? `<div><h3 class="caps up-t">Kenaikan berikutnya</h3><ol>${rises.map(li).join("")}</ol></div>` : ""}
      ${falls.length ? `<div><h3 class="caps down-t">Penurunan terbesar</h3><ol>${falls.map(li).join("")}</ol></div>` : ""}
    </div>`;
  }
  if (html === answerHtml) return; // unchanged: keep the DOM (and any focus) as it is
  answerHtml = html;
  const el = $("answer");
  el.innerHTML = html;
  el.querySelectorAll<HTMLButtonElement>("button[data-c]").forEach((b) => (b.onclick = () => pickFromAnswer(b.dataset.c ?? "")));
}
/** A commodity tapped in the headline lists. One column: open it in the list, like a row tap, and take view and focus there. */
async function pickFromAnswer(id: string): Promise<void> {
  if (ONE_COLUMN.matches && state.category !== "semua" && commodity(id).category !== state.category) state.category = "semua";
  await setCommodity(id);
  if (!ONE_COLUMN.matches) return;
  const row = document.querySelector<HTMLElement>(`#rows tr[data-c="${id}"]`);
  row?.scrollIntoView({ block: "start", behavior: motion() });
  row?.querySelector<HTMLElement>(".rowbtn")?.focus({ preventScroll: true });
}

function renderMapPanel(): void {
  const id = state.commodity;
  const c = commodity(id);
  const sel = $<HTMLSelectElement>("mapCommodity");
  sel.innerHTML = meta.categories
    .map((k) => `<optgroup label="${esc(k.name)}">${meta.commodities.filter((x) => x.category === k.id).map((x) => `<option value="${x.id}"${x.id === id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</optgroup>`)
    .join("");
  sel.onchange = () => setCommodity(sel.value);
  const base = item("diy", id);
  $("map").setAttribute("aria-label", `Peta ${c.name}: harga tiap kabupaten/kota dibanding rata-rata DIY`);
  renderMap($<SVGSVGElement>("map"), {
    names: Object.fromEntries(SUB_REGIONS.map((r) => [r, regionName(r)])),
    prices: Object.fromEntries(SUB_REGIONS.map((r) => [r, item(r, id).date === base.date ? item(r, id).price : null])),
    base: base.price,
    selected: state.region,
    onSelect: setRegion,
  });
  $("legend").innerHTML = `
    <div class="ramp" aria-hidden="true">${BANDS.map((b) => `<div style="background:var(${b.token})"></div>`).join("")}</div>
    <div class="ticks" aria-hidden="true">${BAND_EDGES.map((t, i) => `<span style="left:${((i + 1) / 7) * 100}%">${t}</span>`).join("")}</div>
    <div class="caption"><span>Lebih murah dari rata-rata DIY</span><b>Rata-rata DIY ${rp(base.price)}/${c.unit}</b><span>Lebih mahal</span></div>`;
}

function renderList(): void {
  const reg = state.region;
  $("listTitle").textContent = `Semua komoditas · ${regionName(reg)}`;
  $("listStamp").textContent = `Harga per ${date(dataDate())}`;
  const cats = [{ id: "semua", name: "Semua" }, ...meta.categories];
  const tabs = $("catTabs");
  tabs.innerHTML = cats.map((k) => `<button type="button" aria-pressed="${k.id === state.category}" data-k="${k.id}">${esc(k.name)}</button>`).join("");
  tabs.querySelectorAll<HTMLButtonElement>("button").forEach(
    (b) =>
      (b.onclick = () => {
        redraw(() => {
          state.category = b.dataset.k ?? "semua";
          renderList();
        });
        announce(`${b.textContent ?? ""}: ${$("rows").querySelectorAll("tr[data-c]").length} komoditas.`);
      }),
  );
  const getters: Record<string, (c: Commodity) => Val> = {
    name: (c) => c.name,
    price: (c) => item(reg, c.id).price,
    change: (c) => item(reg, c.id).change_7d_pct,
    diff: (c) => diffNationalPct(reg, c.id), // percent, so beras and cabai compare fairly
  };
  const rows = meta.commodities.filter((c) => state.category === "semua" || c.category === state.category);
  const get = getters[state.listSort.key];
  if (get) rows.sort(compareBy(get, state.listSort.dir));
  const week = hasWeek(reg);
  const table = $("listTable");
  // the trend panel may sit inside the rows (one column); take it home before they are rebuilt
  const tren = $("tren");
  const home = document.querySelector(".lower");
  if (home && tren.parentElement !== home) home.append(tren);
  table.classList.toggle("no-week", !week);
  $("rows").innerHTML = rows
    .map((c) => {
      const it = item(reg, c.id);
      const dir = direction(it.change_7d_pct);
      const cur = c.id === state.commodity;
      const nat = diffNationalPct(reg, c.id);
      // phones drop the national column; the same percentage rides under the name instead
      const natLine = nat == null ? "" : `<small class="nat-m">${pct(nat)} dari nasional</small>`;
      return `<tr data-c="${c.id}" class="${cur ? "sel" : ""}">
        <th scope="row"><button type="button" class="rowbtn"${cur ? ' aria-current="true"' : ""}>${esc(c.name)}</button>${natLine}${it.spike ? `<span class="spike" title="${SPIKE_HINT}">${arrow("up", 12)}Lonjakan</span>` : ""}</th>
        <td class="num">${it.price == null ? `<span class="nodata">${NO_DATA}</span>` : `${rp(it.price)}<span class="unit">/${c.unit}</span>`}</td>
        <td class="num col-7d"><span class="v ${dir}-t">${it.change_7d_pct == null ? "–" : arrow(dir) + pct(it.change_7d_pct)}</span></td>
        <td class="num col-diff">${diffCell(reg, c.id)}</td>
      </tr>`;
    })
    .join("");
  // one column: the trend opens under the selected row, so the list keeps its place
  const selRow = ONE_COLUMN.matches ? $("rows").querySelector(`tr[data-c="${state.commodity}"]`) : null;
  if (selRow) {
    selRow.insertAdjacentHTML("afterend", `<tr class="detail"><td colspan="4"></td></tr>`);
    selRow.nextElementSibling?.firstElementChild?.append(tren);
  }
  tren.hidden = ONE_COLUMN.matches && !selRow; // filtered out: no row to open under, and no jump above the list
  document.querySelectorAll<HTMLTableRowElement>("#rows tr[data-c]").forEach(
    (tr) =>
      (tr.onclick = async () => {
        const id = tr.dataset.c ?? "";
        const top = tr.getBoundingClientRect().top;
        await setCommodity(id);
        // keep the tapped row where the finger is (a trend panel above it may have closed), then show the panel below it
        const now = document.querySelector(`#rows tr[data-c="${id}"]`);
        if (now) window.scrollBy(0, now.getBoundingClientRect().top - top);
        if (ONE_COLUMN.matches) $("tren").scrollIntoView({ block: "nearest", behavior: motion() });
      }),
  );
  sortHeads(table, state.listSort, (k) => {
    redraw(() => {
      state.listSort = nextSort(state.listSort, k);
      renderList();
    });
    announce(sortMessage(state.listSort));
  });
  $("listNote").textContent = [
    week ? "Kolom 7 hari membandingkan harga ini dengan harga seminggu sebelumnya." : "",
    "Selisih dari nasional: plus berarti lebih mahal dari rata-rata nasional di tanggal yang sama, minus berarti lebih murah.",
    week ? `Tanda Lonjakan: ${SPIKE_HINT.toLowerCase()}.` : "",
    "Ketuk atau klik baris untuk melihat tren dan perbandingan antarwilayah. Ketuk judul kolom untuk mengurutkan.",
  ].filter(Boolean).join(" ");
}

/** The day the chart region's 7-day change is measured from, when it has one. */
function chartBase(region: string, id: string, h: History | undefined): { date: string; price: number } | null {
  const it = item(region, id);
  return h && it.change_7d_pct != null ? basePoint(h.series[region] ?? [], it.date) : null;
}

function renderProfilePanel(): void {
  const c = commodity(state.commodity);
  const h = histories.get(c.id);
  const own = h?.series[state.region] ?? [];
  const useRegion = own.filter((p) => p.price != null).length >= 7;
  const basis = useRegion ? state.region : "diy";
  const points = lastDays(h?.series[basis] ?? [], state.range);
  // name the region the chart really shows, and say so when it stands in for the picked one
  $("profileTitle").textContent = `Tren harga · ${c.name} · ${regionName(basis)}`;
  const days = own.filter((p) => p.price != null).length;
  $("profileNote").textContent = basis === state.region
    ? ""
    : `Riwayat ${regionName(state.region)} baru ${days} hari, jadi grafik ini memakai rata-rata DIY. Harga ${regionName(state.region)} hari ini: ${priceText(state.region, c.id)}.`;
  $("range").innerHTML = RANGES.map((d) => `<button type="button" aria-pressed="${d === state.range}" data-d="${d}">${d} hari</button>`).join("");
  $("range").querySelectorAll<HTMLButtonElement>("button").forEach(
    (b) =>
      (b.onclick = () => {
        redraw(() => {
          state.range = Number(b.dataset.d);
          renderProfilePanel();
        });
        announce(`Grafik ${state.range} hari terakhir.`);
      }),
  );
  const svg = $<SVGSVGElement>("profile");
  svg.setAttribute("aria-label", `Tren harga ${c.name}, ${regionName(basis)}, ${state.range} hari. Tekan panah kiri atau kanan untuk membaca harga tiap hari.`);
  const lost = failed.has(c.id);
  const base = chartBase(basis, c.id, h);
  const step = renderProfile(svg, $("readout"), points, c.unit, `Tren harga ${esc(c.name)}`, lost ? "Riwayat harga tidak bisa dimuat." : undefined, base?.date);
  const capEl = $("profileCap");
  if (lost) {
    capEl.innerHTML = `Riwayat ${esc(c.name)} gagal dimuat, mungkin karena koneksi. <button type="button" id="retryHistory">Coba lagi</button>`;
    $("retryHistory").onclick = async () => {
      await setCommodity(c.id);
      // success removes this button: hand focus to the chart that just loaded
      if (!document.getElementById("retryHistory")) $("profile").focus({ preventScroll: true });
    };
    return;
  }
  const known = points.filter((p) => p.price != null);
  const first = known[0]?.price;
  const last = known[known.length - 1]?.price;
  let cap = first != null && last != null
    ? `${regionName(basis)}, ${state.range} hari terakhir: dari ${rp(first)} jadi ${rp(last)}/${c.unit} (${pct(((last - first) / first) * 100)}). Garis bantu tiap ${rp(step)}.`
    : "";
  if (cap && base && points.some((p) => p.date === base.date)) cap += ` Titik “acuan 7 hari” adalah harga ${date(base.date)} (${rp(base.price)}/${c.unit}), pembanding angka 7 hari.`;
  const nat = item("nasional", c.id);
  if (nat.price != null && cap) cap += ` Rata-rata nasional ${date(nat.date)}: ${rp(nat.price)}/${c.unit}. Garisnya belum digambar karena riwayatnya masih pendek.`;
  capEl.textContent = cap;
}

/** The region table's national column in one line, bridging it to the map's DIY baseline. */
function nationalSpread(id: string): string {
  const ps = ["diy", ...SUB_REGIONS].map((r) => diffNationalPct(r, id)).filter((v): v is number => v != null).map((v) => Math.round(v));
  if (!ps.length) return "";
  const lo = Math.min(...ps);
  const hi = Math.max(...ps);
  const span = (a: number, b: number) => (a === b ? `${num(a)}%` : `${num(a)}–${num(b)}%`);
  const head = hi < 0
    ? `Semua wilayah DIY ${span(-hi, -lo)} lebih murah dari rata-rata nasional.`
    : lo > 0
      ? `Semua wilayah DIY ${span(lo, hi)} lebih mahal dari rata-rata nasional.`
      : `Dibanding rata-rata nasional, wilayah DIY berkisar dari ${num(-lo)}% lebih murah sampai ${num(hi)}% lebih mahal.`;
  return `${head} Warna peta membandingkan antarwilayah DIY.`;
}

function renderCompare(): void {
  const id = state.commodity;
  const c = commodity(id);
  const national = item("nasional", id);
  $("cmpTitle").textContent = `Antar wilayah · ${c.name}`;
  $("cmpStamp").textContent = national.date ? `per ${date(national.date)}` : "";
  $("cmpNote").textContent = nationalSpread(id);
  const rows = ["diy", ...SUB_REGIONS].map((r) => ({ id: r, name: regionName(r), price: item(r, id).price, diff: diffNational(r, id) }));
  const getters: Record<string, (r: (typeof rows)[number]) => Val> = { name: (r) => r.name, price: (r) => r.price, diff: (r) => r.diff };
  const get = getters[state.sort.key];
  if (get) rows.sort(compareBy(get, state.sort.dir));
  $("cmp").innerHTML =
    rows
      .map((r) => `<tr data-r="${r.id}" class="${r.id === state.region ? "sel" : ""}">
        <th scope="row"><button type="button" class="rowbtn"${r.id === state.region ? ' aria-current="true"' : ""}>${esc(r.name)}</button></th>
        <td class="num">${r.price == null ? `<span class="nodata">${NO_DATA}</span>` : rp(r.price)}</td>
        <td class="num">${diffCell(r.id, id)}</td>
      </tr>`)
      .join("") + `<tr><th scope="row"><b>Nasional</b></th><td class="num"><b>${rp(national.price)}</b></td><td class="num muted">acuan</td></tr>`;
  document.querySelectorAll<HTMLTableRowElement>("#cmp tr[data-r]").forEach((t) => (t.onclick = () => setRegion(t.dataset.r ?? "diy")));
  sortHeads($("cmpTable"), state.sort, (k) => {
    redraw(() => {
      state.sort = nextSort(state.sort, k);
      renderCompare();
    });
    announce(sortMessage(state.sort));
  });
}

function renderAll(): void {
  renderHeader();
  renderAnswer();
  renderMapPanel();
  renderList();
  renderProfilePanel();
  renderCompare();
  const start = historyStart(histories.get(state.commodity));
  $("historyNote").textContent = start
    ? `Rata-rata DIY punya riwayat 90 hari lebih. Riwayat kabupaten/kota dan nasional baru dikumpulkan sejak ${date(start)}.`
    : "";
}

async function setCommodity(id: string, quiet = false): Promise<void> {
  if (!id) return;
  state.commodity = id;
  await loadHistory(id).catch(() => undefined); // the chart panel shows the failure and a retry button
  if (state.commodity !== id) return; // a later pick won the race; it renders itself
  redraw(renderAll);
  if (!quiet) announce(`${commodity(id).name} dipilih: ${priceText(state.region, id)}, ${regionName(state.region)}.`);
}
function setRegion(id: string): void {
  state.region = id;
  redraw(renderAll);
  announce(`${regionName(id)} dipilih. ${commodity(state.commodity).name}: ${priceText(id, state.commodity)}.`);
}

async function init(): Promise<void> {
  counterScale($<SVGSVGElement>("map"));
  counterScale($<SVGSVGElement>("profile"));
  try {
    [latest, meta] = await Promise.all([getJSON<Latest>("./latest.json"), getJSON<Meta>("./meta.json")]);
    const first = movers("diy")[0]?.id ?? meta.commodities[0]?.id ?? "";
    await setCommodity(first, true);
    ONE_COLUMN.addEventListener("change", () => redraw(renderList)); // rotate or resize across the breakpoint
  } catch (err) {
    console.error(err);
    $("app").innerHTML = `<div class="error" role="alert"><p>Data harga tidak bisa dimuat. Mungkin koneksi sedang putus atau server sedang sibuk.</p><button type="button" id="retry">Coba lagi</button></div>`;
    $("retry").onclick = () => location.reload();
    $("stamp").textContent = "";
    $("regionTabs").hidden = true;
    document.querySelector<HTMLElement>(".skip")?.setAttribute("hidden", "");
  } finally {
    $("app").setAttribute("aria-busy", "false");
  }
}
void init();
