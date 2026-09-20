/**
 * The AI round (REQ-256).
 *
 * One iteration of loop 1 ([[EPIC-12]] §7.1): an AI process reads the evidence
 * a reproduction left on disk, names what the ENGINE cannot yet do, and files a
 * gap ticket. It writes no code — it files the ticket itself ([[REQ-262]] D10),
 * the operator free-codes it in the ordinary way, and [run again] re-runs the
 * reproduction with whatever has landed since.
 *
 * THE ROUND READS, AND RUNS `xgd`. Everything that can write a file, reach the
 * network or spawn an agent whose tool set is not this one is denied BY NAME in
 * {@link AI_DISALLOWED_TOOLS} — which removes it from the session's tool list
 * outright rather than leaving it available and merely unapproved.
 *
 * THE DENY LIST IS THE GATE, NOT THE ALLOW LIST. Measured twice, both times the
 * same way: a tool merely absent from the allow list is still in the session and
 * still runs, and a SCOPED allow rule (`Bash(xgd ticket get:*)`) admits the tool
 * whole rather than narrowing it. See `measurements/tool-gating.sh` for the
 * numbers. An allow list that does not deny is a description of intent.
 *
 * WHICH IS WHY `Bash` IS GRANTED WHOLE ([[REQ-262]] D7). [[REQ-256]] denied it
 * and had the console file on the round's behalf; a round needs the ticket
 * store, `xgd` is how this project exposes it, and the measurement above says
 * there is no narrow version of that grant to make. So behaviour 3 is NARROWED
 * here, deliberately and by the operator, rather than upheld.
 *
 * THE DELIVERABLE IS STILL THE TICKET'S CONTENT — but the ROUND now files it
 * and the console reads it back ([[REQ-262]] D10; the relay `fileTicket` and
 * `appendGapEvidence` are gone, see `ticket.ts`). So `status: draft` stopped
 * being structural: it used to be a field the console wrote, and is now an
 * instruction a round can get wrong. It is asserted instead: behaviour 4's
 * "never at a `ready_*` status" is checked after every round by
 * {@link readyStatusFindings} ([[REQ-262]] requirement 11, narrowed to what is
 * attributable to the round by [[BUG-114]]), because a `ready_*` status is a
 * dispatcher trigger and the one mistake here that spends real money while
 * nobody is watching.
 *
 * WHY THE `claude` CLI AND NOT A CLIENT. The console spawns `1c` per step
 * already; spawning the CLI the operator is signed in to adds no dependency,
 * no credential handling and no bundled client. It is reached through an
 * injected {@link AiRunner}, the same seam {@link StepRunner} gives the
 * reproduction steps, so the console's whole surface is exercisable without
 * spending a token.
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DEFECT_CLASS_FIELD, defectClassTable, parseDefectClasses } from './defect-class'
import type { GapEntry } from './gaps'
import { INDEX_FILE, type SessionKbResult } from './session-kb'
import { ROUND_CREATED_BY } from './ticket'
import type { RailRoundResult } from './rail-round'
// REQ-277 — one definition of the unmeasured set, shared by every surface that
// shows it. The console must never have two answers to "how much did this run
// not measure".
import { breakdownOf, headlineOf, unmeasuredOf, type UnmeasuredSet } from './unmeasured'

/** How a round ended. `running` is the console's, never the AI's. */
export type AiStatus = 'running' | 'filed' | 'appended' | 'no-gap' | 'stopped' | 'failed'

/** The statuses a round may claim for itself in its outcome block. */
export const CLAIMABLE_STATUSES: readonly AiStatus[] = ['filed', 'appended', 'no-gap', 'stopped']


/** A ticket the round really filed, as xgd reports it. */
export interface ReadTicket {
  /** What the round said it created. */
  id: string
  /** The status it really carries, or why it could not be read. */
  status: string
  /**
   * Who `xgd` recorded as having filed it ([[BUG-104]]).
   *
   * The only field in the store that separates "an unattended round wrote this"
   * from "the operator wrote this", so it is read back beside the status rather
   * than taken on trust. Empty when the ticket could not be read at all —
   * which is `found: false`, a different outcome from wrong provenance.
   */
  createdBy: string
  /**
   * Where the round said the defect sits ([[REQ-276]]).
   *
   * READ BACK, NOT REPORTED. Every other thing a round claims arrives in its
   * outcome block; this one is read out of the ticket itself in the same
   * `xgd ticket get --json` that already fetches the status and the provenance,
   * because the field is the deliverable. A class the round mentioned only in
   * its closing block would be a class no filter could ever find.
   *
   * Empty when the ticket carries none — which is a violation, and distinct
   * from `found: false`, which is the console not having been able to look.
   */
  defectClasses: string[]
  /** Absent when `xgd` would not answer about it at all. */
  found: boolean
}

/**
 * A ticket nothing could be learned about ([[BUG-125]]).
 *
 * ONE SHAPE FOR "THE CONSOLE COULD NOT LOOK", declared here beside the type it
 * fills in rather than written out at each of the places that needs it. Two of
 * them exist — the live read-back that `xgd` would not answer about, and an
 * entry restored off disk that is too malformed to read — and they are the same
 * finding: every field empty, `found: false`, which every caller already reports
 * as unverified. A second spelling of it would be a second thing to keep true.
 */
export function unreadTicket(id: string): ReadTicket {
  return { id, status: '', createdBy: '', defectClasses: [], found: false }
}

/**
 * What the round cost and what ran it ([[REQ-261]] behavior 6).
 *
 * READ OFF THE STREAM, NOT GUESSED. The `system` init event names the model the
 * CLI actually chose — which matters because `REPRO_CONSOLE_AI_MODEL` is
 * optional, so with it unset the round runs on whatever the CLI defaults to that
 * week — and the `result` event carries the cost and the usage. Both were being
 * discarded. This loop is meant to run many times and its per-round cost is what
 * decides how many, so it is recorded beside the outcome and answerable from the
 * artifacts rather than from impression.
 */
export interface RoundCost {
  model?: string
  costUsd?: number
  durationMs?: number
  turns?: number
  inputTokens?: number
  outputTokens?: number
}

/**
 * What a round says it did.
 *
 * REPORTED, NOT MINED (requirement 20). The console does not read the
 * transcript for a diagnosis: what the round states in its outcome block is
 * what gets filed, and everything else it said is commentary on it.
 */
export interface AiOutcome {
  status: AiStatus
  /** The kind of gap, not the symptom on one site. See the brief, §5. */
  residualClass?: string
  /**
   * The ticket the round created for the gap ([[REQ-262]] requirement 17).
   *
   * REPORTED BY THE ROUND, NOT WRITTEN BY THE CONSOLE. The round runs
   * `xgd ticket create` itself; this is the id it says it made, and the console
   * reads it back rather than taking it on trust.
   */
  ticketId?: string
  /**
   * Bugs found on the way to the diagnosis ([[REQ-261]] behavior 2).
   *
   * Independent of `status`: a round that found no engine gap at all may still
   * have tripped over a defect in L1 or in its own instructions, and the whole
   * point of this list is that such a finding no longer has to be folded into a
   * gap ticket it does not belong in — or dropped.
   */
  bugTickets?: string[]
  /** What reading each reported ticket back actually found. */
  ticketsRead?: ReadTicket[]
  summary?: string
  /** Why a `stopped` or `failed` round did not file. */
  reason?: string
  /** Behaviours 3 and 4's falsifiers, filled in by the console after the round. */
  violations?: string[]
  /**
   * What merely happened while the round ran ([[BUG-114]]).
   *
   * A SECOND LIST, NOT A SOFTER VIOLATION. Both come from the same check — a
   * ticket arriving at a dispatcher-trigger status — and the whole point of
   * BUG-114 is that an arrival nothing ties to the round is not a thing the
   * round did. One list the operator must act on, one they may want to look at;
   * folding them together is what taught an operator to discount both.
   */
  observations?: string[]
  /** The status the gap ticket actually carries, read back (behavior 4). */
  ticketStatus?: string
  /** The model, the cost and the shape of the round ([[REQ-261]] behavior 6). */
  cost?: RoundCost
  /** The CLI session this round ran in — what the next round on this site resumes. */
  sessionId?: string
  /** Set when this outcome was read back off a finished round's artifacts (behavior 5). */
  recovered?: boolean
}

/** The part of `1c gate`'s report a round is handed inline. */
export interface GateSummary {
  verdict: string
  pass: boolean
  diagnosis: string
  nextStep: string
  meanDiff?: number
  pctOverThreshold?: number
  regions?: number
  valueDeltas?: number
  unreferencedImages?: string[]
  /**
   * REQ-270 — every reference-coverage finding the gate recorded, verbatim.
   *
   * A round is told its ORACLE is suspect before it spends itself diagnosing a
   * residual the oracle cannot move. `stale-capture` is the case that forced
   * this: iteration 2 of `repro-gigabytealchemy-ai` re-ran against a bundle
   * taken seventy minutes before the capture fix it was measuring, produced a
   * ranked-region score identical to iteration 1 down to the bbox, and spent the
   * round diagnosing five residuals that had already been fixed. The finding was
   * two keys away in `gate.json` the whole time; being in the file is not the
   * same as being in the round's hands.
   */
  coverageFindings?: { kind: string; detail: string }[]
  /**
   * REQ-277 — what this run did NOT measure, as one number plus its breakdown.
   *
   * Beside `valueDeltas` and, on every surface that shows the pair, ABOVE it.
   * The delta count can only rise when the instrument sharpens, so a loop that
   * reads it as a score reads a pure improvement as a 14× regression — which is
   * what [[EPIC-19]] found it doing. This is the quantity that moves the right
   * way, and it is carried here so the page, the digest and the prompt all take
   * it from one place.
   */
  unmeasured: UnmeasuredSet
}

/** The verdict that means the reference is wrong, not the engine (behavior 7). */
export const CAPTURE_INCOMPLETE = 'capture-incomplete'

/**
 * Read `gate.json` out of an iteration's evidence directory.
 *
 * Returns `null` when there is none or it cannot be read. The console treats
 * that as a reason to stop rather than as a reason to guess: behavior 7's stop
 * is decided from this file, so an unreadable one is the one case where
 * starting the AI anyway would be starting it blind.
 */
export function readGateReport(file: string): GateSummary | null {
  if (!existsSync(file)) return null
  try {
    const report = JSON.parse(readFileSync(file, 'utf8')) as {
      verdict?: string
      pass?: boolean
      diagnosis?: string
      nextStep?: string
      perceptual?: { meanDiff?: number; pctOverThreshold?: number; regions?: number }
      values?: { deltas?: number }
      coverage?: { unreferencedImages?: string[]; findings?: { kind?: string; detail?: string }[] }
    }
    if (typeof report.verdict !== 'string') return null
    return {
      verdict: report.verdict,
      pass: report.pass === true,
      diagnosis: typeof report.diagnosis === 'string' ? report.diagnosis : '',
      nextStep: typeof report.nextStep === 'string' ? report.nextStep : '',
      meanDiff: report.perceptual?.meanDiff,
      pctOverThreshold: report.perceptual?.pctOverThreshold,
      regions: report.perceptual?.regions,
      valueDeltas: report.values?.deltas,
      unreferencedImages: report.coverage?.unreferencedImages,
      coverageFindings: (report.coverage?.findings ?? [])
        .filter((f): f is { kind: string; detail: string } => typeof f?.kind === 'string' && typeof f?.detail === 'string')
        .map((f) => ({ kind: f.kind, detail: f.detail })),
      // REQ-277 — derived from the WHOLE report rather than from the fields
      // picked out above, because the parts of the unmeasured set are spread
      // across `values` and a second hand-maintained pick list here would be
      // the next place a quantity goes silently missing.
      unmeasured: unmeasuredOf(report),
    }
  } catch {
    return null
  }
}

// ── the brief ────────────────────────────────────────────────────────────────

/**
 * The standing brief (behavior 11).
 *
 * A DOCUMENT, NOT A STRING BURIED IN THE CONSOLE. It is a file in the
 * repository, so changing what the AI is told is a diff somebody reviews — and
 * so the thing [[EPIC-12]] §8.5 calls a deliverable is one.
 */
export const BRIEF_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'brief',
  'DIAGNOSE-THE-GAP.md',
)

export function readBrief(file: string = BRIEF_FILE): string {
  return readFileSync(file, 'utf8')
}

// ── the prompt ───────────────────────────────────────────────────────────────

/**
 * When the reference was taken, and what the engine has done since.
 *
 * Both halves are needed for the round to reach the conclusion on its own: the
 * timestamp comes off the bundle, the commit list comes off the engine's log,
 * and neither alone says whether the residual in front of it is outstanding or
 * merely un-re-captured.
 */
export interface ReferenceProvenance {
  /** The bundle's own `capturedAt`, or absent on a bundle written before the stamp. */
  capturedAt?: string
  /** [[REQ-270]]'s extractor stamp, or absent — which reads as schema 1. */
  captureSchema?: number
  /** Engine commits that landed after the capture, newest first, one line each. */
  landedSince: string[]
}

/** Everything about one round the brief does not already say. */
export interface RoundContext {
  n: number
  slug: string
  /** The address the capture answered on. */
  originalUrl: string
  /** The reference bundle every step pointed `--ref` at — `raw.html` lives here. */
  bundleDir: string
  /**
   * When that bundle was taken, and what has landed since ([[REQ-272]] part 2).
   *
   * IN THE PROMPT AND NOT ONLY IN THE DIGEST, which is a deliberate exception to
   * "paths, not contents". Everything else the prompt summarises is a pointer at
   * evidence; this is a fact ABOUT that evidence, and a round that misses it
   * files a ticket for work already done — which is exactly what happened, at
   * $7.70 and 78 turns, on the round that motivated [[REQ-272]].
   */
  reference?: ReferenceProvenance
  /** Where `1c gate` wrote `gate.json`, `values-diff.json`, `regions.json`. */
  evidenceDir: string
  /** This iteration's copy of the reproduction's own L1 document. */
  pageDocument: string
  /** This iteration's rendered reproduction. */
  siteDir: string
  /**
   * The derived facts the console computed while writing the evidence
   * ([[REQ-261]] behavior 7). An ADDITION to the files below, never a
   * replacement for them — the prompt says so, because the one rule is that a
   * claim comes from the captured file and a digest is a console's arithmetic.
   */
  digestFile?: string
  /**
   * The session KB ([[REQ-262]] behaviour 2) — every `doc` ticket, exported as
   * ordinary markdown the round reaches with `Read`, `Glob` and `Grep`.
   *
   * ABSENT IS A VALID STATE. A KB that could not be built is a round that reads
   * the engine the way the first one did, which worked; it is never a reason
   * not to run. The prompt says which of the two it got.
   */
  kb?: SessionKbResult
  gate: GateSummary | null
  rail: RailRoundResult
  /** The classes that already have tickets (behavior 6). */
  knownGaps: GapEntry[]
  /** True when this round resumed the previous round's session (behavior 3). */
  resumed?: boolean
}

/**
 * What a resumed round is told INSTEAD of the brief ([[REQ-261]] behavior 3).
 *
 * The brief is already in the resumed session, so restating it would grow the
 * context by its own length every iteration — which is half of what makes a long
 * resume chain dangerous. The other half is what this text exists to say out
 * loud: a resumed round remembers a page that has since been refolded, so its
 * memory is a pointer and never a source. That is the brief's one rule
 * (transcribe, do not reconstruct) turned against the mechanism that would
 * otherwise quietly break it.
 */
export function resumePreamble(previousRounds: number): string {
  return `# You are being resumed

This is round ${previousRounds + 1} on this reproduction, and you are continuing the
session that ran ${previousRounds === 1 ? 'the previous round' : `the previous ${previousRounds} rounds`}.

**The standing brief you were given at the start of this chain still binds you in
full.** It is not restated here — re-read it in your own context if you need it.

**What you remember is a pointer, never evidence.** The engine has changed
underneath you: this iteration refolded the same reference through whatever
landed since, so every number you remember may now be wrong. Your memory is good
for knowing WHERE to look and what you already ruled out. It is not good for
anything you are about to assert. Every claim in this round's ticket must be read
out of THIS iteration's files, listed below — and anything you cannot re-read
this round, you cannot state this round.

Say plainly in your summary what you carried forward and what you re-read.`
}

/**
 * The brief, then this round's evidence.
 *
 * PATHS, NOT CONTENTS, for everything but the gate summary. The one rule is
 * *transcribe from the captured DOM*, and a prompt that pasted the values in
 * would be doing the transcription for the round — which reads convenient and
 * is exactly the habit [[DOC-19]] says produces reconstructions. Handing it the
 * paths makes reading the file the cheapest way to answer, which is the
 * behaviour we want.
 */
export function buildPrompt(brief: string, ctx: RoundContext): string {
  const gate = ctx.gate
    ? [
        `- verdict: **${ctx.gate.verdict}**${ctx.gate.pass ? ' (pass)' : ''}`,
        `- perceptual: mean ${ctx.gate.meanDiff ?? '?'}/255 · ${ctx.gate.pctOverThreshold ?? '?'}% of pixels over threshold · ${ctx.gate.regions ?? '?'} region(s)`,
        /**
         * THE UNMEASURED SET, ABOVE THE DELTA COUNT ([[REQ-277]] behaviour 5).
         *
         * Order is the whole point. A round optimising for fewer deltas will
         * avoid adding an axis, which is exactly backwards: every axis the
         * instrument gains can only RAISE the delta count, and [[EPIC-19]]
         * measured that inversion at 1 delta → 14 on a pure improvement. So the
         * number the round is asked to drive is named first, and the sentence
         * under the pair says what a rise in the second one means.
         */
        `- **${headlineOf(ctx.gate.unmeasured)}** — ${breakdownOf(ctx.gate.unmeasured)}. **This is the number to drive down.**`,
        `- values-diff: ${ctx.gate.valueDeltas ?? '?'} delta(s) — a count of what the gate DID compare, so it rises when the instrument sharpens. It is not a score.`,
        ...(ctx.gate.unreferencedImages?.length
          ? [`- mirrored images no manifest element references: ${ctx.gate.unreferencedImages.join(', ')}`]
          : []),
        // REQ-270 — the coverage findings are quoted IN FULL rather than counted.
        // Each one is a statement about the ORACLE, which is the one thing a
        // round cannot re-derive from the evidence: every file it is about to
        // read was produced against that oracle, so a count would tell it a
        // number and leave it to discover the meaning the expensive way.
        ...(ctx.gate.coverageFindings ?? []).map((f) => `- **coverage \`${f.kind}\`** — ${f.detail}`),
        `- diagnosis: ${ctx.gate.diagnosis}`,
        `- next step: ${ctx.gate.nextStep}`,
      ].join('\n')
    : '- no gate report was produced for this round.'

  /**
   * WHAT THE ROUND IS TOLD ABOUT THE KB, and why it is this short.
   *
   * Naming the index and NOT the documents is the whole design. The corpus is
   * around 900 KB; a prompt that listed 52 titles would cost tokens on every
   * round to reproduce a file that is already on disk and already sorted. So
   * the prompt names one file, says what it is for, and stops.
   */
  const kb =
    ctx.kb && ctx.kb.docs.length
      ? [
          `\`${path.join(ctx.kb.dir, INDEX_FILE)}\` — **start here.** ${ctx.kb.docs.length} project document(s), one line each saying what that document answers.`,
          '',
          'The documents themselves are `<DOC-ID>.md` beside the index — `Grep` the directory when you are hunting a term, `Read` the two or three the index points you at. **Do not read the corpus**; it is far larger than a round should spend.',
          '',
          'It is swept from every `doc` ticket and rebuilt this round, so it is current. If the answer to a question is in here, it is cheaper and more reliable than deriving it from source — and a diagnosis that cites a document is one an implementer can check.',
        ].join('\n')
      : `- no knowledge base this round${ctx.kb?.error ? ` — ${ctx.kb.error}` : ''}. Read the engine directly.`

  /**
   * THE AGE OF THE ORACLE, SAID BEFORE THE EVIDENCE IS LISTED ([[REQ-272]]).
   *
   * Placed above the evidence rather than below it because it changes how every
   * file under it must be read. The digest carries the same facts at length; this
   * is the one-paragraph version, because a fact that only appears in a file the
   * round MAY read is a fact the round may miss — and this is the one whose being
   * missed costs a whole round.
   */
  const reference = ctx.reference
    ? [
        ctx.reference.capturedAt
          ? `- captured at **${ctx.reference.capturedAt}**${
              ctx.reference.captureSchema === undefined
                ? ', with no extractor schema stamp — read it as schema 1'
                : ` at extractor schema ${ctx.reference.captureSchema}`
            }.`
          : '- **this bundle carries no capture time**, so how old the oracle under every number below is cannot be told from it. That is a defect in the instrument and worth a bug ticket.',
        ...(ctx.reference.landedSince.length
          ? [
              `- **${ctx.reference.landedSince.length} commit(s) have landed in the engine since.** A residual you are about to file may already be fixed and merely not re-captured — \`1c refold\` re-derives the fold from the oracle this bundle already holds and never re-runs the capture, so a CAPTURE-side fix cannot show up here until the operator re-captures. The digest lists them; check the ones that touch what you are filing.`,
            ]
          : ctx.reference.capturedAt
            ? ['- nothing has landed in the engine since, so every residual below is measured by the instrument running now.']
            : []),
      ].join('\n')
    : '- nothing is recorded about when this reference was taken.'

  const gaps = ctx.knownGaps.length
    ? ctx.knownGaps
        .map(
          (gap) =>
            `- \`${gap.residualClass}\` → **${gap.ticketId}** (\`${gap.ticketUid}\`) · seen on ${gap.references.join(', ')}\n  ${gap.summary}`,
        )
        .join('\n')
    : '- none yet. Anything you find this round is a new class.'

  return `${brief}

---

# This round

Iteration **${ctx.n}** of the reproduction of **${ctx.originalUrl}** (sandbox site \`${ctx.slug}\`).

## The gate

${gate}

## What the project already knows

${kb}

## The reference you are measuring against

${reference}

## Where the evidence is

Every path is absolute and every file is already written. Read them.

- \`${path.join(ctx.evidenceDir, 'gate.json')}\` — the full reconciliation, including the coverage block.
- \`${path.join(ctx.evidenceDir, 'values-diff.json')}\` — the value deltas. **This is your strongest evidence.**
- \`${path.join(ctx.evidenceDir, 'regions.json')}\` — the ranked pixel regions. Read these before the mean; they point, they do not measure. Each entry names its own \`bbox\` and, in \`nodes\`, the manifest records under it from BOTH sides — so a region is quotable as text and you never have to open its crop to find out what is there. A lead on one side and nothing on the other is usually the whole finding.
- \`${path.join(ctx.evidenceDir, 'actual-manifest.json')}\` and \`${path.join(ctx.evidenceDir, 'expected-manifest.json')}\` — the two value manifests the deltas were computed from, reproduction and reference. **Read these when a delta is summarised rather than raw** — \`contentAnchor: center (0.50)\` is a band name and two decimals over a \`sections\` list you can read in full here, on both sides. The two lists are not the same kind of list: the reference's sections are coalesced, the reproduction's are its raw bands, so compare the counts before you trust an index.
- \`${path.join(ctx.evidenceDir, 'actual.png')}\` — the reproduction's own screenshot, the actual side of the perceptual diff. \`1c crop\` it anywhere; the \`region-*-ours.png\` crops only cover what the region ranker picked.
- \`${ctx.bundleDir}\` — the reference bundle: \`capture.json\`, \`raw.html\`, \`multistate.json\`, \`screenshot.full.png\`. **\`raw.html\` is the ground truth.**
- \`${ctx.pageDocument}\` — this iteration's copy of the reproduction's own L1 document, as \`1c page get … --json\` printed it.
- \`${ctx.siteDir}\` — the rendered reproduction.
${
    ctx.digestFile
      ? `- \`${ctx.digestFile}\` — **derived facts, computed by the console from the four files above.** Asset attribution, the key census of the reference manifest, every value delta and every ranked region, already counted. It is a shortcut to the questions rounds keep spending reads on; it is NOT a source. Anything you quote in a ticket, quote from the file it came from.\n`
      : ''
}
The engine you are diagnosing is \`tools/generate/src/\` — the fold, the capture, the L1 substrate, the probes.

## The ticket store

You have \`Bash\`, and it is there so you can run \`xgd\`. Use it: \`xgd ticket list\` and \`xgd ticket get <id>\` are how you find out whether what you are looking at has been seen before. A defect observed twice and never fixed is a stronger ticket than the same defect observed once, and you cannot know which you have without looking.

Read the store through \`xgd\`, never by path — \`.xgd/\`'s layout is xgd's own business and will move.

**You file. Nothing is handed back to be filed for you** — see the brief §6 for the command and §7 for how you report what you made. Create at \`status: draft\`, and **never at a \`ready_*\` status**: that is a dispatcher trigger and it spawns an autonomous pipeline against your ticket within about thirty seconds, before anybody has read it. The console checks every ticket you name after you finish.

**The \`--created-by\` for this round is \`${ROUND_CREATED_BY}:${ctx.slug}#${ctx.n}\`.** Pass it to every \`xgd ticket create\` you run, verbatim. Without it \`xgd\` falls back to the operator's git identity and your ticket arrives claiming a human wrote it; the console reads it back and reports the ticket that does not carry it.

## Where the defect sits — the class every ticket you file carries

**Every ticket you file names where the defect sits**, in the \`${DEFECT_CLASS_FIELD}\` field, from this closed set and no other value. The gap ticket and every secondary \`1c\` bug alike — "every ticket" means every ticket.

${defectClassTable()}

Pass it beside the status:

\`\`\`
--fields '{"status":"draft","${DEFECT_CLASS_FIELD}":["fold-wrong"]}'
\`\`\`

A list, because one gap ticket carries every residual you found: name a second class when an issue in the ticket genuinely sits somewhere else, and put the leading issue's class first. Most tickets carry one.

**And defend each class in one line in the body**, from the evidence you already have — the test you ran and what came back. The field is what a filter reads; the line is what makes it checkable.

\`cannot-tell\` is a real answer and not a failure. A forced choice between the instrument and the engine, made without the evidence to separate them, is confident noise that costs more to unpick than saying so would. If you pick it, say what you would need in order to tell.

The console reads every ticket you name back and reports one that carries no class, or a class that is not in the set. See the brief §5 for what the classes mean and §6 for the command.

## The regression rail

${ctx.rail.summary}

## Classes that already have a ticket

If your diagnosis is one of these, **append to that ticket** and report \`"status": "appended"\` naming it. Do not file a second one.

${gaps}

---

## What you produce

**One gap ticket, and it is not bounded.** If you found five related residuals, the ticket describes five. Do not defer a finding to "a later round": a later round starts from your absence and will never know you saw it. Deferring is losing.

**Anything else you tripped over is its own bug ticket.** A defect in L1, in your own brief, in this console, anywhere in \`1c\` that is not a gap in the reproduction engine — file it separately as a \`bug\`, at \`draft\`, with the same \`--created-by\` and to the same standard of evidence, and **name its id in \`bugTickets\`** in your closing block. Never fold one into the gap ticket. That list is independent of your status: a round that found no engine gap may still have found a bug.

Now do the round. Finish with the JSON block described in §7 of the brief, and nothing after it.
`
}

// ── the tool policy ──────────────────────────────────────────────────────────

/**
 * What the round may do: read the evidence, and run `xgd`.
 *
 * `Bash` IS HERE DELIBERATELY ([[REQ-262]] D7), and it narrows [[REQ-256]]
 * behaviour 3 rather than upholding it. The round needs the ticket store — the
 * first live round went looking for prior art on its own defect and found that
 * the same false positive had been observed once before and shipped without a
 * fix, which was worth saying in its ticket. `xgd` is the API this project
 * exposes to an agent for that, and running it requires a shell.
 *
 * IT COULD NOT BE GIVEN NARROWLY, AND THAT WAS MEASURED — see
 * {@link AI_DISALLOWED_TOOLS} for the numbers. A scoped allow rule of the form
 * `Bash(xgd ticket get:*)` admits `Bash` wholesale and does not enforce the
 * prefix, so there is no half-measure to take: either the round has a shell or
 * it cannot reach the ticket store at all. The operator chose the shell.
 *
 * WHAT THAT COSTS, STATED PLAINLY. "The round writes no code" stops being a
 * property of the process and becomes an instruction in the brief. The engine
 * the round is diagnosing is editable by it. That cost is bounded by machinery
 * that already exists — an un-ticketed edit is drift and `test_fix` eliminates
 * it — and the one genuinely expensive mistake, a ticket created at a `ready_*`
 * status, is asserted against after every round rather than hoped about
 * ([[REQ-262]] requirement 11, `readyStatusFindings`).
 */
export const AI_ALLOWED_TOOLS: readonly string[] = ['Read', 'Glob', 'Grep', 'Bash']

/**
 * What the round may not do, named rather than merely omitted.
 *
 * NAMING IS WHAT WORKS, AND THIS HAS NOW BEEN MEASURED TWICE.
 *
 *  1. [[REQ-256]], and re-confirmed on today's CLI: a tool left off the allow
 *     list is still IN the session — merely unapproved — and a round asked to
 *     run `echo` through an unapproved `Bash` ran it, `permission_denials: []`.
 *  2. [[REQ-262]] D5: naming a PREFIX does not narrow the tool either. With
 *     `--allowedTools 'Bash(xgd ticket get:*)'` and `Bash` absent from this
 *     list, a round asked to run `echo MEASURED-B` ran it, exit 0, again with
 *     `permission_denials: []`. A prefix rule ADMITS `Bash`; it does not scope
 *     it.
 *
 * Both runs are reproducible from `measurements/tool-gating.sh`, which
 * carries the numbers beside the script that produced them. The second is why
 * `Bash` is in {@link AI_ALLOWED_TOOLS} whole rather than scoped: there was no
 * scoped version to have.
 *
 * A tool named HERE is removed from the session's tool list outright, and that
 * is still the only mechanism observed to gate anything.
 *
 * Three families, and the reason for each:
 *
 *  - **authoring** — `Edit`, `Write`, `NotebookEdit`. The direct route. `Bash`
 *    is no longer among them and the round can write through it; these stay
 *    denied because removing them costs the round nothing it needs and keeps
 *    the cheap paths to an edit closed.
 *  - **delegation** — `Task`, `Workflow`, `Skill`. An agent this round spawned
 *    would not inherit this list, so a spawner is an authoring tool wearing a
 *    different name.
 *  - **the network** — `WebFetch`, `WebSearch`, `RemoteTrigger`, `SendMessage`,
 *    `PushNotification`, `DesignSync`. Nothing about diagnosing a reproduction
 *    needs to leave this machine, and a round that can reach out is a round
 *    whose evidence could have come from somewhere other than the capture.
 *  - **the machine's own state** — `CronCreate`, `CronDelete`, `EnterWorktree`,
 *    `ExitWorktree`. A dev tool that can schedule work or move the checkout it
 *    is diagnosing has left the round's job behind.
 *
 * The list is enumerated, which means it can go stale as the CLI grows tools.
 * That is an accepted cost rather than an oversight: the alternative is trusting
 * an allow list that was measured not to gate. When the CLI gains a tool that
 * can act, it belongs here — and the session's reported tool list, printed in
 * the transcript's first line, is where that would be noticed.
 */
export const AI_DISALLOWED_TOOLS: readonly string[] = [
  'Edit',
  'Write',
  'NotebookEdit',
  'Task',
  'Workflow',
  'Skill',
  'WebFetch',
  'WebSearch',
  'RemoteTrigger',
  'SendMessage',
  'PushNotification',
  'DesignSync',
  'CronCreate',
  'CronDelete',
  'EnterWorktree',
  'ExitWorktree',
]

/**
 * The permission mode the round runs under.
 *
 * STATED, NEVER INHERITED. A settings file — the operator's, the project's —
 * may carry `defaultMode: auto`, and a round that inherited it would approve
 * its own tool calls. Defence in depth rather than the gate: what actually
 * stops a round acting is {@link AI_DISALLOWED_TOOLS}, because a tool merely
 * left unapproved was measured to run anyway.
 */
export const AI_PERMISSION_MODE = 'manual'

/**
 * No settings sources at all.
 *
 * The other half of the same argument: an `allow` rule in any settings file
 * would widen what the round may do, and the console cannot assert behavior 3
 * about a tool set that a file outside this repository can extend. Loading none
 * makes the argv the whole of the policy — which is the only version of it a
 * test can check.
 */
export const AI_SETTING_SOURCES = ''

/** The executable, and the model, both overridable by an operator. */
export const AI_COMMAND_ENV = 'REPRO_CONSOLE_AI'
export const AI_MODEL_ENV = 'REPRO_CONSOLE_AI_MODEL'

export interface AiCommand {
  command: string
  args: string[]
}

/** Everything about one invocation that is not fixed by the policy. */
export interface AiCommandOptions {
  /** Continue this CLI session rather than starting a new one (behavior 3). */
  resume?: string
}

/**
 * The `claude -p` invocation.
 *
 * A pure function of the environment so the tool policy is assertable without
 * spawning anything — which is the only way a test can prove that the process
 * the console starts cannot write code.
 *
 * `--output-format stream-json` is what makes behavior 2's streaming transcript
 * possible at all; `--verbose` is required alongside it, and the prompt arrives
 * on stdin rather than in the argv because it carries the whole brief.
 */
export function claudeCommand(env: NodeJS.ProcessEnv = process.env, opts: AiCommandOptions = {}): AiCommand {
  const model = env[AI_MODEL_ENV]?.trim()
  return {
    command: env[AI_COMMAND_ENV]?.trim() || 'claude',
    args: [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      AI_PERMISSION_MODE,
      '--setting-sources',
      AI_SETTING_SOURCES,
      '--allowedTools',
      ...AI_ALLOWED_TOOLS,
      '--disallowedTools',
      ...AI_DISALLOWED_TOOLS,
      ...(model ? ['--model', model] : []),
      /**
       * RESUME IS A FLAG, NOT A SECOND MODE ([[REQ-261]] behavior 3).
       *
       * Everything above it — the permission mode, the empty settings sources,
       * both tool lists — is identical on a resumed round, so behavior 3 is the
       * same property on iteration 7 as on iteration 1. A resumed round inherits
       * nothing from its predecessor except the conversation.
       */
      ...(opts.resume ? ['--resume', opts.resume] : []),
    ],
  }
}

// ── the transcript ───────────────────────────────────────────────────────────

/** One-line-per-thing, for a `<pre>` a human reads while it happens. */
export function formatStreamEvent(raw: string): string[] {
  let event: Record<string, unknown>
  try {
    event = JSON.parse(raw) as Record<string, unknown>
  } catch {
    // Not every line a CLI prints is its protocol. Keeping it is better than
    // dropping it: the commonest reason for a round to produce nothing useful
    // is a refusal printed in plain text.
    return raw.trim() ? [raw.trimEnd()] : []
  }
  const type = event.type
  if (type === 'system') {
    /**
     * ONLY `init` IS A SESSION STARTING ([[REQ-261]] behavior 4).
     *
     * Every `system` event used to print `— session started`, and the observed
     * round printed that line 74 times in a 175-line transcript because the CLI
     * emits `system` for its own bookkeeping too. A bookkeeping event is worth
     * one line naming what it was — a compaction boundary matters to a resumed
     * round — and is worth nothing at all when it names nothing.
     */
    if (event.subtype !== undefined && event.subtype !== 'init') {
      return typeof event.subtype === 'string' ? [`— ${event.subtype}`] : []
    }
    if (event.subtype === undefined && typeof event.model !== 'string') return []
    return [`— session started${modelOf(event) ? ` (${modelOf(event)})` : ''}`]
  }
  if (type === 'assistant' || type === 'user') {
    const message = event.message as { content?: unknown } | undefined
    const content = Array.isArray(message?.content) ? message.content : []
    const lines: string[] = []
    for (const block of content as Array<Record<string, unknown>>) {
      if (block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
        lines.push(block.text.trimEnd())
      } else if (block.type === 'tool_use') {
        lines.push(`→ ${String(block.name)} ${summariseToolInput(block.input)}`)
      } else if (block.type === 'tool_result') {
        lines.push(`← ${block.is_error === true ? 'refused' : 'ok'}`)
      }
    }
    return lines
  }
  if (type === 'result') {
    /**
     * THE RESULT IS NOT REPRINTED ([[REQ-261]] behavior 4).
     *
     * `result.result` is the assistant's final message, which has already been
     * printed as an `assistant` event — so echoing it put every round's whole
     * diagnosis in the transcript twice, half of the observed round's 22KB. What
     * this event uniquely knows is what the round COST (behavior 6), so that is
     * what its one line says.
     */
    return [`— round finished${describeCost(readCost(event)) ? ` · ${describeCost(readCost(event))}` : ''}`]
  }
  return []
}

/** The model an init event names, wherever that CLI version puts it. */
function modelOf(event: Record<string, unknown>): string {
  if (typeof event.model === 'string') return event.model
  const info = event.modelInfo as { id?: unknown; name?: unknown } | undefined
  if (typeof info?.name === 'string') return info.name
  return typeof info?.id === 'string' ? info.id : ''
}

/** The cost and shape of a round, out of its `result` event (behavior 6). */
export function readCost(event: Record<string, unknown>): RoundCost {
  const usage = (event.usage ?? {}) as Record<string, unknown>
  const num = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined)
  return {
    costUsd: num(event.total_cost_usd) ?? num(event.cost_usd),
    durationMs: num(event.duration_ms),
    turns: num(event.num_turns),
    inputTokens: num(usage.input_tokens),
    outputTokens: num(usage.output_tokens),
  }
}

/**
 * The round's cost as one line, for the transcript and for the page.
 *
 * Empty when nothing is known rather than a row of dashes: a console that
 * printed `$— · —` would be claiming to have measured something it did not.
 */
export function describeCost(cost: RoundCost | undefined): string {
  if (!cost) return ''
  const parts: string[] = []
  if (cost.model) parts.push(cost.model)
  if (cost.costUsd !== undefined) parts.push(`$${cost.costUsd.toFixed(2)}`)
  if (cost.durationMs !== undefined) parts.push(formatDuration(cost.durationMs))
  if (cost.turns !== undefined) parts.push(`${cost.turns} turn${cost.turns === 1 ? '' : 's'}`)
  if (cost.inputTokens !== undefined || cost.outputTokens !== undefined) {
    parts.push(`${thousands(cost.inputTokens)}→${thousands(cost.outputTokens)} tok`)
  }
  return parts.join(' · ')
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

function thousands(value: number | undefined): string {
  if (value === undefined) return '?'
  return value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value)
}

/** A tool call in one line — enough to follow, not enough to drown the pane. */
function summariseToolInput(input: unknown): string {
  if (typeof input !== 'object' || input === null) return ''
  const record = input as Record<string, unknown>
  const first = record.command ?? record.file_path ?? record.pattern ?? record.path
  const text = typeof first === 'string' ? first : JSON.stringify(record)
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat
}

// ── the outcome block ────────────────────────────────────────────────────────

/**
 * Every balanced JSON object in a text, latest first ([[REQ-261]] behavior 1).
 *
 * THE PARSE MUST NOT DEPEND ON FENCE DISCIPLINE. It used to: the outcome block
 * was found with a lazy ```…``` regex, and a gap ticket that quotes
 * `gate.json` inside its own body — exactly what the brief demands — carries
 * those fences as literal characters inside a JSON string. The lazy match
 * stopped at the first of them, and the first live round's 7,500-character
 * answer was truncated at 1,130 and thrown away. The better the ticket, the more
 * certainly that fired.
 *
 * So the scan is for BRACES and it is string-aware: a `{`, `}` or a fence inside
 * a JSON string is data, and only an escape-aware walk can tell the difference.
 *
 * FROM THE END, AND WITHOUT SKIPPING. Every `{` is tried as a start, in reverse,
 * so a stray brace in the round's prose can neither swallow the real block nor
 * hide it: a start that does not parse is simply not a candidate. The nested
 * objects inside the answer (`ticket`, each `bugs` entry) are reached first and
 * rejected for carrying no `status`, which is what makes the outermost one win.
 */
export function* jsonObjectsFromEnd(text: string): Generator<unknown> {
  const starts: number[] = []
  for (let i = 0; i < text.length; i += 1) if (text[i] === '{') starts.push(i)
  for (let i = starts.length - 1; i >= 0; i -= 1) {
    const end = balancedEnd(text, starts[i])
    if (end === -1) continue
    try {
      yield JSON.parse(text.slice(starts[i], end + 1))
    } catch {
      // Not JSON from here. A `{` in prose, or one inside a string this scan
      // started in the middle of — either way, not the round's answer.
    }
  }
}

/** The index of the `}` closing the object that opens at `start`, or -1. */
function balancedEnd(text: string, start: number): number {
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * The JSON block the round finishes with (requirement 20).
 *
 * The LAST parseable object carrying a `status` wins: a round that shows an
 * example of the shape before filling it in — which they do — must not have its
 * example read as its answer.
 *
 * A claim that does not carry what its status requires is a FAILED round, not a
 * partly-honoured one. `filed` without a ticket body would file an empty
 * ticket; `appended` without evidence would append nothing. Either is worse
 * than saying the round did not produce an answer.
 */
export function parseOutcome(finalText: string): AiOutcome {
  for (const parsed of jsonObjectsFromEnd(finalText)) {
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) continue
    const outcome = parsed as Record<string, unknown>
    if (typeof outcome.status !== 'string') continue
    if (!CLAIMABLE_STATUSES.includes(outcome.status as AiStatus)) {
      return {
        status: 'failed',
        reason: `the round claimed a status it may not claim: '${outcome.status}'`,
      }
    }
    const status = outcome.status as AiStatus
    const base: AiOutcome = {
      status,
      residualClass: str(outcome.residualClass),
      summary: str(outcome.summary),
      reason: str(outcome.reason),
      // Carried on EVERY status ([[REQ-261]] behavior 2, now as ids). A round
      // that found no engine gap may still have tripped over a defect in L1 or
      // in its own brief, and this list is the only shape it has to report one
      // in. Ids rather than drafts since [[REQ-262]] D10: the round filed them.
      ...(ticketIds(outcome.bugTickets).length ? { bugTickets: ticketIds(outcome.bugTickets) } : {}),
    }
    /**
     * A CLAIM TO HAVE FILED IS A TICKET ID ([[REQ-262]] D10, requirement 17).
     *
     * The round runs `xgd ticket create` itself now, so what it reports is what
     * it DID, not what it would like done. The id is what makes the claim
     * checkable: the console reads that ticket back and records the status it
     * really carries. A claim with no id is unverifiable, and an unverifiable
     * claim to have filed is worse than an honest failure — it would put a
     * round on the page as successful with nothing behind it.
     */
    if (status === 'filed' || status === 'appended') {
      const ticketId = str(outcome.ticketId)
      if (!ticketId) {
        return {
          status: 'failed',
          reason: `the round claimed to have ${status} but named no ticket id, so there is nothing to read back.`,
        }
      }
      if (!base.residualClass) {
        return { status: 'failed', reason: `the round claimed to have ${status} without naming its residual class.` }
      }
      return { ...base, ticketId }
    }
    return base
  }
  return { status: 'failed', reason: 'the round produced no outcome block.' }
}

/**
 * AN OUTCOME COMING BACK OFF DISK, NORMALISED ([[BUG-125]]).
 *
 * THE RULE THE CONSOLE ALREADY HOLDS `1c` TO, APPLIED TO ITS OWN ARTIFACT.
 * `readIterations` normalises the manifest field by field and `readGateReport`
 * does the same for the verdict, both because the console must render an
 * artifact written by any earlier version of itself. This boundary did not: it
 * spread what `JSON.parse` returned and asserted it was an {@link AiOutcome},
 * so the compiler agreed a field was there that the file on disk had never
 * heard of. [[REQ-276]] then added `defectClasses` as required, and every round
 * recorded before it took the whole page down on open — the iteration list, the
 * verdict, the diff links and the reference line, lost because one ticket in
 * one round could not be classified.
 *
 * So every field the code declares required is GIVEN A VALUE HERE, whatever the
 * file carries, and a field the artifact does not have costs what it names
 * rather than the page. `status` is the one exception: an outcome with no
 * status is not a round that lost a field, it is not an outcome at all, and the
 * caller already reads that as "this iteration has no round".
 */
export function normaliseOutcome(parsed: unknown): AiOutcome | null {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
  const raw = parsed as Record<string, unknown> & Partial<AiOutcome>
  if (typeof raw.status !== 'string') return null
  return {
    ...raw,
    status: raw.status as AiStatus,
    violations: lines(raw.violations),
    observations: lines(raw.observations),
    // ABSENCE IS KEPT AS ABSENCE for the two lists that have it: a round that
    // named no secondary bug and one that read none back are not the same as a
    // round whose read-back came out empty, and only the file can say which.
    ...(raw.bugTickets === undefined ? {} : { bugTickets: ticketIds(raw.bugTickets) }),
    ...(raw.ticketsRead === undefined ? {} : { ticketsRead: readTickets(raw.ticketsRead) }),
  }
}

/** The read-back list, each entry standing or falling on its own. */
function readTickets(value: unknown): ReadTicket[] {
  if (!Array.isArray(value)) return []
  return value.map(normaliseReadTicket)
}

/**
 * One restored read-back ([[BUG-125]] behaviour 3).
 *
 * A MALFORMED ENTRY COSTS ITSELF, NOT ITS NEIGHBOURS. An entry that is not an
 * object, or whose `id` or `status` is the wrong type, comes back as
 * {@link unreadTicket} — the shape a ticket the console could not read already
 * has — so the rest of the round's filings still render. Dropping it instead
 * would make a round look as though it had filed one ticket fewer than it did.
 */
export function normaliseReadTicket(value: unknown): ReadTicket {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return unreadTicket('')
  const raw = value as Record<string, unknown>
  const id = typeof raw.id === 'string' ? raw.id : ''
  if (!id || typeof raw.status !== 'string') return unreadTicket(id)
  return {
    id,
    status: raw.status,
    createdBy: typeof raw.createdBy === 'string' ? raw.createdBy : '',
    // Parsed rather than trusted, by the same function the live read-back uses
    // on the field as `xgd` prints it. An entry written before [[REQ-276]] has
    // no classes at all, which reads as a round that classified nothing — which
    // is what it was — and NOT as a violation: the unclassified-ticket check
    // belongs to the live path, where the console can still see the store.
    defectClasses: parseDefectClasses(raw.defectClasses),
    found: raw.found === true,
  }
}

/** A restored list of prose lines, dropping anything that is not one. */
function lines(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

/**
 * The secondary ticket ids a round reports, dropping anything that is not one.
 *
 * DROPPED, NOT FAILED — unlike the gap ticket. A missing gap id fails the round
 * because the gap IS the deliverable. A malformed entry here is an aside:
 * losing it costs one aside, and failing the whole round over it would throw
 * away the diagnosis too.
 */
function ticketIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(str).filter((id): id is string => id !== undefined)
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

// ── running it ───────────────────────────────────────────────────────────────

export interface AiRunOptions {
  /** Repo root — the round reads the engine and the evidence from here. */
  cwd: string
  /** The whole prompt: the brief plus this round's evidence. */
  prompt: string
  /** Called with each transcript line as it arrives (behavior 2). */
  onLine: (line: string) => void
  /**
   * The session a previous round on this reproduction left ([[REQ-261]] b3).
   *
   * Absent on the first round of a chain, and on any round whose chain was
   * reset — see `session.ts`, which owns when that happens and why.
   */
  resume?: string
}

/** Runs one AI round and resolves with what it claims it did. Injectable. */
export type AiRunner = (opts: AiRunOptions) => Promise<AiOutcome>

/**
 * The real runner: `claude -p`, one process per round.
 *
 * The prompt goes in on stdin and the transcript comes back as NDJSON on
 * stdout, line by line, so the page can show the round working rather than only
 * its result. A round that dies without a result is a failed round, not a
 * thrown exception — the console has an iteration on the page either way and
 * has to say something under it.
 */
export function spawnAiRunner(env: NodeJS.ProcessEnv = process.env): AiRunner {
  /**
   * A RESUME THAT WILL NOT START IS NOT A FAILED ROUND ([[REQ-261]] b3).
   *
   * The session id is the console's memory of something the CLI owns and prunes.
   * When the conversation it names has gone, the round must not die with it — so
   * a resumed attempt that produced nothing is retried once from scratch, and
   * the transcript says so rather than leaving an unexplained empty round.
   */
  const runner: AiRunner = async (opts) => {
    const first = await attempt(env, opts, opts.resume)
    // RETRIED ONLY WHEN THE SESSION NEVER STARTED. `sessionId` comes from the
    // init event, so its absence means the CLI refused before the round began —
    // which is the one failure a fresh session fixes. A round that ran and then
    // failed to produce a usable answer is NOT retried: that would pay for the
    // same round twice, and behavior 5 recovers it from its transcript for free.
    if (!opts.resume || first.status !== 'failed' || first.sessionId !== undefined) return first
    opts.onLine(`— could not resume ${opts.resume}; starting a fresh session`)
    return attempt(env, opts, undefined)
  }
  return runner
}

/** One `claude -p` process, resumed or not. */
function attempt(env: NodeJS.ProcessEnv, opts: AiRunOptions, resume: string | undefined): Promise<AiOutcome> {
  return new Promise<AiOutcome>((resolve) => {
    const { command, args } = claudeCommand(env, { resume })
    const child = spawn(command, args, { cwd: opts.cwd, stdio: ['pipe', 'pipe', 'pipe'] })
    let pending = ''
    let finalText = ''
    let stderr = ''
    // Read off the stream rather than guessed at (behavior 6): what the CLI
    // chose and what the round cost, neither of which was recorded before.
    let cost: RoundCost = {}
    let sessionId: string | undefined

    const consume = (chunk: string, flush = false): void => {
      pending += chunk
      const lines = pending.split('\n')
      pending = flush ? '' : (lines.pop() ?? '')
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line) as Record<string, unknown>
          if (event.type === 'result') {
            if (typeof event.result === 'string') finalText = event.result
            cost = { ...readCost(event), model: cost.model }
          }
          if (event.type === 'system' && event.subtype === 'init') {
            if (typeof event.session_id === 'string') sessionId = event.session_id
            if (typeof event.model === 'string') cost.model = event.model
          }
        } catch {
          // Not protocol — still shown, see formatStreamEvent.
        }
        for (const formatted of formatStreamEvent(line)) opts.onLine(formatted)
      }
    }

    child.stdout.on('data', (chunk: Buffer) => consume(chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
    child.on('error', (err: Error) => {
      opts.onLine(`— could not start ${command}: ${err.message}`)
      resolve({ status: 'failed', reason: `could not start ${command}: ${err.message}` })
    })
    child.on('close', () => {
      consume('', true)
      const observed = { cost, ...(sessionId ? { sessionId } : {}) }
      if (!finalText.trim()) {
        const why = stderr.trim().split('\n').filter((l) => /\w/.test(l)).slice(-3).join('\n')
        resolve({ status: 'failed', reason: why || 'the round produced no final message.', ...observed })
        return
      }
      resolve({ ...parseOutcome(finalText), ...observed })
    })

    child.stdin.write(opts.prompt)
    child.stdin.end()
  })
}
