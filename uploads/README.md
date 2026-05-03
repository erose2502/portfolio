# Kazi

**The execution OS for AI agents.**

Kazi is an operations platform that lets you define any business workflow, deploy a coordinated crew of specialized AI agents to execute it, and stay in control with a human checkpoint before anything goes out. It replaces the scattered stack of tools, manual handoffs, and one-off automations with a single place where your agents work — and you approve.

---

## What Kazi does

Most AI tools answer questions. Kazi gets work done.

You describe what you want to accomplish — run an outreach campaign, process expense approvals, onboard a new hire, ship a code fix — and Kazi breaks it into steps, assigns the right agents, runs the workflow, and drops the finished output into your queue for a final review before anything leaves the system.

Every action is logged. Every agent decision is traceable. And your integrations stay connected, so the work actually lands in the right place.

---

## The agent crew

Kazi ships with a crew of five specialized agents, each with a defined role in the workflow:

**Riley — Research & Intelligence**
Gathers context, surfaces insights, and maps the landscape before any work begins. Riley makes sure the crew always operates with the right information at the right time.

**Jordan — Execution & Output**
Produces the deliverables — messages, drafts, reports, and actions — in the exact format your workflow requires. Jordan turns the plan into real output, every time.

**Sam — Quality & Oversight**
Reviews every output before it reaches your queue. Sam enforces standards, catches edge cases, and keeps every agent in the crew accountable to the objective.

**Alex — Creative Director**
Handles brand, copy, and visual direction.Alex ensures that anything customer-facing looks and sounds like you.

**Cody — Kazi Coder**
Writes, reviews, and ships code across the stack. Cody handles feature builds, bug fixes, and technical tasks — turning specs into working software, end to end.

---

## What you get out of it

**A command center for every role.** The dashboard adapts to who you are — Revenue Lead, Finance Lead, People Lead, Ops Lead, or Executive. You see the metrics and agent activity that matter to your function, not a generic feed.

**An inbox that replaces the approval bottleneck.** Agent drafts, approvals, and pending actions are routed to a single queue. You review, approve, or reject — and the agent executes. Nothing goes out without your sign-off.

**Finance ops without the spreadsheet chase.** Invoice tracking, budget vs. actuals, spend anomaly flags, and expense approval routing — all driven by agents connected to your financial tools. Unusual patterns surface before they escalate.

**People ops that runs itself.** Automated onboarding flows, time-off tracking, hiring pipeline management, and performance check-ins. Agents handle the scheduling and follow-through; you handle the decisions.

**Project execution across teams.** Agents decompose goals into tasks, assign them, track status in real time, and sync bidirectionally with your existing project tools. A revenue deal can trigger a project. A finance approval can gate spend.

**A full audit trail.** Every task — who ran it, which agent handled it, what the outcome was — is logged and filterable. You can see what's running, what completed, and what failed, down to the individual agent action.

**Meetings that document themselves.** Scheduling, note-taking, and follow-up actions are handled by agents. Meeting history and action items stay connected to the work they came from.

**Integrations that actually stay in sync.** Kazi connects to the tools your team already uses. Changes made inside Kazi propagate out; changes made in your external tools propagate back in.

---

## The MCP server (Kazi Agent Hub)

Kazi exposes its orchestration layer as an MCP server — `kazi-agent-hub` — so Claude and other AI clients can dispatch tasks to the agent crew directly. You can trigger workflows, route tasks to specific agents, check execution status, and pull results without leaving your AI client.

This makes Kazi the execution backend for any AI-driven workflow, not just the ones built inside the Kazi app.

---

## Pillars

Kazi is organized around four operational pillars. Each pillar surfaces the right tools, capabilities, and agent activity for that function:

- **Revenue** — Outreach, pipeline, campaigns, prospect management
- **Finance** — Spend tracking, approvals, anomaly detection, AP/AR
- **People** — Hiring, onboarding, org structure, scheduling
- **Projects** — Task execution, cross-team dependencies, status tracking

---

## Coming Soon

Kazi is not yet publicly available. We're onboarding a limited set of early teams — if you're interested in getting access, reach out directly.

[kazi-nu.vercel.app](https://kazi-nu.vercel.app)
