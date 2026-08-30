# Skylark Drones - Business Intelligence Agent
> **Enterprise-grade executive BI Agent integrating Monday.com Deals Pipeline & Drone Flight Operations with Cross-Board Resilience & Entity Resolution.**

---

## 📑 Deliverables & Submission Summary

| Deliverable | Status & Access Point | Description |
| :--- | :--- | :--- |
| **1. Hosted Prototype** | **Ready for Vercel / Cloud Deploy**<br>`npm run dev` / `npm start` | Fully responsive, interactive web application testable without prior setup. Includes a built-in high-fidelity snapshot of 344 Deals and 176 Work Orders + live Monday.com synchronization. |
| **2. Decision Log** | [**`DECISION_LOG.md`**](file:///c:/Users/waibhav/skylark/DECISION_LOG.md) | Comprehensive 2-page executive engineering log documenting key assumptions, trade-offs, roadmap, and leadership update models. |
| **3. Source Code & ZIP** | [**`skylark-monday-bi-agent.zip`**](file:///c:/Users/waibhav/skylark/skylark-monday-bi-agent.zip)<br>Run `npm run package` | Complete production repository with zero external dependencies required to run tests. |

---

## 🌟 System Overview & Capabilities

Founders and executive leadership at **Skylark Drones** require instant, accurate business intelligence across the commercial sales pipeline (Deals) and mission execution (Flight Work Orders). Real-world Monday.com data is inherently noisy: varying currency notations (`₹75L`, `1.2 Cr`, `$50k`), unstandardized dates, fuzzy client names, and unaligned sector classifications.

This system delivers:
1. **Dynamic Monday.com Integration (GraphQL v2 & Model Context Protocol)**: Introspects custom board schemas, column IDs, and paginates items directly from Monday.com.
2. **Data Resilience & Fuzzy Entity Resolution**: Automatically normalizes Indian financial notations (`Lakhs`, `Crores`, USD), date strings, and reconciles mismatched client names (`Adani Green Energy Ltd` ↔ `Adani Green`).
3. **Deterministic Math Engine**: Eliminates LLM math hallucinations by computing pipeline sums, weighted forecasts, conversion rates, and SLA metrics via TypeScript OLAP routines.
4. **Conversational Founder Copilot**: Context-aware natural language interface with interactive Recharts charts, proactive risk alerts, and multi-turn clarification prompts.
5. **Multi-Persona Leadership Briefing Studio**: Dynamic decks tailored for Founders/Board, Executive Leadership, and Sales & Ops Sync across Weekly, Monthly, and Quarterly horizons.
6. **Cross-Board Risk Detection**: Identifies won contracts lacking execution work orders and open negotiation deals endangered by delayed flight operations.

---

## 🏛️ Architecture

```
                                  ┌───────────────────────────┐
                                  │   Founder / Executive UI  │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                              ▼                              ▼
      ┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
      │  AI Founder Copilot │        │   Executive BI      │        │  Leadership Studio  │
      │  (Interactive Chat) │        │     Dashboard       │        │  (Deck Generator)   │
      └──────────┬──────────┘        └──────────┬──────────┘        └──────────┬──────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │  BI Query Engine & Aggregations │
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │  Data Resilience & Fuzzy Join   │
                               │  (Currencies, Dates, Entities)  │
                               └────────────────┬────────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
          ┌───────────────────────────┐                   ┌───────────────────────────┐
          │  Monday.com Deals Board   │                   │  Monday.com Work Orders   │
          │    (Sales Pipeline)       │                   │    (Drone Flight Ops)     │
          └───────────────────────────┘                   └───────────────────────────┘
```

---

## 🚀 Quick Start & Testing

### 1. Installation
```bash
git clone <repo-url>
cd skylark
npm install
```

### 2. Run Automated Test Suite (34 Unit & E2E Tests)
```bash
npm test
```
*Tests verify currency normalization, date resilience, fuzzy string matching, cross-board joins, query engine intents, and MCP server tools.*

### 3. Run Web Application Locally
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** to interact with the live telemetry dashboard.

---

## 🛠️ Monday.com Configuration & Setup

### Mode 1: High-Fidelity Snapshot Mode (Zero Setup Required)
The application loads with an out-of-the-box snapshot of 344 Deals and 176 Work Orders reflecting real Skylark drone missions across Solar, Mining, Infrastructure, and Powerlines.

### Mode 2: Connect Live Monday.com Workspace
1. In Monday.com, generate an API token:
   - Click **Avatar** (bottom left) → **Developers** → **Developer** → **API** → Copy Personal API Token.
2. In the Web App, open the **Monday.com API** tab:
   - Paste your API Token and click **Test API Key**.
   - Enter your **Deals Board ID** and **Work Orders Board ID** (from board URL `monday.com/boards/<ID>`).
   - Click **Sync Live Monday.com Boards**.

### Mode 3: Automated Board Provisioning Script
To automatically provision new boards on a fresh Monday account:
```bash
export MONDAY_API_KEY="your_api_key_here"
npx tsx scripts/import_to_monday.ts
```

### Mode 4: Model Context Protocol (MCP) Server
Run the standard MCP JSON-RPC 2.0 stdio Server:
```bash
npm run mcp
```
Connect from **Claude Desktop**, **Cursor**, or any AI host using [`mcp_config.json`](file:///c:/Users/waibhav/skylark/mcp_config.json):
```json
{
  "mcpServers": {
    "skylark-monday-bi": {
      "command": "npx",
      "args": ["tsx", "scripts/monday_mcp_server.ts"],
      "env": {
        "MONDAY_API_KEY": "your_api_key_optional"
      }
    }
  }
}
```

---

## 🌐 Deploying to Vercel / Production

Deploy in 1 click to Vercel:
```bash
npm run build
```
The application is pre-configured with Next.js 15 App Router and zero environment variable requirements for immediate evaluator review.
