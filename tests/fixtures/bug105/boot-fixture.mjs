#!/usr/bin/env node
/**
 * `repro-rail.mjs` with the rail swapped for a fixture entry (BUG-105).
 *
 * Boots the REAL `boot.mjs` on the same `keepAlive: false` path `repro-rail`
 * uses — the path whose forced exit truncated a piped report — and points it at
 * a fixture module that prints a document of the size the test asks for.
 */
import { boot } from '../../../tools/repro-console/bin/boot.mjs'

await boot('/tests/fixtures/bug105/large-stdout-entry.ts', { keepAlive: false })
