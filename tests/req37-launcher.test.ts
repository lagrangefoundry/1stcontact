import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * UATs for REQ-37 — the `1c` launcher (tools/generate/bin/1c.mjs) must run its
 * Vite SSR server WITHOUT opening Vite's HMR WebSocket. Under Vite 8 the ws
 * server is gated on `server.ws`, not `hmr`, so an occupied HMR port (24678 —
 * as held by a long-running `1c serve`) would make every other `1c` invocation
 * log "Port 24678 is already in use". These tests drive the real launcher as a
 * subprocess so they cover the mjs entrypoint, not just the command handlers.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const launcher = path.join(repoRoot, 'tools', 'generate', 'bin', '1c.mjs')
const HMR_PORT = 24678

/** Bind the HMR port to reproduce a running `1c serve`; null if already held. */
function occupyHmrPort(): Promise<net.Server | null> {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(null)) // already in use == same test condition
    srv.listen(HMR_PORT, () => resolve(srv))
  })
}

describe('1c launcher — HMR WebSocket disabled (REQ-37)', () => {
  it(
    'test_UAT_FC_REQ-37_launcher_does_not_error_on_occupied_hmr_port',
    async () => {
      const blocker = await occupyHmrPort()
      try {
        const res = spawnSync('node', [launcher, 'list'], {
          cwd: repoRoot,
          encoding: 'utf8',
        })
        // Command succeeds...
        expect(res.status).toBe(0)
        // ...and never complains about the HMR port being taken.
        expect(res.stderr).not.toContain('is already in use')
        expect(res.stderr).not.toContain('24678')
      } finally {
        blocker?.close()
      }
    },
    60_000,
  )
})
