import { parse } from 'node-html-parser';
import { XMOJ_ORIGIN, type ContestRank, type RankRow } from '../src/shared/types.ts';
import type { HttpClient } from './http.ts';
import { normaliseText } from './parsers.ts';
function isAcceptedRankColor(raw: string): boolean {
    const value = raw.trim().toLowerCase();
    let rgb: [number, number, number] | null = null;
    const hex = value.match(/^#?([0-9a-f]{6})$/);
    if (hex) {
        rgb = [
            Number.parseInt(hex[1].slice(0, 2), 16),
            Number.parseInt(hex[1].slice(2, 4), 16),
            Number.parseInt(hex[1].slice(4, 6), 16),
        ];
    }
    else {
        const fn = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*[),]/);
        if (fn)
            rgb = [Number(fn[1]), Number(fn[2]), Number(fn[3])];
    }
    if (!rgb)
        return false;
    const [r, g, b] = rgb;
    return g === 255 && g > r && g > b || (r === 170 && g === 170 && b === 255);
}
export function parseContestRank(html: string, contestId: number, oi: boolean): ContestRank {
    const root = parse(html);
    const table = root.querySelector('table');
    const title = normaliseText(root.querySelector('h2, h3, .title')?.textContent ?? '')
        .replace(/^OI Mode RankList\s*--\s*/, '')
        .trim();
    if (!table) {
        return { contestId, title, oi, headers: [], rows: [] };
    }
    const trs = table.querySelectorAll('tr');
    if (trs.length === 0)
        return { contestId, title, oi, headers: [], rows: [] };
    const headerCells = trs[0]
        .querySelectorAll('th, td')
        .map((cell) => normaliseText(cell.textContent ?? ''));
    const problemCount = Math.max(0, headerCells.length - 5);
    const headers = headerCells.slice(5);
    const rows: RankRow[] = [];
    for (const tr of trs.slice(1)) {
        const cells = tr.querySelectorAll('th, td');
        if (cells.length < 5)
            continue;
        const text = (index: number) => normaliseText(cells[index]?.textContent ?? '');
        const rankRaw = text(0);
        const parsedRank = Number.parseInt(rankRaw, 10);
        const rank = Number.isFinite(parsedRank) ? parsedRank : null;
        const rankText = Number.isFinite(parsedRank) ? null : rankRaw || null;
        const solved = Number.parseInt(text(3), 10);
        const score = Number.parseInt(text(4), 10);
        const problemCells: RankRow['cells'] = [];
        for (let i = 0; i < problemCount; i++) {
            const cell = cells[5 + i];
            const value = normaliseText(cell?.textContent ?? '');
            const style = cell?.getAttribute('style') ?? '';
            const color = style.match(/background(?:-color)?\s*:\s*([^;]+)/i)?.[1] ?? style;
            const accepted = isAcceptedRankColor(color);
            problemCells.push({ text: value, accepted });
        }
        rows.push({
            rank,
            rankText,
            userId: text(1),
            nick: text(2),
            solved: Number.isFinite(solved) ? solved : 0,
            score: Number.isFinite(score) ? score : 0,
            cells: problemCells,
        });
    }
    return { contestId, title, oi, headers, rows };
}
export async function fetchContestRank(http: HttpClient, contestId: number, oi: boolean): Promise<ContestRank> {
    if (!oi) {
        const json = await fetchCorrectionRank(http, contestId);
        if (json)
            return json;
    }
    const page = oi ? 'contestrank-oi.php' : 'contestrank-correct.php';
    const response = await http.get(`${XMOJ_ORIGIN}/${page}?cid=${contestId}`);
    return parseContestRank(response.body, contestId, oi);
}
interface CorrectionRankPayload {
    contest?: {
        contestId?: number;
        title?: string;
    };
    title?: string;
    headers?: {
        num?: string;
        label?: string;
    }[];
    rows?: {
        rank?: number | string;
        rankText?: string | null;
        userId?: string;
        nick?: string;
        solved?: number;
        total?: number;
        cells?: {
            text?: string;
            bgColor?: string;
        }[];
    }[];
}
async function fetchCorrectionRank(http: HttpClient, contestId: number): Promise<ContestRank | null> {
    try {
        const response = await http.get(`${XMOJ_ORIGIN}/api/contest/${contestId}/rank-correct`);
        if (!(response.headers.get('content-type') ?? '').includes('json'))
            return null;
        const payload = JSON.parse(response.body) as CorrectionRankPayload;
        if (!Array.isArray(payload.rows))
            return null;
        const headers = (payload.headers ?? []).map((header) => String(header.num ?? header.label ?? ''));
        const rows: RankRow[] = payload.rows.map((row) => {
            const rawRank = row.rank;
            const parsed = typeof rawRank === 'number' ? rawRank : Number.parseInt(String(rawRank ?? ''), 10);
            return {
                rank: Number.isFinite(parsed) ? parsed : null,
                rankText: row.rankText ?? null,
                userId: String(row.userId ?? ''),
                nick: String(row.nick ?? ''),
                solved: Number(row.solved ?? 0),
                score: Number(row.total ?? 0),
                cells: (row.cells ?? []).map((cell) => ({
                    text: String(cell.text ?? ''),
                    accepted: isAcceptedRankColor(String(cell.bgColor ?? '')),
                })),
            };
        });
        return {
            contestId,
            title: String(payload.contest?.title ?? payload.title ?? ''),
            oi: false,
            headers,
            rows,
        };
    }
    catch {
        return null;
    }
}
