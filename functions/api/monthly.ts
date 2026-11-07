import { getPublicPage } from './_shared.ts';

interface PagesContext {
  request: Request;
}

export function onRequestGet({ request }: PagesContext): Promise<Response> {
  return getPublicPage(request, '/open_contest.php', '暂时无法读取月赛信息');
}
