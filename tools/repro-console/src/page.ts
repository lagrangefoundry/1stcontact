/**
 * The console's two rendered pages (REQ-254).
 *
 * SERVER-RENDERED, DELIBERATELY. The iteration list is markup the server emits
 * on every request, not something a client script assembles from JSON. One
 * definition of the markup, no build step, no bundle, and the page survives a
 * reload with its history intact. The only thing the browser script does is
 * update the one status line and reload when the version moves — see
 * {@link POLL_SCRIPT}.
 */

import type { MeasurementView } from './unmeasured'

/** One finished iteration, as the page shows it. */
export interface IterationView {
  n: number
  /** The live site, for comparison — the address the capture actually answered on. */
  originalUrl: string
  /** This iteration's rendered reproduction, served by the console. */
  reproHref: string
  /** This iteration's diff images, served by the console. */
  diffHref: string
  /**
   * This iteration's copy of the reproduction's own L1 document.
   *
   * The fourth link (requirement 34). The three above it are renderings; this
   * is the thing that was rendered, and it is where a fold change actually
   * shows up. ([[REQ-256]]'s gap-ticket link is a fifth, not this one.)
   */
  pageHref: string
  /**
   * The fifth link: the gap ticket this round filed ([[REQ-256]] behavior 5).
   *
   * Absent on a round that filed nothing — a `capture-incomplete` stop, a
   * `no-gap` verdict, a failed round — because a link to a ticket that does not
   * exist is worse than no link.
   */
  ticketHref?: string
  ticketLabel?: string
  /**
   * The bugs this round tripped over on the way ([[REQ-261]] behavior 2).
   *
   * Peers of the gap link rather than a sub-list: they are peers as tickets —
   * same console, same `draft` status, same round — and the only thing that
   * differs is which of the round's two deliverables they came from.
   */
  extraTickets?: Array<{ href: string; label: string }>
  /**
   * THIS ITERATION'S TWO NUMBERS, IN THE ORDER THEY MUST BE READ ([[REQ-277]]).
   *
   * The unmeasured set is the headline and the delta count sits under it. The
   * delta count is not removed — it is exact, it is the strongest evidence a
   * ticket can carry, and it is what the round reads — it is simply no longer
   * the thing the eye lands on first, because it can only RISE when the
   * instrument sharpens. [[EPIC-19]] measured that inversion: [[BUG-107]] added
   * `role` comparison and took a reproduction from 1 delta to 14 with nothing
   * about the page having changed.
   */
  measurement?: MeasurementView
  /** `1c gate`'s verdict for this round, shown beside the links. */
  verdict?: string
  /** What the regression rail said this round (behavior 8). */
  rail?: string
  /** The AI round under this iteration, if one ran. */
  ai?: AiView
  /**
   * Where to post to START the round on this iteration ([[REQ-272]] part 1,
   * behaviour 2).
   *
   * Absent while something is running and on an iteration whose round already
   * reached an answer — the console never offers a button that would spend a
   * round's money on a question already answered.
   */
  diagnoseHref?: string
  diagnoseLabel?: string
  /**
   * Which reference this iteration measured against ([[REQ-272]] part 2).
   *
   * On EVERY iteration, because `re-captured` is a statement about a comparison
   * and a comparison needs both sides visible. A chain whose reference moved
   * half way through then reads as one chain with a marked seam in it, rather
   * than as a score that jumped for no reason a reader can see.
   */
  reference?: ReferenceView
}

/** The reference bundle one iteration used, and whether it moved to get there. */
export interface ReferenceView {
  /** `<host>/<pathSlug>` — the bundle's own name. */
  bundle: string
  /** When those bytes were taken, when the bundle records it. */
  capturedAt?: string
  /** This iteration re-captured; its numbers are not comparable with the one above. */
  recaptured?: boolean
}

/**
 * The loop, held after a round filed ([[REQ-272]] part 1, behaviour 3).
 *
 * Carries what it is waiting for rather than only the fact of waiting: an
 * operator returning to this page after an hour has to be able to read WHY the
 * button is inert without reconstructing it from the round above.
 */
export interface HeldView {
  /** The iteration whose filing is holding the loop. */
  n: number
  /** One sentence: what landed, and what has to happen before the loop advances. */
  waitingFor: string
  /** Where to post the operator's "it has landed". */
  releaseHref: string
}

/**
 * What the AI round under an iteration says about itself (REQ-256).
 *
 * Rendered server-side from the round's own artifacts on disk, exactly like
 * every other part of an iteration, so a restart of the console shows the
 * rounds it already ran rather than an empty page beside a full `storage/tmp/`.
 * The only thing streamed is the round currently in flight — see
 * {@link PollState.live}.
 */
export interface AiView {
  status: 'running' | 'filed' | 'appended' | 'no-gap' | 'stopped' | 'failed'
  /** One line under the heading: what the round did, or why it did not. */
  summary: string
  /** The kind of gap, not the symptom on this site. */
  residualClass?: string
  ticketId?: string
  /** What ran the round and what it cost ([[REQ-261]] behavior 6), pre-formatted. */
  cost?: string
  /**
   * WHERE THIS ROUND'S FILINGS SIT ([[REQ-276]] behaviour 3), pre-formatted.
   *
   * `2 ruler (fold-wrong, instrument-blind), 1 ceiling (l1-cannot-express)` —
   * the same clause the status line carries, kept under the round so it is
   * still readable once the status line has moved on. Absent when nothing the
   * round filed carried a class, which is a violation and says so there rather
   * than pretending to a split it does not have.
   */
  classSplit?: string
  /**
   * Where to post to file from this round's transcript ([[REQ-261]] b5).
   *
   * Present only on a failed round that left one — which is exactly the round
   * whose diagnosis is on disk beside a message saying it produced nothing.
   */
  recoverHref?: string
  /**
   * Behaviours 3 and 4's falsifiers, when either fired.
   *
   * SHOWN, NOT LOGGED. A check whose failure is invisible is not a check, and
   * these two are the whole reason a diagnose-only AI is safe to run at all.
   */
  violations: string[]
  /**
   * What happened alongside the round and is charged to nobody ([[BUG-114]]).
   *
   * Rendered under the violations and deliberately unlike them: no red, no
   * accusation, and absent altogether in the ordinary round. A reader has to be
   * able to tell "the round did this" from "this happened" at a glance, or the
   * violations stop being read as violations.
   */
  observations?: string[]
  /** What the round did, as it did it. Empty until the first line arrives. */
  transcript: string
}

/** A capture already on disk, offered back on the blank page (requirement 31). */
export interface StoredCaptureView {
  name: string
  url: string
}

export interface PageState {
  /** Bumped whenever the iteration list changes; the poller reloads when it moves. */
  version: number
  running: boolean
  /** What is happening, or what failed. Empty before the first run. */
  message: string
  /** Whether {@link message} is a failure rather than progress. */
  failed: boolean
  /** The address currently loaded, if any — what [recapture] would re-capture. */
  url: string | null
  iterations: IterationView[]
  /** The captures on disk, so a site can be revisited without re-hitting it. */
  stored: StoredCaptureView[]
  /** Why the loop will not advance, when it will not ([[REQ-272]] part 1). */
  held: HeldView | null
  /**
   * A standing condition of the checkout, above the iteration list ([[BUG-114]]).
   *
   * NOT A RESULT AND NOT A MESSAGE. {@link message} is what is happening right
   * now and is replaced by the next thing that happens; an iteration's own lines
   * are what one round produced. This is neither: it is true until somebody runs
   * a command, and it stays on the page until they do. One at a time, because a
   * list of standing notices is a list nobody reads.
   */
  notice?: string
  /**
   * What this loop has filed, by queue ([[REQ-276]] behaviour 4).
   *
   * Above the iterations because it is about all of them. The per-round split
   * answers "what did that round buy"; this answers the question [[EPIC-19]]
   * needed a human-directed audit of ten ticket bodies to answer — how much of
   * this loop has been making the ruler trustworthy and how much has raised the
   * product's ceiling. Absent until a round has filed something carrying a
   * class.
   */
  filings?: FilingsView
  /**
   * THE LOADED REFERENCE IS BEHIND THE EXTRACTOR ([[BUG-120]] behaviour 4).
   *
   * `staleCaptureDetail`'s own sentence, reused rather than restated, and
   * rendered BESIDE the chain it is about rather than under the round that
   * discovered it. It used to be the fact that decided which continuation was
   * worth pressing; with one verb left ([[REQ-299]] part 1) it is a fact about
   * the rows above it instead, and no less true for that:
   * against a bundle this far back the iterations above it cannot see an axis
   * the stored oracle never had. Absent when the bundle is current, because
   * then there is nothing about those numbers that needs explaining.
   */
  staleReference?: string
}

/** The loop's filings, grouped by queue and then by class ([[REQ-276]]). */
export interface FilingsView {
  /** The one-line split, as the status line says it. */
  split: string
  groups: QueueGroupView[]
}

export interface QueueGroupView {
  queue: string
  /** How many distinct tickets landed in this queue. */
  tickets: number
  classes: Array<{ id: string; tickets: string[] }>
}

/**
 * What the poller asks for, once a second.
 *
 * DELIBERATELY SMALLER THAN {@link PageState}. The page state carries every
 * iteration's whole transcript, which is the right thing to render once and the
 * wrong thing to send every second. The only transcript on the wire here is the
 * one round that is still moving.
 */
export interface PollState {
  version: number
  running: boolean
  message: string
  failed: boolean
  /** The round in flight and what it has said so far (behavior 2). */
  live: { n: number; text: string } | null
  /**
   * Whether the loop is held ([[REQ-272]] part 1, behaviour 3).
   *
   * A boolean rather than the whole {@link HeldView}: the sentence is rendered
   * into the page and the page reloads when the version moves, so all the poller
   * needs between reloads is enough to keep the held button inert.
   */
  held: boolean
}

/**
 * Escaped, with `backticked` spans rendered as code.
 *
 * The notices name commands, and a command an operator is meant to type reads
 * as one when it looks like one. Escaping happens FIRST, so the markup this
 * adds is the only markup in the result.
 */
function inlineCode(value: string): string {
  return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>')
}

/**
 * `disabled`, and WHY it is disabled ([[BUG-130]] behaviour 2).
 *
 * The console disables a control for two unrelated reasons and the `disabled`
 * attribute records neither: a round is in flight and the machine is working, or
 * the loop is held ([[REQ-272]] part 1, behaviour 3) and the machine is waiting
 * on the operator. One says wait and the other says your turn, and an operator
 * who cannot tell them apart presses nothing — which is the more expensive of
 * the two mistakes, because the loop simply stalls.
 *
 * So the reason goes in the markup rather than in the stylesheet's guesswork.
 * The cursor is then a rule keyed on it, and — the part a hover could not do — a
 * test can read which state the page is in instead of a human reading a cursor.
 *
 * ATTRIBUTE ORDER IS LOAD-BEARING: `disabled` comes first so that the
 * `data-held="1" disabled` pair [[REQ-272]] and [[BUG-120]] assert as contiguous
 * text stays contiguous. This ticket adds a fact to the markup; it does not get
 * to invalidate the evidence already standing on it.
 *
 * `running` wins when both apply. It is the one that is true about the machine,
 * and the hold has not begun to be the operator's problem until the round that
 * would have filed it has finished.
 */
function inertAttrs(reason: 'running' | 'held' | null): string {
  return reason ? ` disabled data-inert="${reason}"` : ''
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The poller. Two jobs and no more: keep the status line and the buttons honest
 * while a run is in flight, and reload when the server says the iteration list
 * has changed. Reloading rather than re-rendering is what keeps the markup
 * defined in exactly one place.
 */
const POLL_SCRIPT = `
const page = Number(document.body.dataset.version);
async function poll() {
  try {
    const state = await (await fetch('/state')).json();
    if (state.version !== page) { location.reload(); return; }
    const line = document.getElementById('status');
    line.textContent = state.message;
    line.className = state.failed ? 'failed' : 'progress';
    // A held button stays inert between reloads ([[REQ-272]] part 1, b3).
    // Keying on state.running alone would re-enable the held control a second
    // after the round that held it finished - the press the hold exists to stop.
    //
    // WHY IT IS INERT IS RE-COMPUTED WITH WHETHER IT IS ([[BUG-130]] b1). The
    // reason is an attribute the stylesheet reads, so a reason set once at
    // render time would be a lie one second after a round ends: the button that
    // was busy becomes the button that is held, and would go on claiming the
    // machine was working. Same argument as the line above, one field over.
    for (const button of document.querySelectorAll('button')) {
      const held = state.held && button.dataset.held === '1';
      button.disabled = state.running || held;
      if (state.running) button.dataset.inert = 'running';
      else if (held) button.dataset.inert = 'held';
      else delete button.dataset.inert;
    }
    // The AI round in flight (REQ-256 behavior 2). One element, replaced whole:
    // the transcript is short enough that diffing it would be more code than
    // it saves, and the server is the single definition of what it says.
    if (state.live) {
      const pane = document.getElementById('ai-transcript-' + state.live.n);
      if (pane && pane.textContent !== state.live.text) {
        const atBottom = pane.scrollTop + pane.clientHeight >= pane.scrollHeight - 4;
        pane.textContent = state.live.text;
        if (atBottom) pane.scrollTop = pane.scrollHeight;
      }
    }
  } catch {}
  setTimeout(poll, 1000);
}
poll();
`

const STYLE = `
:root { color-scheme: light dark }
body { font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; margin: 3rem auto; max-width: 42rem; padding: 0 1rem }
form { display: flex; gap: .5rem }
input { flex: 1; padding: .5rem .6rem; font: inherit }
button { padding: .5rem 1rem; font: inherit; cursor: pointer }
button[disabled] { cursor: not-allowed; opacity: .5 }
/* WAIT AND YOUR-TURN ARE DIFFERENT INSTRUCTIONS ([[BUG-130]] behaviour 1). A
   console disables a control for two unrelated reasons - a round is in flight,
   or the loop is held on the operator - and a progress cursor is the idiom for
   only the first. Rendered for the second it says the machine is working when
   the machine is waiting, and an operator who reads the cursor stops reading:
   the sentence explaining the hold, and the button that lifts it, sit one
   element away. not-allowed is the default above because it is the honest
   answer for every other way a control can be inert. */
button[disabled][data-inert="running"] { cursor: progress }
#status { min-height: 1.5em; margin: 1rem 0 }
#status.failed { color: #c0392b; white-space: pre-wrap }
#status.progress { opacity: .7 }
h2 { margin: 2rem 0 .25rem; font-size: 1rem }
ul { margin: 0; padding-left: 1.2rem }
form.inline { display: inline }
button.link { background: none; border: 0; padding: 0; font: inherit; color: inherit; text-decoration: underline; cursor: pointer }
figure { margin: 1.5rem 0 }
figure img { max-width: 100%; border: 1px solid #8884 }
.triptych { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem }
.triptych figcaption { font-size: .8rem; opacity: .7 }
/* BUG-99 — the caption spans the three cells rather than becoming a fourth. */
.triptych .region-caption { grid-column: 1 / -1; font-size: .85rem; opacity: .9; font-family: ui-monospace, monospace }
.verdict, .rail, .ai-status, .reference { margin: .25rem 0; font-size: .9rem }
/* REQ-277 — the headline of an iteration. Bigger than the verdict and above
   every link, because it is the number the operator's glance has to land on:
   the delta count under it rises whenever the instrument sharpens, and a loop
   that reads THAT as the score reads its own improvements as regressions. */
.measure { margin: .4rem 0 .1rem; font-size: 1.05rem }
.measure strong { font-variant-numeric: tabular-nums }
.measure .breakdown { font-size: .8rem; opacity: .7 }
.measure .move { font-size: .85rem; opacity: .85 }
.deltas { margin: .1rem 0; font-size: .85rem; opacity: .75 }
/* The sentence that stops the pair being misread. Not dimmed: an operator who
   has never heard of REQ-277 has to be able to read the page correctly. */
.reading { margin: .25rem 0 .5rem; font-size: .85rem; border-left: 3px solid #8888; padding-left: .6rem }
.reference { opacity: .7; font-size: .8rem }
.reference .moved { opacity: 1; color: #b8860b; font-weight: 600 }
.held { margin: 1rem 0; padding: .6rem .8rem; border: 1px solid #b8860b; border-radius: 4px; font-size: .9rem }
.held form { display: inline; margin-top: .4rem }
.decide { margin: .5rem 0 }
.verdict strong { font-family: ui-monospace, monospace }
.rail { opacity: .75; white-space: pre-wrap }
.ai-status.filed, .ai-status.appended { color: #1e7a3c }
.ai-status.stopped, .ai-status.failed { color: #c0392b }
.violations { color: #c0392b; font-size: .9rem; margin: .25rem 0 }
/* BUG-114 — noticed, not charged. Dimmed and uncoloured, so it cannot be
   mistaken for the red list above it at a glance. */
.observations { opacity: .7; font-size: .85rem; margin: .25rem 0 }
/* BUG-114 — the rail with no recorded baseline. Its own colour because it is
   neither progress nor a failure: it is a setup step nobody has done. */
.notice { border-left: 3px solid #d08b18; padding: .4rem .7rem; margin: 1rem 0; font-size: .9rem }
.notice code { font-family: ui-monospace, monospace }
.ai-cost { margin: .1rem 0; font-size: .8rem; opacity: .6; font-family: ui-monospace, monospace }
/* REQ-276 — what the round bought, beside what it cost. Same weight as the cost
   line because the two are read together. */
.ai-classes { margin: .1rem 0; font-size: .8rem; opacity: .75; font-family: ui-monospace, monospace }
/* REQ-276 — the loop's own split, above the iterations. The ceiling queue is the
   only one with a colour: it is the one the operator is looking for. */
.filings { margin: 1.5rem 0; padding: .6rem .8rem; border: 1px solid #8884; border-radius: 4px }
.filings h2 { margin: 0 0 .4rem; font-size: .9rem }
.filings .queue { margin: .5rem 0 .15rem; font-size: .85rem; opacity: .8 }
.filings .queue.ceiling { color: #1e7a3c; opacity: 1 }
.filings ul { font-size: .85rem }
.filings code { font-family: ui-monospace, monospace }
/* BUG-120 — the two continuations, together and labelled.
   The flex rule on form above is the address row's; the continuation form is
   rows of its own, one control per row with what it does beside it. */
.continue { margin: 1.5rem 0 }
.continue h2 { margin: 0 0 .3rem }
.continue form { display: block }
.choice { display: flex; gap: .6rem; align-items: baseline; margin: .5rem 0 }
.choice button { flex: none }
/* What a control will do to the iteration list, in text rather than a title
   attribute: a tooltip is invisible on a touch device and to anyone not
   hovering, which is the wrong channel for the fact that decides whether a
   round measures anything. */
.effect { font-size: .85rem; opacity: .75 }
p.restart { margin: .4rem 0 0 }
/* The stale reference, at the point of choosing. Same bar as .notice, because
   it is the same kind of thing — a standing condition of what is loaded — and a
   second colour for it would be a second thing to learn. */
.stale-reference { border-left: 3px solid #d08b18; padding: .4rem .7rem; margin: .5rem 0; font-size: .85rem }
.stale-reference code { font-family: ui-monospace, monospace }
pre.transcript {
  white-space: pre-wrap; max-height: 22rem; overflow: auto; margin: .5rem 0 0;
  padding: .6rem .7rem; border: 1px solid #8884; border-radius: 4px;
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; opacity: .9;
}
`

/** One link, always in a new tab so following it never loses the console. */
function link(href: string, label: string): string {
  return `    <li><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`
}

/** How each AI status reads under an iteration. */
const AI_LABEL: Record<AiView['status'], string> = {
  running: 'diagnosing…',
  filed: 'filed',
  appended: 'appended to',
  'no-gap': 'found no engine gap',
  stopped: 'stopped',
  failed: 'failed',
}

/**
 * One iteration: its links, its verdict, the rail, and the AI round beneath it.
 *
 * The AI block is a peer of the links rather than a separate panel, because
 * behavior 1 makes the round a PART of the iteration — it starts as soon as the
 * links appear and it is what that iteration produced.
 */
function renderIteration(it: IterationView): string {
  const links = [
    link(it.originalUrl, 'the original site'),
    link(it.reproHref, 'the reproduction'),
    link(it.diffHref, 'the diff images'),
    link(it.pageHref, 'the L1 document'),
    // The fifth (behavior 5). Present only when a round really filed something.
    ...(it.ticketHref ? [link(it.ticketHref, it.ticketLabel ?? 'the gap ticket')] : []),
    // …and one per bug ([[REQ-261]] behavior 2), on the same terms.
    ...(it.extraTickets ?? []).map((ticket) => link(ticket.href, ticket.label)),
  ].join('\n')

  /**
   * WHICH REFERENCE THIS ITERATION USED ([[REQ-272]] part 2, items 1 and 2).
   *
   * The `re-captured` marker is the load-bearing half: a refold's numbers are
   * comparable with the iteration above it — that is the comparison the loop
   * exists to make — and a re-capture's are not, because the oracle moved at the
   * same moment the engine did. Saying which kind of change happened is what
   * preserves the comparison rather than destroying it.
   */
  const reference = it.reference
    ? `  <p class="reference">reference <code>${escapeHtml(it.reference.bundle)}</code>${
        it.reference.capturedAt ? ` captured ${escapeHtml(it.reference.capturedAt)}` : ' (no capture time recorded)'
      }${
        it.reference.recaptured
          ? ` — <span class="moved">re-captured</span>, so these numbers are not comparable with iteration ${it.n - 1}'s; the reference moved as well as the engine.`
          : ''
      }</p>\n`
    : ''

  /**
   * THE FIRST DECISION POINT, AS A BUTTON ([[REQ-272]] part 1, behaviour 2).
   *
   * Under the links rather than above them, because the order on the page is the
   * order of the act: look at the reproduction, look at the diff, look at the
   * document, and then decide whether this is worth a round.
   */
  const decide = it.diagnoseHref
    ? `  <form class="decide" method="post" action="${escapeHtml(it.diagnoseHref)}"><button title="start the AI round on this iteration — it reads the evidence above and files what it finds">${escapeHtml(
        it.diagnoseLabel ?? 'diagnose this',
      )}</button></form>\n`
    : ''

  /**
   * THE HEADLINE ([[REQ-277]] behaviours 1, 2 and 3).
   *
   * Above the links rather than beside the verdict, which is the whole of
   * behaviour 2: the delta count is not removed, it is demoted. The reading
   * sentence is rendered in full rather than as a marker, because the operator
   * this is written for is the one who has never read [[REQ-277]] and is about
   * to conclude that an iteration which measured more of the page got worse.
   */
  const measure = it.measurement
    ? `  <p class="measure"><strong>${escapeHtml(it.measurement.headline)}</strong>` +
      `${it.measurement.unmeasuredMove ? ` <span class="move">${escapeHtml(it.measurement.unmeasuredMove)}</span>` : ''}` +
      `<br><span class="breakdown">${escapeHtml(it.measurement.breakdown)}</span></p>\n` +
      `  <p class="deltas">${escapeHtml(it.measurement.deltas)}</p>\n` +
      (it.measurement.reading ? `  <p class="reading">${escapeHtml(it.measurement.reading)}</p>\n` : '')
    : ''

  const verdict = it.verdict ? `  <p class="verdict">gate: <strong>${escapeHtml(it.verdict)}</strong></p>\n` : ''
  // A <pre>, not a <p>: the rail reports one finding per line, and a paragraph
  // collapses them into one run-on sentence (REQ-256 behavior 8).
  const rail = it.rail ? `  <pre class="rail">regression rail: ${escapeHtml(it.rail)}</pre>\n` : ''

  const ai = it.ai
    ? `  <p class="ai-status ${it.ai.status}">AI — ${escapeHtml(AI_LABEL[it.ai.status])}${
        it.ai.residualClass ? ` <code>${escapeHtml(it.ai.residualClass)}</code>` : ''
      }${it.ai.summary ? `: ${escapeHtml(it.ai.summary)}` : ''}</p>\n` +
      (it.ai.cost ? `  <p class="ai-cost">${escapeHtml(it.ai.cost)}</p>\n` : '') +
      // WHAT IT BOUGHT ([[REQ-276]] behaviour 3) — under the cost line, and
      // deliberately beside it: "$7.70" and "1 ceiling" are one fact read
      // together and two facts read apart.
      (it.ai.classSplit ? `  <p class="ai-classes">filed: ${escapeHtml(it.ai.classSplit)}</p>\n` : '') +
      (it.ai.violations.length
        ? `  <ul class="violations">${it.ai.violations.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>\n`
        : '') +
      // BUG-114 — below the violations and visibly not one of them.
      (it.ai.observations?.length
        ? `  <ul class="observations">${it.ai.observations.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>\n`
        : '') +
      // The way back into a round that already ran ([[REQ-261]] behavior 5).
      // A plain form post, like every other verb here: no client script starts
      // anything, and the redirect is what stops a reload doing it twice.
      (it.ai.recoverHref
        ? `  <form method="post" action="${escapeHtml(it.ai.recoverHref)}"><button class="link" title="parse this round's transcript again and file what it said — spawns nothing">read it again</button></form>\n`
        : '') +
      `  <pre class="transcript" id="ai-transcript-${it.n}">${escapeHtml(it.ai.transcript)}</pre>\n`
    : ''

  return `<section>
  <h2>Iteration ${it.n}</h2>
${measure}  <ul>
${links}
  </ul>
${reference}${verdict}${rail}${decide}${ai}</section>`
}

/**
 * The console itself.
 *
 * Opens blank: a text box and a [recapture] button, and nothing else — which is
 * also the state [clear history] returns it to ([[REQ-299]] part 2). Every
 * artifact link carries `target="_blank"`, so following one never loses the
 * console — which is the point of the console being a page at all rather than a
 * sequence of printed paths.
 */
export function renderConsolePage(state: PageState): string {
  const rows = state.iterations.map(renderIteration).join('\n')

  /**
   * ONE CONTINUATION, AND THE WAY TO PUT THE CHAIN DOWN ([[REQ-299]]).
   *
   * [[BUG-120]] rendered [run again] and [recapture] as one labelled group here,
   * because they are the same KIND of act and the page had them at opposite
   * ends of itself. [[REQ-299]] part 1 removes one of the pair: the bit that
   * separated them — whether the reference is re-rolled before the fold — could
   * only be answered correctly by someone who knew the schema the stored bundle
   * was written at, which this page does not carry. So the distinguishing
   * sentence is gone with the button it distinguished, and the heading no longer
   * promises two.
   *
   * The GROUP survives, because what it is for survives and has grown: this is
   * the place that acts on the history above it rather than on the address box,
   * and [clear history] belongs in it for exactly the reason [recapture] does.
   * Position is the claim — "this acts on the list" rather than "this starts
   * something" — and it is the claim [[BUG-120]] was about.
   *
   * ONE FORM EACH, because they are different verbs posting to different paths
   * and there is no longer a shared address for a `formaction` pair to carry.
   * [recapture]'s hidden address is the site already loaded, which is what makes
   * the press a continuation rather than a restart ([[REQ-272]] part 2);
   * [clear history] carries nothing, because it is about the list and the
   * console already knows which one it is showing.
   *
   * `data-held` is what the poller keys on ([[REQ-272]] part 1, behaviour 3):
   * both carry it, and both are named in the sentence that explains the hold
   * ([[BUG-130]] behaviour 3), because a disabled control the explanation beside
   * it does not mention reads as a broken console.
   */
  const inert = inertAttrs(state.running ? 'running' : state.held ? 'held' : null)
  const next = state.iterations.length + 1
  const last = state.iterations.length
  const again = state.iterations.length
    ? `<section class="continue">
  <h2>this chain — ${last} iteration${last === 1 ? '' : 's'} so far</h2>
${
  state.staleReference ? `  <p class="stale-reference">⚠ ${inlineCode(state.staleReference)}</p>\n` : ''
}  <form method="post" action="/recapture">
    <input type="hidden" name="url" value="${escapeHtml(state.url ?? '')}">
    <p class="choice"><button data-held="1"${inert}>recapture</button> <span class="effect">re-hits the site and re-rolls the reference first, then folds — appends iteration ${next}, whose numbers are not comparable with iteration ${last}'s, and the page marks the seam.</span></p>
  </form>
  <form method="post" action="/clear">
    <p class="choice"><button data-held="1"${inert}>clear history</button> <span class="effect">ends this chain — the ${last} iteration${last === 1 ? '' : 's'} above are moved aside on disk, not deleted, and the page returns to the blank state it opens in. The captured reference is left where it is.</span></p>
  </form>
</section>`
    : ''

  /**
   * THE SECOND DECISION POINT ([[REQ-272]] part 1, behaviour 3).
   *
   * It says what it is waiting for and it says it on the page, because the
   * operator this is written for is the one who comes back an hour later to a
   * button that does nothing. A disabled control with no explanation beside it
   * reads as a bug in the console.
   */
  const held = state.held
    ? `<p class="held">⏸ ${escapeHtml(state.held.waitingFor)}
  <form method="post" action="${escapeHtml(state.held.releaseHref)}"><button${inertAttrs(
    state.running ? 'running' : null,
  )}>the implementation has landed</button></form>
</p>`
    : ''

  /**
   * The captures already on disk (requirement 31).
   *
   * Shown only before a site is loaded, so requirement 2's blank page is still
   * blank on a fresh checkout and useful on a worked-in one — the list IS the
   * nothing-else, once there is something. Each is a one-click revisit that
   * does not re-hit the site.
   */
  const stored =
    state.url === null && state.stored.length
      ? `<h2>captured already</h2>
<ul>${state.stored
          .map(
            (site) => `
  <li><form method="post" action="/open" class="inline"><input type="hidden" name="url" value="${escapeHtml(site.url)}"><button${inertAttrs(
      state.running ? 'running' : null,
    )} class="link">${escapeHtml(site.name)}</button></form></li>`,
          )
          .join('')}
</ul>`
      : ''

  /**
   * The standing notice (BUG-114), above the iteration list rather than in it.
   *
   * Between the status line and the history, which is where the eye already
   * goes, and styled as neither — a red failure line is about the run that just
   * happened, and this is about the checkout.
   */
  const notice = state.notice ? `<p class="notice">${inlineCode(state.notice)}</p>\n` : ''

  /**
   * WHAT THIS LOOP HAS FILED, BY QUEUE ([[REQ-276]] behaviour 4).
   *
   * Above the iteration list and below the notice, because it is a fact about
   * the whole loop rather than about the round that just ran. Ticket ids under
   * each class rather than counts alone: "show me the capability queue" has to
   * end in ids somebody can open, or it is a number that still needs an audit
   * behind it.
   */
  const filings = state.filings
    ? `<section class="filings">
  <h2>what this loop has filed — ${escapeHtml(state.filings.split)}</h2>
${state.filings.groups
  .map(
    (group) =>
      `  <p class="queue ${escapeHtml(group.queue)}"><strong>${escapeHtml(group.queue)}</strong> · ${group.tickets} ticket${
        group.tickets === 1 ? '' : 's'
      }</p>\n  <ul>${group.classes
        .map((cls) => `<li><code>${escapeHtml(cls.id)}</code> — ${cls.tickets.map((id) => escapeHtml(id)).join(', ')}</li>`)
        .join('')}</ul>`,
  )
  .join('\n')}
</section>\n`
    : ''

  /**
   * THE SAME VERB, IN THE POSITION THE RESTART OCCUPIED ([[REQ-299]] part 1).
   *
   * [reproduce] stood here and is retired; [recapture] takes the position
   * rather than the position being emptied, because beginning a chain for a
   * typed address is still a thing the page has to be able to do and this is
   * where an address is typed.
   *
   * THE LABEL IS THE SAME WORD IN BOTH POSITIONS, deliberately. "re-" is
   * slightly wrong on a blank console — there is nothing to re-do — and that is
   * accepted: two labels for one act would put back exactly the
   * which-one-do-I-want question [[REQ-299]] exists to remove, and `recapture`
   * is the word the tickets and the operator already use.
   *
   * NOT HELD, as [reproduce] was not. The hold stops THIS chain advancing before
   * the implementation it asked for lands ([[REQ-272]] part 1, behaviour 3), and
   * it has no business stopping a different site being captured — which is what
   * an inert address row would do. A press here that names the held site is
   * refused by the console itself with the hold's own sentence.
   *
   * What it does is under it in text rather than in a `title=`, on the same
   * terms as the continuation: it is not one fact but two — a new address
   * begins a list, and the address already loaded appends to the one on screen.
   */
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>reproduction console</title><style>${STYLE}</style></head>
<body data-version="${state.version}">
<form method="post" action="/recapture">
  <input name="url" value="${escapeHtml(state.url ?? '')}" placeholder="site address" autocomplete="off" autofocus>
  <button${inertAttrs(state.running ? 'running' : null)}>recapture</button>
</form>
<p class="effect restart">re-hits the address and re-rolls the reference before folding: a new address starts a list numbered from 1, and the address already loaded appends the next iteration to the chain below.</p>
<p id="status" class="${state.failed ? 'failed' : 'progress'}">${escapeHtml(state.message)}</p>
${notice}${stored}
${filings}
${rows}
${held}
${again}
<script>${POLL_SCRIPT}</script>
</body>
</html>`
}

/** The headline numbers and one region `1c diff` wrote. */
export interface DiffRegionView {
  id: number | string
  ref: string
  actual: string
  diff: string
  /**
   * BUG-99 — the region's own geometry and its best lead from each side, as a
   * caption. Three unlabelled images say *that* something differs; the caption
   * says where and what, which is the difference between a picture to interpret
   * and a fact to quote.
   *
   * Optional because a report written before the leads existed still renders —
   * the caption is simply absent rather than the page refusing.
   */
  caption?: string
}

export interface DiffReportView {
  meanDiff?: number
  pctOverThreshold?: number
  /** BUG-99 — the key `regions` is ordered by, named on the page so the order is readable. */
  rankedBy?: string
  regions: DiffRegionView[]
}

/**
 * One iteration's diff images, on one page.
 *
 * The heatmaps first, then a ref / ours / diff triptych per ranked region —
 * the same worst-first reading order the runbook prescribes ([[DOC-19]]): the
 * regions say *where*, and the operator opens them in order.
 */
export function renderDiffPage(n: number, base: string, report: DiffReportView): string {
  const headline =
    report.meanDiff === undefined
      ? ''
      : `<p>mean difference <strong>${report.meanDiff}</strong>/255 · <strong>${report.pctOverThreshold ?? 0}%</strong> of pixels over threshold${
          report.rankedBy ? ` · regions ranked by <strong>${escapeHtml(report.rankedBy)}</strong>, highest first` : ''
        }</p>`

  const triptychs = report.regions
    .map(
      (region) => `<figure class="triptych">
  <figcaption class="region-caption">region ${escapeHtml(String(region.id))}${region.caption ? ` — ${escapeHtml(region.caption)}` : ''}</figcaption>
  <div><img src="${escapeHtml(base + region.ref)}" alt="reference, region ${region.id}"><figcaption>reference</figcaption></div>
  <div><img src="${escapeHtml(base + region.actual)}" alt="reproduction, region ${region.id}"><figcaption>reproduction</figcaption></div>
  <div><img src="${escapeHtml(base + region.diff)}" alt="difference, region ${region.id}"><figcaption>difference</figcaption></div>
</figure>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Iteration ${n} — diff images</title><style>${STYLE}</style></head>
<body>
<h2>Iteration ${n} — diff images</h2>
${headline}
<figure><img src="${escapeHtml(base + 'diff-blocks.png')}" alt="block-averaged difference heatmap"><figcaption>block-averaged heatmap</figcaption></figure>
<figure><img src="${escapeHtml(base + 'diff.png')}" alt="per-pixel difference heatmap"><figcaption>per-pixel heatmap</figcaption></figure>
${triptychs || '<p>No region of interest — the two agree everywhere the diff looks.</p>'}
</body>
</html>`
}

/**
 * The gap ticket a round filed, as xgd itself prints it (REQ-256 req 24).
 *
 * THE CONSOLE DOES NOT READ `.xgd/tickets/`. That layout is xgd's — it tiers
 * tickets, it moves them, and a second reader of it would go stale the first
 * time it did. So the link runs `xgd ticket get` and shows what came back,
 * which is also what the operator would see at their own terminal.
 */
export function renderTicketPage(n: number, ticketId: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Iteration ${n} — ${escapeHtml(ticketId)}</title><style>${STYLE}</style></head>
<body>
<h2>Iteration ${n} — ${escapeHtml(ticketId)}</h2>
<pre class="transcript">${escapeHtml(body)}</pre>
</body>
</html>`
}
