# Marrymap: Build Strategy

## Executive decision

The IdeaBrowser email describes a capable DIY wedding coordinator: timeline generation, weekly steps, inquiry drafts, quote comparison, price flags, bank-linked budget tracking, and a risk dashboard. The problem is credible, but the broad product is not the correct first product.

Existing platforms already provide checklists, budgets, guest tooling, websites, registries, vendor discovery, and AI assistance. Marrymap's first wedge should be a neutral **quote and commitment cockpit** for DIY couples who already have vendors in motion. It turns their own quotes, contracts, and decisions into a source-linked plan, asks the right missing questions, and prepares communication for their approval.

The customer never sees "an agent team." They see a reliable, quiet decision ledger.

## What the front-end MVP proves

The shipped static prototype deliberately includes four surfaces:

1. An editable weekly plan with clear urgency and completion state.
2. A manual, browser-only commitment budget.
3. An apples-to-apples photography comparison with a missing-term warning.
4. Vendor-message drafts that cannot send without a review and explicit approval action.

It deliberately excludes bank and Gmail integrations, document uploads, price-outlier verdicts, autonomous communication, bookings, payments, and a vendor marketplace. Those capabilities carry material security, data-quality, marketplace-neutrality, and operational risks that are not justified before paid evidence exists.

## Why this is a YC-shaped wedge

YC's advice is to launch once there is a "quantum of utility," get early customers by any means necessary, talk directly to them, and do work manually rather than scaling prematurely. The relevant implementation is concierge coordination, not a feature-complete SaaS product.

### 14-day customer proof plan

1. Offer: "Already booked vendors? We create and manage your final 30-day operating plan from your real contracts, vendor emails, and decisions." Charge a clear one-event pilot price.
2. Segment: start with DIY couples 2-8 weeks from a 80-200 guest, multi-vendor wedding. A multi-event or destination wedding may be an even stronger narrow initial market because coordination density is higher.
3. Recruit: reach 30 qualified couples through personal referrals, local photographers, venues, planners who meet DIY couples, and highly specific regional or cultural wedding communities.
4. Interview: conduct 20 artifact-led conversations. Ask for the last coordination breakdown, existing spreadsheets, a vendor message or contract, the next deadline, who absorbs coordination, and what they already tried. Do not ask whether they "would use AI."
5. Sell: ask 10 qualified couples for a $49-$299 paid pilot or deposit. Deliver the first two manually within 24 hours; use the real deliverable to sell later pilots.
6. Gate: alter the segment or stop if fewer than 3 of 20 have acute final-month coordination pain or fewer than 3 of 10 qualified offers pay or deposit.

### First metrics

- 24-hour activation: couple supplies at least two source artifacts, receives a source-linked plan, assigns three tasks, and approves one vendor check-in.
- Reliability: 100 percent of commitments have a source reference; critical extraction error rate is below 2 percent after human review; no unapproved external action.
- Engagement: the majority of active final-month couples return weekly and close critical readiness work by 72 hours before the wedding.
- Paid signal: payment, referrals, and the percentage who say they would be very disappointed without the service. Do not mistake signups or chat messages for traction.
- Unit economics: revenue per event, human time per event, model/tool cost, refund rate, and source of paid acquisition.

## Multi-agent system: use the useful part of Yegge's playbook

Steve Yegge's Gas Town framing is valuable as an engineering pattern, not as a consumer feature. It uses durable, small work units, an orchestrating Mayor role, ephemeral workers, explicit dependencies, and persistence across sessions.

Map that pattern to Marrymap:

| Gas Town concept | Marrymap concept | Authority |
| --- | --- | --- |
| Mayor | Wedding orchestrator | Creates a bounded work graph; no external writes |
| Rig | One wedding workspace | Strict tenant and wedding data boundary |
| Bead | Immutable work item | Input snapshot, expected schema, dependencies, lease, status |
| Polecat | Short-lived specialist run | Read-only or proposal-only |
| Hook / mail | Durable artifact and event stream | Handoffs survive model session failure |
| Convoy | One coordination goal | Example: "publish the final-week run-of-show" |

### Agent roles

- Intake extractor: converts a questionnaire, uploaded quote, or forwarded message into typed candidate facts and exact source references.
- Timeline specialist: derives an editable dependency-aware task graph and run-of-show.
- Budget specialist: normalizes approved commitments, totals categories, and proposes variance warnings. It cannot move money.
- Vendor specialist: compares only user-supplied or explicitly selected vendors and identifies non-comparable terms. It does not rank marketplace inventory.
- Communications specialist: drafts user-reviewed emails or messages from approved facts. It cannot send.
- Validator: independently checks conflicts, missing evidence, dates, amounts, scope mismatch, and changes from the prior plan. It can block publication or open remediation work only.
- Orchestrator: schedules these workers and asks for human clarification. It does not mutate the plan or call external providers.
- Policy and execution service: deterministic application code, not an LLM. It validates user scope, payload schema, approval, idempotency, and provider receipts.

### Parallelism boundaries

Parallelize only independent, read-only analysis after a canonical input snapshot is frozen:

- budget analysis
- timeline analysis
- logistics analysis
- vendor comparison / research

Cap initial concurrency at three or four runs per wedding and one run per specialist role. Run the validator after required artifacts finish. Serialize and lock:

- canonical wedding fact updates
- plan merges and version publication
- approval creation and decisions
- external messages, calendar writes, RSVP changes, payments, data sharing, and deletion

Independent weddings may run in parallel, but isolation must be enforced by database row-level policy and tool authorization, not by prompt text.

### Durable artifacts, not agent memory

Use typed immutable artifacts as the contract:

- `WeddingBrief`: canonical facts, source references, owner edits, field-level confidence.
- `WorkItem`: wedding ID, goal ID, role, immutable input snapshot, expected output schema, dependencies, lease, attempt count, and state.
- `Recommendation`: proposal, evidence, assumptions, confidence, and source PlanVersion.
- `PlanVersion`: immutable task graph, run-of-show, budget snapshot, and content hash.
- `ActionProposal`: exact side-effect payload, risk level, required scopes, payload hash, and idempotency key.
- `Approval`: user decision bound to the wedding, canonical payload hash, actor, and expiry.
- `ExecutionReceipt`: provider response, timestamps, status, retry chain, and request ID.
- `RunTrace`: model, prompt/template version, tool calls, costs, latency, source artifact IDs, and policy outcome.

A change to recipient, amount, timing, or message body invalidates an existing approval.

## Safety and privacy controls

Documents, email, vendor web pages, OCR output, and tool responses are untrusted input. A reader/extractor has no action tools; privileged planning receives only typed extractions. Enforce least privilege in code, give credentials short lifetimes, and do not retain raw personal documents in broad agent traces.

Every external action needs a deterministic policy check:

1. authenticated wedding member and correct wedding scope
2. expected provider scope and allowlisted connector
3. strict input schema and recipient validation
4. exact fresh approval for the exact canonical payload
5. idempotency key and action budget / rate limit
6. provider receipt persisted before success is shown

Example idempotency key: `hash(wedding_id, action_type, canonical_payload, plan_version)`. On retry, query the provider by the original key before sending again.

The v0 product should be read-only except for user-edited local data. Later, use approval-first Gmail/Calendar writes only after a reliable evaluation set and paid pilot evidence. Bank syncing should not precede proof that manual or CSV commitments are insufficient.

## Production architecture after evidence

- UI and request APIs: Next.js and TypeScript on Vercel.
- System of record: Postgres with row-level security, immutable plan versions, audit records, and a transactional outbox. Add encrypted object storage for original files only after consent and retention policies exist.
- Async control plane: a durable workflow/queue system. Vercel serves UI and webhooks, but it should not be the system of record for long-running or wait-state agent work.
- Agent workers: role-scoped processes, each with structured output validation and no shared mutable state.
- Observability: OpenTelemetry-style trace IDs from goal to work item to model run to action receipt; dashboards for stuck leases, low confidence, validation failures, approval timeout, duplicate-action prevention, cost, and user corrections.
- Evaluation: a redacted golden set from pilot artifacts; measure extraction accuracy, source citation coverage, incorrect-risk rate, accepted draft rate, and validator catch rate before enabling any new automation.

## Phased roadmap

### Phase 0: concierge proof

Five to ten paid users. Founder manually ingests artifacts, produces a 7/14-day board and final-week plan, reviews it live, and records every correction. No integrations.

### Phase 1: read-only product

Authenticated workspace, typed WeddingBrief, source references, task board, editable plan, three workers (intake, timeline, validator), and a daily digest. No autonomous actions.

### Phase 2: controlled assistance

Add budget and logistics analysis in parallel, source-linked comparison, draft inbox, plan history/diffs, and evaluator coverage. Keep all action proposals behind approval.

### Phase 3: controlled actions

Gmail/Calendar integration only through proposal -> approval -> idempotent executor -> receipt. Add granular sharing permissions, export/delete, support escalation, and a connector kill switch.

### Phase 4: scale carefully

Mobile/offline run-of-show, multi-event support, vendors and family roles, and only then selective integrations. A marketplace is a separate product decision because it compromises neutral recommendations and creates a two-sided acquisition problem.

## Sources

- IdeaBrowser email, "Idea of the Day: DIY wedding coordinator," July 15, 2026 (private inbox source).
- YC, [YC's Essential Startup Advice](https://www.ycombinator.com/blog/ycs-essential-startup-advice).
- Paul Graham, [Do Things that Don't Scale](https://paulgraham.com/ds.html).
- Steve Yegge, [Welcome to Gas Town](https://steve-yegge.medium.com/welcome-to-gas-town-4f25ee16dd04).
- Anthropic, [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system).
- The Knot, [Wedding Planning App](https://www.theknot.com/wedding-planning-app).
- Zola, [Wedding Budget](https://www.zola.com/wedding-budget).
- OWASP, [LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html).
- Google, [Gmail API authorization scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).
- CFPB, [Personal Financial Data Rights](https://www.consumerfinance.gov/personal-financial-data-rights/).
- FTC, [Featuring Online Customer Reviews: A Guide for Platforms](https://www.ftc.gov/business-guidance/resources/featuring-online-customer-reviews-guide-platforms).
