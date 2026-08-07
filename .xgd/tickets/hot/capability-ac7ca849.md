---
uid: capability-ac7ca849
id: CAP-66
type: capability
title: 1c CLI Argument Parsing & Output Hygiene
created_by: xgd
created_at: '2026-07-19T03:00:57.934830+00:00'
updated_at: '2026-08-07T15:27:40.377653+00:00'
completed_at: null
last_field_updated: status
status: deprecated
fields:
  name: 1c CLI Argument Parsing & Output Hygiene
  uat_coverage: pass
  merged_into: capability-aa030c83
---

# Capability: 1c CLI Argument Parsing & Output Hygiene

Correctness guarantees for the `1c` command-line interface that make it safe to
compose and script:

- **Flag parsing**: boolean flags are recognised as boolean and do not consume a
  following token as their value, so positional arguments (e.g. a site slug)
  survive regardless of where the flag appears on the line.
- **Machine-readable output hygiene**: in `--json` mode, stdout carries only the
  command's single JSON document. Render/bootstrap diagnostics from the
  in-process Astro/Vite render are kept off stdout (routed to stderr) so a
  downstream JSON parser never chokes on interleaved chatter.

This capability documents behavior reconciled from bundle-ab9e0cb6
(REQ-58 pass-3), plan item 5.



---

**ABSORBED 2026-08-05 (structural rebalance).** All stories previously under this
capability were reassigned to **1c Capture & Diff Fidelity** (`capability-aa030c83`).
This capability now holds zero stories and is retained only as a historical
pointer. It could not be set to `status: deprecated` in this run — see the
rebalance report for the blocking index defect.