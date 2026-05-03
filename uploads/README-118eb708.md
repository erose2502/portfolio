# Relay — Voice AI Coordination Platform

> The coordination layer for voice AI agents across industries.
> Not just a conversational AI — a system that turns phone calls into parallel, structured actions.

---

## What Relay Does

Most voice AI tools let an AI answer a phone call and have a conversation. Relay goes further: it coordinates *between* organizations by dispatching multiple agents simultaneously, extracting structured data from every call, and turning that data into trackable actions — all without a human making a single phone call.

**The core insight:** Professionals in real estate, insurance, healthcare, legal, and logistics spend hours every week making sequential phone calls to different organizations to coordinate a single transaction. Relay dispatches all those calls in parallel, extracts what was said into structured outcomes, and surfaces the results in a unified dashboard.

---

## What's Working Right Now

### Voice Agent Engine
- **Live inbound calls** via LiveKit telephony — real PSTN phone numbers, agents answer instantly
- **Outbound dialing** — campaigns dispatch calls to lead lists with configurable concurrency and calling-hour windows
- **Ultra-low latency pipeline** — Silero VAD → OpenAI Whisper STT → GPT-4o-mini → OpenAI TTS, tuned for natural conversation
- **Post-call structured extraction** — after every call, GPT-4o-mini parses the transcript into structured JSON: `status`, `blocker`, `next_date`, `action_required`, `key_facts`
- **RAG knowledge base** — per-tenant ChromaDB vector store; agents answer questions grounded in your documents during the call
- **Intent classification** — GPT-4o at low temperature routes calls to the right disposition path
- **Automatic fallback** — if LiveKit is unavailable, falls back to Twilio TwiML Gather

### Transaction Coordination *(the core product)*
- **Transaction dashboard** — create a real estate (or any B2B) transaction, add the parties (lender, title company, inspector, appraiser), and dispatch coordination calls to all of them simultaneously
- **Parallel call dispatch** — all parties called at once instead of sequentially; what takes a human 3 days of phone tag takes minutes
- **Per-party call results** — each party's call surfaces: key facts confirmed, blockers, required actions, next dates — pulled automatically from the transcript
- **Closing date tracking** — days-to-close countdown with visual urgency cues

### Agent Builder
- **Custom voice agents** — build agents with custom system prompts, greetings, voice selection (alloy, echo, fable, nova, onyx, shimmer), model (GPT-4o-mini or GPT-4o), and temperature
- **8 pre-built agent templates** — ready to deploy out of the box:
  - Cold Call — Lead Qualification
  - Appointment Setting
  - Restaurant Order Taking
  - Inbound Customer Support
  - Payment Reminder
  - RE — Lender Status Check
  - RE — Title Company Confirmation
  - RE — Inspector Scheduling
- **Template library** — seed and extend with your own industry-specific templates
- **Per-agent knowledge base** — each agent can be scoped to a tenant's knowledge documents

### Campaign Manager
- **Outbound campaigns** — upload a lead list, assign an agent, set concurrent call limits and calling hours, and launch
- **Real-time progress** — live stats: pending, dialing, completed, connect rate, progress bar
- **Campaign controls** — start, pause, stop with status tracking
- **Retry logic** — failed calls automatically retried on configurable backoff schedule

### Live Call Monitor
- **Real-time active call view** — see every in-progress call with live duration counter
- **Recent call history** — direction, status, from/to numbers, timestamps
- **Call detail modal** — SID, transcript, disposition per call
- **WebSocket updates** — dashboard refreshes in real time via tenant-scoped event bus

### Knowledge Base
- **Document management** — add, edit, delete knowledge documents with titles, categories, and tags
- **RAG query testing** — test questions against the knowledge base directly from the UI
- **Per-tenant scoping** — each tenant's documents are isolated; no cross-tenant data leakage
- **Semantic search** — ChromaDB with L2 similarity threshold tuned for relevance

### Phone Number Management
- **LiveKit telephony integration** — buy real PSTN numbers directly from the LiveKit dashboard, register them here
- **Agent assignment** — map any phone number to any agent with a single dropdown
- **Multi-number support** — manage a full portfolio of inbound numbers per tenant

### Order Board
- **Kanban-style order tracking** — orders captured during calls flow into a board with columns: Pending → Confirmed → Processing → Completed → Cancelled
- **Status transitions** — move orders between stages with one click
- **Call-linked orders** — each order references the call session that created it

### Analytics Dashboard
- **Overview metrics** — calls today, calls this month, minutes used, cost, active campaigns, total contacts
- **Call volume chart** — bar chart with 7d / 30d / 90d period selector
- **Aggregate stats** — total calls, inbound vs. outbound split, average connect rate

### Billing
- **Plan management** — track subscription tier, billing status, next billing date
- **Minutes usage** — progress bar with overage warning when approaching or exceeding included minutes
- **Usage history table** — per-day breakdown of calls, minutes, and cost
- **Stripe integration** — webhook handler wired up for payment events

### Auth & Multi-Tenancy
- **JWT authentication** — login, token refresh, role-based access
- **Three roles** — Admin (full access), Manager (operations), Agent (calls + tasks)
- **Per-tenant data isolation** — every model carries a `tenant_id`; no cross-tenant data access
- **Default accounts seeded on first run:**
  - `admin@voiceagency.ai` / `admin123`
  - `manager@voiceagency.ai` / `manager123`
  - `agent@voiceagency.ai` / `agent123`

### User & Task Management
- **User management** — create, edit, deactivate users; assign roles
- **Task board** — tasks created manually or auto-generated from call outcomes; assign to team members, track status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Voice runtime | LiveKit Agents SDK, Silero VAD, OpenAI Whisper, OpenAI TTS |
| LLM | GPT-4o-mini (agent), GPT-4o (intent classification + extraction) |
| Telephony | LiveKit Phone Numbers (PSTN), Twilio (fallback) |
| Backend | FastAPI, SQLAlchemy async, aiosqlite (dev) / asyncpg + PostgreSQL (prod) |
| Background jobs | APScheduler |
| Vector DB | ChromaDB (in-memory or persistent) |
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Auth | JWT (python-jose), bcrypt |
| Billing | Stripe |
| Deployment | Railway (Procfile + nixpacks configured) |

---

## Running Locally

```bash
# 1. Copy and fill in your API keys
cp .env.example .env

# 2. Start everything
./start.sh
```

That's it. The script creates the Python venv, installs dependencies, starts the backend, LiveKit agent worker, and frontend dev server, then prints the URLs.

| Service | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

### Required env vars to get a live call working

```
OPENAI_API_KEY=sk-...
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=...
```

### Seed agent templates

```bash
.venv/bin/python3.14 scripts/seed_templates.py
```

---

## Project Structure

```
src/
├── main.py                  # FastAPI app entry point
├── livekit_agent.py         # LiveKit voice agent worker
├── config.py                # Pydantic settings
├── api/routes/              # One file per resource (agents, calls, campaigns...)
├── services/                # Business logic (voice_agent, rag, campaign, billing...)
├── models/
│   ├── db_models.py         # SQLAlchemy ORM (17 models)
│   └── schemas.py           # Pydantic request/response schemas
├── db/database.py           # Async session factory, init_db
├── jobs/scheduler.py        # APScheduler background tasks
├── data/agent_templates.py  # Pre-built agent template definitions
└── Frontend/                # React app
    └── src/
        ├── App.tsx           # Tab-based SPA shell
        ├── components/       # One component per feature area
        └── contexts/         # AuthContext (JWT + role state)

scripts/
├── seed_templates.py        # Seeds agent templates into DB
└── load_policies.py         # Seeds knowledge base documents
```

---

## What's Coming

- **Bring Your Own Agent** — register any external agent (Vapi, Bland, Retell, custom) into the Relay network via webhook
- **MCP tool integration** — agents trigger structured actions mid-call or post-call via MCP servers
- **Agent-to-agent calls** — when a Relay-registered number is dialed, route to the org's AI agent instead of a human
- **Orchestration layer** — post-call extraction triggers CrewAI/LangChain workflows for complex multi-step actions
- **Relay Registry** — the directory of registered agent endpoints across organizations; the network moat
