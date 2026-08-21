import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * REQ-141 — the node project is still the node project, and the routing
 * convention that keeps it that way is real.
 *
 * This file is its own evidence twice over: it imports `node:fs` at module
 * scope (so it could only have loaded in a runtime that has one) and it has no
 * `.workers` marker (so the convention it asserts is the reason it is here).
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (name: string) => readFileSync(path.join(repoRoot, name), 'utf8')

const WORKERS_GLOB = 'tests/**/*.workers.test.ts'

describe('REQ-141 project routing', () => {
  it('runs in node, with a filesystem, not in workerd', () => {
    // The import above already proved the module loaded; use it for something
    // only a real filesystem can answer.
    expect(read('package.json')).toContain('"name": "1stcontact"')
    expect(globalThis.navigator?.userAgent).not.toBe('Cloudflare-Workers')
  })

  it('routes this file to node and the .workers files to workerd', () => {
    const here = path.basename(fileURLToPath(import.meta.url))
    expect(here.endsWith('.workers.test.ts')).toBe(false)

    const workers = read('vitest.workers.config.mts')
    const node = read('vitest.node.config.mts')

    // The workerd project takes the marked files and nothing else…
    expect(workers).toContain(`include: ['${WORKERS_GLOB}']`)
    // …and the node project hands exactly that set over.
    expect(node).toContain(`include: ['tests/**/*.test.ts']`)
    expect(node).toContain(`exclude: ['${WORKERS_GLOB}']`)
  })

  it('composes both projects from one root config', () => {
    const root = read('vitest.config.mts')
    expect(root).toContain("'./vitest.node.config.mts'")
    expect(root).toContain("'./vitest.workers.config.mts'")
    // The root is an orchestrator: it must not also declare a suite of its own,
    // or those tests run in neither project's runtime.
    expect(root).not.toContain('include:')
  })

  it('names no Astro plugin in either project config', () => {
    // This test used to assert the OPPOSITE for the node project: the config was
    // Astro's `getViteConfig` precisely so behavior-module `.astro` components
    // could be transformed, and the workerd project had to stay clear of it
    // because that transform cannot run there. REQ-148 removed the last `.astro`
    // file and REQ-150 removed the dependency, so the asymmetry the assertion
    // recorded no longer exists — the two configs are now plain Vitest configs
    // that differ only in pool and routing.
    //
    // Matched on the IMPORT SPECIFIER rather than the bare word: both configs
    // carry comments explaining the removal, and those legitimately spell
    // `.astro`. What must not come back is a resolvable dependency on it.
    for (const config of ['vitest.node.config.mts', 'vitest.workers.config.mts']) {
      const source = read(config)
      expect(source, config).not.toMatch(/from ['"]astro/)
      expect(source, config).not.toMatch(/import\(['"]astro/)
      expect(source, config).not.toMatch(/getViteConfig\s*\(/)
      expect(source, config).toContain("from 'vitest/config'")
    }
  })
})
