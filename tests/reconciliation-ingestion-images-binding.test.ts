import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * STORY-6ccaedd5 (ingestion), reconciled for REQ-221 — **the image converter
 * binding is declared once, under the same name, on both sides**.
 *
 * THE PARSER IS THE ONE WRANGLER ITSELF USES. A line-based reader cannot see a
 * table declared twice; a real TOML parser refuses the document, exactly as the
 * deployment tool would. `smol-toml` is resolved through the control app's own
 * `wrangler` dependency so this file needs no dependency of its own and parses
 * with the same library that will load the file at deploy time.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const APP = path.join(REPO, 'apps', 'control-app')
const WRANGLER = path.join(APP, 'wrangler.toml')

function wranglersTomlParser(): (text: string) => Record<string, unknown> {
  const fromApp = createRequire(path.join(APP, 'package.json'))
  const fromWrangler = createRequire(fromApp.resolve('wrangler/package.json'))
  return (fromWrangler('smol-toml') as { parse: (t: string) => Record<string, unknown> }).parse
}

describe('STORY-6ccaedd5 — the image converter binding (REQ-221)', () => {
  it('test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production', () => {
    const parse = wranglersTomlParser()
    const text = readFileSync(WRANGLER, 'utf8')

    // A table declared twice makes the document invalid, and this throws.
    let config: Record<string, unknown> = {}
    expect(() => {
      config = parse(text)
    }, 'wrangler.toml must be a valid TOML document (no table declared twice)').not.toThrow()

    // Top level (local development) declares IMAGES.
    const topLevel = config.images as { binding?: string } | undefined
    expect(topLevel?.binding).toBe('IMAGES')

    // Production inherits no bindings, so it must declare the same name itself.
    const envs = config.env as Record<string, { images?: { binding?: string } }> | undefined
    expect(envs?.production?.images?.binding).toBe('IMAGES')

    // And that is the name the upload path's converter is built from.
    const router = readFileSync(path.join(APP, 'src', 'router.ts'), 'utf8')
    const heic = readFileSync(path.join(APP, 'src', 'heic.ts'), 'utf8')
    expect(router).toMatch(/IMAGES\?: ImagesLike/)
    expect(router).toMatch(/imagesHeicConverter\(env\)/)
    expect(heic).toMatch(/const images = env\.IMAGES/)
  })
})
