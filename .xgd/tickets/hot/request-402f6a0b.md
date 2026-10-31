---
uid: request-402f6a0b
id: REQ-489
type: request
title: 'Spend: cap a business''s total cost ($100 in beta)'
created_by: EPIC-20
created_at: '2026-10-30T00:20:04.621747+00:00'
updated_at: '2026-10-30T17:53:33.477501+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-882549a5
  commits:
  - working_sha: 286502f6be7f661832c8e3c25741cf30a3badddf
    reconcile_sha: null
    main_sha: null
  - working_sha: 00419fc6bf8cd6669cda7d2201c47b8439c5d20e
    reconcile_sha: null
    main_sha: null
  version: 0.2.708
  story_points: 5
---

## What the operator sees and gets

A ceiling on the **total** amount any one business (tenant) can cost the platform, across its whole lifetime (not per month). For the beta it is **$100**. It exists so a beta client cannot run up an unbounded bill, however they use the product.

- **What counts:** every metered cost attributed to the business — consultant turns, delegated builder requests, review/critic requests, web search, and paid media (image generation, video clips). That is: the business's settled cost in `turn_spend` (including media rows and `attributed` builder spend). The cap is the same number the operator console shows as the business's total, so the two can never disagree.
- **Configured, not hardcoded:** one platform-wide default (`100` USD in beta), held in configuration. **Every business has the cap, including the platform's own** (site-1stcontact) — there is no built-in exemption.
- **Per-business override in the Operator Console:** the operator can change the limit for any one business from that business's panel in the Operator Console (REQ-297/298 — the selected business on the right, beside its cost). The override is stored per business, takes effect on the next check (a capped business can start work again as soon as its limit is raised above its total), and clearing it returns the business to the default. Only the console's operator gate (`ownsPlatformBusiness`) can set it.
- **Enforced before paid work starts, not after:** checked when a consultant turn starts and before each paid media call (image, clip). A turn already running is allowed to finish, so the overshoot is bounded by one turn, not cut mid-tool-call. The check reads a running per-tenant total (`counters`, `(tenant_id, type, value)`), not a scan of the month's rows — "rows for truth, counters for speed" (EPIC-20, *Caps — discussed, not built*).
- **At the limit — hard stop, no warning beforehand:** the business's AI work stops — no new consultant turn, no paid media. The site itself, its published pages, forms and leads are unaffected; the cap stops spending, not the business.
- **What the client is told:** never a price or a dollar figure (no costs to clients — the client pays the operator, the operator pays providers). The message says the assistant has reached its beta allowance and the GenDev Labs team has been told. It is a host message, not something the model composes.
- **The operator is told (at the cap, not before):** the business is flagged in the Operator Console as capped (with its total and its limit), and reaching the cap creates an internal event so it is not discovered by a client complaint.
- **No warning on the way:** nothing is shown or sent before the cap is reached — no gauge to the consultant, no threshold event to the operator. The first signal anyone gets is the stop itself.

## Why free-coded

A bounded control over existing meter data, needed before beta opens; the meter (REQ-292), the report (REQ-293) and the console (REQ-297/298) already exist.

## Decisions (operator, 2026-10-29)

1. **Lifetime** total, not monthly.
2. **Hard stop** at the cap — no degraded mode, and **no warning** beforehand.
3. **No** warning threshold (no 80% event).
4. The platform's own business is **not exempt**; instead the Operator Console has a **per-business override** of the limit.

## Test plan

UATs `test_UAT_FC_REQ-489_*` (workers pool, metered fixtures):
- A business whose recorded total is at/over the cap cannot start a consultant turn; the client sees the allowance message, which contains no price/currency.
- A paid media call (image, clip) is refused once the cap is reached; under it, it proceeds.
- A turn that crosses the cap mid-run completes; the next one is refused.
- The counter total equals the console's total for the same business (turn + attributed + media rows).
- Setting a business's limit in the Operator Console changes the cap for that business only; a capped business whose limit is raised above its total can start a turn again; clearing the override returns it to the $100 default.
- The override cannot be set without the console's operator gate.
- The platform's own business is capped like any other.
- Below the cap nothing about spend reaches the consultant's context, and no event is recorded.
- Reaching the cap records an internal event and flags the business in the operator console.
## As built (2026-10-30)

- **Running total** — `counters (tenant_id, 'spend_micros', value)`, settled by `apps/control-app/src/spend-cap.ts` (`settleSpend`) after every meter write that can move it: a turn's close, a builder's request rows (they may land after the delegating turn closed), and every media spend row. It is **recomputed** from the meter's own `tenantSpendTotal` over the business's whole record (turns + listed and lost builders + media), not incremented, so it equals the console's total by construction. The chat host's meter is `spendMeter` (wraps `d1TurnMeter`); media spend goes through `recordSpend`.
- **Default limit** — `SPEND_CAP_USD = "100"` in `wrangler.toml` (top level, `env.dev`, `env.production`). An absent or unreadable value falls back to `DEFAULT_SPEND_CAP_USD = 100`, so a missing variable never lifts the cap.
- **Per-business override** — new table `business_spend_caps (business_id, limit_micros, updated_at)` (migration `0037`). Clearing deletes the row. Route `GET /api/admin/spend/caps` (every business with a total or an override, plus `defaultMicros`) and `PUT /api/admin/spend/caps` `{business, limitUsd}` (`null` = back to the default); both behind `ownsPlatformBusiness`, 404 otherwise.
- **Turn gate** — `POST /api/ai/prompt` refuses with **402** and `{error: SPEND_CAP_MESSAGE}` before the ledger/turn opens, so the panel paints the host sentence as the reply. A held round (`continue` cue — the rest of a message already running) is let through: a running turn finishes. Cues on a capped business are refused (the panel treats that as silence).
- **Client message** — "I've reached my beta allowance, so I can't take on any more work for now. The GenDev Labs team has been told. Your site, its forms and your leads keep working as before." No figure, no currency.
- **Media gate and metering** — clips: checked in `videogen.ts`'s gated backend before the per-site clip count, refused as `budget_exhausted`. Pictures (`create_image` / `edit_image`): checked at the toolbox's one provider call (`_draw`), refused as `budget_exhausted`, the provider never reached. **Picture spend is now metered too** — each draw's `estimatedCost` is written as a `media` row like a clip's (it was not recorded before), so it counts toward the total. Shared conversion `usdMicros` in `spend.ts`.
- **At the cap** — the settle that takes the total from below the limit to at/over it writes one `log_records` row (`kind=app`, `level=warn`, `event=spend.cap_reached`, `business`, data: total, limit, overridden) and a matching Workers log line. Spend past the limit does not record a second event.
- **Operator Console** — a new **Spend limit** section in the selected business's pane (after *Business cost*): whole-life total, the limit with "(default)" or "(set for this business)", a red *Capped* line when reached, a dollar field with *Set limit*, and *Use the default* when overridden. The site list flags a capped business with a red *Capped* badge beside its cost.
- **Below the cap** nothing about spend is added to the consultant's context and nothing is recorded beyond the counter.

UATs: `tests/test_UAT_FC_REQ-489_spend_cap.workers.test.ts` (route, meter, media, admin gate) and `tests/test_UAT_FC_REQ-489_console_spend_limit.test.ts` (console section and list flag, jsdom).