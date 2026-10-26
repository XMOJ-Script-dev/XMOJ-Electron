import { createHmac, randomUUID } from 'node:crypto';
import { parse } from 'node-html-parser';
import type { HttpClient } from './http.ts';
import { XMOJ_ORIGIN, type ContestReplay } from '../src/shared/types.ts';
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
export function signVodRequest(params: Record<string, string>, secret: string): string {
    const query = Object.keys(params).sort().map(key => `${encode(key)}=${encode(params[key])}`).join('&');
    return createHmac('sha1', `${secret}&`).update(`GET&%2F&${encode(query)}`).digest('base64');
}
export async function fetchContestReplay(http: HttpClient, contestId: number, request: typeof fetch = fetch): Promise<ContestReplay> {
    const response = await http.get(`${XMOJ_ORIGIN}/contest_video.php?cid=${contestId}`);
    if (response.status !== 200 || /Not Invited|请登录后|无权|没有权限/i.test(response.body)) throw new Error('当前账号无权观看此比赛回放，请确认已登录并获得比赛访问权限');
    const root = parse(response.body);
    const videos: ContestReplay['videos'] = [];
    for (const script of root.querySelectorAll('script')) {
        for (const match of script.textContent.matchAll(/new\s+Aliplayer\s*\(\s*\{([\s\S]*?)\}\s*,?/g)) {
            const config = match[1];
            const field = (key: string) => config.match(new RegExp(`\\b${key}\\s*:\\s*(['"])(.*?)\\1`))?.[2] ?? '';
            const id = field('vid'), accessKey = field('accessKeyId'), secret = field('accessKeySecret'), token = field('securityToken');
            const region = field('region') || 'cn-shanghai';
            if (!id || !accessKey || !secret || !token || !/^cn-[a-z0-9-]+$/.test(region)) continue;
            const params: Record<string, string> = { Action: 'GetPlayInfo', Version: '2017-03-21', Format: 'JSON', AccessKeyId: accessKey, SecurityToken: token, SignatureMethod: 'HMAC-SHA1', SignatureVersion: '1.0', Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), SignatureNonce: randomUUID(), VideoId: id, Formats: 'mp4', AuthTimeout: '3600' };
            params.Signature = signVodRequest(params, secret);
            // Never log signed URLs, STS credentials, or upstream error bodies.
            let result: Response;
            try { result = await request(`https://vod.${region}.aliyuncs.com/?${new URLSearchParams(params)}`, { signal: AbortSignal.timeout(20000) }); }
            catch { throw new Error('连接点播服务失败，请检查网络或代理后重试'); }
            if (!result.ok) throw new Error(`点播鉴权失败（HTTP ${result.status}），请重新加载回放`);
            const data = await result.json() as { PlayInfoList?: { PlayInfo?: { PlayURL: string; Format?: string; Definition?: string; Width?: number; Height?: number }[] }; VideoBase?: { Title?: string } };
            const sources = (data.PlayInfoList?.PlayInfo ?? []).filter(info => info.Format === 'mp4' && /^https?:\/\//.test(info.PlayURL)).map(info => ({ url: info.PlayURL, label: info.Height ? `${info.Height}p` : info.Definition || '默认画质' }));
            if (sources.length) videos.push({ title: data.VideoBase?.Title || `回放 ${videos.length + 1}`, sources });
        }
    }
    if (!videos.length) throw new Error('此比赛暂无可播放的回放，或回放尚未授权');
    return { videos };
}
