import type { BbsPostDetail } from './community.ts';
export const DISCUSSION_ADMINS = ['zhuchenrui2', 'shanwenxiao', 'chenlangning', 'liushangchen', 'admin'];
export function isDiscussionAdmin(username: string): boolean { return DISCUSSION_ADMINS.includes(username); }
export function canManageDiscussion(username: string, author?: string, locked = false): boolean {
    return !!username && (isDiscussionAdmin(username) || (!locked && username === author));
}
export function quoteReply(content: string, username?: string): string {
    const quoted = content.split('\n').map(line => /^(?:>\s*){2}/.test(line.trimStart()) ? '' : '> ' + line).join('\n');
    return `${quoted}\n\n${username ? `@${username} ` : ''}`;
}
export function attachOpeningComment(detail: BbsPostDetail, firstPage: BbsPostDetail = detail): BbsPostDetail {
    const opening = firstPage.Reply?.[0];
    if (!opening || (detail.Content?.trim() && detail.Content !== opening.Content)) return detail;
    return {
        ...detail,
        Content: opening.Content,
        RootReplyID: opening.ReplyID,
        UserID: detail.UserID || opening.UserID,
        PostTime: detail.PostTime ?? opening.ReplyTime,
    };
}
