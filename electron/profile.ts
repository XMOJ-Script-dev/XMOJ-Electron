import { parse } from 'node-html-parser';
import { XMOJ_ORIGIN, type SolvedProblem, type UserProfile } from '../src/shared/types.ts';
import type { HttpClient } from './http.ts';
import { normaliseText } from './parsers.ts';
export function parseSolvedProblems(html: string): SolvedProblem[] {
    const problems: SolvedProblem[] = [];
    const seen = new Set<number>();
    const call = /p\(\s*(\d+)\s*,\s*(\d+)\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = call.exec(html)) !== null) {
        const id = Number.parseInt(match[1], 10);
        if (seen.has(id))
            continue;
        seen.add(id);
        problems.push({
            id,
            attempts: Number.parseInt(match[2], 10),
            url: `${XMOJ_ORIGIN}/problem.php?id=${id}`,
        });
    }
    return problems;
}
export function parseUserProfile(html: string, username: string): UserProfile {
    const root = parse(html);
    const text = normaliseText(root.querySelector('.container')?.textContent ?? html);
    const headerMatch = text.match(new RegExp(`${escapeRegExp(username)}\\s*-{2}\\s*([^\\s短]+)`));
    const nick = headerMatch ? headerMatch[1].trim() : '';
    const solvedMatch = text.match(/解决\s*(\d+)/);
    const solvedTotal = solvedMatch ? Number.parseInt(solvedMatch[1], 10) : null;
    const problems = parseSolvedProblems(html);
    const rows = root.querySelectorAll('#statics tr').map((row) => row.querySelectorAll('td'));
    const stats = rows
        .filter((cells) => cells.length > 1 &&
            !/^(解决|solved)/i.test(normaliseText(cells[0].textContent)) &&
            cells[1].querySelector('a[href*="jresult="]'))
        .map((cells) => ({
            label: normaliseText(cells[0].textContent),
            count: parseCount(cells[1].textContent),
            result: Number(cells[1].querySelector('a[href*="jresult="]')?.getAttribute('href')?.match(/[?&]jresult=(\d+)/)?.[1]),
        }))
        .filter((entry) => Number.isFinite(entry.result) && entry.count !== null);
    const resultStats = stats.map(({ label, count }) => ({ label, count: count ?? 0 }));
    const submissionTotal = findCount(rows, /^(提交|提交次数|submissions?)$/i);
    const acceptedTotal = findCount(rows, /^(正确|通过|accepted)$/i);
    const solved = solvedTotal ?? problems.length;
    const failures = stats
        .filter((entry) => entry.result >= 5 && entry.result <= 10)
        .reduce((total, entry) => total + (entry.count ?? 0), 0);
    const activity = parseActivity(root);
    return {
        username,
        nick,
        solvedTotal: solved,
        submissionTotal: submissionTotal ?? 0,
        acceptedTotal: acceptedTotal ?? 0,
        rating: calculateRating(solved, failures, activity),
        resultStats,
        activity,
        problems,
        profileUrl: `${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(username)}`,
    };
}
function parseCount(value: string): number | null {
    const match = normaliseText(value).replace(/,/g, '').match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : null;
}
function findCount(rows: ReturnType<ReturnType<typeof parse>['querySelectorAll']>[], label: RegExp): number | null {
    for (const cells of rows) {
        if (cells.length > 1 && label.test(normaliseText(cells[0].textContent)))
            return parseCount(cells[1].textContent);
    }
    return null;
}
function parseActivity(root: ReturnType<typeof parse>): UserProfile['activity'] {
    const script = root.querySelectorAll('script').find((node) =>
        /\$\.plot\s*\(/.test(node.textContent) && /["']#submission["']/.test(node.textContent));
    if (!script)
        return [];
    const series = [new Map<number, number>(), new Map<number, number>()];
    for (const match of script.textContent.matchAll(/\bd([12])\.push\(\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]\s*\)\s*;?/g)) {
        const timestamp = Number(match[2]);
        const count = Number(match[3]);
        if (!Number.isSafeInteger(timestamp) || timestamp <= 0 || timestamp > 8640000000000000 || !Number.isSafeInteger(count))
            continue;
        series[Number(match[1]) - 1].set(timestamp, count);
    }
    const timestamps = new Set([...series[0].keys(), ...series[1].keys()]);
    return [...timestamps].sort((a, b) => a - b).map((timestamp) => ({
        timestamp,
        submissions: series[0].get(timestamp) ?? 0,
        accepted: series[1].get(timestamp) ?? 0,
    }));
}
function calculateRating(
    solved: number,
    failures: number,
    activity: UserProfile['activity'],
): number {
    if (solved === 0)
        return 0;
    const solveProgress = Math.min(1, Math.log1p(solved) / Math.log1p(2000));
    const successRate = (solved + 4) / (solved + failures + 10);
    const activityProgress = Math.min(1, activity.length / 365);
    return Math.round(3000 * (0.7 * solveProgress + 0.2 * successRate + 0.1 * activityProgress));
}
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export async function fetchUserProfile(http: HttpClient, username: string): Promise<UserProfile> {
    const response = await http.get(`${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(username)}`);
    return parseUserProfile(response.body, username);
}
