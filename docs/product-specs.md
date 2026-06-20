# Product Specification — CarbonTrack AI (Hybrid Offline + Gemini)

> **Canonical build spec.**
> Target tier: **Advanced**. Architecture: **offline-first calculator + optional Gemini AI layer**.
> Read alongside [`prompt-engineering-log.md`](prompt-engineering-log.md) (the actual prompts).

---

## 1. System context & tech stack

You are an expert **Frontend Engineer + Sustainability Data Scientist**. Build a hyper-performant,
zero-config **Single Page Application**.

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **Markup** | Vanilla HTML5 (semantic) | Zero build step, instant load |
| **Styling** | Tailwind CSS via CDN (v3) | Dense dashboard styling without a bundler |
| **Charts** | Chart.js via CDN (v4) | Canvas dual-reporting + doughnut |
| **Icons** | Lucide via CDN | Lightweight, crisp |
| **Storage** | `window.localStorage` | History + settings, no backend |
| **AI (optional)** | **Gemini API** (`gemini-3.5-flash`) via `fetch` | NL logging + reduction coach |
| **Deploy** | Vercel / GitHub Pages | One-click, zero-config, free TLS |

**Footprint budget:** total deployed payload **~26 KB gzipped / over the wire** (≈105 KB raw, excluding CDN libs). 100% client-side.
No backend, no cookies, no trackers.

> ### ⚖️ The hybrid principle (non-negotiable)
> The **calculator works with zero API key, fully offline.** The Gemini layer is **purely
> additive**. If there is no key, the network is down, or the API errors, the app must degrade
> gracefully to the deterministic calculator + a static rules-based tip engine. **The judge must
> never see a broken state.**

---

## 2. Architecture (unidirectional data flow)

```
[User Action]──▶┌─────────────────────┐
  (sliders,     │  Reactive State     │◀── hydrate from localStorage
   NL text)     │  Store (single src) │
                └─────────┬───────────┘
                          │ updateState(path,value) → recalc → persist → notify
        ┌─────────────────┼───────────────────────────────┐
        ▼                 ▼                                 ▼
┌──────────────┐  ┌──────────────────┐            ┌──────────────────┐
│ Calc Engine  │  │ Equivalency       │            │  Gemini Adapter  │ (optional)
│ (kg CO2e)    │  │ Engine            │            │  NL parse / coach│
│ DETERMINISTIC│  │ (human relatable) │            │  FALLIBLE→fallbk │
└──────┬───────┘  └────────┬─────────┘            └────────┬─────────┘
       └───────────┬───────┘                               │
                   ▼                                        ▼
        ┌──────────────────────┐                 ┌──────────────────┐
        │ DOM Renderer │ Chart  │                 │ AI Panel Renderer│
        │ Controller   │ Sync   │                 │ (coach / parse)  │
        └──────────────────────┘                 └──────────────────┘
```

**Key boundary:** the calculator path and the Gemini path are *fully decoupled*. The Gemini adapter
only ever **writes structured activity data back into the same state store** (for NL logging) or
**reads the computed results to render advice** (for the coach). It is never on the critical path.

---

## 3. State schema (single source of truth)

```javascript
const state = {
  inputs: { // the ACTIVE day's working copy (mirrors ct_logs[selectedDate])
    travel:      { gasolineKm: 0, evKm: 0, flightKm: 0, trainKm: 0, motorbikeKm: 0, busKm: 0 },
    electricity: { kwh: 0, mobileHr: 0, laptopHr: 0, desktopHr: 0, gridRegion: 'global', offsetPercentage: 0 },
    digital:     { gbTransferred: 0 }
  },
  results: {
    travel: 0, electricityLocation: 0, electricityMarket: 0, digital: 0,
    totalLocation: 0, totalMarket: 0
  },
  ai: {
    enabled: false,         // true once a key is present
    model: 'gemini-3.5-flash',
    lastCoachPlan: null,    // cached plan object (cuts repeat API calls = meta-sustainability)
    status: 'idle'          // 'idle'|'parsing'|'coaching'|'error'
  },
  settings: {
    lowCarbonMode: false,
    theme: 'light',        // 'Deep Jungle' light theme (see §8)
    unit: 'km',            // 'km' | 'mi' — display only; all distances STORED in km
    commuteKm: 24,         // user's saved daily commute, for the 1-click quick-add
    commuteMode: 'gasolineKm', // which travel field the commute injects into
    trendRange: 7,         // 7 | 30 — window for the daily-footprint trend
    viewMode: 'today',     // 'today' | 'total' — big number shows the day vs the lifetime sum
    committedActions: ['bike-short','led','meatless'] // adopted eco-actions (see §13)
  },
  selectedDate: null       // 'YYYY-MM-DD' — the day being viewed/edited (defaults to today)
  // NOTE: the API key is NOT in serialized state. It lives in a separate localStorage
  // key ('ct_gemini_key') and is read on demand, never logged, never charted.
};
```

### Persistence model — one log per day
Storage is split into two keys: **`ct_logs`** = `{ 'YYYY-MM-DD': inputs }` (an independent entry per
day) and **`ct_settings`** = the `settings` object. `saveToStorage()` writes the active day into
`ct_logs[selectedDate]`; **day navigation** (‹ / ›, a calendar picker capped at today, and a *Today*
jump) calls `loadDay(date)`, which flushes the current day, then loads that date's inputs (or a blank
sheet, carrying the grid region forward). **Future dates are blocked** — you can review/correct history,
not pre-log. A legacy single-snapshot `ct_state` is migrated into today's log on first run. A **7/30-day
trend** (CSS bars, recomputed from `ct_logs` via the pure `computeTotals`) visualises history and lets
you jump to any past day. A third key, **`ct_actions`** = `{ 'YYYY-MM-DD': [actionId] }`, records which
eco-actions were completed each day (drives streak / cumulative-saved; see §13).

Pub/sub broker drives reactive rendering:

```javascript
const stateBroker = { listeners: [], subscribe(fn){this.listeners.push(fn);},
  notify(){ this.listeners.forEach(fn => fn(state)); } };

function updateState(path, value) {
  setDeepValue(state, path, value);  // 'inputs.travel.gasolineKm'
  runCalculations();                  // deterministic, synchronous
  saveToStorage();                    // persist (excluding key)
  stateBroker.notify();               // re-render DOM + charts
}
```

---

## 4. Calculation engine (GHG-Protocol aligned)

$$\text{Total Emissions} = \sum (\text{Activity Data} \times \text{Emission Factor})$$

### Emission factor table (every constant is cited in [`evaluation-and-metrics.md`](evaluation-and-metrics.md))

| Sector | Input | Factor (EF) | Unit | Baseline source |
| :--- | :--- | :--- | :--- | :--- |
| Travel · Gasoline car | km | `0.17` | kg CO2e/km | Avg gasoline passenger car |
| Travel · EV | km | `0.05` | kg CO2e/km | EV on avg grid charge |
| Travel · Flight (short-haul) | km | `0.15` | kg CO2e/km | Commercial <3h |
| Travel · Train/rail | km | `0.04` | kg CO2e/km | National rail transit |
| Travel · Motorbike | km | `0.10` | kg CO2e/km | Avg two-wheeler |
| Travel · Public bus | km | `0.08` | kg CO2e/km | Avg urban bus, per-passenger-km |
| Electricity · Grid | kWh | regional | kg CO2e/kWh | 17 regions — see [`metrics` §1.1](evaluation-and-metrics.md) |
| Electricity · Device use | hours | `0.005`/`0.05`/`0.20` | kWh/hr → ×EF_grid | Mobile / laptop / desktop active draw |
| Digital · Data | GB | `0.06` | kg CO2e/GB | CO2.js standard methodology |

### Formulas

```
E_travel        = gasKm·0.17 + evKm·0.05 + flightKm·0.15 + trainKm·0.04 + motorbikeKm·0.10 + busKm·0.08
deviceKwh       = mobileHr·0.005 + laptopHr·0.05 + desktopHr·0.20
E_elec_location = (kWh + deviceKwh) · EF_grid
E_elec_market   = E_elec_location · (1 − offset%/100)     ← Scope 2 dual reporting
E_digital       = GB · 0.06
E_total_location = E_travel + E_elec_location + E_digital
E_total_market   = E_travel + E_elec_market   + E_digital
```

All calc functions are **pure** (input → output, no DOM, no side effects) so they are unit-testable
against the baselines in the eval doc.

---

## 5. Equivalency engine — "Translate, Don't Just Inform"

Never display a raw number alone. The engine holds a **library of ~28 everyday equivalencies** (each a
`count / kg CO2e` rate; full provenance in [`evaluation-and-metrics.md`](evaluation-and-metrics.md)).
It selects the one whose count lands **closest to ~20** among all candidates reading ≥ 1 — a magnitude
that stays human-relatable (you see "18 cups of coffee", never "0.003 hamburgers" or "41,200 searches").

```javascript
function formatEquivalency(kgCO2e, unit) {
  if (kgCO2e <= 0) return { valueString: "0", label: "No emissions yet", description: "Log an activity to begin." };
  const baselines = [ // count-per-kg rates; ~28 entries in the implementation
    { name: 'Smartphone Charge',  factor: 120, icon: 'smartphone', phrase: v => `${Math.round(v).toLocaleString()} smartphone charges` },
    { name: 'Cups of coffee',     factor: 40,  icon: 'coffee',     phrase: v => `${Math.round(v).toLocaleString()} cups of coffee` },
    { name: 'HD Video Streaming', factor: 10,  icon: 'tv',         phrase: v => `${Math.round(v).toLocaleString()} hours of HD streaming` },
    { name: 'Driving',            factor: 2.5, icon: 'car',        phrase: v => unit === 'mi' ? `${Math.round(v)} miles driven` : `${Math.round(v*1.609)} km driven` },
    // …food, manufacturing, digital, household, travel… (see app.js)
  ];
  // Pick the most relatable: closest to ~20, among counts >= 1 (fallback: first baseline).
  let valid = baselines.filter(b => kgCO2e * b.factor >= 1.0);
  if (valid.length === 0) valid = [baselines[0]];
  valid.sort((a, b) => Math.abs(kgCO2e*a.factor - 20) - Math.abs(kgCO2e*b.factor - 20));
  const selected = valid[0];
  const text = selected.phrase(kgCO2e * selected.factor);
  return { valueString: text, label: selected.name, description: text, icon: selected.icon };
}
```

> **Units:** distance-based equivalencies (Driving, e-Bike) and the Travel inputs follow the user's
> **km/mi** setting. Distances are always *stored* in kilometres; the unit is a display concern only.

---

## 6. 🤖 The Gemini AI layer (optional, additive)

This is the differentiator for an **AI hackathon**. Three features, all degrade gracefully.
The **exact prompts** (CO-STAR, delimiters, guardrails, schemas) live in
[`prompt-engineering-log.md`](prompt-engineering-log.md). This section is the *engineering* contract.

### 6.0 Key handling (security-critical)
- A small "🔑 Connect Gemini" affordance lets the user paste their **own** API key.
- Stored **only** in `localStorage['ct_gemini_key']`, never committed, never sent anywhere except
  `generativelanguage.googleapis.com`. A visible "Disconnect / clear key" button wipes it.
- `state.ai.enabled = !!key`. With no key, AI panels show a friendly "Connect to unlock" stub and
  the static tip engine runs instead.

### 6.1 Natural-language activity logging  ·  *"Prompts in, data out"*
> User types: *"I drove 30 km to work, took a 400 km flight, and streamed 3 hours of Netflix."*
> Gemini returns **structured JSON** that is merged into `state.inputs` → calculator runs as normal.

- Uses **structured output**: `responseMimeType: "application/json"` + a strict `responseSchema`.
- The model only **maps language → numbers**; it does **not** compute emissions (determinism stays
  in our engine). This separation is a deliberate prompt-engineering decision (see log §2).
- Streaming hours → GB uses a documented assumption (HD ≈ 3 GB/h) shown to the user, editable.

### 6.2 AI Reduction Coach  ·  *"Plan out"*
> Sends the computed sector breakdown → Gemini returns a **prioritized, personalized 3-step plan**
> with a projected kg CO2e saving per step and an encouraging, non-preachy tone.

- Output is structured (`steps[]` with `title`, `action`, `projectedSavingKg`, `effort`).
- Plan is **cached** in `state.ai.lastCoachPlan`; re-requesting the same breakdown returns the cache
  (no redundant API roundtrip → reinforces the meta-sustainability story).

### 6.3 "Explain my footprint" (plain-language narrative)
> One-paragraph, encouraging summary of where the user's emissions come from and the one biggest
> lever — readable by a non-expert. Falls back to a templated sentence offline.

### Gemini request shape (reference)
```
POST https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}
Content-Type: application/json
{
  "system_instruction": { "parts": [{ "text": "<CO-STAR system prompt, see log>" }] },
  "contents": [{ "role": "user", "parts": [{ "text": "<delimited task + data>" }] }],
  "generationConfig": {
    "temperature": 0.4,
    "responseMimeType": "application/json",
    "responseSchema": { /* strict schema per feature, see log */ }
  }
}
```
> Model `gemini-3.5-flash` (fast, cheap), called via raw `fetch`. Always handle non-200 + malformed
> JSON by falling back to the deterministic/static path.

---

## 7. Visual dashboard

- **Scope 2 dual-reporting bar chart:** Location-based vs Market-based (offset) emissions.
- **Sector doughnut:** % from Travel / Electricity / Digital.
- Always `chartInstance.destroy()` before re-render to avoid Chart.js ghosting.
- The big number is the **total**, immediately followed by its equivalency string and (if AI on) the
  one-line "Explain my footprint" narrative.

---

## 8. UI/UX — "Deep Jungle" Light Environmental theme

Palette from `colors.jpg` (UI Color Collective · Deep Jungle): a slightly **offwhite**
background, **greens** carrying the environmental tone, and the palette's near-black used as a
softened **charcoal** (never harsh pure black). Canonical tokens live in
[`../theme.css`](../theme.css) (CSS vars + a Tailwind CDN `tailwind.config` snippet).

| Token | Value | Role |
| :--- | :--- | :--- |
| Background (offwhite) | `#F5F8F0` | page — faint green-tinted offwhite |
| Surface (card) | `#FFFFFF` | elevated panels |
| Surface sunk | `#ECF1E3` | inset wells, stripes |
| Card border | `#DCE6CE` (≈ `rgba(46,89,14,.18)`) | hairline |
| Charcoal surface | `#0C2605` | header / footer / code (palette black) |
| Deepest black | `#010D00` | shadows, overlays |
| Primary text (charcoal-green) | `#16240E` | ~14:1 on bg — softened, easy on eyes |
| Secondary / muted text | `#46583A` / `#6B7D5E` | — |
| Brand green | `#548C1C` | accent / brand |
| Green text on white (AA) | `#3F6B14` | links, accent text (~5.8:1) |
| Heading / deep green | `#2E590E` | headers, pressed states |
| Lime highlight | `#8EBF24` | chart fills, progress, hover glow (fills only — too low-contrast as text) |
| Climate-cost accent (the "visual speed bump") | amber `#B5860B` | kept off-palette so it reads as a warning against the greens |
| Metric values | `font-mono` · `#2E590E` · `font-bold tracking-widest` | the "big number" |
| Focus ring | `0 0 0 3px rgba(84,140,28,.45)` | — |
| Data-viz sequence | `#2E590E → #548C1C → #8EBF24 → #0C2605` | Travel / Electricity / Digital / extra |

> **Why these tweaks:** raw lime `#8EBF24` fails contrast as text on white, so it's reserved for
> fills; near-pure black `#010D00` is reserved for shadows/charcoal surfaces, while body text uses a
> softer charcoal-green `#16240E` — keeping the page calm and readable.

### Dark mode (same palette, inverted)

The palette's near-blacks become the surfaces and lime carries text/accent (the deep greens are too
dark to read on a dark ground). Toggle via `[data-theme="dark"]` / `.dark`, with a
`prefers-color-scheme` fallback — see [`../theme.css`](../theme.css).

| Token | Light | Dark |
| :--- | :--- | :--- |
| Background | `#F5F8F0` | `#010D00` |
| Surface (card) | `#FFFFFF` | `#0C2605` |
| Hairline border | `#DCE6CE` | `#234017` |
| Primary text | `#16240E` | `#EAF1DD` |
| Accent / link text | `#3F6B14` | `#A6D62E` |
| Heading | `#2E590E` | `#B6E04A` |
| Primary button | `#3F6B14` bg · white | `#8EBF24` bg · `#0C2605` label |
| Data-viz seq | `#2E590E·#548C1C·#8EBF24·#0C2605` | `#A6D62E·#8EBF24·#548C1C·#3F6B14` |

The `settings.theme` value (`'light'`/`'dark'`) maps directly to the `data-theme` attribute on
`<html>`.

Subtle transition when a carbon score updates (positive-feedback animation). Dense, card-based,
extension-friendly layout (12-col grid: inputs left, dashboard right).

### Input ergonomics (lower the cost of logging)
- **km / mi unit toggle** (header): switches all distance inputs, labels, and distance equivalencies
  between metric and imperial. Distances are stored canonically in km; the toggle is display-only and
  persisted in `settings.unit`. The NL parser is instructed to normalise any miles → km.
- **Daily-commute quick-add** (Travel sector): the user saves their typical commute once
  (`settings.commuteKm`, default 24 km); **"Add my commute"** injects it into Gasoline Car in one
  click, and **"Work week ×5"** adds five days at once — the common case becomes a single tap.

---

## 9. 🌱 Low-Carbon Mode (meta-sustainability — the "wow")

Header toggle `[Low-Carbon Mode]`. On enable:
- `body.low-carbon` ⇒ `* { transition:none!important; animation:none!important; }`
- Charts swap to **static CSS grid bars** (no canvas repaint cost).
- Web fonts disabled → system sans only.
- A status card reports the *actual* engineering wins (the DB payload is **computed live** from
  `localStorage`, not hardcoded):
  > *"Local DB payload: 0.4 KB · Off-grid · Network roundtrips blocked: 100% · Est. page energy: ~0.02 g CO2e/view (est.)"*
- **AI calls auto-cache-only** in this mode (no new roundtrips) — the app literally lives its message.

---

## 10. Required output files (judge-facing, you build these)

1. `index.html` — semantic SPA shell + CDN integrations + AI panel markup.
2. `app.js` — state store, pure calc engine, equivalency engine, Chart.js controller,
   localStorage sync, Gemini adapter (with graceful fallback), Low-Carbon handler. **No placeholders.**
3. *(optional)* `tips.js` — static rules-based fallback tip engine for the no-key path.

---

## 11. Implementation roadmap (feed these to Antigravity)

1. **Ingest spec** → read this file + the prompt log so generation is aligned.
2. **Generate SPA** → complete `index.html` + `app.js`, deterministic calculator first.
3. **Add Gemini adapter** → wire the three AI features behind the key gate, with fallbacks.
4. **Validate** → run the baseline test cases in [`evaluation-and-metrics.md`](evaluation-and-metrics.md);
   confirm no broken CDN/chart mounting; confirm app works with key removed.
5. **Polish** → Low-Carbon Mode, animations, equivalency edge cases.
6. **Deploy** → Vercel/Pages; capture live URL + screenshots for the README and blog.

> The literal, copy-paste prompts for each step are in
> [`prompt-engineering-log.md`](prompt-engineering-log.md) §1 (Build prompts).

---

## 12. Goal & Context gauge (UNDERSTAND)

A number means nothing without a yardstick. The gauge frames the selected day's footprint against two
references (provenance in [`metrics` §1.3](evaluation-and-metrics.md)):

- **Paris-aligned daily target** = `2300 / 365 ≈ 6.3 kg/day`.
- **Regional daily average** = `regionAnnualAvg(gridRegion) / 365`, mapped from the chosen grid region.

An SVG progress ring fills to `min(1, total / regionDailyAvg)` and is colour-coded: **green** ≤ target,
**amber** ≤ average, **red** above average. A horizontal bar marks target vs average vs "you". Pure,
offline, recomputed on every state change.

## 13. Eco-Actions hub (REDUCE + engagement)

A habit-formation layer grounded in our **real per-day logs** instead of a flat counter:

- A cited **action library** (`ECO_ACTIONS`, [`metrics` §1.2](evaluation-and-metrics.md)); each carries a
  daily `save` (kg CO2e). Users **commit** actions → `settings.committedActions`.
- Committed actions render as a **per-day checklist**; ticking writes to `ct_actions[selectedDate]`.
- Derived, all deterministic: **today saved**, **cumulative saved** (Σ over all days), a **streak**
  (consecutive days with ≥1 completion), and an **eco-tier** (Seedling → Forest Guardian) from cumulative.

> Why this works: streak and savings are *earned from verifiable logged days*, not vanity points,
> and the whole loop runs offline.

## 14. What-if Impact Simulator (REDUCE)

A panel of toggles (car→EV, halve car, halve flights, 100% renewable electricity, −30% data) that
**re-run `computeTotals` on a deep copy** (`normalizeInputs`) of the current inputs and show the projected
footprint + saving live. The model never guesses — it reuses the deterministic engine, so projections are
reproducible and never mutate real state.
