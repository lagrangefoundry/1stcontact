---
uid: report-8421bbe1
id: REPORT-1539
type: report
title: Claude fix_reconciliation_review report
created_by: xgd
created_at: '2026-08-07T03:37:27.700651+00:00'
updated_at: '2026-08-07T03:37:27.700651+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-15c1f647
---

Both gaps from REPORT-1538 (`report-78435e9e`) are addressed. I independently verified the review's root-cause claim before restating anything:

```
"/../../../../../../etc/passwd" -> /tmp/root/etc/passwd inside= true
"/%2e%2e/%2e%2e/etc/passwd"     -> /tmp/root/etc/passwd inside= true
"/..%2f..%2fetc/passwd"         -> /tmp/root/etc/passwd inside= true
```

All three trees pass a **root-relative** `rel` into `resolveStaticFile` (`builder.ts:271`, `:322`, `:327`), POSIX `path.normalize` clamps leading `..` on an absolute path, so the `startsWith(rootDir)` check passes and the `'forbidden'` branch is unreachable for URL-derived paths. Confinement holds by clamping; the refusal is *not found*, not *forbidden*.

**Stories created**: none.

**Stories modified**
- `story-e674c60a` (STORY-99) — the "Confinement" bullet no longer claims a request is "refused rather than answered"; it now states the observable guarantee (never satisfied, no targeted contents, identical on every tree) and names clamping as the mechanism. Added a Technical Context entry recording that the resolver's forbidden branch is dead for URL-derived paths, that security is intact, and that detecting the escape explicitly would be a new ticket rather than a reconciliation change (review's optional item 4).
- `story-d0a8cfad` (STORY-83) — replaced the stale Technical Context sentence disclaiming container coverage. It now describes the authored fixture that `test_UAT_AC1010_*` (`tests/reconciliation-nowrap-width-floor.test.ts:305-369`) actually ships: a geometry-tracked container wrapping a floored run, plus the `.strict()` refusal of `nowrapFromPx` on a container. No AC or behaviour change.

**ACs modified**
- `acceptance_criterion-53c66f17` (AC-978) — retitled to "…is never satisfied, identically on every tree"; criterion restated to non-delivery + uniformity, explicitly declining to pin a forbidden status and explaining why; verification restated to a non-success status plus a same-status-across-trees assertion.

**Stories deleted**: none.

**Code changes**
- `tests/reconciliation-builder-workspace-origin.test.ts` — UAT renamed to `test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it`; `toBe(403)` replaced with `res.ok === false` + status ≥ 400 + the existing secret-absence assertion, and a new assertion that every probe across every tree produced the *same* status (so "no tree lacks the confinement" is observed, not asserted three times independently). The `unverified()` reason reworded from "traversal guard" to "confinement". **No change to `serve.ts` or `builder.ts`** — reconciliation is code-authoritative.

Per the mission's "do not run tests" instruction I did not execute the suite; the workflow's own run follows. Reasoning on the new assertions: all escaping probes clamp to non-existent paths inside their tree (`<distDir>/etc/passwd`, `<clientDir>/package.json` — that directory holds only the eight browser `.js`/`.css` files, `<webuiPkgDir>/etc/passwd`), so every one returns 404 and the single-distinct-status assertion holds whether or not the webui components are installed.

**Confidence**: high for Gap 1 and Gap 3 — both were narrowly scoped, the failing assertion is the only one the review flagged, and its replacement matches behaviour I verified directly rather than inferred. Gap 2 (12 ACs unproven without the out-of-band `@gendevlabs/webui-*` install) is untouched by design: the review explicitly declined to fail on it and no fix cycle can perform that install, so it will resurface as a recorded caveat in the next review rather than a FAIL.
