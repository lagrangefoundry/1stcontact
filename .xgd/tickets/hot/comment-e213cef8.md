---
uid: comment-e213cef8
id: COMMENT-1264
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T05:48:13.393684+00:00'
updated_at: '2026-08-20T05:48:13.393684+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5a2d2db9
  kind: note
---

All 17 findings resolved. Final report `report-5a2d2db9` filed with `needs_more_work: false`.

## This call — the three W1 browser-gated ACs

W1's warning was that a naive port would produce ACs reporting covered while contributing nothing headlessly. In one case that had **already happened**: `bug24-scrim-alpha.test.ts` defined its own `itB` as a wrapper that returned early when the capture was missing, so on a runner without Chromium those two tests reported **PASS**, not skip — a broken scrim probe would have read green. Replaced with `it.runIf`. That wasn't in the findings list.

For all three ACs I took W1's first option rather than accepting the gating, and each needed a different route:

- **AC-1310** — the two-branch rule is a *decision*, not a measurement, so supplying layout (element rects **and** `Range` rects keyed by covered text) makes it provable under jsdom. Four new UATs: split element → per-line boxes one line-height apart, single-run element → element box, same-rect elements → identical boxes, per-run line count of 1.
- **AC-1314** — mechanism (c)'s claim is about *the question the probe asks*, so supplying the `document.fonts` FontFaceSet and recording the query proves it: the shorthand carries `italic`, the real `700`, `56px`, never a bare 400, and the run's own text.
- **AC-1316** — only the modern colour syntaxes need an engine. Three new UATs cover what the probe does once a colour resolves: alpha preserved, opaque/transparent/invalid refused, and a veil that doesn't blanket the band refused.

**17 files, 139 passed, 21 skipped, 0 failed.**

## Two things I want to be straight about

**Two untouched files fail in this sandbox and I could not fix them.** `tests/capture.test.ts` and `tests/bug27-nested-backdrop-capture.test.ts` abort with `EPERM: listen 127.0.0.1` — the sandbox intermittently denies the loopback bind. Both are byte-identical to HEAD, `capture.test.ts` fails the same way run alone, and no production file was modified in any of the three calls — so this can't originate from the work. It's also why the full-suite run timed out last call: those two burn 120s each.

**One test I authored has never been executed.** `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` (call one) needs a real engine. It mirrors a passing sibling, but it should be confirmed on a runner with a browser.

Two items are forwarded rather than acted on: the possibly-dead `§`-padding classifier rule, and AC-1289's `--clusters` precedence branch, which sits behind `--multi-viewport` and remains unproven by test.
