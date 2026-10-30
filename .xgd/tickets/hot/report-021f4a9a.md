---
uid: report-021f4a9a
id: REPORT-5612
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T20:40:36.492685+00:00'
updated_at: '2026-09-29T20:40:36.492685+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `packages/framework/src/l1/render.ts` — class **UU**, rule **2c** (UU on code
  files: non-overlapping changes keep BOTH). One conflict region only
  (6 lines at the `case 'text':` template literal); the commit's other two
  hunks into this file auto-merged.

Picked commit: `df9862ce77203dac7d95e47cf07db2f2908e36d3` (2026-09-10 10:19:17
-0700) — *feat(l1): one string of page copy can vary within itself
[FREE-CODED]*. This is a genuine CODE conflict between two independent
free-coded features, not a ticket-bookkeeping conflict.

### The conflict was non-overlapping within one line

The two sides edited different parts of the same template literal:

- **Ours** (HEAD, REQ-212 — *modals in L1: the overlay role and the disclosure
  verb*) appended `${actionAttrs}` to the `<p>`'s attribute list.
- **Theirs** (incoming, REQ-211) replaced the element's content expression
  `${escapeHtml(node.text)}` with `${words}`, where
  `const words = textRunsHtml(node.text, name, state)`.

Attributes and content are disjoint positions, so both were kept. Resolved to:

```ts
const words = textRunsHtml(node.text, name, state)
html = `<${tag('p')} class="${cls}"${idAttr}${editAttrs}${linkAttrs}${actionAttrs}>${words}</${tag('p')}>`
```

The `${actionAttrs}` placement (after `linkAttrs`) matches ours' own two other
emitters that carry it, `render.ts:2495` and `:2532`, so the attribute order is
the one REQ-212 already established rather than a new choice made here.

Nothing was discarded from either side: the enrichment's fallback rule ("intent
unknown on one or both sides — take the more recent commit by timestamp and
flag for post-merge review") would have thrown away one of the two features. It
does not apply, because the HARD RULES for code files and 2c both require
integration, and the changes turned out to be positionally disjoint, so no
tie-break was needed at all.

### Identifier scope verified before writing

Both sides' identifiers resolve in the merged body of `emitNode`:

- `actionAttrs` (ours) — defined `render.ts:2272`, before the use at `:2401`.
- `name` (theirs' `nodeClass` argument) — defined `render.ts:2185`
  (`` `${state.prefix ? `${state.prefix}-` : ''}l1-${state.n++}` ``), before the
  use at `:2400`, and is the same node class name `cls` is built from at `:2212`.
  This matters for REQ-211's stated design: the run classes hang off the node's
  own class (`<nodeClass>-r<i>`) precisely so a run does NOT consume the render
  counter `state.n`.

## Incoming changes preserved

All three of the incoming commit's hunks into `render.ts` are present in the
staged blob. No hunk was dropped; the BUG-1301 precedence exception was not
invoked.

| Incoming hunk | Staged location | Status |
| --- | --- | --- |
| `L1Text` added to the `@1stcontact/site-schema` type import | `:59` | auto-merged |
| `textRunsHtml(content, nodeClass, state)` + its REQ-211 doc comment, after `segmentKind` | `:2155` | auto-merged |
| `case 'text':` emits `textRunsHtml(...)` instead of `escapeHtml(node.text)` | `:2400`–`:2401` | resolved by hand, both sides kept |

Verified against the staged index (`git show :packages/framework/src/l1/render.ts`):
`textRunsHtml` appears at its definition (`:2155`) and its call site (`:2400`),
`L1Text` at `:59`, the resolved line at `:2401` carries BOTH `${actionAttrs}`
and `${words}`, and no conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`) remains.

The commit's other 19 files applied without conflict and are staged: the
`site-schema` run schema (`l1/text.ts` new, plus `schema.ts`/`validate.ts`/
`types.ts`/`edit.ts`/`index.ts`), the capture/fold/roundtrip side
(`tools/generate/src/l1/inline-runs.ts` new, `fold.ts`, `probes.ts`,
`roundtrip.ts`, `cli/capture/*`), and both UAT suites
(`test_UAT_FC_REQ-211_multi_variate_text.test.ts`,
`test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts`) with their
`req211-inline-runs.html` fixture.

Unlike the recent `.xgd/tickets/**` picks on this branch, this resolution leaves
a **real** net change from HEAD — 20 files, +1419/−54 — so finalize should
commit it rather than skip it.

Not verified by execution: per this role's constraints the suite was not run
(the resync caretaker rule forbids `test_fix`, and workerd/wrangler suites are
unrunnable in a headless role regardless). Verification here is read-level —
hunk presence, identifier scope, and marker absence in the staged index.
