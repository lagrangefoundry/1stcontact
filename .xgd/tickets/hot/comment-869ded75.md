---
uid: comment-869ded75
id: COMMENT-1433
type: comment
title: Comment on request REQ-152
created_by: xgd
created_at: '2026-08-22T21:55:47.688270+00:00'
updated_at: '2026-08-22T22:08:01.349216+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a03967f2
  kind: chat_transcript
---

<!-- xgd-turn id="fb69b3be-f413-4748-bcad-c768ddd22a37-user" -->

<!-- xgd-chat role="user" ts="2026-08-22T21:55:41.531973+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="fb69b3be-f413-4748-bcad-c768ddd22a37-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-22T22:08:01.206994+00:00" -->
#### Claude
I'll start by reading the ticket to see what's being asked.

The ticket is fully specified. Let me investigate the relevant code before asking anything.

Now let me set up the ticket state and cut a branch.

Now writing the formatting seam.

Now wire the export and update `buildInfo.ts` to point at the resolution.

Now the UATs.

Now running the full node suite as the regression scope.

Suite is running. Meanwhile, updating the docs.

Now DOC-25 §11, to point at the seam that now exists.

Bumping the version while those run.

Workerd side is clean. Committing.

Fast-forwarded cleanly. Now promoting the ticket and updating the body.

Now updating the ticket body to match what was actually built.

Done. REQ-152 is at `free_coded` on `xgd-working` at `2d6bc79`, version 0.2.4.

**No blocking questions arose** — the ticket specified the API, and the one genuinely open item (the determinism resolution) came with a written proposal, which I adopted as stated. Flagging it explicitly since it's the piece that constrains how the calendar module gets built:

> Render output stays byte-deterministic. Time-varying content is client-rendered or fetched at request time, and is never derived from the render clock.

The prohibition in `buildInfo.ts` is unchanged — what changed is that *showing a date* is no longer mistaken for breaking it. `formatDateTime` has no clock-reading overload, so it's the rule as an API rather than as something to remember.

**What landed** — `packages/framework/src/intl.ts`, exported from the barrel:

- `formatMoney(amountMinor, currency, locale)` — the divisor comes from ICU's minor-unit count for the currency, so there is no `/100` anywhere (JPY 0, KWD 3). The decimal is built by string arithmetic, not division, because `9007199254740991 / 100` drops a cent and a shown price is a legal claim. Non-integer amounts and non-ISO-4217 currencies throw, so a transposed argument fails loudly instead of rendering something plausible.
- `formatDateTime(instant, timeZone, locale, opts)` — refuses a zone-less wall-clock string (accepting it would reinterpret it as the build host's zone, baked into an immutable snapshot) and refuses an unknown IANA id.

**Three decisions worth your eye:**

1. I wrote `formatSiteMoney`/`formatSiteDateTime` convenience wrappers taking `ResolvedLocale`, then **deleted them** — two ways to format money is against the simplicity mandate. The transposition risk they existed to remove is instead handled by the ISO-4217 guard.
2. Recorded as **DOC-34 §8.4**, not §8.2 as the ticket said — §8.2 is calendar-specific and this rule binds every module. §8.2 now points at it. DOC-25 §11 and DOC-34 §8.1/§8.2 were also updated to name the seam.
3. `formatDateTime` accepts an explicit offset, not only `Z`. "Never a fixed offset" governs *storage of future local events*; at a formatting boundary the distinction that matters is ambiguous vs unambiguous.

**Tests** — 15 UATs, all green. The DST case pins Dublin↔New York on 20 Oct / 28 Oct / 5 Nov 2026: five hours apart, then **four**, then five again, because the EU leaves DST on 25 Oct and the US on 1 Nov. AC-4 is asserted twice over — the same page rendered twice through both renderers and compared file by file, plus a structural check that no framework render source contains a zero-arg `new Date()` or `Date.now()`, so a future module reaching for the clock fails here rather than shipping.

**Regression** — full node suite (938 tests) plus the workerd behavior suite. Three files fail: `reconciliation-colour-census-and-retrofit`, `reconciliation-colour-retrofit-shade-model`, `test_UAT_FC_REQ-150_plain_vite_bootstrap`. **All three fail identically on clean `xgd-working`** — I ran them there to confirm. Pre-existing, unrelated. Framework typecheck clean.

<!-- xgd-chat-end -->