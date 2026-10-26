import { fetchUserInfo } from '@/services/api';
import { userColor } from '@/lib/user-color';
import { usePanel } from '@/stores/panel';
import { useNavigation } from '@/stores/navigation';
import { useToasts } from '@/stores/toasts';
import { XMOJ_ORIGIN } from '@/shared/types';
import { isExternalWebUrl, isJudgeUrl } from '@/shared/links';
import { resolveUserBadge, userBadgeStyle } from '@/shared/user-badge';
import type { UserInfo } from '@/shared/types';
import { watch } from 'vue';
import { useSession } from '@/stores/session';
export function installRichLinks(): void {
    let colored = new WeakSet<HTMLElement>();
    const session = useSession();
    function decorate(anchor: HTMLElement, username: string, info?: UserInfo): void {
        anchor.style.color = userColor(username, info?.rating);
        const tag = resolveUserBadge(username, info);
        const existing = anchor.nextElementSibling?.matches('[data-rich-user-badge]') ? anchor.nextElementSibling as HTMLElement : null;
        if (!tag) { existing?.remove(); return; }
        const badge = existing ?? document.createElement('span');
        badge.dataset.richUserBadge = '';
        badge.dataset.slot = 'user-badge';
        badge.textContent = tag.content;
        badge.className = 'ml-1.5 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium leading-none align-middle';
        Object.assign(badge.style, userBadgeStyle(tag));
        if (!existing) anchor.after(badge);
    }
    function enrich(root: Node): void {
        if (!(root instanceof Element) && !(root instanceof Text)) return;
        if (root.parentElement?.closest('a,[data-user-mention],pre,code,textarea,input,script,style,.monaco-editor,[contenteditable="true"]')) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = root instanceof Text ? [root] : [];
        while (walker.nextNode()) nodes.push(walker.currentNode as Text);
        for (const node of nodes) {
            if (!node.isConnected || node.parentElement?.closest('a,[data-user-mention],[data-slot="user-badge"],pre,code,textarea,input,script,style,.monaco-editor,[contenteditable="true"]')) continue;
            if (node.parentElement && node.parentElement.childNodes.length !== 1 && !node.parentElement.closest('.announcement-body')) continue;
            const text = node.textContent ?? '';
            const matches = [...text.matchAll(/(?<![\w@])@([A-Za-z0-9_](?:[A-Za-z0-9_.-]*[A-Za-z0-9_])?)/g)];
            if (!matches.length) continue;
            const fragment = document.createDocumentFragment();
            let start = 0;
            for (const match of matches) {
                fragment.append(text.slice(start, match.index));
                const anchor = document.createElement(node.parentElement?.closest('button') ? 'span' : 'a');
                if (anchor instanceof HTMLAnchorElement) anchor.href = `${XMOJ_ORIGIN}/userinfo.php?user=${encodeURIComponent(match[1])}`;
                else { anchor.dataset.userMention = match[1]; anchor.setAttribute('role', 'link'); anchor.tabIndex = 0; }
                anchor.textContent = match[0];
                anchor.className = 'cursor-pointer underline underline-offset-4';
                fragment.append(anchor);
                start = match.index + match[0].length;
            }
            fragment.append(text.slice(start));
            node.replaceWith(fragment);
        }
        const anchors = root instanceof Element ? [...root.querySelectorAll<HTMLElement>('a[href*="userinfo.php"], [data-user-mention]'), ...(root instanceof HTMLElement && root.matches('a[href*="userinfo.php"], [data-user-mention]') ? [root] : [])] : [];
        for (const anchor of anchors) {
            if (colored.has(anchor)) continue;
            colored.add(anchor);
            try {
                const name = anchor.dataset.userMention ?? new URL(anchor.getAttribute('href') ?? '', XMOJ_ORIGIN).searchParams.get('user');
                if (!name) continue;
                decorate(anchor, name);
                const viewer = session.state.user?.username;
                void fetchUserInfo(name).then(info => {
                    if (anchor.isConnected && viewer === session.state.user?.username) decorate(anchor, name, info);
                }).catch(() => {});
            } catch {}
        }
    }
    const observer = new MutationObserver(records => {
        for (const record of records) {
            if (record.type === 'characterData') enrich(record.target);
            else for (const node of record.addedNodes) enrich(node);
        }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    enrich(document.body);
    watch([() => session.state.authenticated, () => session.state.user?.username], () => {
        colored = new WeakSet();
        enrich(document.body);
    });
    document.addEventListener('click', event => {
        const mention = (event.target as Element)?.closest<HTMLElement>('[data-user-mention]');
        if (mention?.dataset.userMention) {
            event.preventDefault(); event.stopPropagation();
            usePanel().openProfile(mention.dataset.userMention);
            return;
        }
        const anchor = (event.target as Element)?.closest<HTMLAnchorElement>('a[href]');
        if (!anchor) return;
        if (anchor.getAttribute('href')?.startsWith('#')) return;
        let url: URL;
        try { url = new URL(anchor.getAttribute('href')!, `${XMOJ_ORIGIN}/`); } catch { return; }
        if (isExternalWebUrl(url)) {
            event.preventDefault(); event.stopPropagation();
            void window.xmoj.app.openLink(url.href).catch(error => useToasts().error(String(error)));
            return;
        }
        if (!isJudgeUrl(url)) return;
        const nav = useNavigation();
        if (url.pathname === '/userinfo.php' && url.searchParams.get('user')) {
            event.preventDefault(); event.stopPropagation(); usePanel().openProfile(url.searchParams.get('user')!);
        } else if (/^\/(upload\/file|downloads)\//.test(url.pathname)) {
            event.preventDefault();
            void window.xmoj.app.openLink(url.href).catch(error => useToasts().error(String(error)));
        } else if (url.pathname === '/problem.php' && Number(url.searchParams.get('id')) > 0) {
            event.preventDefault(); usePanel().close(); nav.viewProblem(Number(url.searchParams.get('id')));
        } else if (/\/discuss3\/thread\.php$/.test(url.pathname) && Number(url.searchParams.get('tid')) > 0) {
            event.preventDefault(); nav.viewThread(Number(url.searchParams.get('tid')), Number(url.searchParams.get('page')) || 1);
        } else {
            const views = { '/': 'home', '/index.php': 'home', '/open_contest.php': 'monthly', '/contest.php': 'contests', '/web/contest': 'contests', '/problemset.php': 'problemset', '/status.php': 'status', '/downloads.php': 'downloads', '/discuss3/': 'discussion' } as const;
            const view = !url.search ? views[url.pathname as keyof typeof views] : undefined;
            event.preventDefault(); event.stopPropagation();
            if (view) nav.navigate(view);
            else void window.xmoj.app.openLink(url.href).catch(error => useToasts().error(String(error)));
        }
    }, true);
    document.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && (event.target as HTMLElement)?.matches('[data-user-mention]')) {
            event.preventDefault(); (event.target as HTMLElement).click();
        }
    });
}
