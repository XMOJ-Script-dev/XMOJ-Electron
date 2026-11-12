import { getPublicPage } from './_shared.ts';

interface PagesContext {
  request: Request;
}

export function onRequestGet({ request }: PagesContext): Promise<Response> {
  return getPublicPage(request, '/', '暂时无法读取小明 OJ 首页');
}
