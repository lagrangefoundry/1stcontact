---
uid: request-a03967f2
id: REQ-152
type: request
title: Money and time representation, and the render-determinism resolution
created_by: xgd
created_at: '2026-08-20T21:59:25.587137+00:00'
updated_at: '2026-08-31T14:22:29.127505+00:00'
completed_at: '2026-08-31T14:22:29.127505+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 2
  depends_on:
  - REQ-151
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 2d6bc790979aa2ab850dbda1ef748b7b222cd2e3
    reconcile_sha: null
    main_sha: null
  version: 0.2.4
  chat_comment: comment-869ded75
  bundled_in: bundle-b3b7c399
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

The codebase was already **correct** on time: every timestamp is `toISOString()`. This REQ
is about keeping it that way when a module starts handling *user-meaningful* time rather
than system timestamps.

**And there was a conflict that had to be resolved before the calendar module is authored.**
`packages/framework/src/buildInfo.ts` stated that *"modules must never call `new Date()`
at render time"*, because a page rendered twice from the same source must be byte-identical.
A calendar renders **time-varying availability**. Both could not hold as written.

The failure mode if left undecided is nasty and silent: a published **immutable** snapshot
with *"next available: 3 September"* baked into its HTML is wrong the following day and
**cannot self-heal**, because a revision is by definition not re-rendered.

## What changed

### 1 — The shared formatting seam: `packages/framework/src/intl.ts`

Exported from the framework barrel. Two functions, no more — a module that formats money or
a date reads `props.locale` (REQ-151) and calls these rather than inventing an answer.

```ts
formatMoney(amountMinor: number, currency: string, locale: string, options?): string
formatDateTime(instant: string, timeZone: string, locale: string, options?): string
```

Both delegate wholly to ICU. Nothing hand-rolls a symbol, a separator or a date order.

### 2 — Money is `{ amountMinor: integer, currency: ISO 4217 }`

- The divisor comes from **ICU's minor-unit count for the currency**, never a literal
  `/100`. JPY has 0 and KWD has 3, so a hardcoded scale undercharges one by a hundredfold
  and overcharges the other by a thousand.
- The decimal is built by **string arithmetic**, not division: `9007199254740991 / 100`
  formats as `…409.90`, dropping a cent, and `Intl.NumberFormat` (V3) parses a decimal
  string exactly. A shown price is a legal claim, so exactness is not optional.
- A **non-integer amount throws**, and a **currency that is not ISO 4217-shaped throws** —
  the two string arguments are transposable, and a swap would otherwise render something
  plausible-looking.

### 3 — Time is an instant plus an IANA zone id

- A **zone-less wall-clock string is refused**. Accepting it would silently reinterpret it
  as whichever zone the build host happened to be in — a property of the machine, baked
  into an immutable snapshot. Only `Z` or an explicit numeric offset is admitted.
- An **unknown IANA id is refused** (`Europe/Dubland`), rather than allowed to produce an
  opaque `RangeError` from inside ICU.
- `timeZoneName` is passed through, so the calendar module can meet DOC-34 §8.2's
  obligation to surface the zone wherever a cross-zone booking is possible.

### 4 — The determinism conflict, resolved and recorded

Adopted the resolution the ticket proposed:

> **Render output stays byte-deterministic. Time-varying content is rendered on the client
> or fetched at request time, and is NEVER derived from the render clock.**

The prohibition on reading the clock at render time therefore **stands exactly as it was**;
what changed is that showing a date is no longer mistaken for breaking it. Two sanctioned
shapes: an instant known at author time is data on the definition and formatted through the
seam; content that depends on *now* is emitted as a **mount point plus data** for the client
to resolve.

`formatDateTime` has **no clock-reading overload** — the rule expressed as an API rather
than as something to remember. Recorded in **DOC-34 §8.4** (new), in `intl.ts`'s header,
and `buildInfo.ts` now points at both rather than implying no module may ever show a date.

### 5 — Obligations on the two unwritten modules

DOC-34 §8.1/§8.2 and DOC-25 §11 already carried these; both were updated to name the seam
that now exists, so the next author finds the implementation rather than the principle.

## Design decisions made during implementation

- **Two functions, not four.** A `formatSiteMoney(amount, resolvedLocale)` convenience pair
  was written and then removed: it would have created two ways to format money, against the
  project's simplicity mandate. The transposition risk it existed to remove is handled
  instead by the ISO-4217 guard, which throws.
- **Recorded as DOC-34 §8.4, not inside §8.2.** The ticket said "§8.2", but §8.2 is the
  calendar module's obligations and the determinism rule binds every module. §8.2 now points
  at §8.4.
- **`formatDateTime` accepts an explicit offset, not only `Z`.** DOC-34 §7's "never a fixed
  offset" rule governs *storage of future local events* — a calendar-config concern. At a
  formatting boundary the distinction that matters is ambiguous vs unambiguous, and an
  explicit offset is unambiguous. A zone-less string is what gets refused.
- **`NumberFormatV3` declared locally.** The project's `lib` is pinned at ES2022 and the
  string-accepting `format` overload arrived in ES2023. Both hosts (Node 22, workerd)
  implement it; only the type declaration is behind. Widening the whole project's lib to
  reach one overload is a much larger claim than this needed.

## Test plan

`tests/test_UAT_FC_REQ-152_intl_seam.test.ts` — 15 UATs, all green.

| AC | Covered by |
|---|---|
| 1 — same amount, two locales | `€49.99` (en-IE) vs `49,99 €` (de-DE); plus two currencies in one locale, proving the symbol comes from the currency argument |
| 2 — 0- and 3-minor-unit currencies | JPY `￥4,999`, KWD `4.999`, ISK; plus exactness beyond float precision, non-integer refusal, transposed-argument refusal, negative amounts |
| 3 — DST divergence | Dublin↔New York across 20 Oct / 28 Oct / 5 Nov 2026 — **five hours apart, then four, then five again**, because the EU leaves DST on 25 Oct and the US on 1 Nov. Plus zone-abbreviation output, wall-clock refusal, unknown-zone refusal |
| 4 — byte-identical renders | The same page rendered twice through **both** renderers and compared file by file; **plus a structural check** that no source on the framework's render path contains a zero-arg `new Date()` or `Date.now()` — determinism as mechanism rather than discipline |
| 5 — resolution recorded | `buildInfo.ts` references DOC-34 §8.4 and `intl.ts`; `intl.ts` carries the rule verbatim |

All instants in the DST tests are fixed literals, so the suite asserts the same thing in
July as in October.

**Regression scope run**: full node suite (938 tests) plus the workerd behavior suite.
Three files fail — `reconciliation-colour-census-and-retrofit`,
`reconciliation-colour-retrofit-shade-model`, `test_UAT_FC_REQ-150_plain_vite_bootstrap` —
and **all three fail identically on clean `xgd-working`**, verified by running them there.
Pre-existing and unrelated to this change. Framework typecheck is clean.

## Why free-coded

The code deliverable is small (one formatting seam); the value is that it exists *before*
payments and calendar are authored, so neither has to invent its own answer.

## Origin

[[CHAT-26]] · [[DOC-34]] §6–§8 · [[DOC-25]] §11 — FR-3 and FR-4 of that session's
foundational review. The determinism conflict was found against
`packages/framework/src/buildInfo.ts` after [[DOC-34]] was written, and is now reflected
there as §8.4.