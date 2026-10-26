import { parse, type HTMLElement } from 'node-html-parser';
import { XMOJ_ORIGIN, type ContestProblem, type JudgeLanguage, type ProblemCard, type ProblemDetail, type ProblemMeta, type ProblemSample, } from '../src/shared/types.ts';
import { normaliseText, normalizeAssetUrls, sanitizeHtml } from './parsers.ts';
export function decodeEntities(value: string): string {
    return (value
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&'));
}
function assembleStatement(cards: ProblemCard[]): string {
    return cards
        .map((card) => `${card.title ? `<h3>${card.title}</h3>` : ''}${card.html}`)
        .join('\n');
}
function stripSampleWrappers(value: string): string {
    return value
        .replace(/<\/?span\b[^>]*>/gi, '')
        .replace(/<\/?pre\b[^>]*>/gi, '')
        .replace(/<\/?div\b[^>]*>/gi, '');
}
function parseSampleBlock(node: HTMLElement): ProblemSample | null {
    const clean = (value: string) => stripSampleWrappers(decodeEntities(value)).replace(/\r\n?/g, '\n').trim();
    const items = node.querySelectorAll('.in-out-item');
    const texts: string[] = [];
    if (items.length > 0) {
        for (const item of items) {
            const pre = item.querySelector('pre');
            const sampledata = item.querySelector('.sampledata');
            texts.push(clean((pre ?? sampledata ?? item).textContent ?? ''));
        }
    }
    else {
        for (const span of node.querySelectorAll('.sampledata')) {
            texts.push(clean(span.textContent ?? ''));
        }
    }
    if (texts.length === 0) {
        const raw = node.innerHTML ?? '';
        if (/sampledata/i.test(raw)) {
            const parts: string[] = [];
            for (const match of raw.matchAll(/<span[^>]*sampledata[^>]*>([\s\S]*?)(?:<\/span>|$)/gi)) {
                parts.push(clean(match[1]));
            }
            if (parts.length > 0)
                texts.push(...parts);
        }
    }
    if (texts.length >= 2)
        return { input: texts[0], output: texts[1] };
    const pres = node.querySelectorAll('pre');
    if (pres.length >= 2) {
        return { input: clean(pres[0].textContent ?? ''), output: clean(pres[1].textContent ?? '') };
    }
    const input = node.querySelector('.in');
    const output = node.querySelector('.out');
    if (input && output) {
        return { input: clean(input.textContent ?? ''), output: clean(output.textContent ?? '') };
    }
    if (texts.length === 1)
        return { input: texts[0], output: '' };
    return null;
}
function parseSampleExplanations(node: HTMLElement): string {
    const parts: string[] = [];
    for (const block of node.querySelectorAll('.content')) {
        const stripped = (block.innerHTML ?? '')
            .replace(/<span\b[^>]*sampledata[^>]*>[\s\S]*?<\/span>/gi, '')
            .replace(/<span\b[^>]*sampledata[^>]*>[\s\S]*$/gi, '');
        const html = stripped.trim();
        if (html)
            parts.push(sanitizeHtml(html));
    }
    return parts.join('\n');
}
export function parseProblemCards(root: HTMLElement): ProblemCard[] {
    const cards: ProblemCard[] = [];
    for (const row of root.querySelectorAll('.cnt-row')) {
        const head = row.querySelector('.cnt-row-head');
        const body = row.querySelector('.cnt-row-body');
        if (!body)
            continue;
        const title = decodeEntities(normaliseText(head?.textContent ?? '')).trim();
        const sampleNodes = body.querySelectorAll('.data-sample');
        const samples: ProblemSample[] = [];
        let explanation = '';
        for (const node of sampleNodes) {
            const parsed = parseSampleBlock(node);
            if (parsed)
                samples.push(parsed);
            const text = parseSampleExplanations(node);
            if (text)
                explanation += text;
        }
        const renderable = body.querySelector('.content.lang_cn') ??
            body.querySelector('.content:not(.hidden)') ??
            body;
        const rawHtml = sampleNodes.length > 0 ? explanation : (renderable.innerHTML ?? '');
        cards.push({
            title,
            html: normalizeAssetUrls(sanitizeHtml(rawHtml)),
            isSamples: sampleNodes.length > 0,
            samples,
        });
    }
    return cards;
}
export function parseProblemMeta(root: HTMLElement): ProblemMeta[] {
    const meta: ProblemMeta[] = [];
    const container = root.querySelector('.jumbotron');
    if (!container)
        return meta;
    for (const span of container.querySelectorAll('span.green')) {
        const label = decodeEntities(normaliseText(span.textContent ?? ''))
            .replace(/[:：]\s*$/, '')
            .trim();
        interface SiblingNode {
            nodeType: number;
            rawTagName?: string;
            textContent?: string;
            nextSibling: SiblingNode | null;
        }
        let node = (span as unknown as SiblingNode).nextSibling;
        let value = '';
        while (node) {
            if (node.nodeType === 1 && node.rawTagName === 'span')
                break;
            value += node.textContent ?? '';
            node = node.nextSibling;
        }
        const clean = decodeEntities(value).replace(/\s+/g, ' ').trim();
        if (clean)
            meta.push({ label, value: clean });
    }
    return meta;
}
export function parseProblemFileNames(html: string): {
    inputName: string | null;
    outputName: string | null;
} {
    const root = parse(html);
    const text = normaliseText(root.querySelector('h3')?.textContent ?? '');
    const inputMatch = text.match(/输入文件\s*[:：]\s*([\w.-]+)/);
    const outputMatch = text.match(/输出文件\s*[:：]\s*([\w.-]+)/);
    const strip = (value?: string) => value ? value.replace(/\.(in|out|txt)$/i, '') : null;
    if (inputMatch || outputMatch) {
        return {
            inputName: strip(inputMatch?.[1]),
            outputName: strip(outputMatch?.[1]),
        };
    }
    const rawInput = html.match(/输入文件\s*[:：][\s\S]{0,40}?([\w.-]+\.in)/i)?.[1];
    const rawOutput = html.match(/输出文件\s*[:：][\s\S]{0,40}?([\w.-]+\.out)/i)?.[1];
    return { inputName: strip(rawInput), outputName: strip(rawOutput) };
}
export function parseProblemLimits(html: string): {
    timeLimitMs: number | null;
    memoryLimitKb: number | null;
} {
    const text = normaliseText(parse(html).textContent);
    const time = text.match(/时间限制\s*[:：]?\s*([\d.]+)\s*(ms|s|秒|毫秒)?/i);
    const memory = text.match(/内存限制\s*[:：]?\s*([\d.]+)\s*(mb|kb|m|k)?/i);
    let timeLimitMs: number | null = null;
    if (time) {
        const value = Number.parseFloat(time[1]);
        const unit = (time[2] ?? 's').toLowerCase();
        if (!Number.isNaN(value)) {
            timeLimitMs = unit.startsWith('ms') || unit === '毫秒' ? value : value * 1000;
        }
    }
    let memoryLimitKb: number | null = null;
    if (memory) {
        const value = Number.parseFloat(memory[1]);
        const unit = (memory[2] ?? 'mb').toLowerCase();
        if (!Number.isNaN(value)) {
            memoryLimitKb = unit.startsWith('k') ? value : value * 1024;
        }
    }
    return { timeLimitMs, memoryLimitKb };
}
export function parseProblemSamples(html: string): ProblemSample[] {
    const root = parse(html);
    const blocks = root.querySelectorAll('.sampledata');
    const texts = blocks.map((block: HTMLElement) => decodeEntities(block.textContent).replace(/\r\n?/g, '\n').trimEnd());
    const samples: ProblemSample[] = [];
    for (let i = 0; i + 1 < texts.length; i += 2) {
        samples.push({ input: texts[i], output: texts[i + 1] });
    }
    return samples;
}
export function parseLanguages(html: string): JudgeLanguage[] {
    const root = parse(html);
    const select = root.querySelector('#language') ?? root.querySelector('select[name="language"]');
    if (!select)
        return [];
    const languages: JudgeLanguage[] = [];
    for (const option of select.querySelectorAll('option')) {
        const id = Number.parseInt(option.getAttribute('value') ?? '', 10);
        const name = normaliseText(option.textContent);
        if (Number.isNaN(id) || !name)
            continue;
        languages.push({ id, name });
    }
    return languages;
}
export function parseProblemDetail(html: string, problemId: number): ProblemDetail {
    const root = parse(html);
    const rawTitle = normaliseText(root.querySelector('h2')?.textContent) ||
        normaliseText(root.querySelector('title')?.textContent) ||
        '';
    const title = rawTitle.replace(/^问题\s*\d+\s*(--?|:)?\s*/, '').replace(/^\d+\s*[:：]\s*/, '').trim() ||
        `题目 ${problemId}`;
    const element = root as unknown as HTMLElement;
    const cards = parseProblemCards(element);
    const { inputName, outputName } = parseProblemFileNames(html);
    const { timeLimitMs, memoryLimitKb } = parseProblemLimits(html);
    const cardSamples = cards.flatMap((card) => card.samples);
    return {
        id: problemId,
        title,
        cards,
        statementHtml: assembleStatement(cards),
        meta: parseProblemMeta(element),
        inputName,
        outputName,
        samples: cardSamples.length ? cardSamples : parseProblemSamples(html),
        timeLimitMs,
        memoryLimitKb,
        languages: [],
    };
}
export function parseSubmitResponse(body: string): number | null {
    const patterns = [
        /solution_id\s*=\s*(\d+)/i,
        /sid=(\d+)/i,
        /status\.php\?[^"'\s]*id=(\d+)/i,
        /reinfo\.php\?sid=(\d+)/i,
    ];
    for (const pattern of patterns) {
        const match = body.match(pattern);
        if (match)
            return Number.parseInt(match[1], 10);
    }
    return null;
}
export function buildSubmitForm(request: {
    problemId?: number;
    contestId?: number;
    contestPid?: number;
    languageId: number;
    source: string;
    enableO2: boolean;
}): Record<string, string> {
    const form: Record<string, string> = {
        language: String(request.languageId),
        source: request.source,
    };
    if (request.contestId !== undefined && request.contestPid !== undefined) {
        form.cid = String(request.contestId);
        form.pid = String(request.contestPid);
    }
    else if (request.problemId !== undefined) {
        form.id = String(request.problemId);
    }
    if (request.enableO2)
        form.enable_O2 = 'on';
    return form;
}
export function contestProblemLabel(index: number): string {
    if (index < 26)
        return String.fromCharCode(65 + index);
    return String.fromCharCode(97 + (index - 26));
}
export function parseContestProblems(html: string): ContestProblem[] {
    if (html.includes('比赛尚未开始或私有，不能查看题目'))
        return [];
    const root = parse(html);
    const table = root.querySelector('#problemset');
    if (!table)
        return [];
    const problems: ContestProblem[] = [];
    const rows = table.querySelectorAll('tbody tr');
    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3)
            continue;
        const link = row.querySelector('a[href*="problem.php"]');
        const title = normaliseText(link?.textContent);
        if (!title)
            continue;
        const url = link?.getAttribute('href') ?? '';
        const indexMatch = url.match(/[?&]pid=(\d+)/);
        const index = indexMatch ? Number.parseInt(indexMatch[1], 10) : problems.length;
        const idCell = normaliseText(cells[1]?.textContent);
        const problemId = parseIntegerFromText(idCell);
        problems.push({
            index,
            label: contestProblemLabel(problems.length),
            title,
            url: url ? new URL(url, XMOJ_ORIGIN).href : `${XMOJ_ORIGIN}/problem.php?id=`,
            problemId,
        });
    }
    return problems;
}
function parseIntegerFromText(value: string): number | null {
    const match = value.match(/(\d{3,})/);
    return match ? Number.parseInt(match[1], 10) : null;
}
export { XMOJ_ORIGIN };
