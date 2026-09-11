import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe as suite, expect, it } from 'vitest'
import { readWranglerConfig, missingFromEnv } from './support/wrangler-toml'

/**
 * REQ-221 — **the Images binding is declared, on both sides**.
 *
 * WHY THIS IS A TEST AND NOT A LINE IN A FILE. A named wrangler environment
 * inherits NEITHER vars NOR bindings. REQ-144 paid for that lesson on a var;
 * REQ-143, REQ-162 and REQ-159 pinned it for the store, the blobs and the
 * embedder. This is the same assertion for the one binding that decides whether
 * an iPhone photograph can be uploaded at all.
 *
 * AND THE FAILURE MODE IS THE NASTIEST OF THE SET. Forgetting the production
 * repeat is not a degradation that shows up locally: `wrangler dev` reads the
 * top-level table and converts happily, while the deployed Worker sees no
 * binding, `imagesHeicConverter` returns `null`, and every iPhone photograph is
 * refused in production. The two halves therefore have to be pinned together,
 * because nothing an operator does locally could notice them disagreeing.
 *
 * IT DOES NOT ASSERT THE BINDING WORKS. What Cloudflare Images does with real
 * HEIC bytes is a question about an account's plan and a live API, and no local
 * suite can answer it. What this file covers is the half this repository owns:
 * the declaration exists, is named identically on both sides, and the code reads
 * that name.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

const config = readWranglerConfig(WRANGLER)
const router = readFileSync(path.join(REPO, 'apps', 'control-app', 'src', 'router.ts'), 'utf8')
const heic = readFileSync(path.join(REPO, 'apps', 'control-app', 'src', 'heic.ts'), 'utf8')

suite('REQ-221 — the binding that reads a HEIC', () => {
  it('UAT_FC_REQ-221 control-app declares the Images binding at the top level', () => {
    // `wrangler dev` reads this half, which is what makes the door provable
    // against a real binding at all.
    expect(config.topLevel.bindings).toContain('images:IMAGES')
  })

  it('UAT_FC_REQ-221 production declares it too, because it inherits nothing', () => {
    expect(config.envs.production.bindings).toContain('images:IMAGES')
    // AND THE GENERAL RULE FOR BINDINGS, restated over the whole file: no
    // binding declared at the top level is missing from production. A binding
    // added later and repeated nowhere would fail here rather than in the
    // deployed Worker.
    //
    // BINDINGS AND NOT VARS, because one var is deliberately asymmetric:
    // `ACCESS_DEV_OPEN` is declared locally and MUST NOT reach production, where
    // restating it would open the deployed builder to anyone the moment Access
    // were unconfigured. That asymmetry has its own UAT (REQ-145); asserting the
    // whole file here would put this ticket in the position of either breaking
    // that control or carrying an exception list for it.
    expect(missingFromEnv(config, 'production').bindings).toEqual([])
  })

  it('UAT_FC_REQ-221 the code reads the same name the file declares', () => {
    // A binding whose declaration and reader disagree is `undefined` at runtime
    // and nothing anywhere reports why — the same class of silence the repeat
    // above guards against.
    expect(router).toMatch(/IMAGES\?: ImagesLike/)
    expect(heic).toMatch(/env\.IMAGES/)
  })

  it('UAT_FC_REQ-221 the declaration records that an absent binding is a refusal', () => {
    // THE DECISION MOST LIKELY TO BE QUIETLY REVERSED. Storing the HEIC and
    // getting on with it is the obvious-looking change and is precisely the
    // broken row this ticket exists to prevent — a Library row whose preview
    // cannot render, whose description says the format cannot be looked at, and
    // which will be exactly as unreadable in six months. The reasoning lives
    // beside the declaration so the next person to touch it reads it first.
    const toml = readFileSync(WRANGLER, 'utf8')
    const block = toml.slice(toml.indexOf('# Cloudflare Images'), toml.indexOf('[images]'))
    expect(block).toContain('REQ-221')
    expect(block).toMatch(/refusal, not a degradation/i)
    // AND THAT HEIC INPUT IS PLAN-GATED on Cloudflare's own list, which is the
    // fact that makes the refusal load-bearing rather than defensive: a
    // deployment whose plan does not admit HEIC refuses the file and says so,
    // instead of accepting bytes it cannot decode.
    expect(block).toMatch(/enterprise/i)
  })
})
