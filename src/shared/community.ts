export interface ApiControlFlags {
    TokenInvalid?: boolean;
    SessionRequired?: boolean;
}
export interface ApiEnvelope<T> {
    Success: boolean;
    Message?: string;
    Data: T & ApiControlFlags;
}
export interface ApiRequestBody {
    Authentication: {
        Token?: string;
        SessionID?: string;
        Username?: string;
    };
    Data: unknown;
    Version: string;
    DebugMode: boolean;
}
export const UNAUTHENTICATED_ACTIONS = ['GetNotice', 'GetAddOnScript'] as const;
export interface BbsBoard {
    BoardID: number;
    BoardName: string;
}
export interface BbsPost {
    PostID: number;
    BoardName?: string;
    Title: string;
    UserID?: string;
    ProblemID?: number;
    PostTime?: number;
    ReplyCount?: number;
    LastReplyTime?: number;
    Lock?: {
        Locked?: boolean;
    };
}
export interface BbsReply {
    ReplyID: number;
    UserID?: string;
    Content: string;
    ReplyTime?: number;
    EditTime?: number | null;
    EditPerson?: string;
}
export interface BbsPostDetail {
    PostID?: number;
    Title: string;
    UserID?: string;
    Content?: string;
    ProblemID?: number;
    BoardName?: string;
    PostTime?: number;
    PageCount?: number;
    Lock?: {
        Locked?: boolean;
        LockTime?: number;
        LockPerson?: string;
    };
    Reply?: BbsReply[];
}
export interface BbsPostPage {
    Posts: BbsPost[];
    PageCount: number;
}
export interface MailThreadSummary {
    OtherUser: string;
    UnreadCount: number;
    LastsMessage: string;
    SendTime: number;
}
export interface MailMessage {
    FromUser: string;
    Content: string;
    SendTime: number;
    IsRead: boolean;
}
export interface BbsMention {
    MentionID: number;
    MentionTime?: number;
    PostTitle?: string;
    PostID?: number;
    PageNumber?: number;
}
export interface MailMention {
    MentionID: number;
    MentionTime?: number;
    FromUserID?: string;
}
export interface UserBadge {
    Content: string;
    BackgroundColor: string;
    Color: string;
}
