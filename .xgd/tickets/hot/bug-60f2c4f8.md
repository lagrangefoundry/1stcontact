---
uid: bug-60f2c4f8
id: BUG-172
type: bug
title: 'capture_site: entry page refused for exceeding the 32 MiB budget before any
  page has been captured'
created_by: xgd
created_at: '2026-10-02T00:11:17.651238+00:00'
updated_at: '2026-10-02T00:11:17.651238+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What I was doing

First call to `capture_site` in a fresh session, against a public `https://` origin (a small single-page marketing site). No prior capture had been made in this session — `list_references` returned an empty list immediately before the call.

## What I expected

A capture to be created, or — if the target genuinely exceeds the byte budget — a refusal that reflects work actually done, i.e. after the entry document had been fetched and some subresources had been mirrored.

## What happened

```
REFUSED: the page itself was refused, so there is no capture to adopt —
https://<target>/: the capture had already delivered more than 33554432 bytes
when this page was requested, so it was refused; the capture is incomplete.
(1 subresource refusals besides)
```

No reference was created. The exact address is in the refusal record the capture subsystem keeps.

## Why this looks wrong rather than just unlucky

The message asserts that **more than 33,554,432 bytes had already been delivered at the moment the entry page was requested**. At that point the capture had requested nothing else: this was its first page, in a store with zero existing references. So either

1. the byte accounting is not reset per capture run (a counter carried over from a previous run, another tenant's run, or a process-lifetime accumulator), or
2. the entry page is being charged the cost of its own subresources *before* it is fetched — note the trailing "(1 subresource refusals besides)", which implies subresource fetching was attempted and also refused, so ordering/accounting between document and subresources may be inverted, or
3. the budget is being compared against the wrong quantity entirely (e.g. an uncompressed or content-length-declared size rather than bytes delivered).

In all three cases the user-visible outcome is the same and is the real defect: **an origin that cannot be captured at all, with a message that attributes the failure to work the capture had not yet done.** There is no way to proceed from here — no partial reference is adopted, so there is nothing to inspect to find out which asset was large.

## Reproduction

1. Fresh session, `list_references` → `{ "references": [] }`.
2. `capture_site` with the target address → refusal above.
3. Retry with the `www.` host variant → identical refusal, and the message reports the apex host, so the normalisation happened but the outcome did not change.

## What would make this actionable from my side

- The refusal naming **which resource** blew the budget and **how many bytes had been counted**, rather than only that the limit was passed. Right now I cannot tell a genuinely 32 MiB page from an accounting fault, and I have to tell the user "I can't capture your site" with no explanation.
- Adopting the **partial capture** rather than discarding it. The tool's own contract says a refusal is recorded and the capture is "incomplete" — but nothing is adopted, so "incomplete" is indistinguishable from "absent". An entry document plus whatever was mirrored before the cap would still be far more useful than nothing, and `describe_reference` already exists to report that a capture is incomplete.
- A way to capture **without subresource mirroring**, for exactly this case: a page whose imagery is too heavy to mirror but whose structure, colour and type I still want to read.

## Severity

High for the workflow it blocks. Capture is the entry point to reproducing an existing site, and a site that refuses to capture cannot be reproduced at all — there is no degraded path and no retry that changes the outcome.
