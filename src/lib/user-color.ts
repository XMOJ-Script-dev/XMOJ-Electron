import { DISCUSSION_ADMINS } from '../shared/discussion.ts';
const ADMINS = new Set(DISCUSSION_ADMINS);
export function userColor(username: string, rating = 0): string {
    if (ADMINS.has(username.toLowerCase())) return '#a855f7';
    return rating >= 2400 ? '#dc2f5a' : rating >= 2000 ? '#e8590c' : rating >= 1600 ? '#337cf2' : rating >= 1200 ? '#2b9f4f' : rating >= 800 ? '#1798b0' : '#78828c';
}
