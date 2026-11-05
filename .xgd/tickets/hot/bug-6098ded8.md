---
uid: bug-6098ded8
id: BUG-350
type: bug
title: 'Consultant: can''t see an existing site capture, so it recaptures the same
  site'
created_by: EPIC-19
created_at: '2026-11-05T00:40:13.466214+00:00'
updated_at: '2026-11-05T15:33:37.285587+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-30b52b1e
  commits:
  - working_sha: bceed017438ddcdf7f37090d6760b35a2e129d36
    reconcile_sha: null
    main_sha: null
  - working_sha: cad05585e6df836285fa77286ab9414705b98d2b
    reconcile_sha: null
    main_sha: null
  version: 0.2.778
  story_points: 3
---

## Symptom

Dev, 2026-11-05 00:33. The client asked for the shop's collection pages to be added "to match" their existing live site. The consultant searched for the earlier capture of that site with `list_library {kind: document}` and got `{"items":[],"total":0}`. A capture is a reference bundle, not a library document, and `describe_site` doesn't list references either. So it ran `capture_site` again: 12 pages, 206 assets, about 3 minutes. The result was `reference: {adopted: true, created: false, uid: reference-e0485c7c}`: the capture from 2026-11-03 17:38 had been there all along.

The client waited three extra minutes, and the capture work was repeated. `screenshot {of: {kind: reference, bundle}}` could already have shown the existing capture in seconds.

## Fix

1. **Existing captures are visible to the consultant.** `describe_site` (or a dedicated, cheap listing) shows every captured reference for the site: its URL, bundle name, page count and capture date. The consultant can see one exists without capturing.
2. **`capture_site` doesn't recapture a recent capture by default.** For a URL captured within a set period (e.g. 30 days), it returns the existing bundle immediately, with its capture date, unless called with `refresh: true`. The tool description says to use `refresh` only when the client says the site has changed, or the capture is clearly stale.
3. **Guidance:** one line in the consultant's capture notes: look at the existing capture (`screenshot` of the reference) before capturing again.

## What changed (as built)

- **`describe_site` carries `captures`**: every capture the site holds, each with its bundle name, the address it came from (`url`) and when it was captured (`capturedAt`). Present wherever the host has a reference store (the consultant's host); absent where the deployment keeps no captures. It is the same listing `list_references` returns (now one shared `listCaptures` reading), so the two cannot disagree. No page count: a capture is one address, and the `pages` number in a capture result counts the widths recorded, not site pages.
- **`capture_site` reuses a recent full capture.** Within `RECAPTURE_AFTER_DAYS` (30) of the existing capture's `capturedAt`, a call for the same address returns at once without loading any page: `{bundle, url, assets, captured_at, reused: true, age_days}`. The bundle is found by name from the address asked for, and from its www/apex other form (the capture is named after the host that answered), so it's at most two reads whatever the site holds. A light comparison-site capture (no `multistate.json`) is never handed back as a full one. A refused address is still refused before anything is looked up. The existing reference ticket isn't re-adopted on reuse, because that would re-run the describer, so a reused result has no `reference` field.
- **`refresh: true`** captures again as before: full capture, re-adoption, new `captured_at`.
- **Every capture result reports `captured_at`.**
- **Wording:** the `capture_site` description no longer says "Capturing is cheap… capture again whenever it may have moved". It now says a capture takes minutes, tells the consultant to look at existing captures first (`list_references`, a `screenshot` of the reference), and gives the 30-day rule and when to use `refresh`. The "Reproduce a site you were shown" sequence note opens with "Look at an existing capture of the address (a `screenshot` of the reference) before capturing it again." `describe_site`'s description and its `site` shape name the captures.

## Design decisions

- **Superseded behaviour:** a second `capture_site` of the same address within 30 days used to be an in-place recapture (AC-2044's "a second capture of the same page is an in-place update"). That now needs `refresh: true`. The AC-2044 UAT was updated to pass `refresh: true`. The AC-2044 suite was already failing on clean xgd-working, from an unrelated harness error (`businessId` undefined).
- The REQ-157 UAT that lists the fidelity surface's non-picture parameters gains `refresh`.
- Comparison-site (comp) captures are unchanged: they go through `captureComp`, which never reuses.

## Test plan

`tests/test_UAT_FC_BUG-350_an_existing_capture_is_seen_not_retaken.workers.test.ts`. These drive the Worker's `/api/ai/session` and `/api/ai/prompt` routes with a scripted model and a fake browser that records page loads. The host, D1, R2 and the capture pipeline are all real.
- `test_UAT_FC_BUG-350_describe_site_lists_an_earlier_capture_with_its_address_bundle_and_date`
- `test_UAT_FC_BUG-350_capture_site_hands_back_a_recent_capture_without_loading_a_page`: no page loads on the second call; `reused: true`; same `captured_at`.
- `test_UAT_FC_BUG-350_capture_site_with_refresh_captures_again_and_moves_the_date`
- `test_UAT_FC_BUG-350_an_address_never_captured_is_captured_today`

All four fail on the unfixed code and pass with the fix. Regression scope: every workers and node suite naming `capture_site`, `describe_site`, `list_references`, either surface or priming. The only failures left are ones that are also failing on clean xgd-working. One REQ-416 timing flake passes on its own.