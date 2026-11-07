import { onRequestGet as __api_home_ts_onRequestGet } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/home.ts"
import { onRequestGet as __api_monthly_ts_onRequestGet } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/monthly.ts"
import { onRequestGet as __api_problem_ts_onRequestGet } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/problem.ts"
import { onRequestGet as __api_problemset_ts_onRequestGet } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/problemset.ts"
import { onRequestGet as __api_status_ts_onRequestGet } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/status.ts"
import { onRequest as __api_session_ts_onRequest } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/session.ts"

export const routes = [
    {
      routePath: "/api/home",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_home_ts_onRequestGet],
    },
  {
      routePath: "/api/monthly",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_monthly_ts_onRequestGet],
    },
  {
      routePath: "/api/problem",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_problem_ts_onRequestGet],
    },
  {
      routePath: "/api/problemset",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_problemset_ts_onRequestGet],
    },
  {
      routePath: "/api/status",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_status_ts_onRequestGet],
    },
  {
      routePath: "/api/session",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_session_ts_onRequest],
    },
  ]