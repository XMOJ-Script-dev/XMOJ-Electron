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
    const statistics = root.querySelectorAll('#statics tr').flatMap(row => {
        const cells = row.querySelectorAll('td');
        const label = normaliseText(cells[0]?.textContent);
        const link = cells[1]?.querySelector('a[href*="jresult="]');
        const verdict = Number(link?.getAttribute('href')?.match(/jresult=(\d+)/)?.[1]);
        const count = Number(link?.textContent.trim());
        return link && !/^(解决|Solved)/i.test(label) && Number.isFinite(verdict) && Number.isFinite(count) ? [{ label, count, verdict }] : [];
    });
    const series = [new Map<number, number>(), new Map<number, number>()];
    for (const match of html.matchAll(/\bd([12])\.push\(\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]\s*\)/g)) {
        const timestamp = Number(match[2]), count = Number(match[3]);
        if (Number.isSafeInteger(timestamp) && timestamp > 0 && timestamp <= 8640000000000000 && Number.isSafeInteger(count)) series[Number(match[1]) - 1].set(timestamp, count);
    }
    const activity = [...new Set([...series[0].keys(), ...series[1].keys()])].sort((a, b) => a - b).map(timestamp => ({ timestamp, submitted: series[0].get(timestamp) ?? 0, accepted: series[1].get(timestamp) ?? 0 }));
    const failures = statistics.filter(s => s.verdict >= 5 && s.verdict <= 10).reduce((sum, s) => sum + s.count, 0);
    const solved = problems.length;
    let totalAC = 0, cappedAC = 0;
    for (const count of series[1].values()) {
        totalAC += count;
        cappedAC += count <= 8 ? count : 8 + 8 * Math.log(1 + (count - 8) / 8);
    }
    const volume = 1 - Math.exp(-solved * (totalAC > 0 ? cappedAC / totalAC : 1) / 350);
    const precision = (solved + 10) / (solved + failures + 40);
    const accuracy = precision < 0.15 ? 0 : precision < 0.4 ? (precision - 0.15) / 0.25 : precision < 0.55 ? 1 : Math.max(0.3, 1 - (precision - 0.55) * 2);
    const rating = solved ? Math.round(3000 * Math.pow(0.57 * volume + 0.33 * accuracy * solved / (solved + 80) + 0.1 * (1 - Math.exp(-series[0].size / 250)), 0.9)) : 0;
    return {
        rating, statistics, activity,
        username,
        nick,
        solvedTotal: solvedTotal ?? problems.length,
        problems,
        profileUrl: `${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(username)}`,
    };
}
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export async function fetchUserProfile(http: HttpClient, username: string): Promise<UserProfile> {
    const response = await http.get(`${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(username)}`);
    return parseUserProfile(response.body, username);
}
