import type { UserInfo, UserTag } from './types.ts';
export function resolveUserBadge(_username: string, info?: UserInfo | null, explicit?: UserTag | null): UserTag | null {
    const tag = explicit?.content ? explicit : info?.badge;
    if (!tag?.content.trim()) return null;
    if (tag.content.trim().replace(/^[【\[]|[】\]]$/g, '') === '脚本管理员') return null;
    return tag;
}
export function userBadgeStyle(tag: UserTag): { backgroundColor: string; color: string } {
    return {
        backgroundColor: /^#[0-9a-f]{6}$/i.test(tag.backgroundColor) ? tag.backgroundColor : '#000000',
        color: /^#[0-9a-f]{6}$/i.test(tag.color) ? tag.color : '#ffffff',
    };
}
