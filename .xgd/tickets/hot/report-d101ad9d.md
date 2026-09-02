---
uid: report-d101ad9d
id: REPORT-3280
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-02T00:26:10.958257+00:00'
updated_at: '2026-09-02T00:26:10.958257+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-a7a12d81
---

Two new files, nothing else touched.

```
UATs generated for story story-a7a12d81 (plan item 2 of 4)

Story: story-a7a12d81
Test file(s) created:
  - tests/reconciliation-material-blob-storage.test.ts          (AC-1489, AC-1490)
  - tests/reconciliation-material-blob-storage.workers.test.ts  (AC-1486, AC-1487, AC-1488)

Tests written: 5
Tests passed: 3
Tests failed: 2

test_files_created:
  - "tests/reconciliation-material-blob-storage.test.ts"
  - "tests/reconciliation-material-blob-storage.workers.test.ts"
```

⚠️ **TESTS FAILING — downstream fix-it loop required**

```
Failures:
  - test_UAT_AC1487_attached_bytes_are_in_the_material_store_under_the_accounts_address_and_absent_from_the_public_sites:
      no object at t/<account>/blob/<sha256>; the store holds t/<account>/blob/attachment-<8hex>
  - test_UAT_AC1488_the_same_file_is_one_object_within_an_account_and_two_across_two_accounts:
      same — the content address on the record does not resolve to a stored object
```

**Diagnosis — code diverges from intent, not a bad test.** The ACs were not weakened.

The blob layer lives in the out-of-repo `@lagrangefoundry/ticketing` component that `1c assets` re-exports. The installed copy has moved past what REQ-162 landed against: `attach` now does `blobs.put(attachmentUid, …)`, and `blob_store.js` states it outright — *"A blob is addressed by its owning record's uid, not by its content hash (REQ-108). REQ-104 keyed blobs by SHA-256, which deduplicated byte-identical attachments into one blob named by many records… `sha256` stays on the record — for integrity, no longer as the address."*

Consequences against the two ACs:
- **AC-1487** — the account prefix still holds (`t/<account>/…`), and the public-site store is genuinely empty, but the address is not composed of the content address the record carries.
- **AC-1488** — cross-account isolation still holds in substance (same `sha256` on both records, two distinct locations, both objects present), but **dedup within an account is gone**: AC-1486's run attached byte-identical content twice inside one account and produced two stored objects.

This is pre-existing, not introduced here. The repository's own free-coded UAT (`tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts`) asserts the same two claims and fails identically on the current tree — 2 failed / 13 passed. Repair is a component-version or wiring decision, not a test edit, so I left both assertions stating what the ACs specify.

**AC-1486 self-correction (1 of 2 used):** my first pass hardcoded a 40-byte length for a 41-byte string; corrected, and that test now passes in full — including the digest computed independently in the test, the exact size, filename/content-type round-trip, `subject_uid` parentage, listing under the parent, and the bare `{uid, bytes}` call taking no account or location.

**AC-1489 / AC-1490 pass** and both carry mutation checks: re-pointing `BLOBS` at the published-site target is detected in each half independently, and removing either half's declaration is reported separately rather than masked by the other's presence. The public site's bucket names are read from `apps/public-site/wrangler.toml` rather than hardcoded, so "not the published-site store under any name" is checked against that Worker's actual bindings.

One adjacent observation, outside this plan item: `tests/reconciliation-cloudflare-site-store.test.ts:330-332` (AC-1398) asserts exactly two `bucket_name` occurrences across the whole control-app `wrangler.toml`. There are now four. That is the AC-1398 upgrade the story's technical context anticipates; I did not touch it.
