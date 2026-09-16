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
  /** `1c gate`'s verdict for this round, shown beside the links. */
  verdict?: string
  /** What the regression rail said this round (behavior 8). */
  rail?: string
  /** The AI round under this iteration, if one ran. */
  ai?: AiView
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
  /**
   * Behaviours 3 and 4's falsifiers, when either fired.
   *
   * SHOWN, NOT LOGGED. A check whose failure is invisible is not a check, and
   * these two are the whole reason a diagnose-only AI is safe to run at all.
   */
  violations: string[]
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
  /** The address currently loaded, if any — what [run again] would re-run. */
  url: string | null
  iterations: IterationView[]
  /** The captures on disk, so a site can be revisited without re-hitting it. */
  stored: StoredCaptureView[]
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
    for (const button of document.querySelectorAll('button')) button.disabled = state.running;
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
button[disabled] { cursor: progress; opacity: .5 }
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
.verdict, .rail, .ai-status { margin: .25rem 0; font-size: .9rem }
.verdict strong { font-family: ui-monospace, monospace }
.rail { opacity: .75; white-space: pre-wrap }
.ai-status.filed, .ai-status.appended { color: #1e7a3c }
.ai-status.stopped, .ai-status.failed { color: #c0392b }
.violations { color: #c0392b; font-size: .9rem; margin: .25rem 0 }
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
  ].join('\n')

  const verdict = it.verdict ? `  <p class="verdict">gate: <strong>${escapeHtml(it.verdict)}</strong></p>\n` : ''
  // A <pre>, not a <p>: the rail reports one finding per line, and a paragraph
  // collapses them into one run-on sentence (REQ-256 behavior 8).
  const rail = it.rail ? `  <pre class="rail">regression rail: ${escapeHtml(it.rail)}</pre>\n` : ''

  const ai = it.ai
    ? `  <p class="ai-status ${it.ai.status}">AI — ${escapeHtml(AI_LABEL[it.ai.status])}${
        it.ai.residualClass ? ` <code>${escapeHtml(it.ai.residualClass)}</code>` : ''
      }${it.ai.summary ? `: ${escapeHtml(it.ai.summary)}` : ''}</p>\n` +
      (it.ai.violations.length
        ? `  <ul class="violations">${it.ai.violations.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>\n`
        : '') +
      `  <pre class="transcript" id="ai-transcript-${it.n}">${escapeHtml(it.ai.transcript)}</pre>\n`
    : ''

  return `<section>
  <h2>Iteration ${it.n}</h2>
  <ul>
${links}
  </ul>
${verdict}${rail}${ai}</section>`
}

/**
 * The console itself.
 *
 * Opens blank: a text box and a [reproduce] button, and nothing else. Every
 * artifact link carries `target="_blank"`, so following one never loses the
 * console — which is the point of the console being a page at all rather than a
 * sequence of printed paths.
 */
export function renderConsolePage(state: PageState): string {
  const rows = state.iterations.map(renderIteration).join('\n')

  // [run again] appears only once there is something to re-run. It takes no
  // address: [reproduce] captures and starts a new list at Iteration 1, this
  // re-runs the site already loaded and appends the next one.
  const again = state.iterations.length
    ? `<form method="post" action="/run-again"><button${state.running ? ' disabled' : ''}>run again</button></form>`
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
  <li><form method="post" action="/open" class="inline"><input type="hidden" name="url" value="${escapeHtml(site.url)}"><button${
      state.running ? ' disabled' : ''
    } class="link">${escapeHtml(site.name)}</button></form></li>`,
          )
          .join('')}
</ul>`
      : ''

  // [recapture] re-hits the site and re-rolls the oracle, which is occasionally
  // exactly right and never what [reproduce] should quietly do — so it is its
  // own button, offered beside the box rather than in place of anything.
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>reproduction console</title><style>${STYLE}</style></head>
<body data-version="${state.version}">
<form method="post" action="/run">
  <input name="url" value="${escapeHtml(state.url ?? '')}" placeholder="site address" autocomplete="off" autofocus>
  <button${state.running ? ' disabled' : ''}>reproduce</button>
  <button${state.running ? ' disabled' : ''} formaction="/recapture" title="re-hit the site and re-roll the reference">recapture</button>
</form>
<p id="status" class="${state.failed ? 'failed' : 'progress'}">${escapeHtml(state.message)}</p>
${stored}
${rows}
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
}

export interface DiffReportView {
  meanDiff?: number
  pctOverThreshold?: number
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
      : `<p>mean difference <strong>${report.meanDiff}</strong>/255 · <strong>${report.pctOverThreshold ?? 0}%</strong> of pixels over threshold</p>`

  const triptychs = report.regions
    .map(
      (region) => `<figure class="triptych">
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
