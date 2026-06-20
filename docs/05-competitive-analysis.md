# 05 · Competitive Analysis & Differentiation

> **Win-condition layer.** A code evaluation of four rival PromptWars entries, the best features
> worth borrowing, and the concrete upgrades we shipped in response. Goal: be the entry a judge
> remembers — strongest on *all three* problem verbs (**understand · track · reduce**).

---

## 1. The field (what the competition actually built)

| Entry | Stack | Standout strengths | Weaknesses we exploit |
| :--- | :--- | :--- | :--- |
| **CarbonPulse** | Vanilla HTML/CSS/JS | "Premium" UI; 4-step wizard w/ live estimate; **comparison-to-average bar**; **Eco-Actions hub + daily habit checklist + cumulative saved**; gamified **Levels**; SVG donut | Annual-only (no per-day history); no real AI; cost-based electricity proxy (`bill × 3.8`) is weak science |
| **EcoSphere AI** (carbonwise) | React + TS, Vite | 7 categories; **global averages + tiers**; **challenges**; **what-if simulator**; **forecast**; AI coach; 304 tests / 97% cov; strong security | Heavy build/runtime; needs login; large bundle — the *opposite* of our meta-sustainability story |
| **CarbonLens** | Next.js | **ProgressRing** + StatCard UI; StepIndicator; a11y (SkipToContent) | Generic default README; framework-heavy for a tiny tool |
| **Terramo** | Vanilla | Clean, simple | Minimal — calculator + static tips only |

### Patterns that recur in the *strong* entries (so judges expect them)
1. **Context comparison** — footprint vs world/country average vs Paris target (EcoSphere `GLOBAL_AVERAGES`, CarbonPulse bar).
2. **Eco-Actions + daily checklist + cumulative "carbon saved" + streak/levels** (CarbonPulse, EcoSphere challenges).
3. **Gamified tiers** (EcoSphere Seedling→Forest Guardian; CarbonPulse Levels).
4. **What-if / impact simulator** (EcoSphere).
5. **Hero progress ring** as the visual centrepiece (CarbonLens).

---

## 2. Where we already win (do not regress)

- **Per-day history + 7/30-day trend** — most rivals are annual-only snapshots. We track *change over time*.
- **Scope-2 dual reporting** (location vs market) — GHG-report rigor nobody else has.
- **"Translate, don't inform"** — a 28-item equivalency engine; the best relatability layer in the field.
- **True offline-first, ~26 KB gzipped, no build, no backend** — our meta-sustainability story is the inverse of EcoSphere's heavy bundle. *Their strength is our differentiator.*
- **Prompt rigor** — CO-STAR + guardrails + JSON contracts + a graceful AI-off fallback. This is a *prompt* war; only EcoSphere competes here, and it needs a login.
- **Documentation system** — strategy + spec + prompt log + evaluation + this doc.

---

## 3. The gaps we closed (this iteration)

Each maps to a problem verb and stays true to our thesis (deterministic, offline, cited):

| Borrowed idea | Our implementation | Verb | Why ours is better |
| :--- | :--- | :--- | :--- |
| Context comparison | **Goal & Context gauge** — hero progress ring + bar vs Paris-aligned daily target and region average (cited `GLOBAL_AVERAGES`) | Understand | Tied to the *selected day*, region-aware, fully offline |
| Habits + cumulative saved | **Eco-Actions hub** — cited action library; commit actions; **per-day checklist**; **cumulative CO₂ saved**, **streak**, and **eco-tier** | Reduce | Streak/savings are computed from our *real per-day logs*, not a flat counter |
| What-if scenarios | **Impact Simulator** — toggles (car→EV, −50% flights, 100% green grid, lighter digital) recompute a projected footprint live | Reduce | Deterministic via the same `computeTotals`; no AI guesswork |
| Tiers / levels | **Eco-tier** (Seedling→Forest Guardian) from cumulative saved | Engage | Earned from verifiable savings, not vanity points |
| Progress ring | SVG **hero gauge** in the Deep Jungle palette | UI | Themed, dark-mode aware, low-carbon (CSS/SVG, no new lib) |

All additions are **deterministic and offline** — they reinforce, never dilute, the "AI only does language" boundary.

---

## 4. Positioning one-liner (for blog / judges)

> Rivals make you *log once and read a number*. CarbonTrack makes you **understand it in context**,
> **track it day over day**, and **reduce it with cited, verifiable actions** — in a ~26 KB app that
> practices the sustainability it preaches.

See provenance for the new constants in [`04-evaluation-and-metrics.md`](04-evaluation-and-metrics.md)
(§1.2 actions, §1.3 averages/tiers) and the engineering contract in
[`02-product-spec.md`](02-product-spec.md) §§12–14.
