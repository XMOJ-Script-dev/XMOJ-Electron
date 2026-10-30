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
interface RawUpdateHistory {
    [version: string]: {
        UpdateDate?: number;
        Prerelease?: boolean;
        UpdateContents?: {
            PR?: number;
            Description?: string;
        }[];
        Notes?: string;
    };
}
interface UpdateManifest {
    UpdateHistory?: RawUpdateHistory;
}
function compareVersions(a: string, b: string): number {
    const parse = (value: string) => String(value ?? '')
        .trim()
        .replace(/^v/i, '')
        .split(/[.\-+]/)
        .map((part) => Number.parseInt(part, 10))
        .map((n) => (Number.isFinite(n) ? n : 0));
    const left = parse(a);
    const right = parse(b);
    const length = Math.max(left.length, right.length);
    for (let i = 0; i < length; i++) {
        const l = left[i] ?? 0;
        const r = right[i] ?? 0;
        if (l !== r)
            return l > r ? 1 : -1;
    }
    return 0;
}
function toEntry(version: string, raw: RawUpdateHistory[string]): UpdateEntry {
    return {
        version,
        date: typeof raw.UpdateDate === 'number' ? raw.UpdateDate : null,
        prerelease: raw.Prerelease === true,
        items: (raw.UpdateContents ?? []).map((item) => ({
            title: item.PR ? `#${item.PR}` : '',
            description: String(item.Description ?? ''),
        })),
        notes: String(raw.Notes ?? ''),
    };
}
export async function checkAppUpdate(): Promise<UpdateCheckResult> {
    const current = await window.xmoj.app.version();
    const response = await window.xmoj.app.fetchJson(`${XMOJ_SCRIPT_ORIGIN}/Update.json`);
    if (!response.ok || !response.data) {
        return {
            status: 'unknown',
            current,
            latest: null,
            entries: [],
            message: response.error ?? `HTTP ${response.status}`,
        };
    }
    const manifest = response.data as UpdateManifest;
    const history = manifest.UpdateHistory ?? {};
    const versions = Object.keys(history);
    if (versions.length === 0) {
        return { status: 'unknown', current, latest: null, entries: [], message: '更新信息为空' };
    }
    const sorted = versions.slice().sort(compareVersions);
    const newestStable = [...sorted].reverse().find((version) => history[version]?.Prerelease !== true);
    if (!newestStable) {
        return { status: 'unknown', current, latest: null, entries: [], message: '没有正式版本记录' };
    }
    const newest = sorted[sorted.length - 1];
    const entries = [newestStable, newest]
        .filter((version, index, list) => list.indexOf(version) === index)
        .map((version) => toEntry(version, history[version]));
    const status: UpdateStatus = compareVersions(current, newestStable) < 0 ? 'available' : 'current';
    return {
        status,
        current,
        latest: newestStable,
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
        { label: '更新日志', url: `${XMOJ_SCRIPT_ORIGIN}/Update.json` },
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
const RELEASE_PAGE_URL = 'https://github.com/XMOJ-Script-dev/XMOJ-Electron/releases';
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
        defaultId: buttons[0].id,
        cancelId: 'close',
    });
    if (choice.buttonId === 'release' && releaseUrl)
        await window.xmoj.app.openLink(releaseUrl).catch(() => undefined);
}
