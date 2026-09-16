#!/usr/bin/env node
/**
 * `repro-console` entrypoint (REQ-254).
 *
 * All of the bootstrap is in `boot.mjs`, shared with `repro-rail.mjs`. The
 * console keeps its Vite server up: its own modules are loaded through it and
 * its HTTP server keeps the process alive until the operator stops it.
 */
import { boot } from './boot.mjs'

await boot('/tools/repro-console/src/server.ts', { keepAlive: true })
