import { parse, type HTMLElement } from 'node-html-parser';
import { XMOJ_ORIGIN, type HomeAnnouncement, type HomeBanner, type HomeCountdown, type HomeSnapshot, type ProblemsetEntry, type ProblemsetPage, type StatusPage, type StatusPaging, type SubmissionEntry, type SubmissionVerdict, } from '../src/shared/types.ts';
export function normaliseText(input: string | null | undefined): string {
    if (!input)
        return '';
    return input.replace(/\s+/g, ' ').trim();
}
export function normalizeAssetUrls(html: string): string {
    if (!html)
        return html;
    return html.replace(/(\s(?:src|href)\s*=\s*)(["'])(\/uploads?\/[^"']*)\2/gi, (_match: string, prefix: string, quote: string, assetPath: string) => `${prefix}${quote}${XMOJ_ORIGIN}${assetPath}${quote}`);
}
export function sanitizeHtml(html: string): string {
    return normalizeAssetUrls(html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
        .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"'));
}
export function absoluteUrl(href: string | null | undefined): string | null {
    const raw = (href ?? '').trim();
    if (!raw)
        return null;
    try {
        return new URL(raw, XMOJ_ORIGIN).href;
    }
    catch {
        return null;
    }
}
function parseInteger(input: string | null | undefined): number | null {
    const match = normaliseText(input).match(/-?\d+/);
    if (!match)
        return null;
    const value = Number.parseInt(match[0], 10);
    return Number.isNaN(value) ? null : value;
}
function parseBareInteger(input: string | null | undefined): number | null {
    const text = normaliseText(input);
    if (!/^-?\d+$/.test(text))
        return null;
    const value = Number.parseInt(text, 10);
    return Number.isNaN(value) ? null : value;
}
const LANGUAGE_PATTERN = /^(G\+\+|GCC|Clang|C\+\+|C|Python3?|PyPy3?|Java|Pascal|JavaScript|Node\.?js|Go|Rust|PHP|Ruby|C#|CSharp)(?![A-Za-z0-9+#])/i;
function matchLanguage(value: string): string | null {
    return value.match(LANGUAGE_PATTERN)?.[0] ?? null;
}
function parseMemoryKb(value: string): number | null {
    const match = value.match(/^([\d.]+)\s*(KB|MB|GB)$/i);
    if (!match)
        return null;
    const amount = Number.parseFloat(match[1]);
    if (Number.isNaN(amount))
        return null;
    switch (match[2].toUpperCase()) {
        case 'MB':
            return amount * 1024;
        case 'GB':
            return amount * 1024 * 1024;
        default:
            return amount;
    }
}
function parseTimeMs(value: string): number | null {
    const match = value.match(/^([\d.]+)\s*(MS|S)$/i);
    if (!match)
        return null;
    const amount = Number.parseFloat(match[1]);
    if (Number.isNaN(amount))
        return null;
    return match[2].toUpperCase() === 'S' ? amount * 1000 : amount;
}
export function extractProblemId(href: string | null | undefined): number | null {
    const raw = (href ?? '').trim();
    if (!raw)
        return null;
    if (/[?&]cid=/i.test(raw))
        return null;
    const match = raw.match(/[?&]id=(\d+)/);
    if (match)
        return Number.parseInt(match[1], 10);
    return parseInteger(raw);
}
export interface LoginPageInfo {
    profileText: string;
    loggedIn: boolean;
    username: string | null;
}
const LOGGED_OUT_PROFILE_VALUES = new Set(['login', '登录', '登入', 'sign in']);
export function normaliseUsername(profileText: string): string | null {
    const cleaned = normaliseText(profileText)
        .replace(/\s*(退出|注销|登出|logout)\s*$/i, '')
        .trim();
    if (!cleaned || LOGGED_OUT_PROFILE_VALUES.has(cleaned.toLowerCase()))
        return null;
    return cleaned;
}
export function parseProfile(html: string): LoginPageInfo {
    const root = parse(html);
    const profile = root.querySelector('#profile');
    const profileText = normaliseText(profile?.textContent);
    const username = normaliseUsername(profileText);
    return { profileText, loggedIn: username !== null, username };
}
export function parseProfileScript(script: string): LoginPageInfo {
    const assigned = script.match(/getElementById\(\s*["']profile["']\s*\)\s*\.innerHTML\s*=\s*["']([^"']*)["']/)?.[1] ?? null;
    const username = assigned ? normaliseUsername(assigned) : null;
    if (username) {
        return { profileText: normaliseText(assigned ?? ''), loggedIn: true, username };
    }
    const linked = script.match(/userinfo\.php\?user=([^'"&\s>]+)/i)?.[1] ?? null;
    const linkedName = linked ? normaliseUsername(decodeURIComponent(linked)) : null;
    if (linkedName) {
        return { profileText: linkedName, loggedIn: true, username: linkedName };
    }
    const signedIn = /logout\.php/i.test(script) && !/loginpage\.php/i.test(script);
    return {
        profileText: normaliseText(assigned ?? ''),
        loggedIn: signedIn,
        username: null,
    };
}
export function isLoginForm(html: string): boolean {
    return /<form[^>]*id=["']?login\b/i.test(html) || /<title>\s*Login\s*<\/title>/i.test(html);
}
export const ALREADY_LOGGED_IN_SENTINEL = '<a href=logout.php>Please logout First!</a>';
export function isAlreadyLoggedInResponse(html: string): boolean {
    return html.includes(ALREADY_LOGGED_IN_SENTINEL) || /logout\.php[^>]*>\s*Please logout First!/i.test(html);
}
export function isLoginGate(html: string): boolean {
    return html.includes('请登录后继续操作');
}
export function parseLoginAlert(html: string): string | null {
    const match = html.match(/alert\(\s*'((?:[^'\\]|\\.)*)'\s*\)/i);
    if (!match)
        return null;
    return match[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\').trim();
}
export function isLoginFailureAlert(message: string | null): boolean {
    if (!message)
        return false;
    return /wrong|invalid|incorrect|错误|失败|不存在/i.test(message);
}
export function parseServerTime(html: string): number | null {
    const match = html.match(/var\s+diff\s*=\s*new\s+Date\(\s*["']([^"']+)["']\s*\)/);
    if (!match)
        return null;
    const parsed = Date.parse(match[1].replace(/\//g, '-'));
    return Number.isNaN(parsed) ? null : parsed;
}
export function parseAccountEmail(html: string): string | null {
    const root = parse(html);
    const input = root.querySelector('input[name="email"]') ?? root.querySelector('input[name=email]');
    const value = normaliseText(input?.getAttribute('value'));
    if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return value;
    const match = html.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    return match ? match[0] : null;
}
export function parseHomeSnapshot(html: string, serverTime: number): HomeSnapshot {
    const root = parse(html);
    const announcements: HomeAnnouncement[] = [];
    const headers = root.querySelectorAll('h4.ui.block.top.attached.header');
    for (const header of headers) {
        const contentEl = header.querySelector('.content');
        const title = normaliseText(contentEl?.textContent ?? header.textContent);
        const smallEl = header.querySelector('small');
        const date = normaliseText(smallEl?.textContent) || null;
        let bodyEl: HTMLElement | null = null;
        let cursor = header.nextElementSibling;
        while (cursor) {
            if (cursor.classList.contains('news_content')) {
                bodyEl = cursor;
                break;
            }
            if (cursor.tagName === 'H4')
                break;
            cursor = cursor.nextElementSibling;
        }
        if (!title)
            continue;
        const rawHtml = bodyEl?.innerHTML ?? '';
        const text = normaliseText(bodyEl?.textContent);
        if (!bodyEl || text.length === 0)
            continue;
        announcements.push({
            title,
            date,
            html: sanitizeHtml(rawHtml),
            text: text.slice(0, 400),
        });
    }
    const banners: HomeBanner[] = [];
    for (const anchor of root.querySelectorAll('.col-md-4 a')) {
        const img = anchor.querySelector('img');
        if (!img)
            continue;
        const href = absoluteUrl(anchor.getAttribute('href'));
        const src = absoluteUrl(img.getAttribute('src'));
        if (href && src)
            banners.push({ href, src });
    }
    return {
        announcements,
        banners,
        countdown: parseCountdown(html),
        serverTime: parseServerTime(html) ?? serverTime,
        notice: null,
    };
}
export function parseCountdown(html: string, today = new Date()): HomeCountdown[] {
    const listMatch = html.match(/var\s+list\s*=\s*\[([\s\S]*?)\]\s*;/);
    if (!listMatch)
        return [];
    const pairPattern = /\[\s*["']([^"']*)["']\s*,\s*["']([^"']*)["']\s*\]/g;
    const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const result: HomeCountdown[] = [];
    for (const match of listMatch[1].matchAll(pairPattern)) {
        const event = match[1].trim();
        const date = match[2].trim();
        if (!event || !date)
            continue;
        const parts = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!parts)
            continue;
        const year = Number(parts[1]);
        const month = Number(parts[2]) - 1;
        const day = Number(parts[3]);
        const target = new Date(year, month, day).getTime();
        if (Number.isNaN(target))
            continue;
        const days = Math.floor((target - midnight) / MS_PER_DAY);
        if (days < 0)
            continue;
        result.push({ event, date, days });
    }
    return result;
}
function scoreProblemTable(table: HTMLElement): number {
    const rows = table.querySelectorAll('tbody tr').length > 0
        ? table.querySelectorAll('tbody tr')
        : table.querySelectorAll('tr');
    let score = 0;
    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3)
            continue;
        if (parseInteger(cells[1]?.textContent) !== null)
            score++;
    }
    return score;
}
function parseAcceptedCount(row: HTMLElement): number | null {
    const link = row.querySelector('a[href*="jresult=4"]');
    if (link) {
        const value = parseInteger(link.textContent);
        if (value !== null)
            return value;
    }
    return null;
}
function parseSubmissionCount(row: HTMLElement): number | null {
    const link = row.querySelector('a[href*="jresult=4"]');
    const container = link?.closest('td');
    let cursor: HTMLElement | null = container?.nextElementSibling ?? null;
    while (cursor) {
        const total = cursor.querySelector('a[href*="problem_id"]');
        if (total && !(total.getAttribute('href') ?? '').includes('jresult')) {
            const value = parseInteger(total.textContent);
            if (value !== null)
                return value;
        }
        cursor = cursor.nextElementSibling;
    }
    for (const cell of row.querySelectorAll('td')) {
        const ratio = normaliseText(cell.textContent).match(/(\d+)\s*\/\s*(\d+)/);
        if (ratio)
            return Number.parseInt(ratio[2], 10);
    }
    return null;
}
export function parseProblemsetPage(html: string, requestedPage = 1): ProblemsetPage {
    const root = parse(html);
    const problems: ProblemsetEntry[] = [];
    const explicit = root.querySelector('#problemset');
    let table: HTMLElement | null = explicit;
    if (!table) {
        const candidates = root.querySelectorAll('table');
        let bestScore = 0;
        for (const candidate of candidates) {
            const score = scoreProblemTable(candidate);
            if (score > bestScore) {
                bestScore = score;
                table = candidate;
            }
        }
        if (bestScore === 0)
            table = null;
    }
    const bodyRows = table ? table.querySelectorAll('tbody tr') : [];
    const rows = bodyRows.length > 0 ? bodyRows : table ? table.querySelectorAll('tr') : [];
    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0)
            continue;
        const link = row.querySelector('a[href*="problem.php"]');
        let id = extractProblemId(link?.getAttribute('href'));
        if (id === null && cells.length > 1)
            id = parseInteger(cells[1].textContent);
        if (id === null) {
            for (const cell of cells) {
                const candidate = parseInteger(cell.textContent);
                if (candidate !== null) {
                    id = candidate;
                    break;
                }
            }
        }
        if (id === null)
            continue;
        let title = normaliseText(link?.textContent);
        if (!title && cells.length > 2)
            title = normaliseText(cells[2].textContent);
        if (!title)
            title = `题目 ${id}`;
        title = title.replace(/^\s*\d+\s*[-–—:.]\s*/, '').trim() || `题目 ${id}`;
        const statusEl = row.querySelector('div.status, .status');
        const statusClasses = statusEl?.classList ? Array.from(statusEl.classList.value) : [];
        const solved = statusClasses.includes('status_y')
            ? true
            : statusClasses.includes('status_n')
                ? false
                : null;
        const accepted = parseAcceptedCount(row);
        const submissions = parseSubmissionCount(row);
        const acceptanceRate = accepted !== null && submissions !== null && submissions > 0
            ? (accepted / submissions) * 100
            : null;
        problems.push({
            id,
            title,
            url: `${XMOJ_ORIGIN}/problem.php?id=${id}`,
            accepted,
            submissions,
            solved,
            acceptanceRate,
        });
    }
    return {
        problems,
        page: requestedPage,
        totalPages: parseTotalPages(root),
    };
}
function parseTotalPages(root: ReturnType<typeof parse>): number | null {
    const links = root.querySelectorAll('.pagination a, .pagination li a, ul.pagination a');
    let max: number | null = null;
    for (const link of links) {
        const value = parseInteger(link.textContent);
        if (value !== null && (max === null || value > max))
            max = value;
    }
    for (const link of root.querySelectorAll('a[href*="page="]')) {
        const match = (link.getAttribute('href') ?? '').match(/[?&]page=(\d+)/);
        if (match) {
            const value = Number.parseInt(match[1], 10);
            if (max === null || value > max)
                max = value;
        }
    }
    return max;
}
const JUDGE_RESULTS: Record<number, {
    label: string;
    verdict: SubmissionVerdict;
}> = {
    0: { label: 'Waiting', verdict: 'pending' },
    1: { label: 'Pending', verdict: 'pending' },
    2: { label: 'Compiling', verdict: 'pending' },
    3: { label: 'Running', verdict: 'pending' },
    4: { label: 'Accepted', verdict: 'accepted' },
    5: { label: 'Presentation Error', verdict: 'presentation_error' },
    6: { label: 'Wrong Answer', verdict: 'wrong_answer' },
    7: { label: 'Time Limit Exceeded', verdict: 'time_limit' },
    8: { label: 'Memory Limit Exceeded', verdict: 'memory_limit' },
    9: { label: 'Output Limit Exceeded', verdict: 'output_limit' },
    10: { label: 'Runtime Error', verdict: 'runtime_error' },
    11: { label: 'Compile Error', verdict: 'compile_error' },
};
export const JUDGE_PENDING_THRESHOLD = 4;
const JUDGER_NAMES = new Set(['saturn', 'hustoj', 'jupiter', 'mars', 'judge']);
function isJudgerName(value: string): boolean {
    return JUDGER_NAMES.has(value.toLowerCase());
}
const VERDICT_LABEL_CODES: [
    RegExp,
    number
][] = [
    [/^正确$|^答案正确$|accepted/i, 4],
    [/^格式错误$|presentation/i, 5],
    [/^答案错误$|^错误$|wrong\s*answer/i, 6],
    [/^时间超限$|time\s*limit/i, 7],
    [/^内存超限$|memory\s*limit/i, 8],
    [/^输出超限$|output\s*limit/i, 9],
    [/^运行错误$|runtime\s*error/i, 10],
    [/^编译错误$|compile\s*error/i, 11],
    [/^等待$|waiting/i, 0],
    [/^等待重判$|rejudge/i, 1],
    [/^编译中$|compiling/i, 2],
    [/^运行|judging|running/i, 3],
];
export function verdictCodeFromLabel(label: string): number | null {
    const text = normaliseText(label);
    if (!text)
        return null;
    for (const [pattern, code] of VERDICT_LABEL_CODES) {
        if (pattern.test(text))
            return code;
    }
    return null;
}
function looksLikeVerdict(value: string): boolean {
    return verdictCodeFromLabel(value) !== null;
}
function inferBareMemoryAndTime(cells: HTMLElement[], cellText: string[]): {
    memoryKb: number | null;
    timeMs: number | null;
} {
    let anchor = -1;
    for (let i = 0; i < cellText.length; i++) {
        if (/^\d+\s*B$/.test(cellText[i]))
            anchor = i;
    }
    if (anchor >= 3) {
        const memoryCandidate = parseBareInteger(cellText[anchor - 3]);
        const timeCandidate = parseBareInteger(cellText[anchor - 2]);
        const memoryKb = memoryCandidate !== null && memoryCandidate >= 0 && memoryCandidate < 4194304
            ? memoryCandidate
            : null;
        const timeMs = timeCandidate !== null && timeCandidate >= 0 && timeCandidate < 3600000
            ? timeCandidate
            : null;
        if (memoryKb !== null || timeMs !== null)
            return { memoryKb, timeMs };
    }
    const bareIndexes: number[] = [];
    for (let i = 0; i < cellText.length; i++) {
        if (parseBareInteger(cellText[i]) !== null)
            bareIndexes.push(i);
    }
    if (bareIndexes.length >= 2) {
        return {
            memoryKb: parseBareInteger(cellText[bareIndexes[bareIndexes.length - 2]]),
            timeMs: parseBareInteger(cellText[bareIndexes[bareIndexes.length - 1]]),
        };
    }
    void cells;
    return { memoryKb: null, timeMs: null };
}
export function describeVerdictCode(code: number | null): {
    label: string;
    verdict: SubmissionVerdict;
} {
    if (code === null || !(code in JUDGE_RESULTS)) {
        return { label: 'Unknown', verdict: 'other' };
    }
    return JUDGE_RESULTS[code];
}
export function classifyVerdict(classes: string[], verdictText: string): SubmissionVerdict {
    const classList = classes.map((c) => c.toLowerCase());
    if (classList.includes('status_y'))
        return 'accepted';
    if (classList.includes('status_w'))
        return 'pending';
    if (classList.includes('status_n'))
        return 'wrong_answer';
    const code = verdictCodeFromLabel(verdictText);
    if (code !== null)
        return describeVerdictCode(code).verdict;
    const text = verdictText.toLowerCase();
    if (text.includes('accepted') || text.includes('答案正确'))
        return 'accepted';
    if (text.includes('pending') ||
        text.includes('waiting') ||
        text.includes('running') ||
        text.includes('compiling') ||
        text.includes('judging') ||
        text.includes('等待') ||
        text.includes('评测中') ||
        text.includes('编译中')) {
        return 'pending';
    }
    if (text.includes('runtime') || text.includes('运行错误'))
        return 'runtime_error';
    if (text.includes('compile') || text.includes('编译错误'))
        return 'compile_error';
    if (text.includes('time') || text.includes('时间超限'))
        return 'time_limit';
    if (text.includes('memory') || text.includes('内存超限'))
        return 'memory_limit';
    if (text.includes('output') || text.includes('输出超限'))
        return 'output_limit';
    if (text.includes('presentation') || text.includes('格式错误'))
        return 'presentation_error';
    if (text.includes('wrong') || text.includes('错误') || text.includes('超限')) {
        return 'wrong_answer';
    }
    if (text.trim() === '')
        return 'pending';
    return 'other';
}
function verdictCodeFromClasses(classes: string[]): number | null {
    for (const token of classes) {
        const match = token.match(/^status(\d+)$/i);
        if (match) {
            const code = Number.parseInt(match[1], 10);
            if (code in JUDGE_RESULTS)
                return code;
        }
    }
    return null;
}
export function parseStatusPaging(html: string): StatusPaging {
    const root = parse(html);
    const paging: StatusPaging = { nextTop: null, nextPrevTop: null, prevTop: null };
    for (const anchor of root.querySelectorAll('a')) {
        const label = normaliseText(anchor.textContent);
        const href = anchor.getAttribute('href') ?? '';
        if (!/status\.php/i.test(href))
            continue;
        const top = href.match(/[?&]top=(\d+)/)?.[1];
        const prevtop = href.match(/[?&]prevtop=(\d+)/)?.[1];
        if (label.includes('下一页') || /next/i.test(label)) {
            if (top)
                paging.nextTop = Number.parseInt(top, 10);
            if (prevtop)
                paging.nextPrevTop = Number.parseInt(prevtop, 10);
        }
        else if (label.includes('上一页') || /prev/i.test(label)) {
            if (top)
                paging.prevTop = Number.parseInt(top, 10);
        }
    }
    return paging;
}
export function parseStatusPage(html: string): StatusPage {
    const root = parse(html);
    const submissions: SubmissionEntry[] = [];
    const table = root.querySelector('#result-tab') ??
        root.querySelector('table.table') ??
        root.querySelector('table');
    const bodyRows = table ? table.querySelectorAll('tbody tr') : [];
    const rows = bodyRows.length > 0 ? bodyRows : root.querySelectorAll('table tr');
    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4)
            continue;
        const cellText = cells.map((c) => normaliseText(c.textContent));
        let id = extractSubmissionId(row.querySelector('a[href*="showsource.php"], a[href*="reinfo.php"], a[href*="ceinfo.php"]')?.getAttribute('href'));
        if (id === null) {
            for (let i = 0; i < Math.min(cells.length, 3); i++) {
                const candidate = extractSubmissionId(cells[i].querySelector('a')?.getAttribute('href'));
                if (candidate !== null) {
                    id = candidate;
                    break;
                }
            }
            if (id === null && cells.length > 1)
                id = parseInteger(cellText[1]);
        }
        if (id === null)
            continue;
        const problemLink = row.querySelector('a[href*="problem.php"]');
        let problemTitle = normaliseText(problemLink?.textContent);
        let problemId = extractProblemId(problemLink?.getAttribute('href'));
        if (problemId === null && problemTitle)
            problemId = parseInteger(problemTitle);
        let verdictText = '';
        let verdictClasses: string[] = [];
        for (const cell of cells) {
            const detail = cell.querySelector('a[href*="reinfo.php"], a[href*="ceinfo.php"]');
            if (detail) {
                verdictText = normaliseText(detail.textContent) || normaliseText(cell.textContent);
                verdictClasses = cell.classList ? Array.from(cell.classList.value) : [];
                break;
            }
        }
        if (!verdictText) {
            for (const cell of cells) {
                const cls = cell.classList ? Array.from(cell.classList.value) : [];
                if (cls.some((c) => /^status[_0-9]/i.test(c))) {
                    verdictClasses = cls;
                    verdictText = normaliseText(cell.textContent);
                    break;
                }
            }
        }
        if (!verdictText) {
            const known = cellText.find((t) => looksLikeVerdict(t));
            verdictText = known ?? '';
        }
        const verdictCode = verdictCodeFromClasses(verdictClasses);
        const labelCode = verdictCode ?? verdictCodeFromLabel(verdictText);
        const described = describeVerdictCode(labelCode);
        const verdict = labelCode !== null
            ? described.verdict
            : classifyVerdict(verdictClasses, verdictText);
        let memoryKb: number | null = null;
        let timeMs: number | null = null;
        for (const cell of cells) {
            const text = normaliseText(cell.textContent);
            if (memoryKb === null)
                memoryKb = parseMemoryKb(text);
            if (timeMs === null)
                timeMs = parseTimeMs(text);
        }
        if (memoryKb === null || timeMs === null) {
            const bare = inferBareMemoryAndTime(cells, cellText);
            if (memoryKb === null)
                memoryKb = bare.memoryKb;
            if (timeMs === null)
                timeMs = bare.timeMs;
        }
        const language = cellText.map(matchLanguage).find((l) => l !== null) ?? '';
        let codeLength: number | null = null;
        const lenMatch = cellText
            .map((t) => t.match(/^(\d+)\s*B$/i))
            .find((m) => m !== null);
        if (lenMatch)
            codeLength = Number.parseInt(lenMatch[1], 10);
        let submittedAt = '';
        for (let i = cellText.length - 1; i >= 0; i--) {
            if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(cellText[i])) {
                submittedAt = cellText[i];
                break;
            }
        }
                let userRating: string | null = null;
        const stampIndex = cellText.indexOf(submittedAt);
        if (stampIndex !== -1) {
            for (let i = stampIndex + 1; i < cellText.length; i++) {
                const value = cellText[i];
                if (!value)
                    continue;
                if (parseInteger(value) !== null)
                    continue;
                if (parseMemoryKb(value) !== null || parseTimeMs(value) !== null)
                    continue;
                if (matchLanguage(value))
                    continue;
                if (isJudgerName(value))
                    continue;
                if (value.startsWith('-'))
                    continue;
                userRating = value;
                break;
            }
        }
        let user = '';
        for (let i = 1; i < cellText.length; i++) {
            const value = cellText[i];
            if (!value)
                continue;
            if (problemTitle && value === problemTitle)
                continue;
            if (verdictText && value === verdictText)
                continue;
            if (userRating && value === userRating)
                continue;
            if (cellText[0] === value)
                continue;
            if (/^\d{4}-\d{2}-\d{2}/.test(value))
                continue;
            if (/^[\d.]+\s*(KB|MB|GB|MS|S|B)$/i.test(value))
                continue;
            if (/^\d+$/.test(value))
                continue;
            if (matchLanguage(value))
                continue;
            if (looksLikeVerdict(value))
                continue;
            if (/^edit$/i.test(value))
                continue;
            user = value;
            break;
        }
        submissions.push({
            id,
            verdict,
            verdictCode: labelCode,
            verdictLabel: described.label,
            verdictText: verdictText || described.label,
            problemId,
            problemTitle: problemTitle || (problemId !== null ? `题目 ${problemId}` : ''),
            problemUrl: problemId !== null ? `${XMOJ_ORIGIN}/problem.php?id=${problemId}` : null,
            user,
            memoryKb,
            timeMs,
            language,
            codeLength,
            userRating,
            submittedAt,
        });
    }
    return {
        submissions,
        paging: parseStatusPaging(html),
    };
}
export function extractSubmissionId(href: string | null | undefined): number | null {
    const raw = (href ?? '').trim();
    if (!raw)
        return null;
    const match = raw.match(/[?&](?:id|sid)=(\d+)/);
    return match ? Number.parseInt(match[1], 10) : null;
}
export function formatMemory(kb: number | null): string {
    if (kb === null || Number.isNaN(kb))
        return '—';
    if (kb < 1024)
        return `${Math.round(kb)}KB`;
    const mb = kb / 1024;
    if (mb < 1024)
        return `${mb.toFixed(2)}MB`;
    return `${(mb / 1024).toFixed(2)}GB`;
}
export function formatTime(ms: number | null): string {
    if (ms === null || Number.isNaN(ms))
        return '—';
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}min`;
}
