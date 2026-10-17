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
    return {
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
