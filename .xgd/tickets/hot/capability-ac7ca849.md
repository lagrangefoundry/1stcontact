---
uid: capability-ac7ca849
id: CAP-66
type: capability
title: 1c CLI Argument Parsing & Output Hygiene
created_by: xgd
created_at: '2026-07-19T03:00:57.934830+00:00'
updated_at: '2026-07-23T10:18:45.105261+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: 1c CLI Argument Parsing & Output Hygiene
  uat_coverage: pass
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