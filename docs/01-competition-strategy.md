# 01 · Competition Strategy — How CarbonTrack AI Wins PromptWars

> **Internal playbook.** This file maps every PromptWars judging signal to a concrete
> deliverable in this repo, and names the explicit *score-levers* we pull. Read this first.

---

## 1. What we are actually competing in

**PromptWars — Google for Developers × Hack2Skill** is an *intent-driven development*
("vibe-coding") hackathon. It is **not** a chatbot-prompt beauty contest. The thesis of the
competition is: *can you turn intent (prompts) into a real, working, deployed product?*

| Attribute | Reality |
| :--- | :--- |
| **Cadence** | Bi-weekly. New industry problem on Monday; submit by ~Day 13; judged Day 14. |
| **Build tool** | Google Antigravity / AI Studio (agentic, prompt-first development). |
| **Submission (dual)** | (1) **Technical** — working code + **live deployed app**. (2) **Narrative** — **technical blog post + LinkedIn post** documenting the prompt-engineering journey. |
| **Judges** | Google AI + expert panel. |
| **Scored on** | Functionality · User Experience · **Documentation quality** · **Prompt-engineering skill**. |
| **Outcome** | Valid entries climb a cumulative leaderboard; top finishers get credits/swag + Google for Developers visibility. |

### The single most important insight
Two of the four scored dimensions — **documentation quality** and **prompt-engineering skill** —
are *not about the app at all*. They are about **how well you narrate the act of building with AI.**
Most participants will ship an app and write a throwaway README. **We win by treating the
prompt log and the blog as first-class engineered artifacts**, equal in effort to the code.

---

## 2. Score-lever map (criterion → what we ship → where it lives)

| Judging signal | Score-lever we pull | Artifact in this repo |
| :--- | :--- | :--- |
| **Functionality** | A genuinely useful tool that *works offline instantly* (GHG-Protocol calculator) **and** has an *optional Gemini AI layer* (NL logging + reduction coach). Graceful degradation = nothing ever breaks for the judge. | [`02-product-spec.md`](02-product-spec.md) |
| **User Experience** | "Translate, don't just inform" — every number becomes a human-relatable equivalency. Stark editorial dark theme, sub-second load, zero config. | [`02-product-spec.md`](02-product-spec.md) §UI |
| **Prompt-engineering skill** | Every Gemini call is documented with the **CO-STAR** framework, explicit delimiters, system guardrails, few-shot examples, and **structured-JSON output contracts**. We also document the *meta-prompts* used to vibe-code the app itself. | [`03-prompt-engineering-log.md`](03-prompt-engineering-log.md) |
| **Documentation quality** | A visual, emoji-anchored README (front door) + an academic evaluation doc with baselines and metrics + a narrative blog. Three distinct, deliberate documentation registers. | [`../README.md`](../README.md), [`04-evaluation-and-metrics.md`](04-evaluation-and-metrics.md), [`../submission/blog-post.md`](../submission/blog-post.md) |
| **"Wow" / memorability** | **Meta-sustainability**: the app is itself engineered to be ultra-low-carbon (~26 KB gzipped, offline-first, blocks network roundtrips). A sustainability app that *practices* sustainability is a story judges repeat. | [`02-product-spec.md`](02-product-spec.md) §Low-Carbon Mode |
| **Validity / completeness** | No placeholders, deployable in one click (Vercel/Pages), live URL + repo + blog + LinkedIn all linked from the README. | [`../README.md`](../README.md) §Submission Checklist |

---

## 3. Borrowing from proven winners (and *why* each fits PromptWars)

We deliberately blend three documented prompt-competition winners. Each maps to a different
**scored dimension**, so the blend is additive, not redundant.

### 🧱 Sheila Teo — *CO-STAR + structured prompt discipline* → **Prompt-engineering skill**
- Winner, Singapore GovTech GPT-4 Prompt Engineering Competition.
- We adopt her **CO-STAR** framework (Context · Objective · Style · Tone · Audience · Response)
  for **every** prompt, hard delimiters (`###`) separating instruction / data / examples, and
  explicit **system guardrails** (anti-prompt-injection on the natural-language parser).
- *Why it fits:* PromptWars explicitly scores prompt engineering. CO-STAR is the most legible way
  to *prove* intentionality to a judge skimming fast.

### 🎨 Srish Rachamalla — *visual, project-centric READMEs* → **User experience of the docs**
- Winner, Langflow AI Prompt Engineering Competition.
- We adopt emoji section headers, a one-glance tech-stack table, a copy-paste run/deploy guide,
  and an explicit "agentic workflow" framing of the Gemini layer.
- *Why it fits:* The README is the first thing a judge opens. Scannability = perceived polish.

### 📊 SangMin Lee — *academic, baseline-driven evaluation* → **Documentation quality / rigor**
- Winner, Big Data Camp Prompt Engineering Competition.
- We adopt a strict **evaluation doc**: emission-factor provenance table (every constant cited),
  accuracy validation against published baselines, a **prompt evaluation rubric**, and test cases.
- *Why it fits:* Sustainability claims must be *defensible*. Citing CEA/EPA/IEA factors and showing
  validation is what separates a toy from a credible tool to an expert panel.

> **The blend in one line:** Srish gets the judge in the door, Sheila proves the prompt craft,
> SangMin proves the science. CarbonTrack ships all three.

---

## 4. The product thesis (the one-sentence pitch)

> **CarbonTrack AI turns dry GHG-Protocol emissions math into human-relatable equivalencies,
> then layers an optional Gemini coach that reads your footprint and writes you a personalized,
> prioritized reduction plan — all in a ~26 KB-gzipped app that is itself engineered to be low-carbon.**

Three pillars, each a memorable judge-facing soundbite:
1. **"Translate, don't just inform."** (UX differentiator)
2. **"Prompts in, plan out."** (AI / prompt-engineering differentiator)
3. **"The greenest carbon app is the one that barely uses the network."** (meta-sustainability hook)

---

## 5. Risk register (what loses points, and our mitigation)

| Risk | Why it hurts | Mitigation |
| :--- | :--- | :--- |
| **No AI in an AI competition** | A static calculator reads as "missed the brief." | Hybrid architecture: optional Gemini layer is front-and-center in demo and docs. |
| **AI breaks during judging** (no key, rate limit, offline) | A broken demo tanks Functionality. | **Graceful degradation** — calculator + static tips always work with zero key. AI is additive, never required. |
| **Unsubstantiated emission factors** | Expert judge spots a wrong constant → credibility gone. | Every factor cited with source + date in [`04-evaluation-and-metrics.md`](04-evaluation-and-metrics.md). |
| **Generic README** | Loses Documentation points by default. | Three-register documentation system (see §3). |
| **Prompt injection via NL input** | "Ignore previous instructions…" pasted into the parser. | Documented guardrail + structured-output contract in [`03-prompt-engineering-log.md`](03-prompt-engineering-log.md). |
| **Leaked API key in repo** | Disqualification / security flag. | Key is user-supplied at runtime, stored only in `localStorage`, never committed. Documented prominently. |

---

## 6. Definition of "done" for the submission

- [ ] Live URL loads in <1s, works with **no API key**.
- [ ] NL logging + AI coach work when a key is pasted.
- [ ] README links: **Live demo · Repo · Blog · LinkedIn**.
- [ ] Blog post tells the *prompt journey* (not a feature list).
- [ ] LinkedIn post published with required hashtags/tags.
- [ ] Every emission factor cited.
- [ ] No secrets committed.

See the build sequence in [`02-product-spec.md`](02-product-spec.md) §Implementation Roadmap and the
exact prompts to feed Antigravity in [`03-prompt-engineering-log.md`](03-prompt-engineering-log.md).
