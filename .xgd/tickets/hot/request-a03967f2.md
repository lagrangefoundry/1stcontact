---
uid: request-a03967f2
id: REQ-152
type: request
title: Money and time representation, and the render-determinism resolution
created_by: xgd
created_at: '2026-08-20T21:59:25.587137+00:00'
updated_at: '2026-08-20T21:59:44.575475+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: medium
  story_points: 2
  depends_on:
  - REQ-151
  auto_merge_back: true
  needs_review: false
---

# Money and time representation: the constraints, and the render-determinism resolution

## Why

Two capabilities are coming that do not exist yet — **payments** and **calendar** — and
both have a representation decision whose wrong answer is *unrecoverable* rather than
merely expensive.

**Money.** If prices land in storage as display strings (`"€49.99"`) or floats, converting
later means lossy parsing across live sites, with no clean inverse. Worse, if the displayed
price and the charged price are authored independently they can drift — and a shown price
that differs from the charged price is a **legal** exposure, not a cosmetic bug.

**Time.** If a booking is stored as a local wall-clock string, it is unrecoverable: you
cannot re-interpret history without knowing which zone was meant. If it is stored as a
fixed offset (`+00:00`), it breaks across DST — and the EU and US transition on *different
dates*, so a booking made in October for a November slot silently shifts by an hour.

The codebase is currently **correct** on time: every timestamp is `toISOString()`
(`deploy.ts:190`, `commands.ts:173`, `capture/pipeline.ts:196`, `store/journal-model.ts:124`,
`store/d1r2-store.ts`). This REQ is about keeping it that way when a module starts handling
*user-meaningful* time rather than system timestamps.

**And there is a conflict that must be resolved before the calendar module is authored.**
`packages/framework/src/buildInfo.ts:1-8` states that *"modules must never call `new Date()`
at render time"*, because a page rendered twice from the same source must be byte-identical.
A calendar renders **time-varying availability**. Both cannot hold as written.

The failure mode if this is left undecided is nasty and silent: a published **immutable**
snapshot with *"next available: 3 September"* baked into its HTML is wrong the following
day and **cannot self-heal**, because a revision is by definition not re-rendered.

## What to change

**1 — A shared formatting seam** (suggested `packages/framework/src/intl.ts`; exact path is
an implementation call), so there is one obviously-correct way to do this the moment
payments or calendar lands:

- `formatMoney(amountMinor: number, currency: string, locale: string): string`
- `formatDateTime(instant: string, timeZone: string, locale: string, opts): string`

Both delegate to `Intl.NumberFormat` / `Intl.DateTimeFormat`. Neither hand-rolls a symbol,
a separator or a date order.

**2 — Money is `{ amountMinor: integer, currency: ISO-4217 }`.** Never a float, never a
display string as the source of truth. **Minor units are not always 2** — JPY has 0, KWD has
3 — so the currency must be passed to `Intl` rather than the amount divided by 100 anywhere.

**3 — Time is an instant plus an IANA zone id.** UTC instant for the moment; `Europe/Dublin`
for the zone. Never a wall-clock string, never a fixed offset.

**4 — Resolve the determinism conflict, and record the resolution.** Proposed: *render
output stays byte-deterministic; time-varying content is client-rendered or fetched at
request time, and is never derived from the render clock.* Under that rule a calendar
module emits a mount point plus data, not a baked date. This needs deciding explicitly
because it constrains how the module is built — and once decided it belongs in both
[[DOC-34]] §8.2 (which currently covers formatting and storage but **not** this tension)
and the `buildInfo.ts` comment, which should point at the rule rather than implying no
module may ever show a date.

**5 — Record the obligations these place on the two unwritten modules**, per [[DOC-34]] §8
and [[DOC-25]] §11:

- *payments* — charged amount is `config`; displayed amount **derives** from it, so shown
  and charged are equal by construction. Declares its VAT-display obligation per `country`
  (EU/UK consumer prices must be VAT-inclusive — Price Indication Directive 98/6/EC; UK
  Price Marking Order).
- *calendar* — never emits a hand-formatted date/time string; surfaces the zone
  abbreviation wherever a cross-zone booking is possible.

## Acceptance criteria (provisional)

1. `formatMoney` renders `€49.99` for `(4999, 'EUR', 'en-IE')` and `49,99 €` for
   `(4999, 'EUR', 'de-DE')` — same amount, same currency, different locale.
2. `formatMoney` is correct for a **0-minor-unit** currency (JPY) and a **3-minor-unit**
   currency (KWD) — proving no `/100` is hardcoded anywhere.
3. `formatDateTime` renders the same instant differently for `Europe/Dublin` and
   `America/New_York`, and is correct **across a DST boundary** where the EU and US
   transition dates differ.
4. Rendering the same page twice produces byte-identical output — the determinism rule in
   `buildInfo.ts` still holds after this REQ.
5. The determinism resolution is recorded in [[DOC-34]] §8.2 and referenced from
   `buildInfo.ts`.

## Test approach

UATs named `test_UAT_FC_REQ-152_*` covering AC 1–4, with the DST case using explicit fixed
instants (no reliance on the ambient clock — see AC 4). Regression scope is the framework
render suite.

## Why free-coded

The code deliverable is small (one formatting seam); the value is that it exists *before*
payments and calendar are authored, so neither has to invent its own answer.

## Origin

[[CHAT-26]] · [[DOC-34]] §6–§8 · [[DOC-25]] §11 — FR-3 and FR-4 of that session's
foundational review. The determinism conflict was found against
`packages/framework/src/buildInfo.ts` after [[DOC-34]] was written, and is not yet
reflected there.
