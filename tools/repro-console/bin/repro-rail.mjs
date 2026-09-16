#!/usr/bin/env node
/**
 * `repro-rail` entrypoint (REQ-255).
 *
 * The rail runs, prints one verdict and exits with it — so unlike the console
 * its Vite server is closed when `main` returns, and the exit code `main` set
 * is what the caller sees. That exit code is the whole contract: an automated
 * caller has exactly one thing to check.
 */
import { boot } from './boot.mjs'

await boot('/tools/repro-console/src/rail.ts', { keepAlive: false })
