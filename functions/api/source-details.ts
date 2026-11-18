import { getSourceDetails } from './_judge.ts';
import type { PagesEnv } from './session.ts';

interface PagesContext {
  request: Request;
  env: PagesEnv;
}

export function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  return getSourceDetails(request, env);
}
