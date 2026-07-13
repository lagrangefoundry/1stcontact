---
uid: comment-af70ec94
id: COMMENT-98
type: comment
title: Comment on request REQ-55
created_by: xgd
created_at: '2026-07-12T23:51:55.847818+00:00'
updated_at: '2026-07-13T02:18:28.160229+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-94c792c0
  kind: chat_transcript
---

<!-- xgd-turn id="f4a31ec3-ca8d-4b6f-9b3a-ee8dd38ce118-user" -->

<!-- xgd-chat role="user" ts="2026-07-12T23:51:52.772023+00:00" -->
#### You
Do you understand this ticket well enough to free code it?

<!-- xgd-turn id="f4a31ec3-ca8d-4b6f-9b3a-ee8dd38ce118-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-12T23:54:23.919971+00:00" -->
#### Claude
I'll investigate the current implementation before answering, so my answer is grounded in what's actually there.

This is a class-based implementation. Let me see how dials are validated and how widely the retired names are used across site docs.

Only two site-doc usages (`xnarrow`, `readable`). There's already a literal-or-alias validation precedent (REQ-50). Let me see that pattern and how module dials get validated against their enums.

Yes — I understand the intent and I've traced the current implementation. Here's what I found and the shape of the change, plus a few genuine decisions I'd want your call on before writing code.

## What exists today

`contentWidth` is a **class-based** dial. The value is a named token and each module has static CSS mapping the class to a container token:

```css
.text-block.content-width-narrow .text-block__inner { max-width: var(--container-narrow); }
```

- Scale lives in two places: `container` tokens in `tokens/defaults.ts` (`xnarrow 32rem · narrow 40rem · readable 48rem · default 72rem · wide 90rem · bleed 100%`) and `CONTENT_WIDTH_DIAL` in `modules/dials.ts`.
- Consumed by **text-block, hero, services-grid** (the `contentWidth`/`rowWidth` dials) and **row.ts** (`.fc-row.w-*`).
- Dial values are typed `z.record(z.string(), z.string())` in `schema.ts` — catalog/enum membership isn't strictly validated; an unknown value silently falls through to the frame width.
- Only **two site-doc usages** to migrate: one `xnarrow`, one `readable`.

## The core architectural consequence

The **literal escape hatch can't stay class-based** — you can't predeclare a class for arbitrary `896`/`"56rem"`. So the dial has to resolve at render time to an actual length emitted as an inline `max-width` (or a per-instance `--content-width` custom property), replacing the static per-name CSS rules. Named steps resolve through a Tailwind map; literals pass through (number → `px`, rem-string → as-is). This mirrors the REQ-50 literal-or-alias pattern already in `validate.ts`, so there's a clear precedent to follow.

## Three decisions I'd want from you

1. **Numeric literal `896`.** The ticket shows a bare number, but `dials` is typed string→string, so a numeric dial value is currently rejected. Supporting `896` means relaxing the dial-value type to `string | number` **globally** (all dials). Fine to do — or do you want literals as **strings only** (`"896"`, `"56rem"`) to keep the schema tight? I lean string-only unless you want the bare-number ergonomics.

2. **The dial default / "fill the frame".** Old `default` (and absence) meant *no cap → fill the band*. The new named set has no `default`; `bleed` (100%) is the natural replacement. I'd make **absent/`bleed` = fill the frame**. Good?

3. **The other `--container-*` consumers.** `header`, `footer`, `contact-form` reference `--container-default` (72rem) and `--container-narrow` (40rem) directly for fixed layout max-widths — not through the dial. Renaming the token set breaks them. `40rem`/640px also has no exact Tailwind step (nearest are `xl` 576 / `2xl` 672). I'd repoint those to the nearest new token (or a literal) — just flagging that the blast radius is slightly wider than the dial itself.

My default plan, pending your answers: string-only literals, `bleed`=default, repoint the fixed consumers to nearest steps. Story points ~3. Want me to proceed on those defaults, or adjust 1–3 first?

<!-- xgd-turn id="80268600-1297-4452-a7ae-4884583c67bc-user" -->

<!-- xgd-chat role="user" ts="2026-07-13T01:55:42.622561+00:00" -->
#### You
1. the key is to match what comes out of the render values. Unless there are ambiguities abouyt units I'm fine with numbers or strings if thats what we get out
   2 ok
   3. ok
   
   If we are aligned go ahhead and implement

<!-- xgd-turn id="80268600-1297-4452-a7ae-4884583c67bc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T02:18:28.134402+00:00" -->
#### Claude
Aligned. Support numeric px literals (matching render values) + rem strings, `bleed`=default, repoint fixed consumers. Let me read the ticket first to preserve its body, then implement.

Ticket is clear with explicit UATs. Let me read the full CSS blocks in the three consuming modules and row.ts so I preserve their exact selector behavior.

`rowWidth` shares the same dial and flows through `composeRow` as `w-*` classes. Let me check the token→CSS-variable generator and the two site docs, then design a shared resolver.

I now have the full picture. Let me find every `--container-*` reference across the framework so I repoint them all, and check whether any site theme declares a `container` override (vs. just the dials).

Now I'll check whether these module `<section>` elements already carry a `style` attribute, so I add the custom property cleanly.

No existing `style` attr — clean to add. Now let me find how UAT tests render modules and assert widths, so I follow the existing pattern.

The refactor changes rendered output that existing tests assert. Let me find every test touching the retired class/names.

This is a wider blast radius than first flagged: the class-based mechanism is asserted by UATs across REQ-36/45/49/52 plus token tests. That's expected under "no legacy" — the capability stays, its expression changes, so those mechanism-level UATs get rewritten. Let me confirm the test runner is available locally without installing, then implement.

Good — vitest is available locally and revisions have no dial usages (only theme container blocks). Let me set up task tracking and implement.

Now the framework core. Starting with `defaults.ts` container tokens:

Now `schema.ts` — container schema keys + dials value type:

Now `dials.ts` — the scale + resolver:

Task 1 core done. Now the modules. Let me check hero's imports and frontmatter, then refactor hero, text-block, services-grid.

Now refactor hero. Add import, replace frontmatter, class, add style, update CSS:

Hero done. Now text-block:

Now text-block CSS — base default→6xl, and the panel + child-cap rules:

Now services-grid:

Now row.ts:

Now header/footer/contact-form fixed widths. Let me view and repoint them:

Let me verify no stale `--container-` refs remain and fix the render.ts cast:

Now site-doc migration. First check whether the theme's `container` field is required (affects whether I can drop the blocks):

`container` is required with `bleed` mandatory, so I'll migrate each block to `{"bleed": "100%"}` (defaults now cover the rest). First the gigabytealchemy dial values:

Now the container theme blocks in the 5 site.json files:

Let me verify all retired names are gone from site docs, and check the framework-tokens test's container assertions:

Site docs clean. Now the biggest task — updating the existing UATs across the other tickets to the new mechanism, and adding REQ-55 UATs. Let me read all affected test regions.

Now req36-heading-treatment. Let me read the affected regions:

Now req52-hero-positioning:

Now req49-fidelity-primitives:

Now the req45 tests (lines 80-124):

Let me add the REQ-55 test file. First, find the gigabytealchemy "Most apps" block referenced by the ticket:

The "Most apps" block (`different-approach`) has no `contentWidth`. Per the ticket, set it to `4xl` (896px):

Now let me check how a test reads site docs from storage, then write the REQ-55 test file:

Now I'll write the REQ-55 test file:

Now let me run the affected tests plus the new file:

Two fixes: the ROW_CSS comment has backticks inside a template literal, and there's a second declCount assertion. Fixing both:

All 7 files pass. Now the full suite to catch anything else (conformance/site-fidelity that renders these sites):

Some tests validate against `@1stcontact/site-schema` — which is consumed as a built package, not source. My schema change needs the package rebuilt. Let me confirm and check the build setup:

`@1stcontact/site-schema` is consumed as built `dist`, so my schema source change isn't live. Rebuild it directly with tsc (a compile, not an install):

site-schema rebuilt. Re-run the full suite:

All 559 pass. Let me check git status — including whether the rebuilt `dist` is tracked (and whether framework has a consumed dist):

dist is gitignored (rebuilt by CI); framework is consumed as source. Let me run typechecks to catch anything the transform-based test run skipped:

All green. Now the free-coding finalization. Let me check the version bump script and current ticket state:

The script is implemented. Let me bump the version, then review the full diff before committing:

The diff is coherent. The `faelan/*` deletions predate this session — I'll stage only my REQ-55 files. Let me stage and commit:

Committed `46db8574`. Let me verify the version-bump check passes and see the free-coded gate command:

Let me update the ticket body (preserving the original) with implementation notes, then run the gate:

`--append-body` preserves the existing body. Let me append implementation notes:

Now the free-coded gate (sets status + records the commit):

All done. Let me close out the task list:

REQ-55 is implemented, tested, committed, and free-coded.

## What I did

**The scale + escape hatch (the ticket's core):**
- Replaced the idiosyncratic `xnarrow/narrow/readable/default/wide` container scale with Tailwind's `max-w` steps — `sm md lg xl 2xl 3xl 4xl 5xl 6xl 7xl` + `bleed` — so real sites land on a named step. The missing **896px (`4xl`)** step that motivated the ticket now exists.
- Added the literal escape hatch: `resolveContainerWidth()` accepts a **`px` number** (matching captured render values, per your point 1), a CSS length string (`"56rem"`), or a named step. The schema now allows a dial value to be `string | number`.

**The mechanism change (the part I'd flagged):** the literal can't be a predeclared CSS class, so the class-based `content-width-<name>` approach was replaced by a single path — an inline `--fc-content-width` / `--fc-row-width` custom property + a `has-content-width` marker — across hero, text-block, services-grid, and row. Fixed layout widths were repointed (`--container-default`→`6xl`; contact-form's off-scale 640px → literal `40rem`).

**Migration:** gigabytealchemy's home sets `4xl` on the 896px "Most apps" block and `md`/`3xl` elsewhere; all container theme override blocks reduced to `{"bleed":"100%"}` (defaults cover the rest). No site doc references a retired name.

**Tests:** rewrote the REQ-36/45/49/52 + token UATs that asserted the old mechanism (capability preserved, expression changed) and added `tests/req55-content-width.test.ts` with the four ticket UATs. **Full suite: 559 passing.** Typechecks clean.

## Notes worth your attention
- **`@1stcontact/site-schema` is consumed as built `dist` (gitignored).** The schema change only takes effect after a rebuild — CI/deploy will rebuild, but I had to `tsc` it locally for the validation-path tests to pass. I recorded this on the ticket.
- Commit `46db8574` `[FREE-CODED]`, version bumped to `0.0.98`, ticket REQ-55 → `free_coded` with the commit recorded.

One thing I decided without asking: I set the gigabytealchemy `different-approach` ("Most apps") block to `4xl` — the ticket named it explicitly as the 896px target, but if the reference is actually a different block, point me at it and I'll move the dial.

<!-- xgd-chat-end -->