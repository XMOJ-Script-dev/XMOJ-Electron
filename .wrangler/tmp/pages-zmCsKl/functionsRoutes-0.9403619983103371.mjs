import { onRequestGet as __api_home_ts_onRequestGet } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/home.ts"
import { onRequestGet as __api_monthly_ts_onRequestGet } from "/home/runner/work/XMOJ-Electron/XMOJ-Electron/functions/api/monthly.ts"

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
  ]