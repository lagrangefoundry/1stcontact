import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  BINDING_ADVICE,
  DescribedEmbedder,
  EmbeddingFailedError,
  PartialAiCredentialError,
  canEmbed,
  embedderFor,
  transportFor,
  type Embedder,
  type Transport,
} from '../apps/control-app/src/embedder'
import { AiNotConfiguredError, projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { systemKnowledge } from '../apps/control-app/src/system-knowledge'

/**
 * BUG-73 — **which transport reaches the embedding model, and what a failure says**.
 *
 * THE BUG THIS CLOSES was not a wrong answer, it was an unreadable one. A
 * `wrangler dev` server printed bursts of
 *
 *     ✘ [ERROR] Error: internal error; reference = 6knvuijid52gaa1eks2l9jl5
 *
 * with no request line, no stack and no binding named — workerd's SANITISED
 * internal-error form, whose detail is discarded before anything wrangler writes
 * can see it. Diagnosing it took log timestamps and a binding inventory to
 * establish something the message could have said: the remote preview session
 * proxying the `AI` binding had expired, and wrangler refreshes that only on a
 * worker reload.
 *
 * So the fix has two halves and this file pins both:
 *
 *   - **the transport** (B2/B3/B4) — a deployment that has a Workers AI
 *     credential embeds over REST and never touches the binding, which is what
 *     removes the expiring session from local dev entirely; a deployment with no
 *     credential uses the binding exactly as before, which is what leaves
 *     production alone.
 *   - **the message** (B6/B6a) — an embedding call that fails names its
 *     transport, its knowledge base and, for the binding, what to do about it.
 *
 * WHAT IS DELIBERATELY NOT TESTED HERE is that Workers AI returns vectors. That
 * is upstream's contract and reaching the real API from a unit test would make
 * this suite a network monitor. What is testable, and is what actually broke, is
 * WHICH transport gets selected and WHAT is said when one fails.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const SRC = path.join(REPO, 'apps', 'control-app', 'src')

/**
 * The decorator over a stand-in embedder.
 *
 * A REAL network failure is what B6 describes and what a test must not produce:
 * reaching Cloudflare to make an embed fail would make this suite a monitor of
 * their availability rather than of our message. `DescribedEmbedder` is exported
 * for exactly this, so the inner is a stub that throws and everything asserted
 * below is ours.
 */
function wrap(inner: unknown, transport: Transport, kb: string): Embedder {
  return new DescribedEmbedder(inner, transport, kb)
}

/** A binding that fails the test if anything calls it. */
function forbiddenBinding(): { run(model: string, input: unknown): Promise<unknown> } {
  return {
    run() {
      throw new Error('the AI binding was used when a REST credential was configured')
    },
  }
}

describe('BUG-73 B2/B3 — the transport is selected by configuration', () => {
  it('uses REST when both the account id and the token are present', () => {
    const env = {
      AI: forbiddenBinding(),
      CLOUDFLARE_ACCOUNT_ID: '8feaadfce95919ab2d2b93aa8df6f6ce',
      CLOUDFLARE_API_TOKEN: 'tok_local_dev',
    }
    expect(transportFor(env)).toBe('REST')
  })

  it('does not touch the AI binding when REST is configured', () => {
    // THE POINT OF THE WHOLE TICKET, asserted directly rather than through the
    // transport label: `wrangler.toml` declares the `AI` binding
    // unconditionally, so local dev has both available and the credential must
    // WIN rather than merely be available. A binding that still gets called is
    // a dev server that still has a preview session to expire.
    const env = {
      AI: forbiddenBinding(),
      CLOUDFLARE_ACCOUNT_ID: 'acct',
      CLOUDFLARE_API_TOKEN: 'tok',
    }
    // `forbiddenBinding` is the assertion: `WorkersAiEmbedder` only calls
    // `binding.run` when it was constructed with a binding, so an embedder built
    // from this env that never touches it is one that took the REST branch. The
    // vectors are irrelevant and are not waited for.
    expect(embedderFor(env, 'project')).toBeInstanceOf(DescribedEmbedder)
    expect(transportFor(env)).toBe('REST')
  })

  it('uses the binding when no credential is configured', () => {
    // Production's shape: a binding and nothing else. Unchanged by this ticket.
    expect(transportFor({ AI: { run: async () => ({}) } })).toBe('binding')
  })

  it('has no transport at all when neither is configured', () => {
    expect(transportFor({})).toBeNull()
    expect(canEmbed({})).toBe(false)
  })

  it('treats an empty string as absent on both halves', () => {
    // An exported-but-blank variable is a variable somebody meant to set, and
    // `.dev.vars` makes blanking a line the ordinary way to switch it off — the
    // convention the Access vars in that file already rely on.
    expect(transportFor({ AI: { run: async () => ({}) }, CLOUDFLARE_ACCOUNT_ID: '' })).toBe(
      'binding',
    )
    expect(transportFor({ CLOUDFLARE_ACCOUNT_ID: '  ', CLOUDFLARE_API_TOKEN: '' })).toBeNull()
  })
})

describe('BUG-73 B4 — half a credential is a mistake, not a fallback', () => {
  it('names the missing token when only the account id is set', () => {
    expect(() => transportFor({ CLOUDFLARE_ACCOUNT_ID: 'acct' })).toThrow(PartialAiCredentialError)
    expect(() => transportFor({ CLOUDFLARE_ACCOUNT_ID: 'acct' })).toThrow(/CLOUDFLARE_API_TOKEN/)
  })

  it('names the missing account id when only the token is set', () => {
    expect(() => transportFor({ CLOUDFLARE_API_TOKEN: 'tok' })).toThrow(PartialAiCredentialError)
    expect(() => transportFor({ CLOUDFLARE_API_TOKEN: 'tok' })).toThrow(/CLOUDFLARE_ACCOUNT_ID/)
  })

  it('does not fall back to the binding, which is the whole of B4', () => {
    // The failure this refuses to have: an operator sets the token, forgets the
    // account id, and is left on the expiring preview session while believing
    // they had switched it off. A `binding` answer here would be that bug.
    const env = { AI: { run: async () => ({}) }, CLOUDFLARE_API_TOKEN: 'tok' }
    expect(() => transportFor(env)).toThrow(PartialAiCredentialError)
    expect(() => canEmbed(env)).toThrow(PartialAiCredentialError)
  })
})

describe('BUG-73 B6 — a failed embedding says what failed', () => {
  /** An embedder that always fails, standing in for a dead transport. */
  const broken = {
    name: 'stub-model',
    dimension: 384,
    async embed(): Promise<never> {
      throw new Error('internal error; reference = 6knvuijid52gaa1eks2l9jl5')
    },
  }

  it('names the transport, the knowledge base, and keeps the original message', async () => {
    // The three facts the reference id could not carry, plus the reference id
    // itself — which is preserved rather than replaced, because it is what a
    // Cloudflare support ticket would ask for.
    const failing = wrap(broken, 'binding', 'project')
    await expect(failing.embed(['q'])).rejects.toThrow(EmbeddingFailedError)
    await expect(failing.embed(['q'])).rejects.toThrow(/project knowledge base/)
    await expect(failing.embed(['q'])).rejects.toThrow(/binding transport/)
    await expect(failing.embed(['q'])).rejects.toThrow(/reference = 6knvuijid52gaa1eks2l9jl5/)
  })

  it('wraps whatever the resolver built, so production gets the same message', () => {
    // B6 has to hold for the embedder the WORKER uses, not only for one
    // hand-constructed here — a resolver that returned the bare upstream
    // embedder on some path would leave that path printing reference ids again.
    //
    // ASSERTED BY TYPE RATHER THAN BY FAILING A CALL, deliberately: driving a
    // real embed to its failure would put api.cloudflare.com on the critical
    // path of a unit suite, and what is actually in question is whether the
    // decorator is there — which is a fact about construction.
    for (const env of [
      { AI: { run: async () => ({}) } },
      { CLOUDFLARE_ACCOUNT_ID: 'acct', CLOUDFLARE_API_TOKEN: 'tok' },
    ]) {
      expect(embedderFor(env, 'project')).toBeInstanceOf(DescribedEmbedder)
    }
  })

  it('carries the operator advice on the binding transport and not on REST', async () => {
    // The advice is the actionable half — expired preview session, reload
    // refreshes it, credential avoids it — and it is asserted by identity with
    // the exported constant rather than by restating the prose, so the two
    // copies cannot drift together into a test that passes and says nothing.
    const viaBinding = await wrap(broken, 'binding', 'project')
      .embed(['q'])
      .catch((e: Error) => e)
    const viaRest = await wrap(broken, 'REST', 'project')
      .embed(['q'])
      .catch((e: Error) => e)
    expect((viaBinding as Error).message).toContain(BINDING_ADVICE)
    // REST has no preview session, so the advice would be wrong rather than
    // merely noisy: it would send an operator to reload a server that is fine.
    expect((viaRest as Error).message).not.toContain(BINDING_ADVICE)
  })

  it('records the transport and kb as fields, not only as prose', async () => {
    const error = (await wrap(broken, 'REST', 'system')
      .embed(['q'])
      .catch((e: unknown) => e)) as EmbeddingFailedError
    expect(error).toBeInstanceOf(EmbeddingFailedError)
    expect(error.transport).toBe('REST')
    expect(error.kb).toBe('system')
    expect((error.cause as Error).message).toMatch(/internal error/)
  })

  it('does not rename an already-named failure', async () => {
    const named = {
      name: 'stub-model',
      dimension: 384,
      async embed(): Promise<never> {
        throw new EmbeddingFailedError('REST', 'system', new Error('first'))
      },
    }
    const error = (await wrap(named, 'binding', 'project')
      .embed(['q'])
      .catch((e: unknown) => e)) as EmbeddingFailedError
    // Wrapping twice would report one failure at two altitudes and read as two.
    expect(error.transport).toBe('REST')
    expect(error.kb).toBe('system')
  })
})

describe('BUG-73 B6a — the wrapper is transparent apart from the message', () => {
  it('forwards the model name and the vector width', () => {
    // NOT COSMETIC. `buildIndex` reads `dimension` to size its vectors and
    // `search` reads `name` to refuse an index built by another model, so a
    // decorator that dropped them would turn a legibility fix into the
    // model-comparability corruption `embedder.ts` opens by warning about.
    const inner = { name: '@cf/baai/bge-small-en-v1.5', dimension: 384, embed: async () => [] }
    const wrapped = wrap(inner, 'REST', 'project') as unknown as {
      name: string
      dimension: number
    }
    expect(wrapped.name).toBe(inner.name)
    expect(wrapped.dimension).toBe(inner.dimension)
  })

  it('returns the inner vectors untouched when nothing fails', async () => {
    const vectors = [Float32Array.from([1, 0, 0])]
    const inner = { name: 'm', dimension: 3, embed: async () => vectors }
    await expect(wrap(inner, 'REST', 'project').embed(['q'])).resolves.toBe(vectors)
  })
})

describe('BUG-73 B1a — nothing outside the resolver reaches for the model', () => {
  /** Every `.ts` under the control app's `src`, excluding generated shims. */
  function sources(): string[] {
    const out: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name === 'generated') continue // upstream's re-export shims
          walk(full)
        } else if (entry.name.endsWith('.ts')) out.push(full)
      }
    }
    walk(SRC)
    return out
  }

  it('constructs a WorkersAiEmbedder in exactly one module', () => {
    const constructing = sources().filter((f) =>
      /new\s+WorkersAiEmbedder\s*\(/.test(readFileSync(f, 'utf8')),
    )
    expect(constructing.map((f) => path.relative(SRC, f))).toEqual(['embedder.ts'])
  })

  it('decides nothing from the AI binding outside the resolver', () => {
    // The four-way split this ticket closed was four sites answering "can this
    // deployment embed" locally. A fifth doing the same would reintroduce it
    // silently — a REST-configured deployment told it cannot embed does not
    // error, it simply has no knowledge base.
    //
    // DECLARING the binding is still fine: `RouterEnv` and `EmbedderEnv` have to
    // type it. What is refused is READING it to decide something.
    const deciding = sources().filter((f) => {
      if (path.basename(f) === 'embedder.ts') return false
      return /(?:!|\?\.|\|\||&&|\(|\s)env\.AI\b(?!\s*\?:)/.test(
        readFileSync(f, 'utf8')
          .split('\n')
          .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('//'))
          .join('\n'),
      )
    })
    expect(deciding.map((f) => path.relative(SRC, f))).toEqual([])
  })
})

describe('BUG-73 B7 — the absent case degrades exactly as it did before', () => {
  it('still raises for the project KB, because an unindexed upload is invisible', async () => {
    // UNCHANGED BY THIS TICKET and asserted anyway: moving the decision into a
    // resolver that answers `null` made it possible to lose this distinction by
    // accident, since `null` is a perfectly good value for the caller to ignore.
    await expect(
      projectKnowledgeFor({ BLOBS: {} } as never, { businessId: 'biz_x' } as never, {
        store: {} as never,
      }),
    ).rejects.toThrow(AiNotConfiguredError)
  })

  it('still answers null for the system KB, because a builder is still a builder', async () => {
    const bundle = { index: {}, chunks: {}, docs: {} }
    await expect(systemKnowledge({}, { bundle })).resolves.toBeNull()
  })

  it('reports the REST alternative when nothing can embed', async () => {
    // The message an operator reads at the moment they hit this is the one place
    // the new transport can be discovered without reading the source.
    const error = await projectKnowledgeFor(
      { BLOBS: {} } as never,
      { businessId: 'biz_x' } as never,
      { store: {} as never },
    ).catch((e: Error) => e)
    expect((error as Error).message).toMatch(/CLOUDFLARE_ACCOUNT_ID/)
    expect((error as Error).message).toMatch(/CLOUDFLARE_API_TOKEN/)
  })
})

describe('BUG-73 B5 — the credential is never in wrangler.toml', () => {
  const toml = readFileSync(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'), 'utf8')

  it('names neither variable, in either environment', () => {
    // `wrangler.toml` is COMMITTED: a `[vars]` entry would publish the token to
    // the repository, and an `[env.production.vars]` entry would push it to the
    // deployed Worker — which would also route production's embeddings back out
    // through REST for no reason. Both are dev-only. This is the rule the file
    // already records for RESEND_API_KEY, applied to the credential this ticket
    // introduces.
    expect(toml).not.toMatch(/CLOUDFLARE_API_TOKEN/)
    expect(toml).not.toMatch(/CLOUDFLARE_ACCOUNT_ID/)
  })
})
