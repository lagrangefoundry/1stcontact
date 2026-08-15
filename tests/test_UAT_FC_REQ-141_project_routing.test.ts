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

  it('keeps the .astro transform the single config existed for', () => {
    const node = read('vitest.node.config.mts')
    expect(node).toContain("from 'astro/config'")
    expect(node).toContain('getViteConfig({')
    // The workerd project must NOT go through it — the transform cannot run there.
    expect(read('vitest.workers.config.mts')).not.toContain('astro')
  })
})
