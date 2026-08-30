# Skylark Drones BI Agent // Engineering Decision Log & Architecture Spec

> **Document Type:** Architectural & Strategy Decision Log (Max 2-Page Executive Spec)  
> **Author:** Antigravity AI Engineering Team  
> **System:** Skylark Drones Monday.com Cross-Board Business Intelligence Agent  

---

## 1. Key Assumptions Made

1. **Absence of Shared Foreign Keys**:
   - *Assumption*: Monday.com workspaces maintain disparate schemas where Deals and Flight Work Orders are managed by different teams without strict primary/foreign key relationships (e.g., deal IDs are rarely referenced in operational flight boards).
   - *Implementation*: We built a **Fuzzy Entity Resolution & Name Normalization Engine** (`lib/data/cleaner.ts`) that standardizes client entities by stripping corporate suffixes (`Ltd`, `Inc`, `Infra`, `Pvt`), punctuation, and casing, supplemented with a Levenshtein distance similarity threshold (>0.82) to reliably join records (e.g., `Adani Green Energy Ltd` ↔ `Adani Green`).

2. **Real-World Currency & Unit Inconsistencies**:
   - *Assumption*: Commercial pipeline fields in Indian enterprise tech contain varied notations (`₹75L`, `1.2 Cr`, `₹95 Lakhs`, `$50k USD`), null values for early POCs, and unformatted numbers.
   - *Implementation*: Created a deterministic currency parser with regex lookaheads converting Indian numerical terms (`Lakhs` = $10^5$, `Crores` = $10^7$, USD @ 84 INR) into exact raw numbers before running mathematical aggregations.

3. **Operational Definition of "Cross-Board Business Risk"**:
   - *Assumption*: Operational delays in drone flights directly endanger future contract closings, while missing work order handoffs represent execution bottlenecks.
   - *Implementation*: Defined two distinct cross-board risk vectors:
     - **Execution Bottleneck**: A contract is *Closed Won* (value $\ge ₹5\text{L}$), but 0 corresponding Work Orders exist in the flight operations tracker.
     - **Revenue Churn Risk**: A client has high-value active pipeline in *Proposal/Negotiation*, but their currently ongoing flight missions are *Delayed* or in *Weather Standby*.

4. **Multi-Horizon, Multi-Persona Audience Needs**:
   - *Assumption*: Founders/Board care about macro ARR, capital efficiency, and governance flags; Executive Leadership cares about pacing vs targets and flight velocity; Sales & Ops need tactical mission schedules and closing timelines.

---

## 2. Trade-Offs Chosen & Strategic Rationale

| Architecture Choice | Alternative Considered | Chosen Decision & Justification |
| :--- | :--- | :--- |
| **Calculation Engine** | Passing raw CSV/JSON directly to an LLM for prompt-based math | **Deterministic TypeScript OLAP Math Engine (`lib/agent/analytics.ts`)**. LLMs notoriously hallucinate sums, percentages, and weighted pipelines. All math, win rates, and SLA metrics are strictly calculated in code; the AI synthesizes strategic narrative over ground-truth numbers. |
| **Integration Architecture** | REST API polling only | **Dual Protocol Architecture (GraphQL v2 API + Model Context Protocol Server)**. Standard GraphQL client handles live board schema discovery, while the `scripts/monday_mcp_server.ts` enables zero-setup integration into Cursor, Claude Desktop, and background agents. |
| **State & Data Store** | External Postgres / Redis DB | **In-Memory Normalized Cache with Schema Introspection**. Eliminates database provisioning overhead for the evaluators while supporting instant dataset swapping between real 344-deal snapshot and live Monday.com boards. |
| **UI Aesthetics & UX** | Generic Admin Template / Vanilla Tables | **Awwwards-Grade Dark Mode Console (`globals.css`, Framer Motion)**. Built with precision aerospace framing (`.tech-frame`), monospace metrics, and 60fps spring transitions to mirror a high-stakes drone fleet command center. |

---

## 3. How We Interpreted "Leadership Updates"

Rather than treating a leadership update as a static text dump, we modeled it as a **Multi-Persona Executive Briefing Studio**:

1. **Persona Branching**:
   - **Founders / Board of Directors**: Emphasizes gross contract values, probability-weighted pipeline, capital allocation for LiDAR drone assets, and cross-board governance red flags.
   - **Executive Leadership Team**: Focuses on quarterly target attainment pacing, flight turnaround SLA velocity, cross-departmental handoff friction, and resource rebalancing.
   - **Sales & Ops Sync**: Zeroes in on late-stage negotiations closing this week, DGCA airspace clearance blockers, pilot field rosters, and billing realization.
2. **Horizon Branching**: Dynamically adjusts targets, burn pacing, and urgency across **Weekly Flash**, **Monthly Board Review**, and **Quarterly Forecast**.
3. **Frictionless Export**: Provides instant 1-click Markdown copy for Slack/Notion and print-optimized PDF styling for board slide decks.

---

## 4. What We Would Do Differently With More Time

1. **Automated Monday.com Webhook Listeners**:
   - Implement real-time Webhook endpoints on `/api/monday/webhooks` to immediately re-calculate pipeline risk whenever a flight status changes to `Weather Standby` or a deal moves to `Closed Won`.
2. **Bi-Directional Risk Writeback**:
   - Automatically write back tags and AI risk annotations (e.g. `⚠️ Delayed Flight - Deal at Risk`) directly into custom Monday.com column values.
3. **Live Weather & DGCA Airspace Integration**:
   - Ingest IMD / OpenWeather radar feeds and DGCA Digital Sky airspace maps to predict mission delays *before* they impact enterprise client SLAs.
4. **Predictive Churn Machine Learning Model**:
   - Train an XGBoost classification model on historical deal cycles and turnaround days to predict deal slippage probability based on real-time pilot logs.

---

## 5. Technology Stack Justification

- **Next.js 15 (App Router) + React 19**: Provides blazing fast server-rendered foundation with instant API routes (`/api/agent/query`, `/api/agent/briefing`, `/api/monday/sync`).
- **TypeScript (Strict Mode)**: Guarantees data model safety across `CleanDeal`, `CleanWorkOrder`, and `CrossBoardMatch` records.
- **Framer Motion**: Enables fluid, hardware-accelerated micro-interactions, layout transitions, and staggered visual reveals.
- **Recharts**: High-performance SVG charting for stage funnels and ops breakdown.
- **Model Context Protocol (MCP)**: Native standard JSON-RPC 2.0 stdio interface for enterprise agent interoperability.
