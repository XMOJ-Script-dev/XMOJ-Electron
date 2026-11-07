import { XMOJ_ORIGIN, XMOJ_SCRIPT_ORIGIN, type DialogButton } from '@/shared/types';
import { showDialog } from '@/stores/dialog';
export type UpdateStatus = 'available' | 'current' | 'unknown';
export interface UpdateEntry {
    version: string;
    date: number | null;
    prerelease: boolean;
    items: {
        title: string;
        description: string;
    }[];
    notes: string;
}
export interface UpdateCheckResult {
    status: UpdateStatus;
    current: string;
    latest: string | null;
    entries: UpdateEntry[];
    message?: string;
}
interface RawRelease {
    tag_name?: string;
    prerelease?: boolean;
    published_at?: string | null;
    body?: string | null;
}
function compareVersions(a: string, b: string): number {
    const parse = (value: string) => {
        const cleaned = String(value ?? '').trim().replace(/^v/i, '');
        const match = cleaned.match(/^(.*?)(?:-(.+))?$/);
        const numbers = (match?.[1] ?? '')
            .split(/[.+]/)
            .map((part) => Number.parseInt(part, 10))
            .map((n) => (Number.isFinite(n) ? n : 0));
        return { numbers, prerelease: Boolean(match?.[2]) };
    };
    const left = parse(a);
    const right = parse(b);
    const length = Math.max(left.numbers.length, right.numbers.length);
    for (let i = 0; i < length; i++) {
        const l = left.numbers[i] ?? 0;
        const r = right.numbers[i] ?? 0;
        if (l !== r)
            return l > r ? 1 : -1;
    }
    if (left.prerelease !== right.prerelease)
        return left.prerelease ? -1 : 1;
    return 0;
}
function toEntry(version: string, raw: RawRelease): UpdateEntry {
    return {
        version,
        date: raw.published_at ? Date.parse(raw.published_at) : null,
        prerelease: raw.prerelease === true,
        items: [],
        notes: String(raw.body ?? '').trim(),
    };
}
const RELEASE_PAGE_URL = 'https://github.com/XMOJ-Script-dev/XMOJ-Electron/releases';
const RELEASES_API_URL = 'https://api.github.com/repos/XMOJ-Script-dev/XMOJ-Electron/releases?per_page=20';
export async function checkAppUpdate(): Promise<UpdateCheckResult> {
    const current = await window.xmoj.app.version();
    const response = await window.xmoj.app.fetchJson(RELEASES_API_URL);
    if (!response.ok || !response.data) {
        return {
            status: 'unknown',
            current,
            latest: null,
            entries: [],
            message: response.error ?? `HTTP ${response.status}`,
        };
    }
    const releases = Array.isArray(response.data)
        ? (response.data as RawRelease[]).filter((release) => typeof release.tag_name === 'string' && release.tag_name.trim())
        : [];
    if (releases.length === 0) {
        return { status: 'unknown', current, latest: null, entries: [], message: '没有发布版本记录' };
    }
    const sorted = releases.slice().sort((a, b) => compareVersions(a.tag_name!, b.tag_name!));
    const newestStable = [...sorted].reverse().find((release) => release.prerelease !== true);
    if (!newestStable?.tag_name) {
        return { status: 'unknown', current, latest: null, entries: [], message: '没有正式版本记录' };
    }
    const newest = sorted[sorted.length - 1];
    const entries = [newestStable, newest]
        .filter((release, index, list) => list.indexOf(release) === index)
        .map((release) => toEntry(release.tag_name!, release));
    const status: UpdateStatus = compareVersions(current, newestStable.tag_name) < 0 ? 'available' : 'current';
    return {
        status,
        current,
        latest: newestStable.tag_name,
        entries,
    };
}
export function projectLinks(): {
    label: string;
    url: string;
}[] {
    return [
        { label: '脚本官网', url: XMOJ_SCRIPT_ORIGIN },
        { label: '判题站', url: XMOJ_ORIGIN },
        { label: '更新日志', url: RELEASE_PAGE_URL },
        { label: '问题反馈', url: 'https://github.com/XMOJ-Script-dev/XMOJ-Electron/issues' },
    ];
}
export async function showAboutDialog(): Promise<void> {
    let version = '未知';
    try {
        version = await window.xmoj.app.version();
    }
    catch {
        version = '未知';
    }
    const links = projectLinks()
        .map((link) => `${link.label}：${link.url}`)
        .join('\n');
    await showDialog({
        title: '关于 XMOJ Electron',
        message: `XMOJ Electron ${version}`,
        detail: [
            '基于小明的 OJ 的桌面客户端。',
            '',
            `Electron ${navigator.userAgent.match(/Electron\/[\d.]+/)?.[0] ?? ''}`,
            '',
            links,
        ]
            .filter((line) => line !== undefined)
            .join('\n'),
        buttons: [{ id: 'ok', label: '关闭' }],
        defaultId: 'ok',
        cancelId: 'ok',
    });
}
function formatUpdateDate(value: number | null): string {
    if (value === null)
        return '';
    const ms = value > 1e12 ? value : value * 1000;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('zh-CN');
}
export async function showUpdateDialog(result: UpdateCheckResult): Promise<void> {
    const lines: string[] = [];
    let message: string;
    let buttons: DialogButton[];
    let releaseUrl: string | null = null;
    if (result.status === 'unknown') {
        message = '检查更新失败';
        lines.push(result.message ?? '无法获取更新信息');
        buttons = [{ id: 'close', label: '关闭' }];
    }
    else if (result.status === 'available' && result.latest) {
        message = `发现新版本 ${result.latest}（当前版本 ${result.current}）`;
        releaseUrl = RELEASE_PAGE_URL;
        lines.push(`最新版本：${result.latest}`, `当前版本：${result.current}`, '');
        for (const entry of result.entries) {
            const date = formatUpdateDate(entry.date);
            lines.push(`${entry.prerelease ? '预览版' : '正式版'} ${entry.version}${date ? `（${date}）` : ''}`);
            for (const item of entry.items) {
                if (item.description)
                    lines.push(`  - ${item.title ? `${item.title} ` : ''}${item.description}`);
            }
            if (entry.notes)
                lines.push(`  备注：${entry.notes}`);
            lines.push('');
        }
        buttons = [
            { id: 'release', label: '前往发布页' },
            { id: 'close', label: '关闭' },
        ];
    }
    else {
        message = '已是最新版本';
        lines.push(`当前版本：${result.current}`, `最新版本：${result.latest ?? '未知'}`);
        buttons = [{ id: 'close', label: '关闭' }];
    }
    const choice = await showDialog({
        title: '检查更新',
        message,
        detail: lines.join('\n').trim(),
        buttons,
        defaultId: 'close',
        cancelId: 'close',
    });
    if (choice.buttonId === 'release' && releaseUrl)
        await window.xmoj.app.openLink(releaseUrl).catch(() => undefined);
}
