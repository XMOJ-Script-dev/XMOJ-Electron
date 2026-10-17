import { parse } from 'node-html-parser';
import { XMOJ_ORIGIN, type MonthlyBoard, type MonthlyCard, type SoftwareEntry } from '../src/shared/types.ts';
import type { HttpClient } from './http.ts';
import { absoluteUrl, normaliseText, sanitizeHtml } from './parsers.ts';
export function parseMonthlyBoard(html: string): MonthlyBoard {
    const root = parse(html);
    const cards: MonthlyCard[] = [];
    const headers = root.querySelectorAll('h4.ui.block.top.attached.header');
    const intro = sanitizeHtml((root.querySelector('.col-md-4')?.innerHTML ?? '').trim());
    for (const header of headers) {
        const title = normaliseText(header.querySelector('.content')?.textContent ?? header.textContent);
        const date = normaliseText(header.querySelector('small')?.textContent) || null;
        if (!title)
            continue;
        let body: typeof header | null = null;
        let cursor = header.nextElementSibling;
        while (cursor) {
            if (cursor.classList.contains('news_content') || cursor.classList.contains('segment')) {
                body = cursor as typeof header;
                break;
            }
            if (cursor.rawTagName === 'H4')
                break;
            cursor = cursor.nextElementSibling;
        }
        const rawHtml = body?.innerHTML ?? '';
        const text = normaliseText(body?.textContent ?? '');
        if (!body || text.length === 0)
            continue;
        cards.push({ title, date, html: sanitizeHtml(rawHtml), text: text.slice(0, 400) });
    }
    if (cards.length === 0) {
        const column = root.querySelector('.col-md-8') ?? root.querySelector('.container');
        const blocks = column?.querySelectorAll('h4, .segment') ?? [];
        for (let i = 0; i < blocks.length; i += 2) {
            const head = blocks[i];
            const body = blocks[i + 1];
            const title = normaliseText(head.textContent);
            const html = sanitizeHtml(body?.innerHTML ?? '');
            if (title && normaliseText(body?.textContent ?? '')) {
                cards.push({ title, date: null, html, text: normaliseText(body?.textContent ?? '').slice(0, 400) });
            }
        }
    }
    return { intro, cards, url: `${XMOJ_ORIGIN}/open_contest.php` };
}
export async function fetchMonthlyBoard(http: HttpClient): Promise<MonthlyBoard> {
    const response = await http.get(`${XMOJ_ORIGIN}/open_contest.php`);
    return parseMonthlyBoard(response.body);
}
export function parseSoftwareList(html: string): SoftwareEntry[] {
    const root = parse(html);
    const entries: SoftwareEntry[] = [];
    const seen = new Set<string>();
    for (const anchor of root.querySelectorAll('a[href]')) {
        const url = absoluteUrl(anchor.getAttribute('href'));
        if (!url)
            continue;
        const image = anchor.querySelector('img');
        const imageUrl = absoluteUrl(image?.getAttribute('src'));
        const label = normaliseText(anchor.textContent) ||
            normaliseText(anchor.getAttribute('title')) ||
            (imageUrl ? imageUrl.split('/').pop() ?? '' : '');
        if (!label)
            continue;
        const key = `${label}|${url}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        entries.push({ name: label, url, image: imageUrl });
    }
    return entries;
}
export async function fetchSoftwareList(http: HttpClient): Promise<SoftwareEntry[]> {
    const response = await http.get(`${XMOJ_ORIGIN}/downloads.php`);
    return parseSoftwareList(response.body);
}
