var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-zL0hsx/functionsWorker-0.6697594189840883.mjs
import { Writable } from "node:stream";
import { EventEmitter } from "node:events";
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
__name2(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name2(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
__name2(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");
__name2(notImplementedClass, "notImplementedClass");
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  static {
    __name2(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark2");
  }
  static {
    __name2(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  static {
    __name2(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  static {
    __name2(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  static {
    __name2(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  static {
    __name2(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw /* @__PURE__ */ createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  static {
    __name2(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw /* @__PURE__ */ createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
var noop_default = Object.assign(() => {
}, { __unenv__: true });
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;
globalThis.console = console_default;
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime2"), "hrtime"), { bigint: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint"), "bigint") });
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  static {
    __name2(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  static {
    __name2(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};
var NODE_VERSION = "22.14.0";
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "_Process");
  }
  static {
    __name2(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw /* @__PURE__ */ createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw /* @__PURE__ */ createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw /* @__PURE__ */ createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw /* @__PURE__ */ createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw /* @__PURE__ */ createNotImplementedError("process.kill");
  }
  abort() {
    throw /* @__PURE__ */ createNotImplementedError("process.abort");
  }
  dlopen() {
    throw /* @__PURE__ */ createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw /* @__PURE__ */ createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw /* @__PURE__ */ createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw /* @__PURE__ */ createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw /* @__PURE__ */ createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw /* @__PURE__ */ createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw /* @__PURE__ */ createNotImplementedError("process.openStdin");
  }
  assert() {
    throw /* @__PURE__ */ createNotImplementedError("process.assert");
  }
  binding() {
    throw /* @__PURE__ */ createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name2(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;
globalThis.process = process_default;
var XMOJ_ORIGIN = "https://www.xmoj.tech";
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isRecord, "isRecord");
__name2(isRecord, "isRecord");
async function onRequestGet({ request }) {
  const rawId = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^\d{1,10}$/.test(rawId) || Number(rawId) < 1) {
    return Response.json({ error: "\u65E0\u6548\u7684\u6BD4\u8D5B\u7F16\u53F7" }, { status: 400 });
  }
  try {
    const response2 = await fetch(`${XMOJ_ORIGIN}/api/contest/${rawId}/A`, {
      headers: { Accept: "application/json" },
      redirect: "manual",
      signal: request.signal
    });
    if (!response2.ok || !response2.headers.get("content-type")?.includes("json")) {
      return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6BD4\u8D5B\u4FE1\u606F" }, {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      });
    }
    const raw = await response2.json();
    if (!isRecord(raw) || !isRecord(raw.contest)) {
      return Response.json({ error: "\u6BD4\u8D5B\u4FE1\u606F\u683C\u5F0F\u65E0\u6548" }, { status: 502 });
    }
    const problems = Array.isArray(raw.problems) ? raw.problems : [];
    return Response.json({
      contest: raw.contest,
      problems: problems.map((problem) => {
        const id = typeof problem.problemId === "string" ? Number.parseInt(problem.problemId, 10) : typeof problem.problemId === "number" ? problem.problemId : null;
        return {
          num: String(problem.num ?? "").toUpperCase(),
          problemId: id !== null && Number.isFinite(id) ? id : null,
          title: String(problem.problemTitle ?? problem.title ?? "").trim(),
          status: problem.myStatus ? String(problem.myStatus) : null
        };
      }),
      myRole: typeof raw.myRole === "string" ? raw.myRole : null,
      canExport: Boolean(raw.canExport),
      submitUrl: typeof raw.submitUrl === "string" ? raw.submitUrl : null
    }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" }
    });
  } catch {
    return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6BD4\u8D5B\u4FE1\u606F" }, {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
var XMOJ_ORIGIN2 = "https://www.xmoj.tech";
async function onRequestGet2({ request }) {
  const rawPage = new URL(request.url).searchParams.get("page") ?? "1";
  if (!/^\d{1,3}$/.test(rawPage) || Number(rawPage) < 1 || Number(rawPage) > 100) {
    return Response.json({ error: "\u65E0\u6548\u7684\u6BD4\u8D5B\u9875\u7801" }, { status: 400 });
  }
  const upstreamUrl = new URL("/api/contest/list", XMOJ_ORIGIN2);
  upstreamUrl.searchParams.set("pageNum", rawPage);
  try {
    const response2 = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      redirect: "manual",
      signal: request.signal
    });
    if (!response2.ok || !response2.headers.get("content-type")?.includes("json")) {
      return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6BD4\u8D5B\u5217\u8868" }, {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return Response.json(await response2.json(), {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" }
    });
  } catch {
    return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6BD4\u8D5B\u5217\u8868" }, {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
var __create = Object.create;
var __defProp22 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = /* @__PURE__ */ __name2((cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports), "__commonJSMin");
var __exportAll = /* @__PURE__ */ __name2((all, no_symbols) => {
  let target = {};
  for (var name in all) __defProp22(target, name, {
    get: all[name],
    enumerable: true
  });
  if (!no_symbols) __defProp22(target, Symbol.toStringTag, { value: "Module" });
  return target;
}, "__exportAll");
var __copyProps = /* @__PURE__ */ __name2((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
    key = keys[i];
    if (!__hasOwnProp.call(to, key) && key !== except) __defProp22(to, key, {
      get: ((k) => from[k]).bind(null, key),
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    });
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name2((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp22(target, "default", {
  value: mod,
  enumerable: true
}) : target, mod)), "__toESM");
var decodeMap = /* @__PURE__ */ new Map([
  [0, 65533],
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
function replaceCodePoint(codePoint) {
  var _decodeMap$get;
  if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) return 65533;
  return (_decodeMap$get = decodeMap.get(codePoint)) !== null && _decodeMap$get !== void 0 ? _decodeMap$get : codePoint;
}
__name(replaceCodePoint, "replaceCodePoint");
__name2(replaceCodePoint, "replaceCodePoint");
function decodeBase64(input) {
  const binary = atob(input);
  const evenLength = binary.length & -2;
  const out = new Uint16Array(evenLength / 2);
  for (let index = 0, outIndex = 0; index < evenLength; index += 2) {
    const lo = binary.charCodeAt(index);
    const hi = binary.charCodeAt(index + 1);
    out[outIndex++] = lo | hi << 8;
  }
  return out;
}
__name(decodeBase64, "decodeBase64");
__name2(decodeBase64, "decodeBase64");
var htmlDecodeTree = /* @__PURE__ */ decodeBase64("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IA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YwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWls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ZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");
var BinTrieFlags;
(function(BinTrieFlags2) {
  BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
  BinTrieFlags2[BinTrieFlags2["FLAG13"] = 8192] = "FLAG13";
  BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
  BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
__name(_typeof, "_typeof");
__name2(_typeof, "_typeof");
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
__name(toPrimitive, "toPrimitive");
__name2(toPrimitive, "toPrimitive");
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
__name(toPropertyKey, "toPropertyKey");
__name2(toPropertyKey, "toPropertyKey");
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
__name(_defineProperty, "_defineProperty");
__name2(_defineProperty, "_defineProperty");
var CharCodes;
(function(CharCodes2) {
  CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
  CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
  CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
  CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
  CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
  CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
  CharCodes2[CharCodes2["LOWER_F"] = 102] = "LOWER_F";
  CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
  CharCodes2[CharCodes2["LOWER_Z"] = 122] = "LOWER_Z";
  CharCodes2[CharCodes2["UPPER_A"] = 65] = "UPPER_A";
  CharCodes2[CharCodes2["UPPER_F"] = 70] = "UPPER_F";
  CharCodes2[CharCodes2["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
var TO_LOWER_BIT = 32;
function isNumber(code) {
  return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
__name(isNumber, "isNumber");
__name2(isNumber, "isNumber");
function isHexadecimalCharacter(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
}
__name(isHexadecimalCharacter, "isHexadecimalCharacter");
__name2(isHexadecimalCharacter, "isHexadecimalCharacter");
function isAsciiAlphaNumeric(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
}
__name(isAsciiAlphaNumeric, "isAsciiAlphaNumeric");
__name2(isAsciiAlphaNumeric, "isAsciiAlphaNumeric");
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
__name(isEntityInAttributeInvalidEnd, "isEntityInAttributeInvalidEnd");
__name2(isEntityInAttributeInvalidEnd, "isEntityInAttributeInvalidEnd");
var EntityDecoderState;
(function(EntityDecoderState2) {
  EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
  EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
  EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
  EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
  EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode2) {
  DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
  DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
  DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));
var EntityDecoder = class {
  static {
    __name(this, "EntityDecoder");
  }
  static {
    __name2(this, "EntityDecoder");
  }
  constructor(decodeTree, emitCodePoint, errors) {
    _defineProperty(this, "decodeTree", void 0);
    _defineProperty(this, "emitCodePoint", void 0);
    _defineProperty(this, "errors", void 0);
    _defineProperty(
      this,
      /** The current state of the decoder. */
      "state",
      EntityDecoderState.EntityStart
    );
    _defineProperty(
      this,
      /** Characters that were consumed while parsing an entity. */
      "consumed",
      1
    );
    _defineProperty(
      this,
      /**
      * The result of the entity.
      *
      * Either the result index of a numeric entity, or the codepoint of a
      * numeric entity.
      */
      "result",
      0
    );
    _defineProperty(
      this,
      /** The current index in the decode tree. */
      "treeIndex",
      0
    );
    _defineProperty(
      this,
      /** The number of characters that were consumed in excess. */
      "excess",
      1
    );
    _defineProperty(
      this,
      /** The mode in which the decoder is operating. */
      "decodeMode",
      DecodingMode.Strict
    );
    _defineProperty(
      this,
      /** The number of characters that have been consumed in the current run. */
      "runConsumed",
      0
    );
    this.decodeTree = decodeTree;
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
  }
  /**
  * Resets the instance to make it reusable.
  * @param decodeMode Entity decoding mode to use.
  */
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = EntityDecoderState.EntityStart;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.consumed = 1;
    this.runConsumed = 0;
  }
  /**
  * Write an entity to the decoder. This can be called multiple times with partial entities.
  * If the entity is incomplete, the decoder will return -1.
  *
  * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
  * entity is incomplete, and resume when the next string is written.
  * @param input The string containing the entity (or a continuation of the entity).
  * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
  * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
  */
  write(input, offset) {
    switch (this.state) {
      case EntityDecoderState.EntityStart:
        if (input.charCodeAt(offset) === CharCodes.NUM) {
          this.state = EntityDecoderState.NumericStart;
          this.consumed += 1;
          return this.stateNumericStart(input, offset + 1);
        }
        this.state = EntityDecoderState.NamedEntity;
        return this.stateNamedEntity(input, offset);
      case EntityDecoderState.NumericStart:
        return this.stateNumericStart(input, offset);
      case EntityDecoderState.NumericDecimal:
        return this.stateNumericDecimal(input, offset);
      case EntityDecoderState.NumericHex:
        return this.stateNumericHex(input, offset);
      case EntityDecoderState.NamedEntity:
        return this.stateNamedEntity(input, offset);
    }
  }
  /**
  * Switches between the numeric decimal and hexadecimal states.
  *
  * Equivalent to the `Numeric character reference state` in the HTML spec.
  * @param input The string containing the entity (or a continuation of the entity).
  * @param offset The current offset.
  * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
  */
  stateNumericStart(input, offset) {
    if (offset >= input.length) return -1;
    if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
      this.state = EntityDecoderState.NumericHex;
      this.consumed += 1;
      return this.stateNumericHex(input, offset + 1);
    }
    this.state = EntityDecoderState.NumericDecimal;
    return this.stateNumericDecimal(input, offset);
  }
  /**
  * Parses a hexadecimal numeric entity.
  *
  * Equivalent to the `Hexademical character reference state` in the HTML spec.
  * @param input The string containing the entity (or a continuation of the entity).
  * @param offset The current offset.
  * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
  */
  stateNumericHex(input, offset) {
    while (offset < input.length) {
      const char = input.charCodeAt(offset);
      if (isNumber(char) || isHexadecimalCharacter(char)) {
        const digit = char <= CharCodes.NINE ? char - CharCodes.ZERO : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
        this.result = this.result * 16 + digit;
        this.consumed++;
        offset++;
      } else return this.emitNumericEntity(char, 3);
    }
    return -1;
  }
  /**
  * Parses a decimal numeric entity.
  *
  * Equivalent to the `Decimal character reference state` in the HTML spec.
  * @param input The string containing the entity (or a continuation of the entity).
  * @param offset The current offset.
  * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
  */
  stateNumericDecimal(input, offset) {
    while (offset < input.length) {
      const char = input.charCodeAt(offset);
      if (isNumber(char)) {
        this.result = this.result * 10 + (char - CharCodes.ZERO);
        this.consumed++;
        offset++;
      } else return this.emitNumericEntity(char, 2);
    }
    return -1;
  }
  /**
  * Validate and emit a numeric entity.
  *
  * Implements the logic from the `Hexademical character reference start
  * state` and `Numeric character reference end state` in the HTML spec.
  * @param lastCp The last code point of the entity. Used to see if the
  *               entity was terminated with a semicolon.
  * @param expectedLength The minimum number of characters that should be
  *                       consumed. Used to validate that at least one digit
  *                       was consumed.
  * @returns The number of characters that were consumed.
  */
  emitNumericEntity(lastCp, expectedLength) {
    if (this.consumed <= expectedLength) {
      var _this$errors;
      (_this$errors = this.errors) === null || _this$errors === void 0 || _this$errors.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CharCodes.SEMI) this.consumed += 1;
    else if (this.decodeMode === DecodingMode.Strict) return 0;
    this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CharCodes.SEMI) this.errors.missingSemicolonAfterCharacterReference();
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  /**
  * Parses a named entity.
  *
  * Equivalent to the `Named character reference state` in the HTML spec.
  * @param input The string containing the entity (or a continuation of the entity).
  * @param offset The current offset.
  * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
  */
  stateNamedEntity(input, offset) {
    const { decodeTree } = this;
    let current = decodeTree[this.treeIndex];
    let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
    while (offset < input.length) {
      if (valueLength === 0 && (current & BinTrieFlags.FLAG13) !== 0) {
        const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
        if (this.runConsumed === 0) {
          const firstChar = current & BinTrieFlags.JUMP_TABLE;
          if (input.charCodeAt(offset) !== firstChar) return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          offset++;
          this.excess++;
          this.runConsumed++;
        }
        while (this.runConsumed < runLength) {
          if (offset >= input.length) return -1;
          const charIndexInPacked = this.runConsumed - 1;
          const packedWord = decodeTree[this.treeIndex + 1 + (charIndexInPacked >> 1)];
          const expectedChar = charIndexInPacked % 2 === 0 ? packedWord & 255 : packedWord >> 8 & 255;
          if (input.charCodeAt(offset) !== expectedChar) {
            this.runConsumed = 0;
            return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          }
          offset++;
          this.excess++;
          this.runConsumed++;
        }
        this.runConsumed = 0;
        this.treeIndex += 1 + (runLength >> 1);
        current = decodeTree[this.treeIndex];
        valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      }
      if (offset >= input.length) break;
      const char = input.charCodeAt(offset);
      if (char === CharCodes.SEMI && valueLength !== 0 && (current & BinTrieFlags.FLAG13) !== 0) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
      this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
      if (this.treeIndex < 0) return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
      current = decodeTree[this.treeIndex];
      valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      if (valueLength !== 0) {
        if (char === CharCodes.SEMI) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
        if (this.decodeMode !== DecodingMode.Strict && (current & BinTrieFlags.FLAG13) === 0) {
          this.result = this.treeIndex;
          this.consumed += this.excess;
          this.excess = 0;
        }
      }
      offset++;
      this.excess++;
    }
    return -1;
  }
  /**
  * Emit a named entity that was not terminated with a semicolon.
  * @returns The number of characters consumed.
  */
  emitNotTerminatedNamedEntity() {
    var _this$errors2;
    const { result, decodeTree } = this;
    const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
    this.emitNamedEntityData(result, valueLength, this.consumed);
    (_this$errors2 = this.errors) === null || _this$errors2 === void 0 || _this$errors2.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
  /**
  * Emit a named entity.
  * @param result The index of the entity in the decode tree.
  * @param valueLength The number of bytes in the entity.
  * @param consumed The number of characters consumed.
  * @returns The number of characters consumed.
  */
  emitNamedEntityData(result, valueLength, consumed) {
    const { decodeTree } = this;
    this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~(BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13) : decodeTree[result + 1], consumed);
    if (valueLength === 3) this.emitCodePoint(decodeTree[result + 2], consumed);
    return consumed;
  }
  /**
  * Signal to the parser that the end of the input was reached.
  *
  * Remaining data will be emitted and relevant errors will be produced.
  * @returns The number of characters consumed.
  */
  end() {
    switch (this.state) {
      case EntityDecoderState.NamedEntity:
        return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      case EntityDecoderState.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case EntityDecoderState.NumericHex:
        return this.emitNumericEntity(0, 3);
      case EntityDecoderState.NumericStart:
        var _this$errors3;
        (_this$errors3 = this.errors) === null || _this$errors3 === void 0 || _this$errors3.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      case EntityDecoderState.EntityStart:
        return 0;
    }
  }
};
function getDecoder(decodeTree) {
  let returnValue = "";
  const decoder = new EntityDecoder(decodeTree, (data) => returnValue += String.fromCodePoint(data));
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function decodeWithTrie(input, decodeMode) {
    let lastIndex = 0;
    let offset = 0;
    while ((offset = input.indexOf("&", offset)) >= 0) {
      returnValue += input.slice(lastIndex, offset);
      decoder.startEntity(decodeMode);
      const length = decoder.write(input, offset + 1);
      if (length < 0) {
        lastIndex = offset + decoder.end();
        break;
      }
      lastIndex = offset + length;
      offset = length === 0 ? lastIndex + 1 : lastIndex;
    }
    const result = returnValue + input.slice(lastIndex);
    returnValue = "";
    return result;
  }, "decodeWithTrie"), "decodeWithTrie");
}
__name(getDecoder, "getDecoder");
__name2(getDecoder, "getDecoder");
function determineBranch(decodeTree, current, nodeIndex, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (branchCount === 0) return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
  if (jumpOffset) {
    const value = char - jumpOffset;
    return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIndex + value] - 1;
  }
  const packedKeySlots = branchCount + 1 >> 1;
  let lo = 0;
  let hi = branchCount - 1;
  while (lo <= hi) {
    const mid = lo + hi >>> 1;
    const midKey = decodeTree[nodeIndex + (mid >> 1)] >> (mid & 1) * 8 & 255;
    if (midKey < char) lo = mid + 1;
    else if (midKey > char) hi = mid - 1;
    else return decodeTree[nodeIndex + packedKeySlots + mid];
  }
  return -1;
}
__name(determineBranch, "determineBranch");
__name2(determineBranch, "determineBranch");
var htmlDecoder = /* @__PURE__ */ getDecoder(htmlDecodeTree);
function decodeHTML(htmlString, mode = DecodingMode.Legacy) {
  return htmlDecoder(htmlString, mode);
}
__name(decodeHTML, "decodeHTML");
__name2(decodeHTML, "decodeHTML");
var xmlCodeMap$1 = /* @__PURE__ */ new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [39, "&apos;"],
  [60, "&lt;"],
  [62, "&gt;"]
]);
var getCodePoint$1 = typeof String.prototype.codePointAt === "function" ? (input, index) => input.codePointAt(index) : (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index);
var XML_BITSET_VALUE = 1342177476;
function encodeXML$1(input) {
  let out;
  let last = 0;
  const { length } = input;
  for (let index = 0; index < length; index++) {
    const char = input.charCodeAt(index);
    if (char < 128 && ((1342177476 >>> char & 1) === 0 || char >= 64 || char < 32)) continue;
    if (out === void 0) out = input.substring(0, index);
    else if (last !== index) out += input.substring(last, index);
    if (char < 64) {
      out += xmlCodeMap$1.get(char);
      last = index + 1;
      continue;
    }
    const cp = getCodePoint$1(input, index);
    out += `&#x${cp.toString(16)};`;
    if (cp !== char) index++;
    last = index + 1;
  }
  if (out === void 0) return input;
  if (last < length) out += input.substr(last);
  return out;
}
__name(encodeXML$1, "encodeXML$1");
__name2(encodeXML$1, "encodeXML$1");
function getEscaper$1(regex, map) {
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function escape(data) {
    let match2;
    let lastIndex = 0;
    let result = "";
    while (match2 = regex.exec(data)) {
      if (lastIndex !== match2.index) result += data.substring(lastIndex, match2.index);
      result += map.get(match2[0].charCodeAt(0));
      lastIndex = match2.index + 1;
    }
    return result + data.substring(lastIndex);
  }, "escape"), "escape");
}
__name(getEscaper$1, "getEscaper$1");
__name2(getEscaper$1, "getEscaper$1");
var escapeUTF8$1 = /* @__PURE__ */ getEscaper$1(/["&'<>]/g, xmlCodeMap$1);
var escapeAttribute$1 = /* @__PURE__ */ getEscaper$1(/["&\u00A0]/g, /* @__PURE__ */ new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [160, "&nbsp;"]
]));
var escapeText$1 = /* @__PURE__ */ getEscaper$1(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
  [38, "&amp;"],
  [60, "&lt;"],
  [62, "&gt;"],
  [160, "&nbsp;"]
]));
function parseEncodeTrie(serialized) {
  const top = /* @__PURE__ */ new Map();
  const totalLength = serialized.length;
  let cursor = 0;
  let lastTopKey = -1;
  function readDiff() {
    const start = cursor;
    while (cursor < totalLength) {
      const char = serialized.charAt(cursor);
      if ((char < "0" || char > "9") && (char < "a" || char > "z")) break;
      cursor++;
    }
    if (cursor === start) return 0;
    return Number.parseInt(serialized.slice(start, cursor), 36);
  }
  __name(readDiff, "readDiff");
  __name2(readDiff, "readDiff");
  function readEntity() {
    if (serialized[cursor] !== "&") throw new Error(`Child entry missing value near index ${cursor}`);
    const start = cursor;
    const end = serialized.indexOf(";", cursor + 1);
    if (end === -1) throw new Error(`Unterminated entity starting at index ${start}`);
    cursor = end + 1;
    return serialized.slice(start, cursor);
  }
  __name(readEntity, "readEntity");
  __name2(readEntity, "readEntity");
  while (cursor < totalLength) {
    const keyDiff = readDiff();
    const key = lastTopKey === -1 ? keyDiff : lastTopKey + keyDiff + 1;
    let value;
    if (serialized[cursor] === "&") value = readEntity();
    if (serialized[cursor] === "{") {
      cursor++;
      let diff = readDiff();
      let childKey = diff;
      const firstValue = readEntity();
      if (serialized[cursor] === "{") throw new Error("Unexpected nested '{' beyond depth 2");
      if (serialized[cursor] === "}") {
        top.set(key, {
          value,
          next: childKey,
          nextValue: firstValue
        });
        cursor++;
      } else {
        const childMap = /* @__PURE__ */ new Map([[childKey, firstValue]]);
        let lastChildKey = childKey;
        while (cursor < totalLength && serialized[cursor] !== "}") {
          diff = readDiff();
          childKey = lastChildKey + diff + 1;
          const childValue = readEntity();
          if (serialized[cursor] === "{") throw new Error("Unexpected nested '{' beyond depth 2");
          childMap.set(childKey, childValue);
          lastChildKey = childKey;
        }
        if (serialized[cursor] !== "}") throw new Error("Unterminated child block");
        cursor++;
        top.set(key, {
          value,
          next: childMap
        });
      }
    } else if (value === void 0) throw new Error(`Malformed encode trie: missing value at index ${cursor}`);
    else top.set(key, value);
    lastTopKey = key;
  }
  return top;
}
__name(parseEncodeTrie, "parseEncodeTrie");
__name2(parseEncodeTrie, "parseEncodeTrie");
var htmlTrie = /* @__PURE__ */ parseEncodeTrie("9&Tab;&NewLine;m&excl;&quot;&num;&dollar;&percnt;&amp;&apos;&lpar;&rpar;&ast;&plus;&comma;1&period;&sol;a&colon;&semi;&lt;{6he&nvlt;}&equals;{6hx&bne;}&gt;{6he&nvgt;}&quest;&commat;q&lbrack;&bsol;&rbrack;&Hat;&lowbar;&DiacriticalGrave;5{2y&fjlig;}k&lbrace;&verbar;&rbrace;y&nbsp;&iexcl;&cent;&pound;&curren;&yen;&brvbar;&sect;&die;&copy;&ordf;&laquo;&not;&shy;&circledR;&macr;&deg;&PlusMinus;&sup2;&sup3;&acute;&micro;&para;&centerdot;&cedil;&sup1;&ordm;&raquo;&frac14;&frac12;&frac34;&iquest;&Agrave;&Aacute;&Acirc;&Atilde;&Auml;&angst;&AElig;&Ccedil;&Egrave;&Eacute;&Ecirc;&Euml;&Igrave;&Iacute;&Icirc;&Iuml;&ETH;&Ntilde;&Ograve;&Oacute;&Ocirc;&Otilde;&Ouml;&times;&Oslash;&Ugrave;&Uacute;&Ucirc;&Uuml;&Yacute;&THORN;&szlig;&agrave;&aacute;&acirc;&atilde;&auml;&aring;&aelig;&ccedil;&egrave;&eacute;&ecirc;&euml;&igrave;&iacute;&icirc;&iuml;&eth;&ntilde;&ograve;&oacute;&ocirc;&otilde;&ouml;&div;&oslash;&ugrave;&uacute;&ucirc;&uuml;&yacute;&thorn;&yuml;&Amacr;&amacr;&Abreve;&abreve;&Aogon;&aogon;&Cacute;&cacute;&Ccirc;&ccirc;&Cdot;&cdot;&Ccaron;&ccaron;&Dcaron;&dcaron;&Dstrok;&dstrok;&Emacr;&emacr;2&Edot;&edot;&Eogon;&eogon;&Ecaron;&ecaron;&Gcirc;&gcirc;&Gbreve;&gbreve;&Gdot;&gdot;&Gcedil;1&Hcirc;&hcirc;&Hstrok;&hstrok;&Itilde;&itilde;&Imacr;&imacr;2&Iogon;&iogon;&Idot;&imath;&IJlig;&ijlig;&Jcirc;&jcirc;&Kcedil;&kcedil;&kgreen;&Lacute;&lacute;&Lcedil;&lcedil;&Lcaron;&lcaron;&Lmidot;&lmidot;&Lstrok;&lstrok;&Nacute;&nacute;&Ncedil;&ncedil;&Ncaron;&ncaron;&napos;&ENG;&eng;&Omacr;&omacr;2&Odblac;&odblac;&OElig;&oelig;&Racute;&racute;&Rcedil;&rcedil;&Rcaron;&rcaron;&Sacute;&sacute;&Scirc;&scirc;&Scedil;&scedil;&Scaron;&scaron;&Tcedil;&tcedil;&Tcaron;&tcaron;&Tstrok;&tstrok;&Utilde;&utilde;&Umacr;&umacr;&Ubreve;&ubreve;&Uring;&uring;&Udblac;&udblac;&Uogon;&uogon;&Wcirc;&wcirc;&Ycirc;&ycirc;&Yuml;&Zacute;&zacute;&Zdot;&zdot;&Zcaron;&zcaron;j&fnof;y&imped;1r&gacute;1t&jmath;3y&circ;&caron;g&breve;&DiacriticalDot;&ring;&ogon;&DiacriticalTilde;&dblac;1f&DownBreve;3j&Alpha;&Beta;&Gamma;&Delta;&Epsilon;&Zeta;&Eta;&Theta;&Iota;&Kappa;&Lambda;&Mu;&Nu;&Xi;&Omicron;&Pi;&Rho;1&Sigma;&Tau;&Upsilon;&Phi;&Chi;&Psi;&ohm;7&alpha;&beta;&gamma;&delta;&epsi;&zeta;&eta;&theta;&iota;&kappa;&lambda;&mu;&nu;&xi;&omicron;&pi;&rho;&sigmaf;&sigma;&tau;&upsi;&phi;&chi;&psi;&omega;7&thetasym;&Upsi;2&phiv;&piv;5&Gammad;&digamma;i&kappav;&rhov;3&epsiv;&backepsilon;a&IOcy;&DJcy;&GJcy;&Jukcy;&DScy;&Iukcy;&YIcy;&Jsercy;&LJcy;&NJcy;&TSHcy;&KJcy;1&Ubrcy;&DZcy;&Acy;&Bcy;&Vcy;&Gcy;&Dcy;&IEcy;&ZHcy;&Zcy;&Icy;&Jcy;&Kcy;&Lcy;&Mcy;&Ncy;&Ocy;&Pcy;&Rcy;&Scy;&Tcy;&Ucy;&Fcy;&KHcy;&TScy;&CHcy;&SHcy;&SHCHcy;&HARDcy;&Ycy;&SOFTcy;&Ecy;&YUcy;&YAcy;&acy;&bcy;&vcy;&gcy;&dcy;&iecy;&zhcy;&zcy;&icy;&jcy;&kcy;&lcy;&mcy;&ncy;&ocy;&pcy;&rcy;&scy;&tcy;&ucy;&fcy;&khcy;&tscy;&chcy;&shcy;&shchcy;&hardcy;&ycy;&softcy;&ecy;&yucy;&yacy;1&iocy;&djcy;&gjcy;&jukcy;&dscy;&iukcy;&yicy;&jsercy;&ljcy;&njcy;&tshcy;&kjcy;1&ubrcy;&dzcy;5gi&ensp;&emsp;&emsp13;&emsp14;1&numsp;&puncsp;&ThinSpace;&hairsp;&NegativeMediumSpace;&zwnj;&zwj;&lrm;&rlm;&dash;2&ndash;&mdash;&horbar;&Verbar;1&lsquo;&CloseCurlyQuote;&lsquor;1&ldquo;&CloseCurlyDoubleQuote;&bdquo;1&dagger;&Dagger;&bull;2&nldr;&hellip;9&permil;&pertenk;&prime;&Prime;&tprime;&backprime;3&lsaquo;&rsaquo;3&oline;2&caret;1&hybull;&frasl;a&bsemi;7&qprime;7&MediumSpace;{6bu&ThickSpace;}&NoBreak;&af;&InvisibleTimes;&ic;20&euro;1a&tdot;&DotDot;11&complexes;2&incare;4&gscr;&hamilt;&Hfr;&Hopf;&planckh;&hbar;&imagline;&Ifr;&lagran;&ell;1&naturals;&numero;&copysr;&weierp;&Popf;&Qopf;&realine;&real;&reals;&rx;3&trade;1&integers;2&mho;&zeetrf;&iiota;2&bernou;&Cayleys;1&escr;&Escr;&Fouriertrf;1&Mellintrf;&order;&alefsym;&beth;&gimel;&daleth;c&CapitalDifferentialD;&dd;&ee;&ii;a&frac13;&frac23;&frac15;&frac25;&frac35;&frac45;&frac16;&frac56;&frac18;&frac38;&frac58;&frac78;1d&larr;&ShortUpArrow;&rarr;&darr;&harr;&updownarrow;&nwarr;&nearr;&LowerRightArrow;&LowerLeftArrow;&nlarr;&nrarr;1&rarrw;{mw&nrarrw;}&Larr;&Uarr;&Rarr;&Darr;&larrtl;&rarrtl;&LeftTeeArrow;&mapstoup;&map;&DownTeeArrow;1&hookleftarrow;&hookrightarrow;&larrlp;&looparrowright;&harrw;&nharr;1&lsh;&rsh;&ldsh;&rdsh;1&crarr;&cularr;&curarr;2&circlearrowleft;&circlearrowright;&leftharpoonup;&DownLeftVector;&RightUpVector;&LeftUpVector;&rharu;&DownRightVector;&dharr;&dharl;&RightArrowLeftArrow;&udarr;&LeftArrowRightArrow;&leftleftarrows;&upuparrows;&rightrightarrows;&ddarr;&leftrightharpoons;&Equilibrium;&nlArr;&nhArr;&nrArr;&DoubleLeftArrow;&DoubleUpArrow;&DoubleRightArrow;&dArr;&DoubleLeftRightArrow;&DoubleUpDownArrow;&nwArr;&neArr;&seArr;&swArr;&lAarr;&rAarr;1&zigrarr;6&larrb;&rarrb;f&DownArrowUpArrow;7&loarr;&roarr;&hoarr;&forall;&comp;&part;{mw&npart;}&exist;&nexist;&empty;1&Del;&Element;&NotElement;1&ni;&notni;2&prod;&coprod;&sum;&minus;&MinusPlus;&dotplus;1&Backslash;&lowast;&compfn;1&radic;2&prop;&infin;&angrt;&ang;{6he&nang;}&angmsd;&angsph;&mid;&nmid;&DoubleVerticalBar;&NotDoubleVerticalBar;&and;&or;&cap;{1e68&caps;}&cup;{1e68&cups;}&int;&Int;&iiint;&conint;&Conint;&Cconint;&cwint;&ClockwiseContourIntegral;&awconint;&there4;&becaus;&ratio;&Colon;&dotminus;1&mDDot;&homtht;&sim;{6he&nvsim;}&backsim;{mp&race;}&ac;{mr&acE;}&acd;&VerticalTilde;&NotTilde;&eqsim;{mw&nesim;}&sime;&NotTildeEqual;&cong;&simne;&ncong;&ap;&nap;&ape;&apid;{mw&napid;}&backcong;&asympeq;{6he&nvap;}&bump;{mw&nbump;}&bumpe;{mw&nbumpe;}&doteq;{mw&nedot;}&doteqdot;&efDot;&erDot;&Assign;&ecolon;&ecir;&circeq;1&wedgeq;&veeeq;1&triangleq;2&equest;&ne;&Congruent;{6hx&bnequiv;}&nequiv;1&le;{6he&nvle;}&ge;{6he&nvge;}&lE;{mw&nlE;}&gE;{mw&ngE;}&lnE;{1e68&lvertneqq;}&gnE;{1e68&gvertneqq;}&ll;{mw&nLtv;5uh&nLt;}&gg;{mw&nGtv;5uh&nGt;}&between;&NotCupCap;&nless;&ngt;&nle;&nge;&lesssim;&GreaterTilde;&nlsim;&ngsim;&LessGreater;&gl;&NotLessGreater;&NotGreaterLess;&pr;&sc;&prcue;&sccue;&PrecedesTilde;&scsim;{mw&NotSucceedsTilde;}&NotPrecedes;&NotSucceeds;&sub;{6he&NotSubset;}&sup;{6he&NotSuperset;}&nsub;&nsup;&sube;&supe;&NotSubsetEqual;&NotSupersetEqual;&subne;{1e68&varsubsetneq;}&supne;{1e68&varsupsetneq;}1&cupdot;&UnionPlus;&sqsub;{mw&NotSquareSubset;}&sqsup;{mw&NotSquareSuperset;}&sqsube;&sqsupe;&sqcap;{1e68&sqcaps;}&sqcup;{1e68&sqcups;}&CirclePlus;&CircleMinus;&CircleTimes;&osol;&CircleDot;&circledcirc;&circledast;1&circleddash;&boxplus;&boxminus;&boxtimes;&dotsquare;&RightTee;&dashv;&DownTee;&bot;1&models;&DoubleRightTee;&Vdash;&Vvdash;&VDash;&nvdash;&nvDash;&nVdash;&nVDash;&prurel;1&LeftTriangle;&RightTriangle;&LeftTriangleEqual;{6he&nvltrie;}&RightTriangleEqual;{6he&nvrtrie;}&origof;&imof;&multimap;&hercon;&intcal;&veebar;1&barvee;&angrtvb;&lrtri;&bigwedge;&bigvee;&bigcap;&bigcup;&diam;&sdot;&sstarf;&divideontimes;&bowtie;&ltimes;&rtimes;&leftthreetimes;&rightthreetimes;&backsimeq;&curlyvee;&curlywedge;&Sub;&Sup;&Cap;&Cup;&fork;&epar;&lessdot;&gtdot;&Ll;{mw&nLl;}&Gg;{mw&nGg;}&leg;{1e68&lesg;}&gel;{1e68&gesl;}2&cuepr;&cuesc;&NotPrecedesSlantEqual;&NotSucceedsSlantEqual;&NotSquareSubsetEqual;&NotSquareSupersetEqual;2&lnsim;&gnsim;&precnsim;&scnsim;&nltri;&NotRightTriangle;&nltrie;&NotRightTriangleEqual;&vellip;&ctdot;&utdot;&dtdot;&disin;&isinsv;&isins;&isindot;{mw&notindot;}&notinvc;&notinvb;1&isinE;{mw&notinE;}&nisd;&xnis;&nis;&notnivc;&notnivb;6&barwed;&Barwed;1&lceil;&rceil;&LeftFloor;&rfloor;&drcrop;&dlcrop;&urcrop;&ulcrop;&bnot;1&profline;&profsurf;1&telrec;&target;5&ulcorn;&urcorn;&dlcorn;&drcorn;2&frown;&smile;9&cylcty;&profalar;7&topbot;6&ovbar;1&solbar;1o&angzarr;1f&lmoustache;&rmoustache;2&OverBracket;&bbrk;&bbrktbrk;11&OverParenthesis;&UnderParenthesis;&OverBrace;&UnderBrace;2&trpezium;4&elinters;1n&blank;4k&circledS;1j&boxh;1&boxv;9&boxdr;3&boxdl;3&boxur;3&boxul;3&boxvr;7&boxvl;7&boxhd;7&boxhu;7&boxvh;j&boxH;&boxV;&boxdR;&boxDr;&boxDR;&boxdL;&boxDl;&boxDL;&boxuR;&boxUr;&boxUR;&boxuL;&boxUl;&boxUL;&boxvR;&boxVr;&boxVR;&boxvL;&boxVl;&boxVL;&boxHd;&boxhD;&boxHD;&boxHu;&boxhU;&boxHU;&boxvH;&boxVh;&boxVH;j&uhblk;3&lhblk;3&block;8&blk14;&blk12;&blk34;d&square;8&blacksquare;&EmptyVerySmallSquare;1&rect;&marker;2&fltns;1&bigtriangleup;&blacktriangle;&triangle;2&blacktriangleright;&rtri;3&bigtriangledown;&blacktriangledown;&dtri;2&blacktriangleleft;&ltri;6&loz;&cir;w&tridot;2&bigcirc;8&ultri;&urtri;&lltri;&EmptySmallSquare;&FilledSmallSquare;8&bigstar;&star;7&phone;1d&female;1&male;t&spades;2&clubs;1&hearts;&diamondsuit;3&sung;2&flat;&natural;&sharp;4j&check;3&cross;8&malt;l&sext;x&VerticalSeparator;p&lbbrk;&rbbrk;2c&bsolhsub;&suphsol;s&LeftDoubleBracket;&RightDoubleBracket;&lang;&rang;&Lang;&Rang;&loang;&roang;7&longleftarrow;&longrightarrow;&longleftrightarrow;&DoubleLongLeftArrow;&DoubleLongRightArrow;&DoubleLongLeftRightArrow;1&longmapsto;2&dzigrarr;76&nvlArr;&nvrArr;&nvHarr;&Map;6&lbarr;&bkarow;&lBarr;&dbkarow;&drbkarow;&DDotrahd;&UpArrowBar;&DownArrowBar;2&Rarrtl;2&latail;&ratail;&lAtail;&rAtail;&larrfs;&rarrfs;&larrbfs;&rarrbfs;2&nwarhk;&nearhk;&hksearow;&hkswarow;&nwnear;&nesear;&seswar;&swnwar;8&rarrc;{mw&nrarrc;}1&cudarrr;&ldca;&rdca;&cudarrl;&larrpl;2&curarrm;&cularrp;7&rarrpl;2&harrcir;&Uarrocir;&lurdshar;&ldrushar;2&LeftRightVector;&RightUpDownVector;&DownLeftRightVector;&LeftUpDownVector;&LeftVectorBar;&RightVectorBar;&RightUpVectorBar;&RightDownVectorBar;&DownLeftVectorBar;&DownRightVectorBar;&LeftUpVectorBar;&LeftDownVectorBar;&LeftTeeVector;&RightTeeVector;&RightUpTeeVector;&RightDownTeeVector;&DownLeftTeeVector;&DownRightTeeVector;&LeftUpTeeVector;&LeftDownTeeVector;&lHar;&uHar;&rHar;&dHar;&luruhar;&ldrdhar;&ruluhar;&rdldhar;&lharul;&llhard;&rharul;&lrhard;&udhar;&duhar;&RoundImplies;&erarr;&simrarr;&larrsim;&rarrsim;&rarrap;&ltlarr;1&gtrarr;&subrarr;1&suplarr;&lfisht;&rfisht;&ufisht;&dfisht;5&lopar;&ropar;4&lbrke;&rbrke;&lbrkslu;&rbrksld;&lbrksld;&rbrkslu;&langd;&rangd;&lparlt;&rpargt;&gtlPar;&ltrPar;3&vzigzag;1&vangrt;&angrtvbd;6&ange;&range;&dwangle;&uwangle;&angmsdaa;&angmsdab;&angmsdac;&angmsdad;&angmsdae;&angmsdaf;&angmsdag;&angmsdah;&bemptyv;&demptyv;&cemptyv;&raemptyv;&laemptyv;&ohbar;&omid;&opar;1&operp;1&olcross;&odsold;1&olcir;&ofcir;&olt;&ogt;&cirscir;&cirE;&solb;&bsolb;3&boxbox;3&trisb;&rtriltri;&LeftTriangleBar;{mw&NotLeftTriangleBar;}&RightTriangleBar;{mw&NotRightTriangleBar;}b&iinfin;&infintie;&nvinfin;4&eparsl;&smeparsl;&eqvparsl;5&blacklozenge;8&RuleDelayed;1&dsol;9&bigodot;&bigoplus;&bigotimes;1&biguplus;1&bigsqcup;5&iiiint;&fpartint;2&cirfnint;&awint;&rppolint;&scpolint;&npolint;&pointint;&quatint;&intlarhk;a&pluscir;&plusacir;&simplus;&plusdu;&plussim;&plustwo;1&mcomma;&minusdu;2&loplus;&roplus;&Cross;&timesd;&timesbar;1&smashp;&lotimes;&rotimes;&otimesas;&Otimes;&odiv;&triplus;&triminus;&tritime;&intprod;2&amalg;&capdot;1&ncup;&ncap;&capand;&cupor;&cupcap;&capcup;&cupbrcap;&capbrcup;&cupcup;&capcap;&ccups;&ccaps;2&ccupssm;2&And;&Or;&andand;&oror;&orslope;&andslope;1&andv;&orv;&andd;&ord;1&wedbar;6&sdote;3&simdot;2&congdot;{mw&ncongdot;}&easter;&apacir;&apE;{mw&napE;}&eplus;&pluse;&Esim;&Colone;&Equal;1&ddotseq;&equivDD;&ltcir;&gtcir;&ltquest;&gtquest;&leqslant;{mw&nleqslant;}&geqslant;{mw&ngeqslant;}&lesdot;&gesdot;&lesdoto;&gesdoto;&lesdotor;&gesdotol;&lap;&gap;&lne;&gne;&lnap;&gnap;&lEg;&gEl;&lsime;&gsime;&lsimg;&gsiml;&lgE;&glE;&lesges;&gesles;&els;&egs;&elsdot;&egsdot;&el;&eg;2&siml;&simg;&simlE;&simgE;&LessLess;{mw&NotNestedLessLess;}&GreaterGreater;{mw&NotNestedGreaterGreater;}1&glj;&gla;&ltcc;&gtcc;&lescc;&gescc;&smt;&lat;&smte;{1e68&smtes;}&late;{1e68&lates;}&bumpE;&PrecedesEqual;{mw&NotPrecedesEqual;}&sce;{mw&NotSucceedsEqual;}2&prE;&scE;&precneqq;&scnE;&prap;&scap;&precnapprox;&scnap;&Pr;&Sc;&subdot;&supdot;&subplus;&supplus;&submult;&supmult;&subedot;&supedot;&subE;{mw&nsubE;}&supE;{mw&nsupE;}&subsim;&supsim;2&subnE;{1e68&varsubsetneqq;}&supnE;{1e68&varsupsetneqq;}2&csub;&csup;&csube;&csupe;&subsup;&supsub;&subsub;&supsup;&suphsub;&supdsub;&forkv;&topfork;&mlcp;8&Dashv;1&Vdashl;&Barv;&vBar;&vBarv;1&Vbar;&Not;&bNot;&rnmid;&cirmid;&midcir;&topcir;&nhpar;&parsim;9&parsl;{6hx&nparsl;}y7r{17ks&Ascr;1&Cscr;&Dscr;2&Gscr;2&Jscr;&Kscr;2&Nscr;&Oscr;&Pscr;&Qscr;1&Sscr;&Tscr;&Uscr;&Vscr;&Wscr;&Xscr;&Yscr;&Zscr;&ascr;&bscr;&cscr;&dscr;1&fscr;1&hscr;&iscr;&jscr;&kscr;&lscr;&mscr;&nscr;1&pscr;&qscr;&rscr;&sscr;&tscr;&uscr;&vscr;&wscr;&xscr;&yscr;&zscr;1g&Afr;&Bfr;1&Dfr;&Efr;&Ffr;&Gfr;2&Jfr;&Kfr;&Lfr;&Mfr;&Nfr;&Ofr;&Pfr;&Qfr;1&Sfr;&Tfr;&Ufr;&Vfr;&Wfr;&Xfr;&Yfr;1&afr;&bfr;&cfr;&dfr;&efr;&ffr;&gfr;&hfr;&ifr;&jfr;&kfr;&lfr;&mfr;&nfr;&ofr;&pfr;&qfr;&rfr;&sfr;&tfr;&ufr;&vfr;&wfr;&xfr;&yfr;&zfr;&Aopf;&Bopf;1&Dopf;&Eopf;&Fopf;&Gopf;1&Iopf;&Jopf;&Kopf;&Lopf;&Mopf;1&Oopf;3&Sopf;&Topf;&Uopf;&Vopf;&Wopf;&Xopf;&Yopf;1&aopf;&bopf;&copf;&dopf;&eopf;&fopf;&gopf;&hopf;&iopf;&jopf;&kopf;&lopf;&mopf;&nopf;&oopf;&popf;&qopf;&ropf;&sopf;&topf;&uopf;&vopf;&wopf;&xopf;&yopf;&zopf;}6ve&fflig;&filig;&fllig;&ffilig;&ffllig;");
var HTML_BITSET = /* @__PURE__ */ new Uint32Array([
  5632,
  4227923966,
  4160749569,
  939524097
]);
var XML_BITSET = /* @__PURE__ */ new Uint32Array([
  0,
  XML_BITSET_VALUE,
  0,
  0
]);
function encodeHTML(input) {
  return encodeHTMLTrieRe(HTML_BITSET, input);
}
__name(encodeHTML, "encodeHTML");
__name2(encodeHTML, "encodeHTML");
function encodeNonAsciiHTML(input) {
  return encodeHTMLTrieRe(XML_BITSET, input);
}
__name(encodeNonAsciiHTML, "encodeNonAsciiHTML");
__name2(encodeNonAsciiHTML, "encodeNonAsciiHTML");
function encodeHTMLTrieRe(bitset, input) {
  let out;
  let last = 0;
  const { length } = input;
  for (let index = 0; index < length; index++) {
    const char = input.charCodeAt(index);
    if (char < 128 && !(bitset[char >>> 5] >>> char & 1)) continue;
    if (out === void 0) out = input.substring(0, index);
    else if (last !== index) out += input.substring(last, index);
    let node = htmlTrie.get(char);
    if (typeof node === "object") {
      if (index + 1 < length) {
        const nextChar = input.charCodeAt(index + 1);
        const value = typeof node.next === "number" ? node.next === nextChar ? node.nextValue : void 0 : node.next.get(nextChar);
        if (value !== void 0) {
          out += value;
          index++;
          last = index + 1;
          continue;
        }
      }
      node = node.value;
    }
    if (node === void 0) {
      const cp = getCodePoint$1(input, index);
      out += `&#x${cp.toString(16)};`;
      if (cp !== char) index++;
      last = index + 1;
    } else {
      out += node;
      last = index + 1;
    }
  }
  if (out === void 0) return input;
  if (last < length) out += input.substr(last);
  return out;
}
__name(encodeHTMLTrieRe, "encodeHTMLTrieRe");
__name2(encodeHTMLTrieRe, "encodeHTMLTrieRe");
var EntityLevel;
(function(EntityLevel2) {
  EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
  EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function(EncodingMode2) {
  EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
  EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
  EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
  EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
  EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));
function encode(input, options = EntityLevel.XML) {
  const { mode = EncodingMode.Extensive, level = EntityLevel.XML } = typeof options === "number" ? { level: options } : options;
  switch (mode) {
    case EncodingMode.UTF8:
      return escapeUTF8$1(input);
    case EncodingMode.Attribute:
      return escapeAttribute$1(input);
    case EncodingMode.Text:
      return escapeText$1(input);
    case EncodingMode.ASCII:
      return level === EntityLevel.HTML ? encodeNonAsciiHTML(input) : encodeXML$1(input);
    case EncodingMode.Extensive:
    default:
      return level === EntityLevel.HTML ? encodeHTML(input) : encodeXML$1(input);
  }
}
__name(encode, "encode");
__name2(encode, "encode");
var Node = class {
  static {
    __name(this, "Node");
  }
  static {
    __name2(this, "Node");
  }
  constructor(parentNode = null, range) {
    this.parentNode = parentNode;
    this.childNodes = [];
    Object.defineProperty(this, "range", {
      enumerable: false,
      writable: true,
      configurable: true,
      value: range !== null && range !== void 0 ? range : [-1, -1]
    });
  }
  /**
  * Remove current node
  */
  remove() {
    if (this.parentNode) {
      const children = this.parentNode.childNodes;
      this.parentNode.childNodes = children.filter((child) => {
        return this !== child;
      });
      this.parentNode = null;
    }
    return this;
  }
  get innerText() {
    return this.rawText;
  }
  get textContent() {
    return decodeHTML(this.rawText);
  }
  set textContent(val) {
    this.rawText = encode(val);
  }
};
var NodeType = /* @__PURE__ */ (function(NodeType2) {
  NodeType2[NodeType2["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
  NodeType2[NodeType2["TEXT_NODE"] = 3] = "TEXT_NODE";
  NodeType2[NodeType2["COMMENT_NODE"] = 8] = "COMMENT_NODE";
  return NodeType2;
})(NodeType || {});
var CommentNode = class CommentNode2 extends Node {
  static {
    __name(this, "CommentNode2");
  }
  static {
    __name2(this, "CommentNode");
  }
  clone() {
    return new CommentNode2(this.rawText, null, void 0, this.rawTagName);
  }
  constructor(rawText, parentNode = null, range, rawTagName = "!--") {
    super(parentNode, range);
    this.rawText = rawText;
    this.rawTagName = rawTagName;
    this.nodeType = 8;
  }
  /**
  * Get unescaped text value of current node and its children.
  * @return {string} text content
  */
  get text() {
    return this.rawText;
  }
  toString() {
    return `<!--${this.rawText}-->`;
  }
};
var ElementType;
(function(ElementType2) {
  ElementType2["Root"] = "root";
  ElementType2["Text"] = "text";
  ElementType2["Directive"] = "directive";
  ElementType2["Comment"] = "comment";
  ElementType2["Script"] = "script";
  ElementType2["Style"] = "style";
  ElementType2["Tag"] = "tag";
  ElementType2["CDATA"] = "cdata";
  ElementType2["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
function isTag$2(elem) {
  return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
__name(isTag$2, "isTag$2");
__name2(isTag$2, "isTag$2");
var Root = ElementType.Root;
var Text = ElementType.Text;
var Directive = ElementType.Directive;
var Comment = ElementType.Comment;
var Script = ElementType.Script;
var Style = ElementType.Style;
var Tag = ElementType.Tag;
var CDATA = ElementType.CDATA;
var Doctype = ElementType.Doctype;
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
__name(ownKeys, "ownKeys");
__name2(ownKeys, "ownKeys");
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
__name(_objectSpread2, "_objectSpread2");
__name2(_objectSpread2, "_objectSpread2");
function isTag$1(node) {
  return isTag$2(node);
}
__name(isTag$1, "isTag$1");
__name2(isTag$1, "isTag$1");
function isCDATA(node) {
  return node.type === ElementType.CDATA;
}
__name(isCDATA, "isCDATA");
__name2(isCDATA, "isCDATA");
function isText(node) {
  return node.type === ElementType.Text;
}
__name(isText, "isText");
__name2(isText, "isText");
function isComment(node) {
  return node.type === ElementType.Comment;
}
__name(isComment, "isComment");
__name2(isComment, "isComment");
function isDocument(node) {
  return node.type === ElementType.Root;
}
__name(isDocument, "isDocument");
__name2(isDocument, "isDocument");
function hasChildren(node) {
  return Object.prototype.hasOwnProperty.call(node, "children");
}
__name(hasChildren, "hasChildren");
__name2(hasChildren, "hasChildren");
var xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
var xmlCodeMap = /* @__PURE__ */ new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [39, "&apos;"],
  [60, "&lt;"],
  [62, "&gt;"]
]);
var getCodePoint = String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index);
function encodeXML(str) {
  let ret = "";
  let lastIdx = 0;
  let match2;
  while ((match2 = xmlReplacer.exec(str)) !== null) {
    const i = match2.index;
    const char = str.charCodeAt(i);
    const next = xmlCodeMap.get(char);
    if (next !== void 0) {
      ret += str.substring(lastIdx, i) + next;
      lastIdx = i + 1;
    } else {
      ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
      lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
    }
  }
  return ret + str.substr(lastIdx);
}
__name(encodeXML, "encodeXML");
__name2(encodeXML, "encodeXML");
function getEscaper(regex, map) {
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function escape(data) {
    let match2;
    let lastIdx = 0;
    let result = "";
    while (match2 = regex.exec(data)) {
      if (lastIdx !== match2.index) result += data.substring(lastIdx, match2.index);
      result += map.get(match2[0].charCodeAt(0));
      lastIdx = match2.index + 1;
    }
    return result + data.substring(lastIdx);
  }, "escape"), "escape");
}
__name(getEscaper, "getEscaper");
__name2(getEscaper, "getEscaper");
var escapeAttribute = getEscaper(/["&\u00A0]/g, /* @__PURE__ */ new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [160, "&nbsp;"]
]));
var escapeText = getEscaper(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
  [38, "&amp;"],
  [60, "&lt;"],
  [62, "&gt;"],
  [160, "&nbsp;"]
]));
var elementNames = new Map([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "clipPath",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "foreignObject",
  "glyphRef",
  "linearGradient",
  "radialGradient",
  "textPath"
].map((val) => [val.toLowerCase(), val]));
var attributeNames = new Map([
  "definitionURL",
  "attributeName",
  "attributeType",
  "baseFrequency",
  "baseProfile",
  "calcMode",
  "clipPathUnits",
  "diffuseConstant",
  "edgeMode",
  "filterUnits",
  "glyphRef",
  "gradientTransform",
  "gradientUnits",
  "kernelMatrix",
  "kernelUnitLength",
  "keyPoints",
  "keySplines",
  "keyTimes",
  "lengthAdjust",
  "limitingConeAngle",
  "markerHeight",
  "markerUnits",
  "markerWidth",
  "maskContentUnits",
  "maskUnits",
  "numOctaves",
  "pathLength",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "preserveAlpha",
  "preserveAspectRatio",
  "primitiveUnits",
  "refX",
  "refY",
  "repeatCount",
  "repeatDur",
  "requiredExtensions",
  "requiredFeatures",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "startOffset",
  "stdDeviation",
  "stitchTiles",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "textLength",
  "viewBox",
  "viewTarget",
  "xChannelSelector",
  "yChannelSelector",
  "zoomAndPan"
].map((val) => [val.toLowerCase(), val]));
var unencodedElements = /* @__PURE__ */ new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript"
]);
function replaceQuotes(value) {
  return value.replace(/"/g, "&quot;");
}
__name(replaceQuotes, "replaceQuotes");
__name2(replaceQuotes, "replaceQuotes");
function formatAttributes(attributes2, opts) {
  var _a;
  if (!attributes2) return;
  const encode2 = ((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
  return Object.keys(attributes2).map((key) => {
    var _a2, _b;
    const value = (_a2 = attributes2[key]) !== null && _a2 !== void 0 ? _a2 : "";
    if (opts.xmlMode === "foreign") key = (_b = attributeNames.get(key)) !== null && _b !== void 0 ? _b : key;
    if (!opts.emptyAttrs && !opts.xmlMode && value === "") return key;
    return `${key}="${encode2(value)}"`;
  }).join(" ");
}
__name(formatAttributes, "formatAttributes");
__name2(formatAttributes, "formatAttributes");
var singleTag = /* @__PURE__ */ new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function render(node, options = {}) {
  const nodes = "length" in node ? node : [node];
  let output = "";
  for (let i = 0; i < nodes.length; i++) output += renderNode(nodes[i], options);
  return output;
}
__name(render, "render");
__name2(render, "render");
function renderNode(node, options) {
  switch (node.type) {
    case Root:
      return render(node.children, options);
    case Doctype:
    case Directive:
      return renderDirective(node);
    case Comment:
      return renderComment(node);
    case CDATA:
      return renderCdata(node);
    case Script:
    case Style:
    case Tag:
      return renderTag(node, options);
    case Text:
      return renderText(node, options);
  }
}
__name(renderNode, "renderNode");
__name2(renderNode, "renderNode");
var foreignModeIntegrationPoints = /* @__PURE__ */ new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignObject",
  "desc",
  "title"
]);
var foreignElements = /* @__PURE__ */ new Set(["svg", "math"]);
function renderTag(elem, opts) {
  var _a;
  if (opts.xmlMode === "foreign") {
    elem.name = (_a = elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
    if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) opts = _objectSpread2(_objectSpread2({}, opts), {}, { xmlMode: false });
  }
  if (!opts.xmlMode && foreignElements.has(elem.name)) opts = _objectSpread2(_objectSpread2({}, opts), {}, { xmlMode: "foreign" });
  let tag = `<${elem.name}`;
  const attribs = formatAttributes(elem.attribs, opts);
  if (attribs) tag += ` ${attribs}`;
  if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
    if (!opts.xmlMode) tag += " ";
    tag += "/>";
  } else {
    tag += ">";
    if (elem.children.length > 0) tag += render(elem.children, opts);
    if (opts.xmlMode || !singleTag.has(elem.name)) tag += `</${elem.name}>`;
  }
  return tag;
}
__name(renderTag, "renderTag");
__name2(renderTag, "renderTag");
function renderDirective(elem) {
  return `<${elem.data}>`;
}
__name(renderDirective, "renderDirective");
__name2(renderDirective, "renderDirective");
function renderText(elem, opts) {
  var _a;
  let data = elem.data || "";
  if (((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
  return data;
}
__name(renderText, "renderText");
__name2(renderText, "renderText");
function renderCdata(elem) {
  return `<![CDATA[${elem.children[0].data}]]>`;
}
__name(renderCdata, "renderCdata");
__name2(renderCdata, "renderCdata");
function renderComment(elem) {
  return `<!--${elem.data}-->`;
}
__name(renderComment, "renderComment");
__name2(renderComment, "renderComment");
function getOuterHTML(node, options) {
  return render(node, options);
}
__name(getOuterHTML, "getOuterHTML");
__name2(getOuterHTML, "getOuterHTML");
function getInnerHTML(node, options) {
  return hasChildren(node) ? node.children.map((node2) => getOuterHTML(node2, options)).join("") : "";
}
__name(getInnerHTML, "getInnerHTML");
__name2(getInnerHTML, "getInnerHTML");
function getText$1(node) {
  if (Array.isArray(node)) return node.map(getText$1).join("");
  if (isTag$1(node)) return node.name === "br" ? "\n" : getText$1(node.children);
  if (isCDATA(node)) return getText$1(node.children);
  if (isText(node)) return node.data;
  return "";
}
__name(getText$1, "getText$1");
__name2(getText$1, "getText$1");
function textContent(node) {
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (hasChildren(node) && !isComment(node)) return textContent(node.children);
  if (isText(node)) return node.data;
  return "";
}
__name(textContent, "textContent");
__name2(textContent, "textContent");
function innerText(node) {
  if (Array.isArray(node)) return node.map(innerText).join("");
  if (hasChildren(node) && (node.type === ElementType.Tag || isCDATA(node))) return innerText(node.children);
  if (isText(node)) return node.data;
  return "";
}
__name(innerText, "innerText");
__name2(innerText, "innerText");
function getChildren$1(elem) {
  return hasChildren(elem) ? elem.children : [];
}
__name(getChildren$1, "getChildren$1");
__name2(getChildren$1, "getChildren$1");
function getParent$1(elem) {
  return elem.parent || null;
}
__name(getParent$1, "getParent$1");
__name2(getParent$1, "getParent$1");
function getSiblings$1(elem) {
  const parent = getParent$1(elem);
  if (parent != null) return getChildren$1(parent);
  const siblings = [elem];
  let { prev, next } = elem;
  while (prev != null) {
    siblings.unshift(prev);
    ({ prev } = prev);
  }
  while (next != null) {
    siblings.push(next);
    ({ next } = next);
  }
  return siblings;
}
__name(getSiblings$1, "getSiblings$1");
__name2(getSiblings$1, "getSiblings$1");
function getAttributeValue$1(elem, name) {
  var _a;
  return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
}
__name(getAttributeValue$1, "getAttributeValue$1");
__name2(getAttributeValue$1, "getAttributeValue$1");
function hasAttrib$1(elem, name) {
  return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
}
__name(hasAttrib$1, "hasAttrib$1");
__name2(hasAttrib$1, "hasAttrib$1");
function getName$1(elem) {
  return elem.name;
}
__name(getName$1, "getName$1");
__name2(getName$1, "getName$1");
function nextElementSibling(elem) {
  let { next } = elem;
  while (next !== null && !isTag$1(next)) ({ next } = next);
  return next;
}
__name(nextElementSibling, "nextElementSibling");
__name2(nextElementSibling, "nextElementSibling");
function prevElementSibling(elem) {
  let { prev } = elem;
  while (prev !== null && !isTag$1(prev)) ({ prev } = prev);
  return prev;
}
__name(prevElementSibling, "prevElementSibling");
__name2(prevElementSibling, "prevElementSibling");
function removeElement(elem) {
  if (elem.prev) elem.prev.next = elem.next;
  if (elem.next) elem.next.prev = elem.prev;
  if (elem.parent) {
    const childs = elem.parent.children;
    const childsIndex = childs.lastIndexOf(elem);
    if (childsIndex >= 0) childs.splice(childsIndex, 1);
  }
  elem.next = null;
  elem.prev = null;
  elem.parent = null;
}
__name(removeElement, "removeElement");
__name2(removeElement, "removeElement");
function replaceElement(elem, replacement) {
  const prev = replacement.prev = elem.prev;
  if (prev) prev.next = replacement;
  const next = replacement.next = elem.next;
  if (next) next.prev = replacement;
  const parent = replacement.parent = elem.parent;
  if (parent) {
    const childs = parent.children;
    childs[childs.lastIndexOf(elem)] = replacement;
    elem.parent = null;
  }
}
__name(replaceElement, "replaceElement");
__name2(replaceElement, "replaceElement");
function appendChild(parent, child) {
  removeElement(child);
  child.next = null;
  child.parent = parent;
  if (parent.children.push(child) > 1) {
    const sibling = parent.children[parent.children.length - 2];
    sibling.next = child;
    child.prev = sibling;
  } else child.prev = null;
}
__name(appendChild, "appendChild");
__name2(appendChild, "appendChild");
function append(elem, next) {
  removeElement(next);
  const { parent } = elem;
  const currNext = elem.next;
  next.next = currNext;
  next.prev = elem;
  elem.next = next;
  next.parent = parent;
  if (currNext) {
    currNext.prev = next;
    if (parent) {
      const childs = parent.children;
      childs.splice(childs.lastIndexOf(currNext), 0, next);
    }
  } else if (parent) parent.children.push(next);
}
__name(append, "append");
__name2(append, "append");
function prependChild(parent, child) {
  removeElement(child);
  child.parent = parent;
  child.prev = null;
  if (parent.children.unshift(child) !== 1) {
    const sibling = parent.children[1];
    sibling.prev = child;
    child.next = sibling;
  } else child.next = null;
}
__name(prependChild, "prependChild");
__name2(prependChild, "prependChild");
function prepend(elem, prev) {
  removeElement(prev);
  const { parent } = elem;
  if (parent) {
    const childs = parent.children;
    childs.splice(childs.indexOf(elem), 0, prev);
  }
  if (elem.prev) elem.prev.next = prev;
  prev.parent = parent;
  prev.prev = elem.prev;
  prev.next = elem;
  elem.prev = prev;
}
__name(prepend, "prepend");
__name2(prepend, "prepend");
function filter(test, node, recurse = true, limit = Infinity) {
  return find(test, Array.isArray(node) ? node : [node], recurse, limit);
}
__name(filter, "filter");
__name2(filter, "filter");
function find(test, nodes, recurse, limit) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (indexStack.length === 1) return result;
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (test(elem)) {
      result.push(elem);
      if (--limit <= 0) return result;
    }
    if (recurse && hasChildren(elem) && elem.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(elem.children);
    }
  }
}
__name(find, "find");
__name2(find, "find");
function findOneChild(test, nodes) {
  return nodes.find(test);
}
__name(findOneChild, "findOneChild");
__name2(findOneChild, "findOneChild");
function findOne$1(test, nodes, recurse = true) {
  const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
  for (let i = 0; i < searchedNodes.length; i++) {
    const node = searchedNodes[i];
    if (isTag$1(node) && test(node)) return node;
    if (recurse && hasChildren(node) && node.children.length > 0) {
      const found = findOne$1(test, node.children, true);
      if (found) return found;
    }
  }
  return null;
}
__name(findOne$1, "findOne$1");
__name2(findOne$1, "findOne$1");
function existsOne$1(test, nodes) {
  return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag$1(node) && test(node) || hasChildren(node) && existsOne$1(test, node.children));
}
__name(existsOne$1, "existsOne$1");
__name2(existsOne$1, "existsOne$1");
function findAll$1(test, nodes) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (; ; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) return result;
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (isTag$1(elem) && test(elem)) result.push(elem);
    if (hasChildren(elem) && elem.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(elem.children);
    }
  }
}
__name(findAll$1, "findAll$1");
__name2(findAll$1, "findAll$1");
var Checks = {
  tag_name(name) {
    if (typeof name === "function") return (elem) => isTag$1(elem) && name(elem.name);
    else if (name === "*") return isTag$1;
    return (elem) => isTag$1(elem) && elem.name === name;
  },
  tag_type(type) {
    if (typeof type === "function") return (elem) => type(elem.type);
    return (elem) => elem.type === type;
  },
  tag_contains(data) {
    if (typeof data === "function") return (elem) => isText(elem) && data(elem.data);
    return (elem) => isText(elem) && elem.data === data;
  }
};
function getAttribCheck(attrib, value) {
  if (typeof value === "function") return (elem) => isTag$1(elem) && value(elem.attribs[attrib]);
  return (elem) => isTag$1(elem) && elem.attribs[attrib] === value;
}
__name(getAttribCheck, "getAttribCheck");
__name2(getAttribCheck, "getAttribCheck");
function combineFuncs(a, b) {
  return (elem) => a(elem) || b(elem);
}
__name(combineFuncs, "combineFuncs");
__name2(combineFuncs, "combineFuncs");
function compileTest(options) {
  const funcs = Object.keys(options).map((key) => {
    const value = options[key];
    return Object.prototype.hasOwnProperty.call(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
  });
  return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
__name(compileTest, "compileTest");
__name2(compileTest, "compileTest");
function testElement(options, node) {
  const test = compileTest(options);
  return test ? test(node) : true;
}
__name(testElement, "testElement");
__name2(testElement, "testElement");
function getElements(options, nodes, recurse, limit = Infinity) {
  const test = compileTest(options);
  return test ? filter(test, nodes, recurse, limit) : [];
}
__name(getElements, "getElements");
__name2(getElements, "getElements");
function getElementById(id, nodes, recurse = true) {
  if (!Array.isArray(nodes)) nodes = [nodes];
  return findOne$1(getAttribCheck("id", id), nodes, recurse);
}
__name(getElementById, "getElementById");
__name2(getElementById, "getElementById");
function getElementsByTagName(tagName, nodes, recurse = true, limit = Infinity) {
  return filter(Checks["tag_name"](tagName), nodes, recurse, limit);
}
__name(getElementsByTagName, "getElementsByTagName");
__name2(getElementsByTagName, "getElementsByTagName");
function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
  return filter(getAttribCheck("class", className), nodes, recurse, limit);
}
__name(getElementsByClassName, "getElementsByClassName");
__name2(getElementsByClassName, "getElementsByClassName");
function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
  return filter(Checks["tag_type"](type), nodes, recurse, limit);
}
__name(getElementsByTagType, "getElementsByTagType");
__name2(getElementsByTagType, "getElementsByTagType");
function removeSubsets$1(nodes) {
  let idx = nodes.length;
  while (--idx >= 0) {
    const node = nodes[idx];
    if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
      nodes.splice(idx, 1);
      continue;
    }
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) if (nodes.includes(ancestor)) {
      nodes.splice(idx, 1);
      break;
    }
  }
  return nodes;
}
__name(removeSubsets$1, "removeSubsets$1");
__name2(removeSubsets$1, "removeSubsets$1");
var DocumentPosition;
(function(DocumentPosition2) {
  DocumentPosition2[DocumentPosition2["DISCONNECTED"] = 1] = "DISCONNECTED";
  DocumentPosition2[DocumentPosition2["PRECEDING"] = 2] = "PRECEDING";
  DocumentPosition2[DocumentPosition2["FOLLOWING"] = 4] = "FOLLOWING";
  DocumentPosition2[DocumentPosition2["CONTAINS"] = 8] = "CONTAINS";
  DocumentPosition2[DocumentPosition2["CONTAINED_BY"] = 16] = "CONTAINED_BY";
})(DocumentPosition || (DocumentPosition = {}));
function compareDocumentPosition(nodeA, nodeB) {
  const aParents = [];
  const bParents = [];
  if (nodeA === nodeB) return 0;
  let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
  while (current) {
    aParents.unshift(current);
    current = current.parent;
  }
  current = hasChildren(nodeB) ? nodeB : nodeB.parent;
  while (current) {
    bParents.unshift(current);
    current = current.parent;
  }
  const maxIdx = Math.min(aParents.length, bParents.length);
  let idx = 0;
  while (idx < maxIdx && aParents[idx] === bParents[idx]) idx++;
  if (idx === 0) return DocumentPosition.DISCONNECTED;
  const sharedParent = aParents[idx - 1];
  const siblings = sharedParent.children;
  const aSibling = aParents[idx];
  const bSibling = bParents[idx];
  if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
    if (sharedParent === nodeB) return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
    return DocumentPosition.FOLLOWING;
  }
  if (sharedParent === nodeA) return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
  return DocumentPosition.PRECEDING;
}
__name(compareDocumentPosition, "compareDocumentPosition");
__name2(compareDocumentPosition, "compareDocumentPosition");
function uniqueSort(nodes) {
  nodes = nodes.filter((node, i, arr) => !arr.includes(node, i + 1));
  nodes.sort((a, b) => {
    const relative = compareDocumentPosition(a, b);
    if (relative & DocumentPosition.PRECEDING) return -1;
    else if (relative & DocumentPosition.FOLLOWING) return 1;
    return 0;
  });
  return nodes;
}
__name(uniqueSort, "uniqueSort");
__name2(uniqueSort, "uniqueSort");
function getFeed(doc) {
  const feedRoot = getOneElement(isValidFeed, doc);
  return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
}
__name(getFeed, "getFeed");
__name2(getFeed, "getFeed");
function getAtomFeed(feedRoot) {
  var _a;
  const childs = feedRoot.children;
  const feed = {
    type: "atom",
    items: getElementsByTagName("entry", childs).map((item) => {
      var _a2;
      const { children } = item;
      const entry = { media: getMediaElements(children) };
      addConditionally(entry, "id", "id", children);
      addConditionally(entry, "title", "title", children);
      const href2 = (_a2 = getOneElement("link", children)) === null || _a2 === void 0 ? void 0 : _a2.attribs["href"];
      if (href2) entry.link = href2;
      const description = fetch2("summary", children) || fetch2("content", children);
      if (description) entry.description = description;
      const pubDate = fetch2("updated", children);
      if (pubDate) entry.pubDate = new Date(pubDate);
      return entry;
    })
  };
  addConditionally(feed, "id", "id", childs);
  addConditionally(feed, "title", "title", childs);
  const href = (_a = getOneElement("link", childs)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
  if (href) feed.link = href;
  addConditionally(feed, "description", "subtitle", childs);
  const updated = fetch2("updated", childs);
  if (updated) feed.updated = new Date(updated);
  addConditionally(feed, "author", "email", childs, true);
  return feed;
}
__name(getAtomFeed, "getAtomFeed");
__name2(getAtomFeed, "getAtomFeed");
function getRssFeed(feedRoot) {
  var _a, _b;
  const childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [];
  const feed = {
    type: feedRoot.name.substr(0, 3),
    id: "",
    items: getElementsByTagName("item", feedRoot.children).map((item) => {
      const { children } = item;
      const entry = { media: getMediaElements(children) };
      addConditionally(entry, "id", "guid", children);
      addConditionally(entry, "title", "title", children);
      addConditionally(entry, "link", "link", children);
      addConditionally(entry, "description", "description", children);
      const pubDate = fetch2("pubDate", children) || fetch2("dc:date", children);
      if (pubDate) entry.pubDate = new Date(pubDate);
      return entry;
    })
  };
  addConditionally(feed, "title", "title", childs);
  addConditionally(feed, "link", "link", childs);
  addConditionally(feed, "description", "description", childs);
  const updated = fetch2("lastBuildDate", childs);
  if (updated) feed.updated = new Date(updated);
  addConditionally(feed, "author", "managingEditor", childs, true);
  return feed;
}
__name(getRssFeed, "getRssFeed");
__name2(getRssFeed, "getRssFeed");
var MEDIA_KEYS_STRING = [
  "url",
  "type",
  "lang"
];
var MEDIA_KEYS_INT = [
  "fileSize",
  "bitrate",
  "framerate",
  "samplingrate",
  "channels",
  "duration",
  "height",
  "width"
];
function getMediaElements(where) {
  return getElementsByTagName("media:content", where).map((elem) => {
    const { attribs } = elem;
    const media = {
      medium: attribs["medium"],
      isDefault: !!attribs["isDefault"]
    };
    for (const attrib of MEDIA_KEYS_STRING) if (attribs[attrib]) media[attrib] = attribs[attrib];
    for (const attrib of MEDIA_KEYS_INT) if (attribs[attrib]) media[attrib] = parseInt(attribs[attrib], 10);
    if (attribs["expression"]) media.expression = attribs["expression"];
    return media;
  });
}
__name(getMediaElements, "getMediaElements");
__name2(getMediaElements, "getMediaElements");
function getOneElement(tagName, node) {
  return getElementsByTagName(tagName, node, true, 1)[0];
}
__name(getOneElement, "getOneElement");
__name2(getOneElement, "getOneElement");
function fetch2(tagName, where, recurse = false) {
  return textContent(getElementsByTagName(tagName, where, recurse, 1)).trim();
}
__name(fetch2, "fetch2");
__name2(fetch2, "fetch");
function addConditionally(obj, prop, tagName, where, recurse = false) {
  const val = fetch2(tagName, where, recurse);
  if (val) obj[prop] = val;
}
__name(addConditionally, "addConditionally");
__name2(addConditionally, "addConditionally");
function isValidFeed(value) {
  return value === "rss" || value === "feed" || value === "rdf:RDF";
}
__name(isValidFeed, "isValidFeed");
__name2(isValidFeed, "isValidFeed");
var esm_exports = /* @__PURE__ */ __exportAll({
  DocumentPosition: /* @__PURE__ */ __name2(() => DocumentPosition, "DocumentPosition"),
  append: /* @__PURE__ */ __name2(() => append, "append"),
  appendChild: /* @__PURE__ */ __name2(() => appendChild, "appendChild"),
  compareDocumentPosition: /* @__PURE__ */ __name2(() => compareDocumentPosition, "compareDocumentPosition"),
  existsOne: /* @__PURE__ */ __name2(() => existsOne$1, "existsOne"),
  filter: /* @__PURE__ */ __name2(() => filter, "filter"),
  find: /* @__PURE__ */ __name2(() => find, "find"),
  findAll: /* @__PURE__ */ __name2(() => findAll$1, "findAll"),
  findOne: /* @__PURE__ */ __name2(() => findOne$1, "findOne"),
  findOneChild: /* @__PURE__ */ __name2(() => findOneChild, "findOneChild"),
  getAttributeValue: /* @__PURE__ */ __name2(() => getAttributeValue$1, "getAttributeValue"),
  getChildren: /* @__PURE__ */ __name2(() => getChildren$1, "getChildren"),
  getElementById: /* @__PURE__ */ __name2(() => getElementById, "getElementById"),
  getElements: /* @__PURE__ */ __name2(() => getElements, "getElements"),
  getElementsByClassName: /* @__PURE__ */ __name2(() => getElementsByClassName, "getElementsByClassName"),
  getElementsByTagName: /* @__PURE__ */ __name2(() => getElementsByTagName, "getElementsByTagName"),
  getElementsByTagType: /* @__PURE__ */ __name2(() => getElementsByTagType, "getElementsByTagType"),
  getFeed: /* @__PURE__ */ __name2(() => getFeed, "getFeed"),
  getInnerHTML: /* @__PURE__ */ __name2(() => getInnerHTML, "getInnerHTML"),
  getName: /* @__PURE__ */ __name2(() => getName$1, "getName"),
  getOuterHTML: /* @__PURE__ */ __name2(() => getOuterHTML, "getOuterHTML"),
  getParent: /* @__PURE__ */ __name2(() => getParent$1, "getParent"),
  getSiblings: /* @__PURE__ */ __name2(() => getSiblings$1, "getSiblings"),
  getText: /* @__PURE__ */ __name2(() => getText$1, "getText"),
  hasAttrib: /* @__PURE__ */ __name2(() => hasAttrib$1, "hasAttrib"),
  hasChildren: /* @__PURE__ */ __name2(() => hasChildren, "hasChildren"),
  innerText: /* @__PURE__ */ __name2(() => innerText, "innerText"),
  isCDATA: /* @__PURE__ */ __name2(() => isCDATA, "isCDATA"),
  isComment: /* @__PURE__ */ __name2(() => isComment, "isComment"),
  isDocument: /* @__PURE__ */ __name2(() => isDocument, "isDocument"),
  isTag: /* @__PURE__ */ __name2(() => isTag$1, "isTag"),
  isText: /* @__PURE__ */ __name2(() => isText, "isText"),
  nextElementSibling: /* @__PURE__ */ __name2(() => nextElementSibling, "nextElementSibling"),
  prepend: /* @__PURE__ */ __name2(() => prepend, "prepend"),
  prependChild: /* @__PURE__ */ __name2(() => prependChild, "prependChild"),
  prevElementSibling: /* @__PURE__ */ __name2(() => prevElementSibling, "prevElementSibling"),
  removeElement: /* @__PURE__ */ __name2(() => removeElement, "removeElement"),
  removeSubsets: /* @__PURE__ */ __name2(() => removeSubsets$1, "removeSubsets"),
  replaceElement: /* @__PURE__ */ __name2(() => replaceElement, "replaceElement"),
  testElement: /* @__PURE__ */ __name2(() => testElement, "testElement"),
  textContent: /* @__PURE__ */ __name2(() => textContent, "textContent"),
  uniqueSort: /* @__PURE__ */ __name2(() => uniqueSort, "uniqueSort")
});
var require_boolbase = /* @__PURE__ */ __commonJSMin(((exports, module) => {
  module.exports = {
    trueFunc: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function trueFunc() {
      return true;
    }, "trueFunc"), "trueFunc"),
    falseFunc: /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function falseFunc() {
      return false;
    }, "falseFunc"), "falseFunc")
  };
}));
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AttributeAction = exports.IgnoreCaseMode = exports.SelectorType = void 0;
  (function(SelectorType) {
    SelectorType["Attribute"] = "attribute";
    SelectorType["Pseudo"] = "pseudo";
    SelectorType["PseudoElement"] = "pseudo-element";
    SelectorType["Tag"] = "tag";
    SelectorType["Universal"] = "universal";
    SelectorType["Adjacent"] = "adjacent";
    SelectorType["Child"] = "child";
    SelectorType["Descendant"] = "descendant";
    SelectorType["Parent"] = "parent";
    SelectorType["Sibling"] = "sibling";
    SelectorType["ColumnCombinator"] = "column-combinator";
  })(exports.SelectorType || (exports.SelectorType = {}));
  exports.IgnoreCaseMode = {
    Unknown: null,
    QuirksMode: "quirks",
    IgnoreCase: true,
    CaseSensitive: false
  };
  (function(AttributeAction) {
    AttributeAction["Any"] = "any";
    AttributeAction["Element"] = "element";
    AttributeAction["End"] = "end";
    AttributeAction["Equals"] = "equals";
    AttributeAction["Exists"] = "exists";
    AttributeAction["Hyphen"] = "hyphen";
    AttributeAction["Not"] = "not";
    AttributeAction["Start"] = "start";
  })(exports.AttributeAction || (exports.AttributeAction = {}));
}));
var require_parse = /* @__PURE__ */ __commonJSMin(((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parse = exports.isTraversal = void 0;
  var types_1 = require_types();
  var reName = /^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/;
  var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
  var actionTypes = /* @__PURE__ */ new Map([
    [126, types_1.AttributeAction.Element],
    [94, types_1.AttributeAction.Start],
    [36, types_1.AttributeAction.End],
    [42, types_1.AttributeAction.Any],
    [33, types_1.AttributeAction.Not],
    [124, types_1.AttributeAction.Hyphen]
  ]);
  var unpackPseudos = /* @__PURE__ */ new Set([
    "has",
    "not",
    "matches",
    "is",
    "where",
    "host",
    "host-context"
  ]);
  function isTraversal2(selector) {
    switch (selector.type) {
      case types_1.SelectorType.Adjacent:
      case types_1.SelectorType.Child:
      case types_1.SelectorType.Descendant:
      case types_1.SelectorType.Parent:
      case types_1.SelectorType.Sibling:
      case types_1.SelectorType.ColumnCombinator:
        return true;
      default:
        return false;
    }
  }
  __name(isTraversal2, "isTraversal2");
  __name2(isTraversal2, "isTraversal");
  exports.isTraversal = isTraversal2;
  var stripQuotesFromPseudos = /* @__PURE__ */ new Set(["contains", "icontains"]);
  function funescape(_, escaped, escapedWhitespace) {
    var high = parseInt(escaped, 16) - 65536;
    return high !== high || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
  }
  __name(funescape, "funescape");
  __name2(funescape, "funescape");
  function unescapeCSS(str) {
    return str.replace(reEscape, funescape);
  }
  __name(unescapeCSS, "unescapeCSS");
  __name2(unescapeCSS, "unescapeCSS");
  function isQuote(c) {
    return c === 39 || c === 34;
  }
  __name(isQuote, "isQuote");
  __name2(isQuote, "isQuote");
  function isWhitespace(c) {
    return c === 32 || c === 9 || c === 10 || c === 12 || c === 13;
  }
  __name(isWhitespace, "isWhitespace");
  __name2(isWhitespace, "isWhitespace");
  function parse3(selector) {
    var subselects2 = [];
    var endIndex = parseSelector(subselects2, "".concat(selector), 0);
    if (endIndex < selector.length) throw new Error("Unmatched selector: ".concat(selector.slice(endIndex)));
    return subselects2;
  }
  __name(parse3, "parse3");
  __name2(parse3, "parse");
  exports.parse = parse3;
  function parseSelector(subselects2, selector, selectorIndex) {
    var tokens = [];
    function getName2(offset) {
      var match2 = selector.slice(selectorIndex + offset).match(reName);
      if (!match2) throw new Error("Expected name, found ".concat(selector.slice(selectorIndex)));
      var name = match2[0];
      selectorIndex += offset + name.length;
      return unescapeCSS(name);
    }
    __name(getName2, "getName2");
    __name2(getName2, "getName");
    function stripWhitespace(offset) {
      selectorIndex += offset;
      while (selectorIndex < selector.length && isWhitespace(selector.charCodeAt(selectorIndex))) selectorIndex++;
    }
    __name(stripWhitespace, "stripWhitespace");
    __name2(stripWhitespace, "stripWhitespace");
    function readValueWithParenthesis() {
      selectorIndex += 1;
      var start = selectorIndex;
      var counter = 1;
      for (; counter > 0 && selectorIndex < selector.length; selectorIndex++) if (selector.charCodeAt(selectorIndex) === 40 && !isEscaped(selectorIndex)) counter++;
      else if (selector.charCodeAt(selectorIndex) === 41 && !isEscaped(selectorIndex)) counter--;
      if (counter) throw new Error("Parenthesis not matched");
      return unescapeCSS(selector.slice(start, selectorIndex - 1));
    }
    __name(readValueWithParenthesis, "readValueWithParenthesis");
    __name2(readValueWithParenthesis, "readValueWithParenthesis");
    function isEscaped(pos) {
      var slashCount = 0;
      while (selector.charCodeAt(--pos) === 92) slashCount++;
      return (slashCount & 1) === 1;
    }
    __name(isEscaped, "isEscaped");
    __name2(isEscaped, "isEscaped");
    function ensureNotTraversal() {
      if (tokens.length > 0 && isTraversal2(tokens[tokens.length - 1])) throw new Error("Did not expect successive traversals.");
    }
    __name(ensureNotTraversal, "ensureNotTraversal");
    __name2(ensureNotTraversal, "ensureNotTraversal");
    function addTraversal(type) {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === types_1.SelectorType.Descendant) {
        tokens[tokens.length - 1].type = type;
        return;
      }
      ensureNotTraversal();
      tokens.push({ type });
    }
    __name(addTraversal, "addTraversal");
    __name2(addTraversal, "addTraversal");
    function addSpecialAttribute(name, action2) {
      tokens.push({
        type: types_1.SelectorType.Attribute,
        name,
        action: action2,
        value: getName2(1),
        namespace: null,
        ignoreCase: "quirks"
      });
    }
    __name(addSpecialAttribute, "addSpecialAttribute");
    __name2(addSpecialAttribute, "addSpecialAttribute");
    function finalizeSubselector() {
      if (tokens.length && tokens[tokens.length - 1].type === types_1.SelectorType.Descendant) tokens.pop();
      if (tokens.length === 0) throw new Error("Empty sub-selector");
      subselects2.push(tokens);
    }
    __name(finalizeSubselector, "finalizeSubselector");
    __name2(finalizeSubselector, "finalizeSubselector");
    stripWhitespace(0);
    if (selector.length === selectorIndex) return selectorIndex;
    loop: while (selectorIndex < selector.length) {
      var firstChar = selector.charCodeAt(selectorIndex);
      switch (firstChar) {
        case 32:
        case 9:
        case 10:
        case 12:
        case 13:
          if (tokens.length === 0 || tokens[0].type !== types_1.SelectorType.Descendant) {
            ensureNotTraversal();
            tokens.push({ type: types_1.SelectorType.Descendant });
          }
          stripWhitespace(1);
          break;
        case 62:
          addTraversal(types_1.SelectorType.Child);
          stripWhitespace(1);
          break;
        case 60:
          addTraversal(types_1.SelectorType.Parent);
          stripWhitespace(1);
          break;
        case 126:
          addTraversal(types_1.SelectorType.Sibling);
          stripWhitespace(1);
          break;
        case 43:
          addTraversal(types_1.SelectorType.Adjacent);
          stripWhitespace(1);
          break;
        case 46:
          addSpecialAttribute("class", types_1.AttributeAction.Element);
          break;
        case 35:
          addSpecialAttribute("id", types_1.AttributeAction.Equals);
          break;
        case 91:
          stripWhitespace(1);
          var name_1 = void 0;
          var namespace = null;
          if (selector.charCodeAt(selectorIndex) === 124) name_1 = getName2(1);
          else if (selector.startsWith("*|", selectorIndex)) {
            namespace = "*";
            name_1 = getName2(2);
          } else {
            name_1 = getName2(0);
            if (selector.charCodeAt(selectorIndex) === 124 && selector.charCodeAt(selectorIndex + 1) !== 61) {
              namespace = name_1;
              name_1 = getName2(1);
            }
          }
          stripWhitespace(0);
          var action = types_1.AttributeAction.Exists;
          var possibleAction = actionTypes.get(selector.charCodeAt(selectorIndex));
          if (possibleAction) {
            action = possibleAction;
            if (selector.charCodeAt(selectorIndex + 1) !== 61) throw new Error("Expected `=`");
            stripWhitespace(2);
          } else if (selector.charCodeAt(selectorIndex) === 61) {
            action = types_1.AttributeAction.Equals;
            stripWhitespace(1);
          }
          var value = "";
          var ignoreCase = null;
          if (action !== "exists") {
            if (isQuote(selector.charCodeAt(selectorIndex))) {
              var quote = selector.charCodeAt(selectorIndex);
              var sectionEnd = selectorIndex + 1;
              while (sectionEnd < selector.length && (selector.charCodeAt(sectionEnd) !== quote || isEscaped(sectionEnd))) sectionEnd += 1;
              if (selector.charCodeAt(sectionEnd) !== quote) throw new Error("Attribute value didn't end");
              value = unescapeCSS(selector.slice(selectorIndex + 1, sectionEnd));
              selectorIndex = sectionEnd + 1;
            } else {
              var valueStart = selectorIndex;
              while (selectorIndex < selector.length && (!isWhitespace(selector.charCodeAt(selectorIndex)) && selector.charCodeAt(selectorIndex) !== 93 || isEscaped(selectorIndex))) selectorIndex += 1;
              value = unescapeCSS(selector.slice(valueStart, selectorIndex));
            }
            stripWhitespace(0);
            var forceIgnore = selector.charCodeAt(selectorIndex) | 32;
            if (forceIgnore === 115) {
              ignoreCase = false;
              stripWhitespace(1);
            } else if (forceIgnore === 105) {
              ignoreCase = true;
              stripWhitespace(1);
            }
          }
          if (selector.charCodeAt(selectorIndex) !== 93) throw new Error("Attribute selector didn't terminate");
          selectorIndex += 1;
          var attributeSelector = {
            type: types_1.SelectorType.Attribute,
            name: name_1,
            action,
            value,
            namespace,
            ignoreCase
          };
          tokens.push(attributeSelector);
          break;
        case 58:
          if (selector.charCodeAt(selectorIndex + 1) === 58) {
            tokens.push({
              type: types_1.SelectorType.PseudoElement,
              name: getName2(2).toLowerCase(),
              data: selector.charCodeAt(selectorIndex) === 40 ? readValueWithParenthesis() : null
            });
            continue;
          }
          var name_2 = getName2(1).toLowerCase();
          var data = null;
          if (selector.charCodeAt(selectorIndex) === 40) {
            if (unpackPseudos.has(name_2)) {
              if (isQuote(selector.charCodeAt(selectorIndex + 1))) throw new Error("Pseudo-selector ".concat(name_2, " cannot be quoted"));
              data = [];
              selectorIndex = parseSelector(data, selector, selectorIndex + 1);
              if (selector.charCodeAt(selectorIndex) !== 41) throw new Error("Missing closing parenthesis in :".concat(name_2, " (").concat(selector, ")"));
              selectorIndex += 1;
            } else {
              data = readValueWithParenthesis();
              if (stripQuotesFromPseudos.has(name_2)) {
                var quot = data.charCodeAt(0);
                if (quot === data.charCodeAt(data.length - 1) && isQuote(quot)) data = data.slice(1, -1);
              }
              data = unescapeCSS(data);
            }
          }
          tokens.push({
            type: types_1.SelectorType.Pseudo,
            name: name_2,
            data
          });
          break;
        case 44:
          finalizeSubselector();
          tokens = [];
          stripWhitespace(1);
          break;
        default:
          if (selector.startsWith("/*", selectorIndex)) {
            var endIndex = selector.indexOf("*/", selectorIndex + 2);
            if (endIndex < 0) throw new Error("Comment was not terminated");
            selectorIndex = endIndex + 2;
            if (tokens.length === 0) stripWhitespace(0);
            break;
          }
          var namespace = null;
          var name_3 = void 0;
          if (firstChar === 42) {
            selectorIndex += 1;
            name_3 = "*";
          } else if (firstChar === 124) {
            name_3 = "";
            if (selector.charCodeAt(selectorIndex + 1) === 124) {
              addTraversal(types_1.SelectorType.ColumnCombinator);
              stripWhitespace(2);
              break;
            }
          } else if (reName.test(selector.slice(selectorIndex))) name_3 = getName2(0);
          else break loop;
          if (selector.charCodeAt(selectorIndex) === 124 && selector.charCodeAt(selectorIndex + 1) !== 124) {
            namespace = name_3;
            if (selector.charCodeAt(selectorIndex + 1) === 42) {
              name_3 = "*";
              selectorIndex += 2;
            } else name_3 = getName2(1);
          }
          tokens.push(name_3 === "*" ? {
            type: types_1.SelectorType.Universal,
            namespace
          } : {
            type: types_1.SelectorType.Tag,
            name: name_3,
            namespace
          });
      }
    }
    finalizeSubselector();
    return selectorIndex;
  }
  __name(parseSelector, "parseSelector");
  __name2(parseSelector, "parseSelector");
}));
var require_stringify = /* @__PURE__ */ __commonJSMin(((exports) => {
  var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
    if (pack || arguments.length === 2) {
      for (var i = 0, l = from.length, ar; i < l; i++) if (ar || !(i in from)) {
        if (!ar) ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.stringify = void 0;
  var types_1 = require_types();
  var attribValChars = ["\\", '"'];
  var pseudoValChars = __spreadArray(__spreadArray([], attribValChars, true), ["(", ")"], false);
  var charsToEscapeInAttributeValue = new Set(attribValChars.map(function(c) {
    return c.charCodeAt(0);
  }));
  var charsToEscapeInPseudoValue = new Set(pseudoValChars.map(function(c) {
    return c.charCodeAt(0);
  }));
  var charsToEscapeInName = new Set(__spreadArray(__spreadArray([], pseudoValChars, true), [
    "~",
    "^",
    "$",
    "*",
    "+",
    "!",
    "|",
    ":",
    "[",
    "]",
    " ",
    "."
  ], false).map(function(c) {
    return c.charCodeAt(0);
  }));
  function stringify(selector) {
    return selector.map(function(token) {
      return token.map(stringifyToken).join("");
    }).join(", ");
  }
  __name(stringify, "stringify");
  __name2(stringify, "stringify");
  exports.stringify = stringify;
  function stringifyToken(token, index, arr) {
    switch (token.type) {
      case types_1.SelectorType.Child:
        return index === 0 ? "> " : " > ";
      case types_1.SelectorType.Parent:
        return index === 0 ? "< " : " < ";
      case types_1.SelectorType.Sibling:
        return index === 0 ? "~ " : " ~ ";
      case types_1.SelectorType.Adjacent:
        return index === 0 ? "+ " : " + ";
      case types_1.SelectorType.Descendant:
        return " ";
      case types_1.SelectorType.ColumnCombinator:
        return index === 0 ? "|| " : " || ";
      case types_1.SelectorType.Universal:
        return token.namespace === "*" && index + 1 < arr.length && "name" in arr[index + 1] ? "" : "".concat(getNamespace(token.namespace), "*");
      case types_1.SelectorType.Tag:
        return getNamespacedName(token);
      case types_1.SelectorType.PseudoElement:
        return "::".concat(escapeName(token.name, charsToEscapeInName)).concat(token.data === null ? "" : "(".concat(escapeName(token.data, charsToEscapeInPseudoValue), ")"));
      case types_1.SelectorType.Pseudo:
        return ":".concat(escapeName(token.name, charsToEscapeInName)).concat(token.data === null ? "" : "(".concat(typeof token.data === "string" ? escapeName(token.data, charsToEscapeInPseudoValue) : stringify(token.data), ")"));
      case types_1.SelectorType.Attribute:
        if (token.name === "id" && token.action === types_1.AttributeAction.Equals && token.ignoreCase === "quirks" && !token.namespace) return "#".concat(escapeName(token.value, charsToEscapeInName));
        if (token.name === "class" && token.action === types_1.AttributeAction.Element && token.ignoreCase === "quirks" && !token.namespace) return ".".concat(escapeName(token.value, charsToEscapeInName));
        var name_1 = getNamespacedName(token);
        if (token.action === types_1.AttributeAction.Exists) return "[".concat(name_1, "]");
        return "[".concat(name_1).concat(getActionValue(token.action), '="').concat(escapeName(token.value, charsToEscapeInAttributeValue), '"').concat(token.ignoreCase === null ? "" : token.ignoreCase ? " i" : " s", "]");
    }
  }
  __name(stringifyToken, "stringifyToken");
  __name2(stringifyToken, "stringifyToken");
  function getActionValue(action) {
    switch (action) {
      case types_1.AttributeAction.Equals:
        return "";
      case types_1.AttributeAction.Element:
        return "~";
      case types_1.AttributeAction.Start:
        return "^";
      case types_1.AttributeAction.End:
        return "$";
      case types_1.AttributeAction.Any:
        return "*";
      case types_1.AttributeAction.Not:
        return "!";
      case types_1.AttributeAction.Hyphen:
        return "|";
      case types_1.AttributeAction.Exists:
        throw new Error("Shouldn't be here");
    }
  }
  __name(getActionValue, "getActionValue");
  __name2(getActionValue, "getActionValue");
  function getNamespacedName(token) {
    return "".concat(getNamespace(token.namespace)).concat(escapeName(token.name, charsToEscapeInName));
  }
  __name(getNamespacedName, "getNamespacedName");
  __name2(getNamespacedName, "getNamespacedName");
  function getNamespace(namespace) {
    return namespace !== null ? "".concat(namespace === "*" ? "*" : escapeName(namespace, charsToEscapeInName), "|") : "";
  }
  __name(getNamespace, "getNamespace");
  __name2(getNamespace, "getNamespace");
  function escapeName(str, charsToEscape) {
    var lastIdx = 0;
    var ret = "";
    for (var i = 0; i < str.length; i++) if (charsToEscape.has(str.charCodeAt(i))) {
      ret += "".concat(str.slice(lastIdx, i), "\\").concat(str.charAt(i));
      lastIdx = i + 1;
    }
    return ret.length > 0 ? ret + str.slice(lastIdx) : str;
  }
  __name(escapeName, "escapeName");
  __name2(escapeName, "escapeName");
}));
var require_commonjs = /* @__PURE__ */ __commonJSMin(((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
      enumerable: true,
      get: /* @__PURE__ */ __name2(function() {
        return m[k];
      }, "get")
    };
    Object.defineProperty(o, k2, desc);
  }) : (function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    o[k2] = m[k];
  }));
  var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.stringify = exports.parse = exports.isTraversal = void 0;
  __exportStar(require_types(), exports);
  var parse_1 = require_parse();
  Object.defineProperty(exports, "isTraversal", {
    enumerable: true,
    get: /* @__PURE__ */ __name2(function() {
      return parse_1.isTraversal;
    }, "get")
  });
  Object.defineProperty(exports, "parse", {
    enumerable: true,
    get: /* @__PURE__ */ __name2(function() {
      return parse_1.parse;
    }, "get")
  });
  var stringify_1 = require_stringify();
  Object.defineProperty(exports, "stringify", {
    enumerable: true,
    get: /* @__PURE__ */ __name2(function() {
      return stringify_1.stringify;
    }, "get")
  });
}));
var import_boolbase = /* @__PURE__ */ __toESM(require_boolbase(), 1);
var import_commonjs = require_commonjs();
var procedure = /* @__PURE__ */ new Map([
  [import_commonjs.SelectorType.Universal, 50],
  [import_commonjs.SelectorType.Tag, 30],
  [import_commonjs.SelectorType.Attribute, 1],
  [import_commonjs.SelectorType.Pseudo, 0]
]);
function isTraversal(token) {
  return !procedure.has(token.type);
}
__name(isTraversal, "isTraversal");
__name2(isTraversal, "isTraversal");
var attributes = /* @__PURE__ */ new Map([
  [import_commonjs.AttributeAction.Exists, 10],
  [import_commonjs.AttributeAction.Equals, 8],
  [import_commonjs.AttributeAction.Not, 7],
  [import_commonjs.AttributeAction.Start, 6],
  [import_commonjs.AttributeAction.End, 6],
  [import_commonjs.AttributeAction.Any, 5]
]);
function sortByProcedure(arr) {
  const procs = arr.map(getProcedure);
  for (let i = 1; i < arr.length; i++) {
    const procNew = procs[i];
    if (procNew < 0) continue;
    for (let j = i - 1; j >= 0 && procNew < procs[j]; j--) {
      const token = arr[j + 1];
      arr[j + 1] = arr[j];
      arr[j] = token;
      procs[j + 1] = procs[j];
      procs[j] = procNew;
    }
  }
}
__name(sortByProcedure, "sortByProcedure");
__name2(sortByProcedure, "sortByProcedure");
function getProcedure(token) {
  var _a, _b;
  let proc = (_a = procedure.get(token.type)) !== null && _a !== void 0 ? _a : -1;
  if (token.type === import_commonjs.SelectorType.Attribute) {
    proc = (_b = attributes.get(token.action)) !== null && _b !== void 0 ? _b : 4;
    if (token.action === import_commonjs.AttributeAction.Equals && token.name === "id") proc = 9;
    if (token.ignoreCase) proc >>= 1;
  } else if (token.type === import_commonjs.SelectorType.Pseudo) {
    if (!token.data) proc = 3;
    else if (token.name === "has" || token.name === "contains") proc = 0;
    else if (Array.isArray(token.data)) {
      proc = Math.min(...token.data.map((d) => Math.min(...d.map(getProcedure))));
      if (proc < 0) proc = 0;
    } else proc = 2;
  }
  return proc;
}
__name(getProcedure, "getProcedure");
__name2(getProcedure, "getProcedure");
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
function escapeRegex(value) {
  return value.replace(reChars, "\\$&");
}
__name(escapeRegex, "escapeRegex");
__name2(escapeRegex, "escapeRegex");
var caseInsensitiveAttributes = /* @__PURE__ */ new Set([
  "accept",
  "accept-charset",
  "align",
  "alink",
  "axis",
  "bgcolor",
  "charset",
  "checked",
  "clear",
  "codetype",
  "color",
  "compact",
  "declare",
  "defer",
  "dir",
  "direction",
  "disabled",
  "enctype",
  "face",
  "frame",
  "hreflang",
  "http-equiv",
  "lang",
  "language",
  "link",
  "media",
  "method",
  "multiple",
  "nohref",
  "noresize",
  "noshade",
  "nowrap",
  "readonly",
  "rel",
  "rev",
  "rules",
  "scope",
  "scrolling",
  "selected",
  "shape",
  "target",
  "text",
  "type",
  "valign",
  "valuetype",
  "vlink"
]);
function shouldIgnoreCase(selector, options) {
  return typeof selector.ignoreCase === "boolean" ? selector.ignoreCase : selector.ignoreCase === "quirks" ? !!options.quirksMode : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
}
__name(shouldIgnoreCase, "shouldIgnoreCase");
__name2(shouldIgnoreCase, "shouldIgnoreCase");
var attributeRules = {
  equals(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && attr.length === value.length && attr.toLowerCase() === value && next(elem);
      };
    }
    return (elem) => adapter.getAttributeValue(elem, name) === value && next(elem);
  },
  hyphen(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const len = value.length;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hyphenIC(elem) {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len).toLowerCase() === value && next(elem);
      }, "hyphenIC"), "hyphenIC");
    }
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function hyphen(elem) {
      const attr = adapter.getAttributeValue(elem, name);
      return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len) === value && next(elem);
    }, "hyphen"), "hyphen");
  },
  element(next, data, options) {
    const { adapter } = options;
    const { name, value } = data;
    if (/\s/.test(value)) return import_boolbase.default.falseFunc;
    const regex = new RegExp(`(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`, shouldIgnoreCase(data, options) ? "i" : "");
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function element(elem) {
      const attr = adapter.getAttributeValue(elem, name);
      return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
    }, "element"), "element");
  },
  exists(next, { name }, { adapter }) {
    return (elem) => adapter.hasAttrib(elem, name) && next(elem);
  },
  start(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const len = value.length;
    if (len === 0) return import_boolbase.default.falseFunc;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && attr.length >= len && attr.substr(0, len).toLowerCase() === value && next(elem);
      };
    }
    return (elem) => {
      var _a;
      return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.startsWith(value)) && next(elem);
    };
  },
  end(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const len = -value.length;
    if (len === 0) return import_boolbase.default.falseFunc;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => {
        var _a;
        return ((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.substr(len).toLowerCase()) === value && next(elem);
      };
    }
    return (elem) => {
      var _a;
      return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.endsWith(value)) && next(elem);
    };
  },
  any(next, data, options) {
    const { adapter } = options;
    const { name, value } = data;
    if (value === "") return import_boolbase.default.falseFunc;
    if (shouldIgnoreCase(data, options)) {
      const regex = new RegExp(escapeRegex(value), "i");
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function anyIC(elem) {
        const attr = adapter.getAttributeValue(elem, name);
        return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
      }, "anyIC"), "anyIC");
    }
    return (elem) => {
      var _a;
      return !!((_a = adapter.getAttributeValue(elem, name)) === null || _a === void 0 ? void 0 : _a.includes(value)) && next(elem);
    };
  },
  not(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    if (value === "") return (elem) => !!adapter.getAttributeValue(elem, name) && next(elem);
    else if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (elem) => {
        const attr = adapter.getAttributeValue(elem, name);
        return (attr == null || attr.length !== value.length || attr.toLowerCase() !== value) && next(elem);
      };
    }
    return (elem) => adapter.getAttributeValue(elem, name) !== value && next(elem);
  }
};
var whitespace = /* @__PURE__ */ new Set([
  9,
  10,
  12,
  13,
  32
]);
var ZERO = "0".charCodeAt(0);
var NINE = "9".charCodeAt(0);
function parse$4(formula) {
  formula = formula.trim().toLowerCase();
  if (formula === "even") return [2, 0];
  else if (formula === "odd") return [2, 1];
  let idx = 0;
  let a = 0;
  let sign = readSign();
  let number = readNumber();
  if (idx < formula.length && formula.charAt(idx) === "n") {
    idx++;
    a = sign * (number !== null && number !== void 0 ? number : 1);
    skipWhitespace();
    if (idx < formula.length) {
      sign = readSign();
      skipWhitespace();
      number = readNumber();
    } else sign = number = 0;
  }
  if (number === null || idx < formula.length) throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
  return [a, sign * number];
  function readSign() {
    if (formula.charAt(idx) === "-") {
      idx++;
      return -1;
    }
    if (formula.charAt(idx) === "+") idx++;
    return 1;
  }
  __name(readSign, "readSign");
  __name2(readSign, "readSign");
  function readNumber() {
    const start = idx;
    let value = 0;
    while (idx < formula.length && formula.charCodeAt(idx) >= ZERO && formula.charCodeAt(idx) <= NINE) {
      value = value * 10 + (formula.charCodeAt(idx) - ZERO);
      idx++;
    }
    return idx === start ? null : value;
  }
  __name(readNumber, "readNumber");
  __name2(readNumber, "readNumber");
  function skipWhitespace() {
    while (idx < formula.length && whitespace.has(formula.charCodeAt(idx))) idx++;
  }
  __name(skipWhitespace, "skipWhitespace");
  __name2(skipWhitespace, "skipWhitespace");
}
__name(parse$4, "parse$4");
__name2(parse$4, "parse$4");
function compile$2(parsed) {
  const a = parsed[0];
  const b = parsed[1] - 1;
  if (b < 0 && a <= 0) return import_boolbase.default.falseFunc;
  if (a === -1) return (index) => index <= b;
  if (a === 0) return (index) => index === b;
  if (a === 1) return b < 0 ? import_boolbase.default.trueFunc : (index) => index >= b;
  const absA = Math.abs(a);
  const bMod = (b % absA + absA) % absA;
  return a > 1 ? (index) => index >= b && index % absA === bMod : (index) => index <= b && index % absA === bMod;
}
__name(compile$2, "compile$2");
__name2(compile$2, "compile$2");
function nthCheck(formula) {
  return compile$2(parse$4(formula));
}
__name(nthCheck, "nthCheck");
__name2(nthCheck, "nthCheck");
function getChildFunc(next, adapter) {
  return (elem) => {
    const parent = adapter.getParent(elem);
    return parent != null && adapter.isTag(parent) && next(elem);
  };
}
__name(getChildFunc, "getChildFunc");
__name2(getChildFunc, "getChildFunc");
var filters = {
  contains(next, text, { adapter }) {
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function contains(elem) {
      return next(elem) && adapter.getText(elem).includes(text);
    }, "contains"), "contains");
  },
  icontains(next, text, { adapter }) {
    const itext = text.toLowerCase();
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function icontains(elem) {
      return next(elem) && adapter.getText(elem).toLowerCase().includes(itext);
    }, "icontains"), "icontains");
  },
  "nth-child"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
    if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function nthChild(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = 0; i < siblings.length; i++) {
        if (equals(elem, siblings[i])) break;
        if (adapter.isTag(siblings[i])) pos++;
      }
      return func(pos) && next(elem);
    }, "nthChild"), "nthChild");
  },
  "nth-last-child"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
    if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function nthLastChild(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = siblings.length - 1; i >= 0; i--) {
        if (equals(elem, siblings[i])) break;
        if (adapter.isTag(siblings[i])) pos++;
      }
      return func(pos) && next(elem);
    }, "nthLastChild"), "nthLastChild");
  },
  "nth-of-type"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
    if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function nthOfType(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = 0; i < siblings.length; i++) {
        const currentSibling = siblings[i];
        if (equals(elem, currentSibling)) break;
        if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) pos++;
      }
      return func(pos) && next(elem);
    }, "nthOfType"), "nthOfType");
  },
  "nth-last-of-type"(next, rule, { adapter, equals }) {
    const func = nthCheck(rule);
    if (func === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
    if (func === import_boolbase.default.trueFunc) return getChildFunc(next, adapter);
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function nthLastOfType(elem) {
      const siblings = adapter.getSiblings(elem);
      let pos = 0;
      for (let i = siblings.length - 1; i >= 0; i--) {
        const currentSibling = siblings[i];
        if (equals(elem, currentSibling)) break;
        if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === adapter.getName(elem)) pos++;
      }
      return func(pos) && next(elem);
    }, "nthLastOfType"), "nthLastOfType");
  },
  root(next, _rule, { adapter }) {
    return (elem) => {
      const parent = adapter.getParent(elem);
      return (parent == null || !adapter.isTag(parent)) && next(elem);
    };
  },
  scope(next, rule, options, context2) {
    const { equals } = options;
    if (!context2 || context2.length === 0) return filters["root"](next, rule, options);
    if (context2.length === 1) return (elem) => equals(context2[0], elem) && next(elem);
    return (elem) => context2.includes(elem) && next(elem);
  },
  hover: dynamicStatePseudo("isHovered"),
  visited: dynamicStatePseudo("isVisited"),
  active: dynamicStatePseudo("isActive")
};
function dynamicStatePseudo(name) {
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function dynamicPseudo(next, _rule, { adapter }) {
    const func = adapter[name];
    if (typeof func !== "function") return import_boolbase.default.falseFunc;
    return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function active(elem) {
      return func(elem) && next(elem);
    }, "active"), "active");
  }, "dynamicPseudo"), "dynamicPseudo");
}
__name(dynamicStatePseudo, "dynamicStatePseudo");
__name2(dynamicStatePseudo, "dynamicStatePseudo");
var pseudos = {
  empty(elem, { adapter }) {
    return !adapter.getChildren(elem).some((elem2) => adapter.isTag(elem2) || adapter.getText(elem2) !== "");
  },
  "first-child"(elem, { adapter, equals }) {
    if (adapter.prevElementSibling) return adapter.prevElementSibling(elem) == null;
    const firstChild = adapter.getSiblings(elem).find((elem2) => adapter.isTag(elem2));
    return firstChild != null && equals(elem, firstChild);
  },
  "last-child"(elem, { adapter, equals }) {
    const siblings = adapter.getSiblings(elem);
    for (let i = siblings.length - 1; i >= 0; i--) {
      if (equals(elem, siblings[i])) return true;
      if (adapter.isTag(siblings[i])) break;
    }
    return false;
  },
  "first-of-type"(elem, { adapter, equals }) {
    const siblings = adapter.getSiblings(elem);
    const elemName = adapter.getName(elem);
    for (let i = 0; i < siblings.length; i++) {
      const currentSibling = siblings[i];
      if (equals(elem, currentSibling)) return true;
      if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) break;
    }
    return false;
  },
  "last-of-type"(elem, { adapter, equals }) {
    const siblings = adapter.getSiblings(elem);
    const elemName = adapter.getName(elem);
    for (let i = siblings.length - 1; i >= 0; i--) {
      const currentSibling = siblings[i];
      if (equals(elem, currentSibling)) return true;
      if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elemName) break;
    }
    return false;
  },
  "only-of-type"(elem, { adapter, equals }) {
    const elemName = adapter.getName(elem);
    return adapter.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter.isTag(sibling) || adapter.getName(sibling) !== elemName);
  },
  "only-child"(elem, { adapter, equals }) {
    return adapter.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter.isTag(sibling));
  }
};
function verifyPseudoArgs(func, name, subselect, argIndex) {
  if (subselect === null) {
    if (func.length > argIndex) throw new Error(`Pseudo-class :${name} requires an argument`);
  } else if (func.length === argIndex) throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
}
__name(verifyPseudoArgs, "verifyPseudoArgs");
__name2(verifyPseudoArgs, "verifyPseudoArgs");
var aliases = {
  "any-link": ":is(a, area, link)[href]",
  link: ":any-link:not(:visited)",
  disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
  enabled: ":not(:disabled)",
  checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",
  required: ":is(input, select, textarea)[required]",
  optional: ":is(input, select, textarea):not([required])",
  selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
  checkbox: "[type=checkbox]",
  file: "[type=file]",
  password: "[type=password]",
  radio: "[type=radio]",
  reset: "[type=reset]",
  image: "[type=image]",
  submit: "[type=submit]",
  parent: ":not(:empty)",
  header: ":is(h1, h2, h3, h4, h5, h6)",
  button: ":is(button, input[type=button])",
  input: ":is(input, textarea, select, button)",
  text: "input:is(:not([type!='']), [type=text])"
};
var PLACEHOLDER_ELEMENT = {};
function ensureIsTag(next, adapter) {
  if (next === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
  return (elem) => adapter.isTag(elem) && next(elem);
}
__name(ensureIsTag, "ensureIsTag");
__name2(ensureIsTag, "ensureIsTag");
function getNextSiblings(elem, adapter) {
  const siblings = adapter.getSiblings(elem);
  if (siblings.length <= 1) return [];
  const elemIndex = siblings.indexOf(elem);
  if (elemIndex < 0 || elemIndex === siblings.length - 1) return [];
  return siblings.slice(elemIndex + 1).filter(adapter.isTag);
}
__name(getNextSiblings, "getNextSiblings");
__name2(getNextSiblings, "getNextSiblings");
function copyOptions(options) {
  return {
    xmlMode: !!options.xmlMode,
    lowerCaseAttributeNames: !!options.lowerCaseAttributeNames,
    lowerCaseTags: !!options.lowerCaseTags,
    quirksMode: !!options.quirksMode,
    cacheResults: !!options.cacheResults,
    pseudos: options.pseudos,
    adapter: options.adapter,
    equals: options.equals
  };
}
__name(copyOptions, "copyOptions");
__name2(copyOptions, "copyOptions");
var is$1 = /* @__PURE__ */ __name2((next, token, options, context2, compileToken2) => {
  const func = compileToken2(token, copyOptions(options), context2);
  return func === import_boolbase.default.trueFunc ? next : func === import_boolbase.default.falseFunc ? import_boolbase.default.falseFunc : (elem) => func(elem) && next(elem);
}, "is$1");
var subselects = {
  is: is$1,
  /**
  * `:matches` and `:where` are aliases for `:is`.
  */
  matches: is$1,
  where: is$1,
  not(next, token, options, context2, compileToken2) {
    const func = compileToken2(token, copyOptions(options), context2);
    return func === import_boolbase.default.falseFunc ? next : func === import_boolbase.default.trueFunc ? import_boolbase.default.falseFunc : (elem) => !func(elem) && next(elem);
  },
  has(next, subselect, options, _context, compileToken2) {
    const { adapter } = options;
    const opts = copyOptions(options);
    opts.relativeSelector = true;
    const context2 = subselect.some((s) => s.some(isTraversal)) ? [PLACEHOLDER_ELEMENT] : void 0;
    const compiled = compileToken2(subselect, opts, context2);
    if (compiled === import_boolbase.default.falseFunc) return import_boolbase.default.falseFunc;
    const hasElement = ensureIsTag(compiled, adapter);
    if (context2 && compiled !== import_boolbase.default.trueFunc) {
      const { shouldTestNextSiblings = false } = compiled;
      return (elem) => {
        if (!next(elem)) return false;
        context2[0] = elem;
        const childs = adapter.getChildren(elem);
        const nextElements = shouldTestNextSiblings ? [...childs, ...getNextSiblings(elem, adapter)] : childs;
        return adapter.existsOne(hasElement, nextElements);
      };
    }
    return (elem) => next(elem) && adapter.existsOne(hasElement, adapter.getChildren(elem));
  }
};
function compilePseudoSelector(next, selector, options, context2, compileToken2) {
  var _a;
  const { name, data } = selector;
  if (Array.isArray(data)) {
    if (!(name in subselects)) throw new Error(`Unknown pseudo-class :${name}(${data})`);
    return subselects[name](next, data, options, context2, compileToken2);
  }
  const userPseudo = (_a = options.pseudos) === null || _a === void 0 ? void 0 : _a[name];
  const stringPseudo = typeof userPseudo === "string" ? userPseudo : aliases[name];
  if (typeof stringPseudo === "string") {
    if (data != null) throw new Error(`Pseudo ${name} doesn't have any arguments`);
    const alias = (0, import_commonjs.parse)(stringPseudo);
    return subselects["is"](next, alias, options, context2, compileToken2);
  }
  if (typeof userPseudo === "function") {
    verifyPseudoArgs(userPseudo, name, data, 1);
    return (elem) => userPseudo(elem, data) && next(elem);
  }
  if (name in filters) return filters[name](next, data, options, context2);
  if (name in pseudos) {
    const pseudo = pseudos[name];
    verifyPseudoArgs(pseudo, name, data, 2);
    return (elem) => pseudo(elem, options, data) && next(elem);
  }
  throw new Error(`Unknown pseudo-class :${name}`);
}
__name(compilePseudoSelector, "compilePseudoSelector");
__name2(compilePseudoSelector, "compilePseudoSelector");
function getElementParent(node, adapter) {
  const parent = adapter.getParent(node);
  if (parent && adapter.isTag(parent)) return parent;
  return null;
}
__name(getElementParent, "getElementParent");
__name2(getElementParent, "getElementParent");
function compileGeneralSelector(next, selector, options, context2, compileToken2) {
  const { adapter, equals } = options;
  switch (selector.type) {
    case import_commonjs.SelectorType.PseudoElement:
      throw new Error("Pseudo-elements are not supported by css-select");
    case import_commonjs.SelectorType.ColumnCombinator:
      throw new Error("Column combinators are not yet supported by css-select");
    case import_commonjs.SelectorType.Attribute:
      if (selector.namespace != null) throw new Error("Namespaced attributes are not yet supported by css-select");
      if (!options.xmlMode || options.lowerCaseAttributeNames) selector.name = selector.name.toLowerCase();
      return attributeRules[selector.action](next, selector, options);
    case import_commonjs.SelectorType.Pseudo:
      return compilePseudoSelector(next, selector, options, context2, compileToken2);
    case import_commonjs.SelectorType.Tag: {
      if (selector.namespace != null) throw new Error("Namespaced tag names are not yet supported by css-select");
      let { name } = selector;
      if (!options.xmlMode || options.lowerCaseTags) name = name.toLowerCase();
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function tag(elem) {
        return adapter.getName(elem) === name && next(elem);
      }, "tag"), "tag");
    }
    case import_commonjs.SelectorType.Descendant: {
      if (options.cacheResults === false || typeof WeakSet === "undefined") return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function descendant(elem) {
        let current = elem;
        while (current = getElementParent(current, adapter)) if (next(current)) return true;
        return false;
      }, "descendant"), "descendant");
      const isFalseCache = /* @__PURE__ */ new WeakSet();
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function cachedDescendant(elem) {
        let current = elem;
        while (current = getElementParent(current, adapter)) if (!isFalseCache.has(current)) {
          if (adapter.isTag(current) && next(current)) return true;
          isFalseCache.add(current);
        }
        return false;
      }, "cachedDescendant"), "cachedDescendant");
    }
    case "_flexibleDescendant":
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function flexibleDescendant(elem) {
        let current = elem;
        do
          if (next(current)) return true;
        while (current = getElementParent(current, adapter));
        return false;
      }, "flexibleDescendant"), "flexibleDescendant");
    case import_commonjs.SelectorType.Parent:
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function parent(elem) {
        return adapter.getChildren(elem).some((elem2) => adapter.isTag(elem2) && next(elem2));
      }, "parent"), "parent");
    case import_commonjs.SelectorType.Child:
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function child(elem) {
        const parent = adapter.getParent(elem);
        return parent != null && adapter.isTag(parent) && next(parent);
      }, "child"), "child");
    case import_commonjs.SelectorType.Sibling:
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function sibling(elem) {
        const siblings = adapter.getSiblings(elem);
        for (let i = 0; i < siblings.length; i++) {
          const currentSibling = siblings[i];
          if (equals(elem, currentSibling)) break;
          if (adapter.isTag(currentSibling) && next(currentSibling)) return true;
        }
        return false;
      }, "sibling"), "sibling");
    case import_commonjs.SelectorType.Adjacent:
      if (adapter.prevElementSibling) return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function adjacent(elem) {
        const previous = adapter.prevElementSibling(elem);
        return previous != null && next(previous);
      }, "adjacent"), "adjacent");
      return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function adjacent(elem) {
        const siblings = adapter.getSiblings(elem);
        let lastElement;
        for (let i = 0; i < siblings.length; i++) {
          const currentSibling = siblings[i];
          if (equals(elem, currentSibling)) break;
          if (adapter.isTag(currentSibling)) lastElement = currentSibling;
        }
        return !!lastElement && next(lastElement);
      }, "adjacent"), "adjacent");
    case import_commonjs.SelectorType.Universal:
      if (selector.namespace != null && selector.namespace !== "*") throw new Error("Namespaced universal selectors are not yet supported by css-select");
      return next;
  }
}
__name(compileGeneralSelector, "compileGeneralSelector");
__name2(compileGeneralSelector, "compileGeneralSelector");
function compile$1(selector, options, context2) {
  return ensureIsTag(compileUnsafe(selector, options, context2), options.adapter);
}
__name(compile$1, "compile$1");
__name2(compile$1, "compile$1");
function compileUnsafe(selector, options, context2) {
  return compileToken(typeof selector === "string" ? (0, import_commonjs.parse)(selector) : selector, options, context2);
}
__name(compileUnsafe, "compileUnsafe");
__name2(compileUnsafe, "compileUnsafe");
function includesScopePseudo(t) {
  return t.type === import_commonjs.SelectorType.Pseudo && (t.name === "scope" || Array.isArray(t.data) && t.data.some((data) => data.some(includesScopePseudo)));
}
__name(includesScopePseudo, "includesScopePseudo");
__name2(includesScopePseudo, "includesScopePseudo");
var DESCENDANT_TOKEN = { type: import_commonjs.SelectorType.Descendant };
var FLEXIBLE_DESCENDANT_TOKEN = { type: "_flexibleDescendant" };
var SCOPE_TOKEN = {
  type: import_commonjs.SelectorType.Pseudo,
  name: "scope",
  data: null
};
function absolutize(token, { adapter }, context2) {
  const hasContext = !!(context2 === null || context2 === void 0 ? void 0 : context2.every((e) => {
    const parent = adapter.isTag(e) && adapter.getParent(e);
    return e === PLACEHOLDER_ELEMENT || parent && adapter.isTag(parent);
  }));
  for (const t of token) {
    if (t.length > 0 && isTraversal(t[0]) && t[0].type !== import_commonjs.SelectorType.Descendant) {
    } else if (hasContext && !t.some(includesScopePseudo)) t.unshift(DESCENDANT_TOKEN);
    else continue;
    t.unshift(SCOPE_TOKEN);
  }
}
__name(absolutize, "absolutize");
__name2(absolutize, "absolutize");
function compileToken(token, options, context2) {
  var _a;
  token.forEach(sortByProcedure);
  context2 = (_a = options.context) !== null && _a !== void 0 ? _a : context2;
  const isArrayContext = Array.isArray(context2);
  const finalContext = context2 && (Array.isArray(context2) ? context2 : [context2]);
  if (options.relativeSelector !== false) absolutize(token, options, finalContext);
  else if (token.some((t) => t.length > 0 && isTraversal(t[0]))) throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");
  let shouldTestNextSiblings = false;
  const query = token.map((rules) => {
    if (rules.length >= 2) {
      const [first, second] = rules;
      if (first.type !== import_commonjs.SelectorType.Pseudo || first.name !== "scope") {
      } else if (isArrayContext && second.type === import_commonjs.SelectorType.Descendant) rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
      else if (second.type === import_commonjs.SelectorType.Adjacent || second.type === import_commonjs.SelectorType.Sibling) shouldTestNextSiblings = true;
    }
    return compileRules(rules, options, finalContext);
  }).reduce(reduceRules, import_boolbase.default.falseFunc);
  query.shouldTestNextSiblings = shouldTestNextSiblings;
  return query;
}
__name(compileToken, "compileToken");
__name2(compileToken, "compileToken");
function compileRules(rules, options, context2) {
  var _a;
  return rules.reduce((previous, rule) => previous === import_boolbase.default.falseFunc ? import_boolbase.default.falseFunc : compileGeneralSelector(previous, rule, options, context2, compileToken), (_a = options.rootFunc) !== null && _a !== void 0 ? _a : import_boolbase.default.trueFunc);
}
__name(compileRules, "compileRules");
__name2(compileRules, "compileRules");
function reduceRules(a, b) {
  if (b === import_boolbase.default.falseFunc || a === import_boolbase.default.trueFunc) return a;
  if (a === import_boolbase.default.falseFunc || b === import_boolbase.default.trueFunc) return b;
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function combine(elem) {
    return a(elem) || b(elem);
  }, "combine"), "combine");
}
__name(reduceRules, "reduceRules");
__name2(reduceRules, "reduceRules");
var defaultEquals = /* @__PURE__ */ __name2((a, b) => a === b, "defaultEquals");
var defaultOptions = {
  adapter: esm_exports,
  equals: defaultEquals
};
function convertOptionFormats(options) {
  var _a, _b, _c, _d;
  const opts = options !== null && options !== void 0 ? options : defaultOptions;
  (_a = opts.adapter) !== null && _a !== void 0 || (opts.adapter = esm_exports);
  (_b = opts.equals) !== null && _b !== void 0 || (opts.equals = (_d = (_c = opts.adapter) === null || _c === void 0 ? void 0 : _c.equals) !== null && _d !== void 0 ? _d : defaultEquals);
  return opts;
}
__name(convertOptionFormats, "convertOptionFormats");
__name2(convertOptionFormats, "convertOptionFormats");
function getSelectorFunc(searchFunc) {
  return /* @__PURE__ */ __name2(/* @__PURE__ */ __name(function select(query, elements, options) {
    const opts = convertOptionFormats(options);
    if (typeof query !== "function") query = compileUnsafe(query, opts, elements);
    const filteredElements = prepareContext(elements, opts.adapter, query.shouldTestNextSiblings);
    return searchFunc(query, filteredElements, opts);
  }, "select"), "select");
}
__name(getSelectorFunc, "getSelectorFunc");
__name2(getSelectorFunc, "getSelectorFunc");
function prepareContext(elems, adapter, shouldTestNextSiblings = false) {
  if (shouldTestNextSiblings) elems = appendNextSiblings(elems, adapter);
  return Array.isArray(elems) ? adapter.removeSubsets(elems) : adapter.getChildren(elems);
}
__name(prepareContext, "prepareContext");
__name2(prepareContext, "prepareContext");
function appendNextSiblings(elem, adapter) {
  const elems = Array.isArray(elem) ? elem.slice(0) : [elem];
  const elemsLength = elems.length;
  for (let i = 0; i < elemsLength; i++) {
    const nextSiblings = getNextSiblings(elems[i], adapter);
    elems.push(...nextSiblings);
  }
  return elems;
}
__name(appendNextSiblings, "appendNextSiblings");
__name2(appendNextSiblings, "appendNextSiblings");
var selectAll = getSelectorFunc((query, elems, options) => query === import_boolbase.default.falseFunc || !elems || elems.length === 0 ? [] : options.adapter.findAll(query, elems));
var selectOne = getSelectorFunc((query, elems, options) => query === import_boolbase.default.falseFunc || !elems || elems.length === 0 ? null : options.adapter.findOne(query, elems));
function is(elem, query, options) {
  const opts = convertOptionFormats(options);
  return (typeof query === "function" ? query : compile$1(query, opts))(elem);
}
__name(is, "is");
__name2(is, "is");
function arr_back(arr) {
  return arr[arr.length - 1];
}
__name(arr_back, "arr_back");
__name2(arr_back, "arr_back");
function isTag(node) {
  return node && node.nodeType === 1;
}
__name(isTag, "isTag");
__name2(isTag, "isTag");
function getAttributeValue(elem, name) {
  return isTag(elem) ? elem.getAttribute(name) : void 0;
}
__name(getAttributeValue, "getAttributeValue");
__name2(getAttributeValue, "getAttributeValue");
function getName(elem) {
  return (elem && elem.rawTagName || "").toLowerCase();
}
__name(getName, "getName");
__name2(getName, "getName");
function getChildren(node) {
  return node && node.childNodes;
}
__name(getChildren, "getChildren");
__name2(getChildren, "getChildren");
function getParent(node) {
  return node ? node.parentNode : null;
}
__name(getParent, "getParent");
__name2(getParent, "getParent");
function getText(node) {
  return node.text;
}
__name(getText, "getText");
__name2(getText, "getText");
function removeSubsets(nodes) {
  let idx = nodes.length;
  let node;
  let ancestor;
  let replace;
  while (--idx > -1) {
    node = ancestor = nodes[idx];
    nodes[idx] = null;
    replace = true;
    while (ancestor) {
      if (nodes.indexOf(ancestor) > -1) {
        replace = false;
        nodes.splice(idx, 1);
        break;
      }
      ancestor = getParent(ancestor);
    }
    if (replace) nodes[idx] = node;
  }
  return nodes;
}
__name(removeSubsets, "removeSubsets");
__name2(removeSubsets, "removeSubsets");
function existsOne(test, elems) {
  return elems.some((elem) => {
    return isTag(elem) ? test(elem) || existsOne(test, getChildren(elem)) : false;
  });
}
__name(existsOne, "existsOne");
__name2(existsOne, "existsOne");
function getSiblings(node) {
  const parent = getParent(node);
  return parent ? getChildren(parent) : [];
}
__name(getSiblings, "getSiblings");
__name2(getSiblings, "getSiblings");
function hasAttrib(elem, name) {
  return getAttributeValue(elem, name) !== void 0;
}
__name(hasAttrib, "hasAttrib");
__name2(hasAttrib, "hasAttrib");
function findOne(test, elems) {
  let elem = null;
  for (let i = 0, l = elems === null || elems === void 0 ? void 0 : elems.length; i < l && !elem; i++) {
    const el = elems[i];
    if (test(el)) elem = el;
    else {
      const childs = getChildren(el);
      if (childs && childs.length > 0) elem = findOne(test, childs);
    }
  }
  return elem;
}
__name(findOne, "findOne");
__name2(findOne, "findOne");
function findAll(test, nodes) {
  let result = [];
  for (let i = 0, j = nodes.length; i < j; i++) {
    const node = nodes[i];
    if (!isTag(node)) continue;
    if (test(node)) result.push(node);
    const childs = getChildren(node);
    if (childs) result = result.concat(findAll(test, childs));
  }
  return result;
}
__name(findAll, "findAll");
__name2(findAll, "findAll");
var matcher = {
  isTag,
  getAttributeValue,
  getName,
  getChildren,
  getParent,
  getText,
  removeSubsets,
  existsOne,
  getSiblings,
  hasAttrib,
  findOne,
  findAll
};
var VoidTag = class {
  static {
    __name(this, "VoidTag");
  }
  static {
    __name2(this, "VoidTag");
  }
  constructor(addClosingSlash = false, tags) {
    this.addClosingSlash = addClosingSlash;
    if (Array.isArray(tags)) this.voidTags = tags.reduce((set, tag) => {
      return set.add(tag.toLowerCase()).add(tag.toUpperCase()).add(tag);
    }, /* @__PURE__ */ new Set());
    else this.voidTags = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr"
    ].reduce((set, tag) => {
      return set.add(tag.toLowerCase()).add(tag.toUpperCase()).add(tag);
    }, /* @__PURE__ */ new Set());
  }
  formatNode(tag, attrs, innerHTML) {
    const addClosingSlash = this.addClosingSlash;
    const closingSpace = addClosingSlash && attrs && !attrs.endsWith(" ") ? " " : "";
    const closingSlash = addClosingSlash ? `${closingSpace}/` : "";
    return this.isVoidElement(tag.toLowerCase()) ? `<${tag}${attrs}${closingSlash}>` : `<${tag}${attrs}>${innerHTML}</${tag}>`;
  }
  isVoidElement(tag) {
    return this.voidTags.has(tag);
  }
};
var TextNode = class TextNode2 extends Node {
  static {
    __name(this, "TextNode2");
  }
  static {
    __name2(this, "TextNode");
  }
  clone() {
    return new TextNode2(this._rawText, null);
  }
  constructor(rawText, parentNode = null, range) {
    super(parentNode, range);
    this.nodeType = 3;
    this.rawTagName = "";
    this._rawText = rawText;
  }
  get rawText() {
    return this._rawText;
  }
  /**
  * Set rawText and invalidate trimmed caches
  */
  set rawText(text) {
    this._rawText = text;
    this._trimmedRawText = void 0;
    this._trimmedText = void 0;
  }
  /**
  * Returns raw text with all whitespace trimmed except single leading/trailing non-breaking space
  */
  get trimmedRawText() {
    if (this._trimmedRawText !== void 0) return this._trimmedRawText;
    this._trimmedRawText = trimText(this.rawText);
    return this._trimmedRawText;
  }
  /**
  * Returns text with all whitespace trimmed except single leading/trailing non-breaking space
  */
  get trimmedText() {
    if (this._trimmedText !== void 0) return this._trimmedText;
    this._trimmedText = trimText(this.text);
    return this._trimmedText;
  }
  /**
  * Get unescaped text value of current node and its children.
  * @return {string} text content
  */
  get text() {
    return decodeHTML(this.rawText);
  }
  /**
  * Detect if the node contains only white space.
  * @return {boolean}
  */
  get isWhitespace() {
    return /^(\s|&nbsp;)*$/.test(this.rawText);
  }
  toString() {
    return this.rawText;
  }
};
function trimText(text) {
  let i = 0;
  let startPos;
  let endPos;
  while (i >= 0 && i < text.length) {
    if (/\S/.test(text[i])) {
      if (startPos === void 0) {
        startPos = i;
        i = text.length;
      } else {
        endPos = i;
        i = void 0;
      }
    }
    if (startPos === void 0) i++;
    else i--;
  }
  if (startPos === void 0) startPos = 0;
  if (endPos === void 0) endPos = text.length - 1;
  const hasLeadingSpace = startPos > 0 && /[^\S\r\n]/.test(text[startPos - 1]);
  const hasTrailingSpace = endPos < text.length - 1 && /[^\S\r\n]/.test(text[endPos + 1]);
  return (hasLeadingSpace ? " " : "") + text.slice(startPos, endPos + 1) + (hasTrailingSpace ? " " : "");
}
__name(trimText, "trimText");
__name2(trimText, "trimText");
function decode(val) {
  return decodeHTML(val);
}
__name(decode, "decode");
__name2(decode, "decode");
var Htags = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup"
];
var Dtags = [
  "details",
  "dialog",
  "dd",
  "div",
  "dt"
];
var Ftags = [
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form"
];
var tableTags = [
  "table",
  "td",
  "tr"
];
var htmlTags = [
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "ul"
];
var kBlockElements = /* @__PURE__ */ new Set();
function addToKBlockElement(...args) {
  const addToSet = /* @__PURE__ */ __name2((array) => {
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      kBlockElements.add(element);
      kBlockElements.add(element.toUpperCase());
    }
  }, "addToSet");
  for (const arg of args) addToSet(arg);
}
__name(addToKBlockElement, "addToKBlockElement");
__name2(addToKBlockElement, "addToKBlockElement");
addToKBlockElement(Htags, Dtags, Ftags, tableTags, htmlTags);
var DOMTokenList = class {
  static {
    __name(this, "DOMTokenList");
  }
  static {
    __name2(this, "DOMTokenList");
  }
  _validate(c) {
    if (/\s/.test(c)) throw new Error(`DOMException in DOMTokenList.add: The token '${c}' contains HTML space characters, which are not valid in tokens.`);
  }
  constructor(valuesInit = [], afterUpdate = () => null) {
    this._set = new Set(valuesInit);
    this._afterUpdate = afterUpdate;
  }
  add(c) {
    this._validate(c);
    this._set.add(c);
    this._afterUpdate(this);
  }
  replace(c1, c2) {
    this._validate(c2);
    this._set.delete(c1);
    this._set.add(c2);
    this._afterUpdate(this);
  }
  remove(c) {
    this._set.delete(c) && this._afterUpdate(this);
  }
  toggle(c) {
    this._validate(c);
    if (this._set.has(c)) this._set.delete(c);
    else this._set.add(c);
    this._afterUpdate(this);
  }
  contains(c) {
    return this._set.has(c);
  }
  get length() {
    return this._set.size;
  }
  values() {
    return this._set.values();
  }
  get value() {
    return Array.from(this._set.values());
  }
  toString() {
    return Array.from(this._set.values()).join(" ");
  }
};
var HTMLElement = class HTMLElement2 extends Node {
  static {
    __name(this, "HTMLElement2");
  }
  static {
    __name2(this, "HTMLElement");
  }
  /**
  * Quote attribute values
  * @param attr attribute value
  * @returns {string} quoted value
  */
  quoteAttribute(attr) {
    if (attr == null) return "null";
    return `"${attr.replace(/"/g, "&quot;")}"`;
  }
  /**
  * Creates an instance of HTMLElement.
  * @param keyAttrs	id and class attribute
  * @param [rawAttrs]	attributes in string
  *
  * @memberof HTMLElement
  */
  constructor(tagName, keyAttrs, rawAttrs = "", parentNode = null, range, voidTag = new VoidTag(), _parseOptions = {}) {
    super(parentNode, range);
    this.rawAttrs = rawAttrs;
    this.voidTag = voidTag;
    this.nodeType = 1;
    this.rawTagName = tagName;
    this.rawAttrs = rawAttrs || "";
    this._id = keyAttrs.id || "";
    this.childNodes = [];
    this._parseOptions = _parseOptions;
    this.classList = new DOMTokenList(keyAttrs.class ? keyAttrs.class.split(/\s+/) : [], (classList) => this.setAttribute("class", classList.toString()));
    if (keyAttrs.id) {
      if (!rawAttrs) this.rawAttrs = `id="${keyAttrs.id}"`;
    }
    if (keyAttrs.class) {
      if (!rawAttrs) {
        const cls = `class="${this.classList.toString()}"`;
        if (this.rawAttrs) this.rawAttrs += ` ${cls}`;
        else this.rawAttrs = cls;
      }
    }
  }
  /**
  * Remove Child element from childNodes array
  * @param {HTMLElement} node     node to remove
  */
  removeChild(node) {
    this.childNodes = this.childNodes.filter((child) => {
      return child !== node;
    });
    return this;
  }
  /**
  * Exchanges given child with new child
  * @param {HTMLElement} oldNode     node to exchange
  * @param {HTMLElement} newNode     new node
  */
  exchangeChild(oldNode, newNode) {
    const children = this.childNodes;
    this.childNodes = children.map((child) => {
      if (child === oldNode) return newNode;
      return child;
    });
    return this;
  }
  get tagName() {
    return this.rawTagName ? this.rawTagName.toUpperCase() : this.rawTagName;
  }
  set tagName(newname) {
    this.rawTagName = newname.toLowerCase();
  }
  get localName() {
    return this.rawTagName.toLowerCase();
  }
  get isVoidElement() {
    return this.voidTag.isVoidElement(this.localName);
  }
  get id() {
    return this._id;
  }
  set id(newid) {
    this.setAttribute("id", newid);
  }
  /**
  * Get escpaed (as-it) text value of current node and its children.
  * @return {string} text content
  */
  get rawText() {
    if (/^br$/i.test(this.rawTagName)) return "\n";
    return this.childNodes.reduce((pre, cur) => {
      return pre += cur.rawText;
    }, "");
  }
  get textContent() {
    return decode(this.rawText);
  }
  set textContent(val) {
    const content = [new TextNode(encode(val), this)];
    this.childNodes = content;
  }
  /**
  * Get unescaped text value of current node and its children.
  * @return {string} text content
  */
  get text() {
    return decode(this.rawText);
  }
  /**
  * Get structured Text (with '\n' etc.)
  * @return {string} structured text
  */
  get structuredText() {
    let currentBlock = [];
    const blocks = [currentBlock];
    function dfs(node) {
      if (node.nodeType === 1) {
        if (kBlockElements.has(node.rawTagName)) {
          if (currentBlock.length > 0) blocks.push(currentBlock = []);
          node.childNodes.forEach(dfs);
          if (currentBlock.length > 0) blocks.push(currentBlock = []);
        } else node.childNodes.forEach(dfs);
      } else if (node.nodeType === 3) {
        if (node.isWhitespace) currentBlock.prependWhitespace = true;
        else {
          let text = node.trimmedText;
          if (currentBlock.prependWhitespace) {
            text = ` ${text}`;
            currentBlock.prependWhitespace = false;
          }
          currentBlock.push(text);
        }
      }
    }
    __name(dfs, "dfs");
    __name2(dfs, "dfs");
    dfs(this);
    return blocks.map((block) => {
      return block.join("").replace(/\s{2,}/g, " ");
    }).join("\n").replace(/\s+$/, "");
  }
  toString() {
    const tag = this.rawTagName;
    if (tag) {
      const attrs = this.rawAttrs ? ` ${this.rawAttrs}` : "";
      return this.voidTag.formatNode(tag, attrs, this.innerHTML);
    }
    return this.innerHTML;
  }
  get innerHTML() {
    return this.childNodes.map((child) => {
      return child.toString();
    }).join("");
  }
  set innerHTML(content) {
    const r = parse$1(content, this._parseOptions);
    const nodes = r.childNodes.length ? r.childNodes : [new TextNode(content, this)];
    resetParent(nodes, this);
    resetParent(this.childNodes, null);
    this.childNodes = nodes;
  }
  set_content(content, options = {}) {
    if (content instanceof Node) content = [content];
    else if (typeof content == "string") {
      options = _objectSpread2(_objectSpread2({}, this._parseOptions), options);
      const r = parse$1(content, options);
      content = r.childNodes.length ? r.childNodes : [new TextNode(r.innerHTML, this)];
    }
    resetParent(this.childNodes, null);
    resetParent(content, this);
    this.childNodes = content;
    return this;
  }
  replaceWith(...nodes) {
    const parent = this.parentNode;
    const content = nodes.map((node) => {
      if (node instanceof Node) return [node];
      else if (typeof node == "string") {
        const r = parse$1(node, this._parseOptions);
        return r.childNodes.length ? r.childNodes : [new TextNode(node, this)];
      }
      return [];
    }).flat();
    const idx = parent.childNodes.findIndex((child) => {
      return child === this;
    });
    resetParent([this], null);
    parent.childNodes = [
      ...parent.childNodes.slice(0, idx),
      ...resetParent(content, parent),
      ...parent.childNodes.slice(idx + 1)
    ];
    return this;
  }
  get outerHTML() {
    return this.toString();
  }
  /**
  * Trim element from right (in block) after seeing pattern in a TextNode.
  * @param  {RegExp} pattern pattern to find
  * @return {HTMLElement}    reference to current node
  */
  trimRight(pattern) {
    for (let i = 0; i < this.childNodes.length; i++) {
      const childNode = this.childNodes[i];
      if (childNode.nodeType === 1) childNode.trimRight(pattern);
      else {
        const index = childNode.rawText.search(pattern);
        if (index > -1) {
          childNode.rawText = childNode.rawText.substr(0, index);
          this.childNodes.length = i + 1;
        }
      }
    }
    return this;
  }
  /**
  * Get DOM structure
  * @return {string} structure
  */
  get structure() {
    const res = [];
    let indention = 0;
    function write(str) {
      res.push("  ".repeat(indention) + str);
    }
    __name(write, "write");
    __name2(write, "write");
    function dfs(node) {
      const idStr = node._id ? `#${node._id}` : "";
      const classStr = node.classList.length ? `.${node.classList.value.join(".")}` : "";
      write(`${node.rawTagName}${idStr}${classStr}`);
      indention++;
      node.childNodes.forEach((childNode) => {
        if (childNode.nodeType === 1) dfs(childNode);
        else if (childNode.nodeType === 3) {
          if (!childNode.isWhitespace) write("#text");
        }
      });
      indention--;
    }
    __name(dfs, "dfs");
    __name2(dfs, "dfs");
    dfs(this);
    return res.join("\n");
  }
  /**
  * Remove whitespaces in this sub tree.
  * @return {HTMLElement} pointer to this
  */
  removeWhitespace() {
    let o = 0;
    this.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        if (node.isWhitespace) return;
        node.rawText = node.trimmedRawText;
      } else if (node.nodeType === 1) node.removeWhitespace();
      this.childNodes[o++] = node;
    });
    this.childNodes.length = o;
    const attrs = Object.keys(this.rawAttributes).map((key) => {
      const val = this.quoteAttribute(this.rawAttributes[key]);
      if (val === "null" || val === '""') return key;
      return `${key}=${val}`;
    }).join(" ");
    this.rawAttrs = attrs;
    delete this._rawAttrs;
    return this;
  }
  /**
  * Query CSS selector to find matching nodes.
  * @param  {string}         selector Simplified CSS selector
  * @return {HTMLElement[]}  matching elements
  */
  querySelectorAll(selector) {
    return selectAll(selector, this, {
      xmlMode: true,
      adapter: matcher
    });
  }
  /**
  * Query CSS Selector to find matching node.
  * @param  {string}         selector Simplified CSS selector
  * @return {(HTMLElement|null)}    matching node
  */
  querySelector(selector) {
    return selectOne(selector, this, {
      xmlMode: true,
      adapter: matcher
    });
  }
  /**
  * Tests whether the node matches a given CSS selector.
  * @param  {string}   selector Simplified CSS selector
  * @return {boolean}
  */
  matches(selector) {
    return is(this, selector, {
      xmlMode: true,
      adapter: matcher
    });
  }
  /**
  * find elements by their tagName
  * @param {string} tagName the tagName of the elements to select
  */
  getElementsByTagName(tagName) {
    const upperCasedTagName = tagName.toUpperCase();
    const re = [];
    const stack = [];
    let currentNodeReference = this;
    let index = 0;
    while (index !== void 0) {
      let child;
      do
        child = currentNodeReference.childNodes[index++];
      while (index < currentNodeReference.childNodes.length && child === void 0);
      if (child === void 0) {
        currentNodeReference = currentNodeReference.parentNode;
        index = stack.pop();
        continue;
      }
      if (child.nodeType === 1) {
        if (tagName === "*" || child.tagName === upperCasedTagName) re.push(child);
        if (child.childNodes.length > 0) {
          stack.push(index);
          currentNodeReference = child;
          index = 0;
        }
      }
    }
    return re;
  }
  /**
  * find element by it's id
  * @param {string} id the id of the element to select
  * @returns {HTMLElement | null} the element with the given id or null if not found
  */
  getElementById(id) {
    const stack = [];
    let currentNodeReference = this;
    let index = 0;
    while (index !== void 0) {
      let child;
      do
        child = currentNodeReference.childNodes[index++];
      while (index < currentNodeReference.childNodes.length && child === void 0);
      if (child === void 0) {
        currentNodeReference = currentNodeReference.parentNode;
        index = stack.pop();
        continue;
      }
      if (child.nodeType === 1) {
        if (child._id === id) return child;
        if (child.childNodes.length > 0) {
          stack.push(index);
          currentNodeReference = child;
          index = 0;
        }
      }
    }
    return null;
  }
  /**
  * traverses the Element and its parents (heading toward the document root) until it finds a node that matches the provided selector string. Will return itself or the matching ancestor. If no such element exists, it returns null.
  * @param selector a DOMString containing a selector list
  * @returns {HTMLElement | null} the element with the given id or null if not found
  */
  closest(selector) {
    const mapChild = /* @__PURE__ */ new Map();
    let el = this;
    let old = null;
    function findOne2(test, elems) {
      let elem = null;
      for (let i = 0, l = elems.length; i < l && !elem; i++) {
        const el2 = elems[i];
        if (test(el2)) elem = el2;
        else {
          const child = mapChild.get(el2);
          if (child) elem = findOne2(test, [child]);
        }
      }
      return elem;
    }
    __name(findOne2, "findOne2");
    __name2(findOne2, "findOne");
    while (el) {
      mapChild.set(el, old);
      old = el;
      el = el.parentNode;
    }
    el = this;
    while (el) {
      const e = selectOne(selector, el, {
        xmlMode: true,
        adapter: _objectSpread2(_objectSpread2({}, matcher), {}, {
          getChildren(node) {
            const child = mapChild.get(node);
            return child && [child];
          },
          getSiblings(node) {
            return [node];
          },
          findOne: findOne2,
          findAll() {
            return [];
          }
        })
      });
      if (e) return e;
      el = el.parentNode;
    }
    return null;
  }
  /**
  * Append a child node to childNodes
  * @param  {Node} node node to append
  * @return {Node}      node appended
  */
  appendChild(node) {
    this.append(node);
    return node;
  }
  /**
  * Get attributes
  * @access private
  * @return {Object} parsed and unescaped attributes
  */
  get attrs() {
    if (this._attrs) return this._attrs;
    this._attrs = {};
    const attrs = this.rawAttributes;
    for (const key in attrs) {
      const val = attrs[key] || "";
      this._attrs[key.toLowerCase()] = decode(val);
    }
    return this._attrs;
  }
  get attributes() {
    const ret_attrs = {};
    const attrs = this.rawAttributes;
    for (const key in attrs) ret_attrs[key] = decode(attrs[key] || "");
    return ret_attrs;
  }
  /**
  * Get escaped (as-is) attributes
  * @return {Object} parsed attributes
  */
  get rawAttributes() {
    if (this._rawAttrs) return this._rawAttrs;
    const attrs = {};
    if (this.rawAttrs) {
      const re = /([_a-zA-Z()[\]#@$.?:][a-zA-Z0-9-._:()[\]#]*)(?:\s*=\s*((?:'[^']*')|(?:"[^"]*")|\S+))?/g;
      let match2;
      while (match2 = re.exec(this.rawAttrs)) {
        const key = match2[1];
        if (key === "__proto__") continue;
        let val = match2[2] || null;
        if (val && (val[0] === `'` || val[0] === `"`)) val = val.slice(1, val.length - 1);
        attrs[key] = attrs[key] || val;
      }
    }
    this._rawAttrs = attrs;
    return attrs;
  }
  removeAttribute(key) {
    const attrs = this.rawAttributes;
    delete attrs[key];
    if (this._attrs) delete this._attrs[key];
    this.rawAttrs = Object.keys(attrs).map((name) => {
      const val = this.quoteAttribute(attrs[name]);
      if (val === "null" || val === '""') return name;
      return `${name}=${val}`;
    }).join(" ");
    if (key === "id") this._id = "";
    return this;
  }
  hasAttribute(key) {
    return key.toLowerCase() in this.attrs;
  }
  /**
  * Get an attribute
  * @return {string | undefined} value of the attribute; or undefined if not exist
  */
  getAttribute(key) {
    return this.attrs[key.toLowerCase()];
  }
  /**
  * Set an attribute value to the HTMLElement
  * @param {string} key The attribute name
  * @param {string} value The value to set, or null / undefined to remove an attribute
  */
  setAttribute(key, value) {
    if (arguments.length < 2) throw new Error("Failed to execute 'setAttribute' on 'Element'");
    const k2 = key.toLowerCase();
    const attrs = this.rawAttributes;
    for (const k in attrs) if (k.toLowerCase() === k2) {
      key = k;
      break;
    }
    attrs[key] = String(value);
    if (this._attrs) this._attrs[k2] = decode(attrs[key]);
    this.rawAttrs = Object.keys(attrs).map((name) => {
      const val = this.quoteAttribute(attrs[name]);
      if (val === "null" || val === '""') return name;
      return `${name}=${val}`;
    }).join(" ");
    if (key === "id") this._id = value;
    return this;
  }
  /**
  * Replace all the attributes of the HTMLElement by the provided attributes
  * @param {Attributes} attributes the new attribute set
  */
  setAttributes(attributes2) {
    if (this._attrs) delete this._attrs;
    if (this._rawAttrs) delete this._rawAttrs;
    this.rawAttrs = Object.keys(attributes2).map((name) => {
      const val = attributes2[name];
      if (val === "null" || val === '""') return name;
      return `${name}=${this.quoteAttribute(String(val))}`;
    }).join(" ");
    if ("id" in attributes2) this._id = attributes2["id"];
    return this;
  }
  insertAdjacentHTML(where, html) {
    if (arguments.length < 2) throw new Error("2 arguments required");
    const p = parse$1(html, this._parseOptions);
    if (where === "afterend") this.after(...p.childNodes);
    else if (where === "afterbegin") this.prepend(...p.childNodes);
    else if (where === "beforeend") this.append(...p.childNodes);
    else if (where === "beforebegin") this.before(...p.childNodes);
    else throw new Error(`The value provided ('${where}') is not one of 'beforebegin', 'afterbegin', 'beforeend', or 'afterend'`);
    return this;
  }
  /** Prepend nodes or strings to this node's children. */
  prepend(...insertable) {
    const nodes = resolveInsertable(insertable);
    resetParent(nodes, this);
    this.childNodes.unshift(...nodes);
  }
  /** Append nodes or strings to this node's children. */
  append(...insertable) {
    const nodes = resolveInsertable(insertable);
    resetParent(nodes, this);
    this.childNodes.push(...nodes);
  }
  /** Insert nodes or strings before this node. */
  before(...insertable) {
    const nodes = resolveInsertable(insertable);
    const siblings = this.parentNode.childNodes;
    resetParent(nodes, this.parentNode);
    siblings.splice(siblings.indexOf(this), 0, ...nodes);
  }
  /** Insert nodes or strings after this node. */
  after(...insertable) {
    const nodes = resolveInsertable(insertable);
    const siblings = this.parentNode.childNodes;
    resetParent(nodes, this.parentNode);
    siblings.splice(siblings.indexOf(this) + 1, 0, ...nodes);
  }
  get nextSibling() {
    if (this.parentNode) {
      const children = this.parentNode.childNodes;
      let i = 0;
      while (i < children.length) {
        const child = children[i++];
        if (this === child) return children[i] || null;
      }
      return null;
    }
  }
  get nextElementSibling() {
    if (this.parentNode) {
      const children = this.parentNode.childNodes;
      let i = 0;
      let find2 = false;
      while (i < children.length) {
        const child = children[i++];
        if (find2) {
          if (child instanceof HTMLElement2) return child || null;
        } else if (this === child) find2 = true;
      }
      return null;
    }
  }
  get previousSibling() {
    if (this.parentNode) {
      const children = this.parentNode.childNodes;
      let i = children.length;
      while (i > 0) {
        const child = children[--i];
        if (this === child) return children[i - 1] || null;
      }
      return null;
    }
  }
  get previousElementSibling() {
    if (this.parentNode) {
      const children = this.parentNode.childNodes;
      let i = children.length;
      let find2 = false;
      while (i > 0) {
        const child = children[--i];
        if (find2) {
          if (child instanceof HTMLElement2) return child || null;
        } else if (this === child) find2 = true;
      }
      return null;
    }
  }
  /** Get all childNodes of type {@link HTMLElement}. */
  get children() {
    const children = [];
    for (const childNode of this.childNodes) if (childNode instanceof HTMLElement2) children.push(childNode);
    return children;
  }
  /**
  * Get the first child node.
  * @return The first child or undefined if none exists.
  */
  get firstChild() {
    return this.childNodes[0];
  }
  /**
  * Get the first child node of type {@link HTMLElement}.
  * @return The first child element or undefined if none exists.
  */
  get firstElementChild() {
    return this.children[0];
  }
  /**
  * Get the last child node.
  * @return The last child or undefined if none exists.
  */
  get lastChild() {
    return arr_back(this.childNodes);
  }
  /**
  * Get the last child node of type {@link HTMLElement}.
  * @return The last child element or undefined if none exists.
  */
  get lastElementChild() {
    return this.children[this.children.length - 1];
  }
  get childElementCount() {
    return this.children.length;
  }
  get classNames() {
    return this.classList.toString();
  }
  /** Clone this Node */
  clone() {
    return parse$1(this.toString(), this._parseOptions).firstChild;
  }
};
var kMarkupPattern = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][-.:0-9_a-zA-Z@\xB7\xC0-\xD6\xD8-\xF6\u00F8-\u03A1\u03A3-\u03D9\u03DB-\u03EF\u03F7-\u03FF\u0400-\u04FF\u0500-\u052F\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E00-\u1E9B\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA78E\uA790-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64-\uAB65\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A\x37F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]*)((?:\s+[^>]*?(?:(?:'[^']*')|(?:"[^"]*"))?)*)\s*(\/?)>/gu;
var kMarkupPatternWithCDATA = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<(\/?)([a-zA-Z][-.:0-9_a-zA-Z@\xB7\xC0-\xD6\xD8-\xF6\u00F8-\u03A1\u03A3-\u03D9\u03DB-\u03EF\u03F7-\u03FF\u0400-\u04FF\u0500-\u052F\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E00-\u1E9B\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA78E\uA790-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64-\uAB65\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A\x37F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]*)((?:\s+[^>]*?(?:(?:'[^']*')|(?:"[^"]*"))?)*)\s*(\/?)>/gu;
var kAttributePattern = /(?:^|\s)(id|class)\s*=\s*((?:'[^']*')|(?:"[^"]*")|\S+)/gi;
var kElementsClosedByOpening = {
  li: {
    li: true,
    LI: true
  },
  LI: {
    li: true,
    LI: true
  },
  p: {
    p: true,
    div: true,
    P: true,
    DIV: true
  },
  P: {
    p: true,
    div: true,
    P: true,
    DIV: true
  },
  b: {
    div: true,
    DIV: true
  },
  B: {
    div: true,
    DIV: true
  },
  td: {
    td: true,
    th: true,
    TD: true,
    TH: true
  },
  TD: {
    td: true,
    th: true,
    TD: true,
    TH: true
  },
  th: {
    td: true,
    th: true,
    TD: true,
    TH: true
  },
  TH: {
    td: true,
    th: true,
    TD: true,
    TH: true
  },
  h1: {
    h1: true,
    H1: true
  },
  H1: {
    h1: true,
    H1: true
  },
  h2: {
    h2: true,
    H2: true
  },
  H2: {
    h2: true,
    H2: true
  },
  h3: {
    h3: true,
    H3: true
  },
  H3: {
    h3: true,
    H3: true
  },
  h4: {
    h4: true,
    H4: true
  },
  H4: {
    h4: true,
    H4: true
  },
  h5: {
    h5: true,
    H5: true
  },
  H5: {
    h5: true,
    H5: true
  },
  h6: {
    h6: true,
    H6: true
  },
  H6: {
    h6: true,
    H6: true
  },
  dt: {
    dt: true,
    dd: true,
    DT: true,
    DD: true
  },
  DT: {
    dt: true,
    dd: true,
    DT: true,
    DD: true
  },
  dd: {
    dt: true,
    dd: true,
    DT: true,
    DD: true
  },
  DD: {
    dt: true,
    dd: true,
    DT: true,
    DD: true
  }
};
var kElementsClosedByClosing = {
  li: {
    ul: true,
    ol: true,
    UL: true,
    OL: true
  },
  LI: {
    ul: true,
    ol: true,
    UL: true,
    OL: true
  },
  a: {
    div: true,
    DIV: true
  },
  A: {
    div: true,
    DIV: true
  },
  b: {
    div: true,
    DIV: true
  },
  B: {
    div: true,
    DIV: true
  },
  i: {
    div: true,
    DIV: true
  },
  I: {
    div: true,
    DIV: true
  },
  p: {
    div: true,
    DIV: true
  },
  P: {
    div: true,
    DIV: true
  },
  td: {
    tr: true,
    table: true,
    TR: true,
    TABLE: true
  },
  TD: {
    tr: true,
    table: true,
    TR: true,
    TABLE: true
  },
  th: {
    tr: true,
    table: true,
    TR: true,
    TABLE: true
  },
  TH: {
    tr: true,
    table: true,
    TR: true,
    TABLE: true
  },
  dt: {
    dl: true,
    body: true,
    html: true,
    DL: true,
    BODY: true,
    HTML: true
  },
  DT: {
    dl: true,
    body: true,
    html: true,
    DL: true,
    BODY: true,
    HTML: true
  },
  dd: {
    dl: true,
    body: true,
    html: true,
    DL: true,
    BODY: true,
    HTML: true
  },
  DD: {
    dl: true,
    body: true,
    html: true,
    DL: true,
    BODY: true,
    HTML: true
  }
};
var kElementsClosedByClosingExcept = { p: {
  a: true,
  audio: true,
  del: true,
  ins: true,
  map: true,
  noscript: true,
  video: true
} };
var frameflag = "documentfragmentcontainer";
function base_parse(data, options = {}) {
  var _options$voidTag, _options$voidTag2;
  const voidTag = new VoidTag(options === null || options === void 0 || (_options$voidTag = options.voidTag) === null || _options$voidTag === void 0 ? void 0 : _options$voidTag.closingSlash, options === null || options === void 0 || (_options$voidTag2 = options.voidTag) === null || _options$voidTag2 === void 0 ? void 0 : _options$voidTag2.tags);
  const hasCDATA = data.includes("<![CDATA[");
  const markupPattern = hasCDATA ? kMarkupPatternWithCDATA : kMarkupPattern;
  const elements = options.blockTextElements || {
    script: true,
    noscript: true,
    style: true,
    pre: true
  };
  const element_names = Object.keys(elements);
  const kBlockTextElements = element_names.map((it) => new RegExp(`^${it}$`, "i"));
  const kIgnoreElements = element_names.filter((it) => Boolean(elements[it])).map((it) => new RegExp(`^${it}$`, "i"));
  function element_should_be_ignore(tag) {
    return kIgnoreElements.some((it) => it.test(tag));
  }
  __name(element_should_be_ignore, "element_should_be_ignore");
  __name2(element_should_be_ignore, "element_should_be_ignore");
  function is_block_text_element(tag) {
    return kBlockTextElements.some((it) => it.test(tag));
  }
  __name(is_block_text_element, "is_block_text_element");
  __name2(is_block_text_element, "is_block_text_element");
  const createRange = /* @__PURE__ */ __name2((startPos, endPos) => [startPos - frameFlagOffset, endPos - frameFlagOffset], "createRange");
  const root = new HTMLElement(null, {}, "", null, [0, data.length], voidTag, options);
  let currentParent = root;
  const stack = [root];
  let lastTextPos = -1;
  let noNestedTagIndex = void 0;
  let match2;
  data = `<${frameflag}>${data}</${frameflag}>`;
  const { lowerCaseTagName, fixNestedATags } = options;
  const dataEndPos = data.length - 28;
  const frameFlagOffset = 27;
  markupPattern.lastIndex = 0;
  while (match2 = markupPattern.exec(data)) {
    let { 0: matchText, 1: leadingSlash, 2: tagName, 3: attributes2, 4: closingSlash } = match2;
    const matchLength = matchText.length;
    const tagStartPos = markupPattern.lastIndex - matchLength;
    const tagEndPos = markupPattern.lastIndex;
    if (lastTextPos > -1) {
      if (lastTextPos + matchLength < tagEndPos) {
        const text = data.substring(lastTextPos, tagStartPos);
        currentParent.appendChild(new TextNode(text, null, createRange(lastTextPos, tagStartPos)));
      }
    }
    lastTextPos = markupPattern.lastIndex;
    if (hasCDATA && matchText.startsWith("<![CDATA[")) {
      currentParent.appendChild(new TextNode(matchText, null, createRange(tagStartPos, tagEndPos)));
      continue;
    }
    if (tagName === frameflag) continue;
    if (matchText[1] === "!") {
      if (options.comment) {
        const text = data.substring(tagStartPos + 4, tagEndPos - 3);
        currentParent.appendChild(new CommentNode(text, null, createRange(tagStartPos, tagEndPos)));
      }
      continue;
    }
    if (lowerCaseTagName) tagName = tagName.toLowerCase();
    if (!leadingSlash) {
      const attrs = {};
      for (let attMatch; attMatch = kAttributePattern.exec(attributes2); ) {
        const { 1: key, 2: val } = attMatch;
        const isQuoted = val[0] === `'` || val[0] === `"`;
        attrs[key.toLowerCase()] = isQuoted ? val.slice(1, val.length - 1) : val;
      }
      const parentTagName = currentParent.rawTagName;
      if (!closingSlash && !options.preserveTagNesting && kElementsClosedByOpening[parentTagName]) {
        if (kElementsClosedByOpening[parentTagName][tagName]) {
          stack.pop();
          currentParent = arr_back(stack);
        }
      }
      if (fixNestedATags && (tagName === "a" || tagName === "A")) {
        if (noNestedTagIndex !== void 0) {
          stack.splice(noNestedTagIndex);
          currentParent = arr_back(stack);
        }
        noNestedTagIndex = stack.length;
      }
      const tagEndPos2 = markupPattern.lastIndex;
      const tagStartPos2 = tagEndPos2 - matchLength;
      currentParent = currentParent.appendChild(new HTMLElement(tagName, attrs, attributes2.slice(1), null, createRange(tagStartPos2, tagEndPos2), voidTag, options));
      stack.push(currentParent);
      if (is_block_text_element(tagName)) {
        const closeMarkup = `</${tagName}>`;
        const closeIndex = lowerCaseTagName ? data.toLocaleLowerCase().indexOf(closeMarkup, markupPattern.lastIndex) : data.indexOf(closeMarkup, markupPattern.lastIndex);
        const textEndPos = closeIndex === -1 ? dataEndPos : closeIndex;
        if (element_should_be_ignore(tagName)) {
          const text = data.substring(tagEndPos2, textEndPos);
          if (text.length > 0 && /\S/.test(text)) currentParent.appendChild(new TextNode(text, null, createRange(tagEndPos2, textEndPos)));
        }
        if (closeIndex === -1) lastTextPos = markupPattern.lastIndex = data.length + 1;
        else {
          lastTextPos = markupPattern.lastIndex = closeIndex + closeMarkup.length;
          leadingSlash = "/";
        }
      }
    }
    if (leadingSlash || closingSlash || voidTag.isVoidElement(tagName)) while (true) {
      if (noNestedTagIndex != null && (tagName === "a" || tagName === "A")) noNestedTagIndex = void 0;
      if (currentParent.rawTagName === tagName) {
        currentParent.range[1] = createRange(-1, Math.max(lastTextPos, tagEndPos))[1];
        stack.pop();
        currentParent = arr_back(stack);
        break;
      } else {
        const parentTagName = currentParent.tagName;
        if (kElementsClosedByClosing[parentTagName]) {
          if (kElementsClosedByClosing[parentTagName][tagName]) {
            stack.pop();
            currentParent = arr_back(stack);
            continue;
          }
        }
        const openTag = currentParent.rawTagName ? currentParent.rawTagName.toLowerCase() : "";
        if (kElementsClosedByClosingExcept[openTag]) {
          const closingTag = tagName.toLowerCase();
          if (stack.length > 1) {
            const possibleContainer = stack[stack.length - 2];
            if (possibleContainer && possibleContainer.rawTagName && possibleContainer.rawTagName.toLowerCase() === closingTag && !kElementsClosedByClosingExcept[openTag][closingTag]) {
              currentParent.range[1] = createRange(-1, Math.max(lastTextPos, tagEndPos))[1];
              stack.pop();
              currentParent = arr_back(stack);
              continue;
            }
          }
        }
        if (options.closeAllByClosing === true) {
          let i;
          for (i = stack.length - 2; i >= 0; i--) if (stack[i].rawTagName === tagName) break;
          if (i >= 0) {
            while (stack.length > i) {
              currentParent.range[1] = createRange(-1, Math.max(lastTextPos, tagEndPos))[1];
              stack.pop();
              currentParent = arr_back(stack);
            }
            continue;
          }
        }
        break;
      }
    }
  }
  return stack;
}
__name(base_parse, "base_parse");
__name2(base_parse, "base_parse");
function parse$1(data, options = {}) {
  const stack = base_parse(data, options);
  const [root] = stack;
  while (stack.length > 1) {
    const last = stack.pop();
    const oneBefore = arr_back(stack);
    if (last.parentNode && last.parentNode.parentNode) {
      if (last.parentNode === oneBefore && last.tagName === oneBefore.tagName) {
        if (options.parseNoneClosedTags !== true) {
          oneBefore.removeChild(last);
          last.childNodes.forEach((child) => {
            oneBefore.parentNode.appendChild(child);
          });
          stack.pop();
        }
      } else if (options.parseNoneClosedTags !== true) {
        oneBefore.removeChild(last);
        last.childNodes.forEach((child) => {
          oneBefore.appendChild(child);
        });
      }
    }
  }
  return root;
}
__name(parse$1, "parse$1");
__name2(parse$1, "parse$1");
function resolveInsertable(insertable) {
  return insertable.map((val) => {
    if (typeof val === "string") return new TextNode(val);
    val.remove();
    return val;
  });
}
__name(resolveInsertable, "resolveInsertable");
__name2(resolveInsertable, "resolveInsertable");
function resetParent(nodes, parent) {
  return nodes.map((node) => {
    node.parentNode = parent;
    return node;
  });
}
__name(resetParent, "resetParent");
__name2(resetParent, "resetParent");
function valid(data, options = {}) {
  const stack = base_parse(data, options);
  return Boolean(stack.length === 1);
}
__name(valid, "valid");
__name2(valid, "valid");
function parse(data, options = {}) {
  return parse$1(data, options);
}
__name(parse, "parse");
__name2(parse, "parse");
parse.parse = parse$1;
parse.HTMLElement = HTMLElement;
parse.CommentNode = CommentNode;
parse.valid = valid;
parse.Node = Node;
parse.TextNode = TextNode;
parse.NodeType = NodeType;
var XMOJ_ORIGIN3 = "https://www.xmoj.tech";
function normaliseText(input) {
  if (!input)
    return "";
  return input.replace(/\s+/g, " ").trim();
}
__name(normaliseText, "normaliseText");
__name2(normaliseText, "normaliseText");
function normalizeAssetUrls(html) {
  if (!html)
    return html;
  return html.replace(/(\s(?:src|href)\s*=\s*)(["'])(\/uploads?\/[^"']*)\2/gi, (_match, prefix, quote, assetPath) => `${prefix}${quote}${XMOJ_ORIGIN3}${assetPath}${quote}`);
}
__name(normalizeAssetUrls, "normalizeAssetUrls");
__name2(normalizeAssetUrls, "normalizeAssetUrls");
function sanitizeHtml(html) {
  return normalizeAssetUrls(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "").replace(/\son\w+\s*=\s*"[^"]*"/gi, "").replace(/\son\w+\s*=\s*'[^']*'/gi, "").replace(/\son\w+\s*=\s*[^\s>]+/gi, "").replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"'));
}
__name(sanitizeHtml, "sanitizeHtml");
__name2(sanitizeHtml, "sanitizeHtml");
function parseInteger(input) {
  const match2 = normaliseText(input).match(/-?\d+/);
  if (!match2)
    return null;
  const value = Number.parseInt(match2[0], 10);
  return Number.isNaN(value) ? null : value;
}
__name(parseInteger, "parseInteger");
__name2(parseInteger, "parseInteger");
function parseBareInteger(input) {
  const text = normaliseText(input);
  if (!/^-?\d+$/.test(text))
    return null;
  const value = Number.parseInt(text, 10);
  return Number.isNaN(value) ? null : value;
}
__name(parseBareInteger, "parseBareInteger");
__name2(parseBareInteger, "parseBareInteger");
var LANGUAGE_PATTERN = /^(G\+\+|GCC|Clang|C\+\+|C|Python3?|PyPy3?|Java|Pascal|JavaScript|Node\.?js|Go|Rust|PHP|Ruby|C#|CSharp)(?![A-Za-z0-9+#])/i;
function matchLanguage(value) {
  return value.match(LANGUAGE_PATTERN)?.[0] ?? null;
}
__name(matchLanguage, "matchLanguage");
__name2(matchLanguage, "matchLanguage");
function parseMemoryKb(value) {
  const match2 = value.match(/^([\d.]+)\s*(KB|MB|GB)$/i);
  if (!match2)
    return null;
  const amount = Number.parseFloat(match2[1]);
  if (Number.isNaN(amount))
    return null;
  switch (match2[2].toUpperCase()) {
    case "MB":
      return amount * 1024;
    case "GB":
      return amount * 1024 * 1024;
    default:
      return amount;
  }
}
__name(parseMemoryKb, "parseMemoryKb");
__name2(parseMemoryKb, "parseMemoryKb");
function parseTimeMs(value) {
  const match2 = value.match(/^([\d.]+)\s*(MS|S)$/i);
  if (!match2)
    return null;
  const amount = Number.parseFloat(match2[1]);
  if (Number.isNaN(amount))
    return null;
  return match2[2].toUpperCase() === "S" ? amount * 1e3 : amount;
}
__name(parseTimeMs, "parseTimeMs");
__name2(parseTimeMs, "parseTimeMs");
function extractProblemId(href) {
  const raw = (href ?? "").trim();
  if (!raw)
    return null;
  if (/[?&]cid=/i.test(raw))
    return null;
  const match2 = raw.match(/[?&]id=(\d+)/);
  if (match2)
    return Number.parseInt(match2[1], 10);
  return parseInteger(raw);
}
__name(extractProblemId, "extractProblemId");
__name2(extractProblemId, "extractProblemId");
var LOGGED_OUT_PROFILE_VALUES = /* @__PURE__ */ new Set(["login", "\u767B\u5F55", "\u767B\u5165", "sign in"]);
function normaliseUsername(profileText) {
  const cleaned = normaliseText(profileText).replace(/\s*(退出|注销|登出|logout)\s*$/i, "").trim();
  if (!cleaned || LOGGED_OUT_PROFILE_VALUES.has(cleaned.toLowerCase()))
    return null;
  return cleaned;
}
__name(normaliseUsername, "normaliseUsername");
__name2(normaliseUsername, "normaliseUsername");
function parseProfile(html) {
  const root = parse(html);
  const profile3 = root.querySelector("#profile");
  const profileText = normaliseText(profile3?.textContent);
  const username = normaliseUsername(profileText);
  return { profileText, loggedIn: username !== null, username };
}
__name(parseProfile, "parseProfile");
__name2(parseProfile, "parseProfile");
var ALREADY_LOGGED_IN_SENTINEL = "<a href=logout.php>Please logout First!</a>";
function isAlreadyLoggedInResponse(html) {
  return html.includes(ALREADY_LOGGED_IN_SENTINEL) || /logout\.php[^>]*>\s*Please logout First!/i.test(html);
}
__name(isAlreadyLoggedInResponse, "isAlreadyLoggedInResponse");
__name2(isAlreadyLoggedInResponse, "isAlreadyLoggedInResponse");
function isLoginGate(html) {
  return html.includes("\u8BF7\u767B\u5F55\u540E\u7EE7\u7EED\u64CD\u4F5C");
}
__name(isLoginGate, "isLoginGate");
__name2(isLoginGate, "isLoginGate");
function parseLoginAlert(html) {
  const match2 = html.match(/alert\(\s*'((?:[^'\\]|\\.)*)'\s*\)/i);
  if (!match2)
    return null;
  return match2[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\").trim();
}
__name(parseLoginAlert, "parseLoginAlert");
__name2(parseLoginAlert, "parseLoginAlert");
function isLoginFailureAlert(message) {
  if (!message)
    return false;
  return /wrong|invalid|incorrect|错误|失败|不存在/i.test(message);
}
__name(isLoginFailureAlert, "isLoginFailureAlert");
__name2(isLoginFailureAlert, "isLoginFailureAlert");
function scoreProblemTable(table3) {
  const rows = table3.querySelectorAll("tbody tr").length > 0 ? table3.querySelectorAll("tbody tr") : table3.querySelectorAll("tr");
  let score = 0;
  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 3)
      continue;
    if (parseInteger(cells[1]?.textContent) !== null)
      score++;
  }
  return score;
}
__name(scoreProblemTable, "scoreProblemTable");
__name2(scoreProblemTable, "scoreProblemTable");
function parseAcceptedCount(row) {
  const link = row.querySelector('a[href*="jresult=4"]');
  if (link) {
    const value = parseInteger(link.textContent);
    if (value !== null)
      return value;
  }
  return null;
}
__name(parseAcceptedCount, "parseAcceptedCount");
__name2(parseAcceptedCount, "parseAcceptedCount");
function parseSubmissionCount(row) {
  const link = row.querySelector('a[href*="jresult=4"]');
  const container = link?.closest("td");
  let cursor = container?.nextElementSibling ?? null;
  while (cursor) {
    const total = cursor.querySelector('a[href*="problem_id"]');
    if (total && !(total.getAttribute("href") ?? "").includes("jresult")) {
      const value = parseInteger(total.textContent);
      if (value !== null)
        return value;
    }
    cursor = cursor.nextElementSibling;
  }
  for (const cell of row.querySelectorAll("td")) {
    const ratio = normaliseText(cell.textContent).match(/(\d+)\s*\/\s*(\d+)/);
    if (ratio)
      return Number.parseInt(ratio[2], 10);
  }
  return null;
}
__name(parseSubmissionCount, "parseSubmissionCount");
__name2(parseSubmissionCount, "parseSubmissionCount");
function parseProblemsetPage(html, requestedPage = 1) {
  const root = parse(html);
  const problems = [];
  const explicit = root.querySelector("#problemset");
  let table3 = explicit;
  if (!table3) {
    const candidates = root.querySelectorAll("table");
    let bestScore = 0;
    for (const candidate of candidates) {
      const score = scoreProblemTable(candidate);
      if (score > bestScore) {
        bestScore = score;
        table3 = candidate;
      }
    }
    if (bestScore === 0)
      table3 = null;
  }
  const bodyRows = table3 ? table3.querySelectorAll("tbody tr") : [];
  const rows = bodyRows.length > 0 ? bodyRows : table3 ? table3.querySelectorAll("tr") : [];
  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    if (cells.length === 0)
      continue;
    const link = row.querySelector('a[href*="problem.php"]');
    let id = extractProblemId(link?.getAttribute("href"));
    if (id === null && cells.length > 1)
      id = parseInteger(cells[1].textContent);
    if (id === null) {
      for (const cell of cells) {
        const candidate = parseInteger(cell.textContent);
        if (candidate !== null) {
          id = candidate;
          break;
        }
      }
    }
    if (id === null)
      continue;
    let title2 = normaliseText(link?.textContent);
    if (!title2 && cells.length > 2)
      title2 = normaliseText(cells[2].textContent);
    if (!title2)
      title2 = `\u9898\u76EE ${id}`;
    title2 = title2.replace(/^\s*\d+\s*[-–—:.]?\s*/, "").trim() || `\u9898\u76EE ${id}`;
    const statusEl = row.querySelector("div.status, .status");
    const statusClasses = statusEl?.classList ? Array.from(statusEl.classList.value) : [];
    const solved = statusClasses.includes("status_y") ? true : statusClasses.includes("status_n") ? false : null;
    const accepted = parseAcceptedCount(row);
    const submissions = parseSubmissionCount(row);
    const acceptanceRate = accepted !== null && submissions !== null && submissions > 0 ? accepted / submissions * 100 : null;
    problems.push({
      id,
      title: title2,
      url: `${XMOJ_ORIGIN3}/problem.php?id=${id}`,
      accepted,
      submissions,
      solved,
      acceptanceRate
    });
  }
  return {
    problems,
    page: requestedPage,
    totalPages: parseTotalPages(root)
  };
}
__name(parseProblemsetPage, "parseProblemsetPage");
__name2(parseProblemsetPage, "parseProblemsetPage");
function parseTotalPages(root) {
  const links = root.querySelectorAll(".pagination a, .pagination li a, ul.pagination a");
  let max = null;
  for (const link of links) {
    const value = parseInteger(link.textContent);
    if (value !== null && (max === null || value > max))
      max = value;
  }
  for (const link of root.querySelectorAll('a[href*="page="]')) {
    const match2 = (link.getAttribute("href") ?? "").match(/[?&]page=(\d+)/);
    if (match2) {
      const value = Number.parseInt(match2[1], 10);
      if (max === null || value > max)
        max = value;
    }
  }
  return max;
}
__name(parseTotalPages, "parseTotalPages");
__name2(parseTotalPages, "parseTotalPages");
var JUDGE_RESULTS = {
  0: { label: "Waiting", verdict: "pending" },
  1: { label: "Pending", verdict: "pending" },
  2: { label: "Compiling", verdict: "pending" },
  4: { label: "Accepted", verdict: "accepted" },
  5: { label: "Presentation Error", verdict: "presentation_error" },
  6: { label: "Wrong Answer", verdict: "wrong_answer" },
  7: { label: "Time Limit Exceeded", verdict: "time_limit" },
  8: { label: "Memory Limit Exceeded", verdict: "memory_limit" },
  9: { label: "Output Limit Exceeded", verdict: "output_limit" },
  10: { label: "Runtime Error", verdict: "runtime_error" },
  11: { label: "Compile Error", verdict: "compile_error" }
};
var VERDICT_LABEL_CODES = [
  [/^正确$|^答案正确$|accepted/i, 4],
  [/^格式错误$|presentation/i, 5],
  [/^答案错误$|^错误$|wrong\s*answer/i, 6],
  [/^时间超限$|time\s*limit/i, 7],
  [/^内存超限$|memory\s*limit/i, 8],
  [/^输出超限$|output\s*limit/i, 9],
  [/^运行错误$|runtime\s*error/i, 10],
  [/^编译错误$|compile\s*error/i, 11],
  [/^等待$|waiting/i, 0],
  [/^等待重判$|rejudge/i, 1],
  [/^编译中$|compiling/i, 2],
  [/^运行|judging|running/i, 3]
];
function verdictCodeFromLabel(label) {
  const text = normaliseText(label);
  if (!text)
    return null;
  for (const [pattern, code] of VERDICT_LABEL_CODES) {
    if (pattern.test(text))
      return code;
  }
  return null;
}
__name(verdictCodeFromLabel, "verdictCodeFromLabel");
__name2(verdictCodeFromLabel, "verdictCodeFromLabel");
function looksLikeVerdict(value) {
  return verdictCodeFromLabel(value) !== null;
}
__name(looksLikeVerdict, "looksLikeVerdict");
__name2(looksLikeVerdict, "looksLikeVerdict");
function inferBareMemoryAndTime(cells, cellText) {
  let anchor = -1;
  for (let i = 0; i < cellText.length; i++) {
    if (/^\d+\s*B$/.test(cellText[i]))
      anchor = i;
  }
  if (anchor >= 3) {
    const memoryCandidate = parseBareInteger(cellText[anchor - 3]);
    const timeCandidate = parseBareInteger(cellText[anchor - 2]);
    const memoryKb = memoryCandidate !== null && memoryCandidate >= 0 && memoryCandidate < 4194304 ? memoryCandidate : null;
    const timeMs = timeCandidate !== null && timeCandidate >= 0 && timeCandidate < 36e5 ? timeCandidate : null;
    if (memoryKb !== null || timeMs !== null)
      return { memoryKb, timeMs };
  }
  const bareIndexes = [];
  for (let i = 0; i < cellText.length; i++) {
    if (parseBareInteger(cellText[i]) !== null)
      bareIndexes.push(i);
  }
  if (bareIndexes.length >= 2) {
    return {
      memoryKb: parseBareInteger(cellText[bareIndexes[bareIndexes.length - 2]]),
      timeMs: parseBareInteger(cellText[bareIndexes[bareIndexes.length - 1]])
    };
  }
  void cells;
  return { memoryKb: null, timeMs: null };
}
__name(inferBareMemoryAndTime, "inferBareMemoryAndTime");
__name2(inferBareMemoryAndTime, "inferBareMemoryAndTime");
function describeVerdictCode(code) {
  if (code === null || !(code in JUDGE_RESULTS)) {
    return { label: "Unknown", verdict: "other" };
  }
  return JUDGE_RESULTS[code];
}
__name(describeVerdictCode, "describeVerdictCode");
__name2(describeVerdictCode, "describeVerdictCode");
function classifyVerdict(classes, verdictText) {
  const classList = classes.map((c) => c.toLowerCase());
  if (classList.includes("status_y"))
    return "accepted";
  if (classList.includes("status_w"))
    return "pending";
  if (classList.includes("status_n"))
    return "wrong_answer";
  const code = verdictCodeFromLabel(verdictText);
  if (code !== null)
    return describeVerdictCode(code).verdict;
  const text = verdictText.toLowerCase();
  if (text.includes("accepted") || text.includes("\u7B54\u6848\u6B63\u786E"))
    return "accepted";
  if (text.includes("pending") || text.includes("waiting") || text.includes("running") || text.includes("compiling") || text.includes("judging") || text.includes("\u7B49\u5F85") || text.includes("\u8BC4\u6D4B\u4E2D") || text.includes("\u7F16\u8BD1\u4E2D")) {
    return "pending";
  }
  if (text.includes("runtime") || text.includes("\u8FD0\u884C\u9519\u8BEF"))
    return "runtime_error";
  if (text.includes("compile") || text.includes("\u7F16\u8BD1\u9519\u8BEF"))
    return "compile_error";
  if (text.includes("time") || text.includes("\u65F6\u95F4\u8D85\u9650"))
    return "time_limit";
  if (text.includes("memory") || text.includes("\u5185\u5B58\u8D85\u9650"))
    return "memory_limit";
  if (text.includes("output") || text.includes("\u8F93\u51FA\u8D85\u9650"))
    return "output_limit";
  if (text.includes("presentation") || text.includes("\u683C\u5F0F\u9519\u8BEF"))
    return "presentation_error";
  if (text.includes("wrong") || text.includes("\u9519\u8BEF") || text.includes("\u8D85\u9650")) {
    return "wrong_answer";
  }
  if (text.trim() === "")
    return "pending";
  return "other";
}
__name(classifyVerdict, "classifyVerdict");
__name2(classifyVerdict, "classifyVerdict");
function verdictCodeFromClasses(classes) {
  for (const token of classes) {
    const match2 = token.match(/^status(\d+)$/i);
    if (match2) {
      const code = Number.parseInt(match2[1], 10);
      if (code in JUDGE_RESULTS)
        return code;
    }
  }
  return null;
}
__name(verdictCodeFromClasses, "verdictCodeFromClasses");
__name2(verdictCodeFromClasses, "verdictCodeFromClasses");
function parseStatusPaging(html) {
  const root = parse(html);
  const paging = { nextTop: null, nextPrevTop: null, prevTop: null };
  for (const anchor of root.querySelectorAll("a")) {
    const label = normaliseText(anchor.textContent);
    const href = anchor.getAttribute("href") ?? "";
    if (!/status\.php/i.test(href))
      continue;
    const top = href.match(/[?&]top=(\d+)/)?.[1];
    const prevtop = href.match(/[?&]prevtop=(\d+)/)?.[1];
    if (label.includes("\u4E0B\u4E00\u9875") || /next/i.test(label)) {
      if (top)
        paging.nextTop = Number.parseInt(top, 10);
      if (prevtop)
        paging.nextPrevTop = Number.parseInt(prevtop, 10);
    } else if (label.includes("\u4E0A\u4E00\u9875") || /prev/i.test(label)) {
      if (top)
        paging.prevTop = Number.parseInt(top, 10);
    }
  }
  return paging;
}
__name(parseStatusPaging, "parseStatusPaging");
__name2(parseStatusPaging, "parseStatusPaging");
function parseStatusPage(html) {
  const root = parse(html);
  const submissions = [];
  const table3 = root.querySelector("#result-tab") ?? root.querySelector("table.table") ?? root.querySelector("table");
  const bodyRows = table3 ? table3.querySelectorAll("tbody tr") : [];
  const rows = bodyRows.length > 0 ? bodyRows : root.querySelectorAll("table tr");
  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    if (cells.length < 4)
      continue;
    const cellText = cells.map((c) => normaliseText(c.textContent));
    let id = extractSubmissionId(row.querySelector('a[href*="showsource.php"], a[href*="reinfo.php"], a[href*="ceinfo.php"]')?.getAttribute("href"));
    if (id === null) {
      for (let i = 0; i < Math.min(cells.length, 3); i++) {
        const candidate = extractSubmissionId(cells[i].querySelector("a")?.getAttribute("href"));
        if (candidate !== null) {
          id = candidate;
          break;
        }
      }
      if (id === null && cells.length > 1)
        id = parseInteger(cellText[1]);
    }
    if (id === null)
      continue;
    const problemLink = row.querySelector('a[href*="problem.php"]');
    let problemTitle = normaliseText(problemLink?.textContent);
    let problemId = extractProblemId(problemLink?.getAttribute("href"));
    if (problemId === null && problemTitle)
      problemId = parseInteger(problemTitle);
    let verdictText = "";
    let verdictClasses = [];
    for (const cell of cells) {
      const detail = cell.querySelector('a[href*="reinfo.php"], a[href*="ceinfo.php"]');
      if (detail) {
        verdictText = normaliseText(detail.textContent) || normaliseText(cell.textContent);
        verdictClasses = cell.classList ? Array.from(cell.classList.value) : [];
        break;
      }
    }
    if (!verdictText) {
      for (const cell of cells) {
        const cls = cell.classList ? Array.from(cell.classList.value) : [];
        if (cls.some((c) => /^status[_0-9]/i.test(c))) {
          verdictClasses = cls;
          verdictText = normaliseText(cell.textContent);
          break;
        }
      }
    }
    if (!verdictText) {
      const known = cellText.find((t) => looksLikeVerdict(t));
      verdictText = known ?? "";
    }
    const verdictCode = verdictCodeFromClasses(verdictClasses);
    const labelCode = verdictCode ?? verdictCodeFromLabel(verdictText);
    const described = describeVerdictCode(labelCode);
    const verdict = labelCode !== null ? described.verdict : classifyVerdict(verdictClasses, verdictText);
    let memoryKb = null;
    let timeMs = null;
    for (const cell of cells) {
      const text = normaliseText(cell.textContent);
      if (memoryKb === null)
        memoryKb = parseMemoryKb(text);
      if (timeMs === null)
        timeMs = parseTimeMs(text);
    }
    if (memoryKb === null || timeMs === null) {
      const bare = inferBareMemoryAndTime(cells, cellText);
      if (memoryKb === null)
        memoryKb = bare.memoryKb;
      if (timeMs === null)
        timeMs = bare.timeMs;
    }
    const language = cellText.map(matchLanguage).find((l) => l !== null) ?? "";
    let codeLength = null;
    const lenMatch = cellText.map((t) => t.match(/^(\d+)\s*B$/i)).find((m) => m !== null);
    if (lenMatch)
      codeLength = Number.parseInt(lenMatch[1], 10);
    let submittedAt = "";
    for (let i = cellText.length - 1; i >= 0; i--) {
      if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(cellText[i])) {
        submittedAt = cellText[i];
        break;
      }
    }
    let userRating = null;
    const stampIndex = cellText.indexOf(submittedAt);
    if (stampIndex !== -1) {
      for (let i = stampIndex + 1; i < cellText.length; i++) {
        const value = cellText[i];
        if (!value)
          continue;
        if (parseInteger(value) !== null)
          continue;
        if (parseMemoryKb(value) !== null || parseTimeMs(value) !== null)
          continue;
        if (matchLanguage(value))
          continue;
        userRating = value;
        break;
      }
    }
    let user = "";
    for (let i = 1; i < cellText.length; i++) {
      const value = cellText[i];
      if (!value)
        continue;
      if (problemTitle && value === problemTitle)
        continue;
      if (verdictText && value === verdictText)
        continue;
      if (userRating && value === userRating)
        continue;
      if (cellText[0] === value)
        continue;
      if (/^\d{4}-\d{2}-\d{2}/.test(value))
        continue;
      if (/^[\d.]+\s*(KB|MB|GB|MS|S|B)$/i.test(value))
        continue;
      if (/^\d+$/.test(value))
        continue;
      if (matchLanguage(value))
        continue;
      if (looksLikeVerdict(value))
        continue;
      if (/^edit$/i.test(value))
        continue;
      user = value;
      break;
    }
    submissions.push({
      id,
      verdict,
      verdictCode: labelCode,
      verdictLabel: described.label,
      verdictText: verdictText || described.label,
      problemId,
      problemTitle: problemTitle || (problemId !== null ? `\u9898\u76EE ${problemId}` : ""),
      problemUrl: problemId !== null ? `${XMOJ_ORIGIN3}/problem.php?id=${problemId}` : null,
      user,
      memoryKb,
      timeMs,
      language,
      codeLength,
      userRating,
      submittedAt
    });
  }
  return {
    submissions,
    paging: parseStatusPaging(html)
  };
}
__name(parseStatusPage, "parseStatusPage");
__name2(parseStatusPage, "parseStatusPage");
function extractSubmissionId(href) {
  const raw = (href ?? "").trim();
  if (!raw)
    return null;
  const match2 = raw.match(/[?&](?:id|sid)=(\d+)/);
  return match2 ? Number.parseInt(match2[1], 10) : null;
}
__name(extractSubmissionId, "extractSubmissionId");
__name2(extractSubmissionId, "extractSubmissionId");
function parseContestRank(html, contestId, oi) {
  const root = parse(html);
  const table3 = root.querySelector("table");
  const title2 = normaliseText(root.querySelector("h2, h3, .title")?.textContent ?? "").replace(/^OI Mode RankList\s*--\s*/, "").trim();
  if (!table3) {
    return { contestId, title: title2, oi, headers: [], rows: [] };
  }
  const trs = table3.querySelectorAll("tr");
  if (trs.length === 0)
    return { contestId, title: title2, oi, headers: [], rows: [] };
  const headerCells = trs[0].querySelectorAll("th, td").map((cell) => normaliseText(cell.textContent ?? ""));
  const problemCount = Math.max(0, headerCells.length - 5);
  const headers = headerCells.slice(5);
  const rows = [];
  for (const tr of trs.slice(1)) {
    const cells = tr.querySelectorAll("th, td");
    if (cells.length < 5)
      continue;
    const text = /* @__PURE__ */ __name2((index) => normaliseText(cells[index]?.textContent ?? ""), "text");
    const rankRaw = text(0);
    const parsedRank = Number.parseInt(rankRaw, 10);
    const rank = Number.isFinite(parsedRank) ? parsedRank : null;
    const rankText = Number.isFinite(parsedRank) ? null : rankRaw || null;
    const solved = Number.parseInt(text(3), 10);
    const score = Number.parseInt(text(4), 10);
    const problemCells = [];
    for (let i = 0; i < problemCount; i++) {
      const cell = cells[5 + i];
      const value = normaliseText(cell?.textContent ?? "");
      const style = cell?.getAttribute("style") ?? "";
      const accepted = /#(00ff00|53ff53)/i.test(style);
      problemCells.push({ text: value, accepted });
    }
    rows.push({
      rank,
      rankText,
      userId: text(1),
      nick: text(2),
      solved: Number.isFinite(solved) ? solved : 0,
      score: Number.isFinite(score) ? score : 0,
      cells: problemCells
    });
  }
  return { contestId, title: title2, oi, headers, rows };
}
__name(parseContestRank, "parseContestRank");
__name2(parseContestRank, "parseContestRank");
var XMOJ_ORIGIN4 = "https://www.xmoj.tech";
async function onRequestGet3({ request }) {
  const input = new URL(request.url).searchParams;
  const rawId = input.get("id") ?? "";
  const oi = input.get("oi") === "true";
  if (!/^\d{1,10}$/.test(rawId) || Number(rawId) < 1) {
    return Response.json({ error: "\u65E0\u6548\u7684\u6BD4\u8D5B\u7F16\u53F7" }, { status: 400 });
  }
  const path = oi ? "contestrank-oi.php" : "contestrank-correct.php";
  const upstreamUrl = new URL(`/${path}`, XMOJ_ORIGIN4);
  upstreamUrl.searchParams.set("cid", rawId);
  try {
    const response2 = await fetch(upstreamUrl, {
      headers: { Accept: "text/html" },
      redirect: "manual",
      signal: request.signal
    });
    if (!response2.ok || !response2.headers.get("content-type")?.includes("text/html")) {
      return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6BD4\u8D5B\u6392\u540D" }, {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return Response.json(parseContestRank(await response2.text(), Number(rawId), oi), {
      headers: { "Cache-Control": "public, max-age=30, s-maxage=60" }
    });
  } catch {
    return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6BD4\u8D5B\u6392\u540D" }, {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
var XMOJ_ORIGIN5 = "https://www.xmoj.tech";
async function getPublicPage(request, path, label) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const upstream = await fetch(new URL(path, XMOJ_ORIGIN5), {
      headers: { Accept: "text/html" },
      redirect: "manual",
      signal: request.signal
    });
    if (!upstream.ok || !upstream.headers.get("content-type")?.includes("text/html")) {
      return Response.json({ error: label }, {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return Response.json({ html: await upstream.text(), serverTime: Date.now() }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return Response.json({ error: label }, {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
__name(getPublicPage, "getPublicPage");
__name2(getPublicPage, "getPublicPage");
function onRequestGet4({ request }) {
  return getPublicPage(request, "/", "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u5C0F\u660E OJ \u9996\u9875");
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
function onRequestGet5({ request }) {
  return getPublicPage(request, "/open_contest.php", "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6708\u8D5B\u4FE1\u606F");
}
__name(onRequestGet5, "onRequestGet5");
__name2(onRequestGet5, "onRequestGet");
function decodeEntities(value) {
  return value.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#0?39;/g, "'").replace(/&apos;/gi, "'").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&");
}
__name(decodeEntities, "decodeEntities");
__name2(decodeEntities, "decodeEntities");
function assembleStatement(cards) {
  return cards.map((card) => `${card.title ? `<h3>${card.title}</h3>` : ""}${card.html}`).join("\n");
}
__name(assembleStatement, "assembleStatement");
__name2(assembleStatement, "assembleStatement");
function stripSampleWrappers(value) {
  return value.replace(/<\/?span\b[^>]*>/gi, "").replace(/<\/?pre\b[^>]*>/gi, "").replace(/<\/?div\b[^>]*>/gi, "");
}
__name(stripSampleWrappers, "stripSampleWrappers");
__name2(stripSampleWrappers, "stripSampleWrappers");
function parseSampleBlock(node) {
  const clean = /* @__PURE__ */ __name2((value) => stripSampleWrappers(decodeEntities(value)).replace(/\r\n?/g, "\n").trim(), "clean");
  const items = node.querySelectorAll(".in-out-item");
  const texts = [];
  if (items.length > 0) {
    for (const item of items) {
      const pre = item.querySelector("pre");
      const sampledata = item.querySelector(".sampledata");
      texts.push(clean((pre ?? sampledata ?? item).textContent ?? ""));
    }
  } else {
    for (const span of node.querySelectorAll(".sampledata")) {
      texts.push(clean(span.textContent ?? ""));
    }
  }
  if (texts.length === 0) {
    const raw = node.innerHTML ?? "";
    if (/sampledata/i.test(raw)) {
      const parts = [];
      for (const match2 of raw.matchAll(/<span[^>]*sampledata[^>]*>([\s\S]*?)(?:<\/span>|$)/gi)) {
        parts.push(clean(match2[1]));
      }
      if (parts.length > 0)
        texts.push(...parts);
    }
  }
  if (texts.length >= 2)
    return { input: texts[0], output: texts[1] };
  const pres = node.querySelectorAll("pre");
  if (pres.length >= 2) {
    return { input: clean(pres[0].textContent ?? ""), output: clean(pres[1].textContent ?? "") };
  }
  const input = node.querySelector(".in");
  const output = node.querySelector(".out");
  if (input && output) {
    return { input: clean(input.textContent ?? ""), output: clean(output.textContent ?? "") };
  }
  if (texts.length === 1)
    return { input: texts[0], output: "" };
  return null;
}
__name(parseSampleBlock, "parseSampleBlock");
__name2(parseSampleBlock, "parseSampleBlock");
function parseSampleExplanations(node) {
  const parts = [];
  for (const block of node.querySelectorAll(".content")) {
    const stripped = (block.innerHTML ?? "").replace(/<span\b[^>]*sampledata[^>]*>[\s\S]*?<\/span>/gi, "").replace(/<span\b[^>]*sampledata[^>]*>[\s\S]*$/gi, "");
    const html = stripped.trim();
    if (html)
      parts.push(sanitizeHtml(html));
  }
  return parts.join("\n");
}
__name(parseSampleExplanations, "parseSampleExplanations");
__name2(parseSampleExplanations, "parseSampleExplanations");
function parseProblemCards(root) {
  const cards = [];
  for (const row of root.querySelectorAll(".cnt-row")) {
    const head = row.querySelector(".cnt-row-head");
    const body = row.querySelector(".cnt-row-body");
    if (!body)
      continue;
    const title2 = decodeEntities(normaliseText(head?.textContent ?? "")).trim();
    const sampleNodes = body.querySelectorAll(".data-sample");
    const samples = [];
    let explanation = "";
    for (const node of sampleNodes) {
      const parsed = parseSampleBlock(node);
      if (parsed)
        samples.push(parsed);
      const text = parseSampleExplanations(node);
      if (text)
        explanation += text;
    }
    const renderable = body.querySelector(".content.lang_cn") ?? body.querySelector(".content:not(.hidden)") ?? body;
    const rawHtml = sampleNodes.length > 0 ? explanation : renderable.innerHTML ?? "";
    cards.push({
      title: title2,
      html: normalizeAssetUrls(sanitizeHtml(rawHtml)),
      isSamples: sampleNodes.length > 0,
      samples
    });
  }
  return cards;
}
__name(parseProblemCards, "parseProblemCards");
__name2(parseProblemCards, "parseProblemCards");
function parseProblemMeta(root) {
  const meta = [];
  const container = root.querySelector(".jumbotron");
  if (!container)
    return meta;
  for (const span of container.querySelectorAll("span.green")) {
    const label = decodeEntities(normaliseText(span.textContent ?? "")).replace(/[:：]\s*$/, "").trim();
    let node = span.nextSibling;
    let value = "";
    while (node) {
      if (node.nodeType === 1 && node.rawTagName === "span")
        break;
      value += node.textContent ?? "";
      node = node.nextSibling;
    }
    const clean = decodeEntities(value).replace(/\s+/g, " ").trim();
    if (clean)
      meta.push({ label, value: clean });
  }
  return meta;
}
__name(parseProblemMeta, "parseProblemMeta");
__name2(parseProblemMeta, "parseProblemMeta");
function parseProblemFileNames(html) {
  const root = parse(html);
  const text = normaliseText(root.querySelector("h3")?.textContent ?? "");
  const inputMatch = text.match(/输入文件\s*[:：]\s*([\w.-]+)/);
  const outputMatch = text.match(/输出文件\s*[:：]\s*([\w.-]+)/);
  const strip = /* @__PURE__ */ __name2((value) => value ? value.replace(/\.(in|out|txt)$/i, "") : null, "strip");
  if (inputMatch || outputMatch) {
    return {
      inputName: strip(inputMatch?.[1]),
      outputName: strip(outputMatch?.[1])
    };
  }
  const rawInput = html.match(/输入文件\s*[:：][\s\S]{0,40}?([\w.-]+\.in)/i)?.[1];
  const rawOutput = html.match(/输出文件\s*[:：][\s\S]{0,40}?([\w.-]+\.out)/i)?.[1];
  return { inputName: strip(rawInput), outputName: strip(rawOutput) };
}
__name(parseProblemFileNames, "parseProblemFileNames");
__name2(parseProblemFileNames, "parseProblemFileNames");
function parseProblemLimits(html) {
  const text = normaliseText(parse(html).textContent);
  const time3 = text.match(/时间限制\s*[:：]?\s*([\d.]+)\s*(ms|s|秒|毫秒)?/i);
  const memory = text.match(/内存限制\s*[:：]?\s*([\d.]+)\s*(mb|kb|m|k)?/i);
  let timeLimitMs = null;
  if (time3) {
    const value = Number.parseFloat(time3[1]);
    const unit = (time3[2] ?? "s").toLowerCase();
    if (!Number.isNaN(value)) {
      timeLimitMs = unit.startsWith("ms") || unit === "\u6BEB\u79D2" ? value : value * 1e3;
    }
  }
  let memoryLimitKb = null;
  if (memory) {
    const value = Number.parseFloat(memory[1]);
    const unit = (memory[2] ?? "mb").toLowerCase();
    if (!Number.isNaN(value)) {
      memoryLimitKb = unit.startsWith("k") ? value : value * 1024;
    }
  }
  return { timeLimitMs, memoryLimitKb };
}
__name(parseProblemLimits, "parseProblemLimits");
__name2(parseProblemLimits, "parseProblemLimits");
function parseProblemSamples(html) {
  const root = parse(html);
  const blocks = root.querySelectorAll(".sampledata");
  const texts = blocks.map((block) => decodeEntities(block.textContent).replace(/\r\n?/g, "\n").trimEnd());
  const samples = [];
  for (let i = 0; i + 1 < texts.length; i += 2) {
    samples.push({ input: texts[i], output: texts[i + 1] });
  }
  return samples;
}
__name(parseProblemSamples, "parseProblemSamples");
__name2(parseProblemSamples, "parseProblemSamples");
function parseLanguages(html) {
  const root = parse(html);
  const select = root.querySelector("#language") ?? root.querySelector('select[name="language"]');
  if (!select)
    return [];
  const languages = [];
  for (const option of select.querySelectorAll("option")) {
    const id = Number.parseInt(option.getAttribute("value") ?? "", 10);
    const name = normaliseText(option.textContent);
    if (Number.isNaN(id) || !name)
      continue;
    languages.push({ id, name });
  }
  return languages;
}
__name(parseLanguages, "parseLanguages");
__name2(parseLanguages, "parseLanguages");
function parseProblemDetail(html, problemId) {
  const root = parse(html);
  const rawTitle = normaliseText(root.querySelector("h2")?.textContent) || normaliseText(root.querySelector("title")?.textContent) || "";
  const title2 = rawTitle.replace(/^问题\s*\d+\s*(--?|:)?\s*/, "").replace(/^\d+\s*[:：]\s*/, "").trim() || `\u9898\u76EE ${problemId}`;
  const element = root;
  const cards = parseProblemCards(element);
  const { inputName, outputName } = parseProblemFileNames(html);
  const { timeLimitMs, memoryLimitKb } = parseProblemLimits(html);
  const cardSamples = cards.flatMap((card) => card.samples);
  return {
    id: problemId,
    title: title2,
    cards,
    statementHtml: assembleStatement(cards),
    meta: parseProblemMeta(element),
    inputName,
    outputName,
    samples: cardSamples.length ? cardSamples : parseProblemSamples(html),
    timeLimitMs,
    memoryLimitKb,
    languages: []
  };
}
__name(parseProblemDetail, "parseProblemDetail");
__name2(parseProblemDetail, "parseProblemDetail");
function parseSubmitResponse(body) {
  const patterns = [
    /solution_id\s*=\s*(\d+)/i,
    /sid=(\d+)/i,
    /status\.php\?[^"'\s]*id=(\d+)/i,
    /reinfo\.php\?sid=(\d+)/i
  ];
  for (const pattern of patterns) {
    const match2 = body.match(pattern);
    if (match2)
      return Number.parseInt(match2[1], 10);
  }
  return null;
}
__name(parseSubmitResponse, "parseSubmitResponse");
__name2(parseSubmitResponse, "parseSubmitResponse");
function buildSubmitForm(request) {
  const form = {
    language: String(request.languageId),
    source: request.source
  };
  if (request.contestId !== void 0 && request.contestPid !== void 0) {
    form.cid = String(request.contestId);
    form.pid = String(request.contestPid);
  } else if (request.problemId !== void 0) {
    form.id = String(request.problemId);
  }
  if (request.enableO2)
    form.enable_O2 = "on";
  return form;
}
__name(buildSubmitForm, "buildSubmitForm");
__name2(buildSubmitForm, "buildSubmitForm");
var XMOJ_ORIGIN6 = "https://www.xmoj.tech";
function error3(message, status) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
__name(error3, "error3");
__name2(error3, "error");
async function onRequestGet6({ request }) {
  const rawId = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^\d{1,10}$/.test(rawId)) return error3("\u65E0\u6548\u7684\u9898\u76EE\u7F16\u53F7", 400);
  const problemId = Number(rawId);
  if (!Number.isSafeInteger(problemId) || problemId < 1 || problemId > 1e9) {
    return error3("\u65E0\u6548\u7684\u9898\u76EE\u7F16\u53F7", 400);
  }
  try {
    const problemUrl = new URL("/problem.php", XMOJ_ORIGIN6);
    problemUrl.searchParams.set("id", String(problemId));
    const response2 = await fetch(problemUrl, {
      headers: { Accept: "text/html" },
      redirect: "manual",
      signal: request.signal
    });
    if (!response2.ok || !response2.headers.get("content-type")?.includes("text/html")) {
      return error3("\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u9898\u76EE", 502);
    }
    const detail = parseProblemDetail(await response2.text(), problemId);
    try {
      const submitUrl = new URL("/submitpage.php", XMOJ_ORIGIN6);
      submitUrl.searchParams.set("id", String(problemId));
      const submitPage = await fetch(submitUrl, {
        headers: { Accept: "text/html" },
        redirect: "manual",
        signal: request.signal
      });
      if (submitPage.ok && submitPage.headers.get("content-type")?.includes("text/html")) {
        detail.languages = parseLanguages(await submitPage.text());
      }
    } catch {
      detail.languages = [];
    }
    return Response.json(detail, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return error3("\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u9898\u76EE", 502);
  }
}
__name(onRequestGet6, "onRequestGet6");
__name2(onRequestGet6, "onRequestGet");
var XMOJ_ORIGIN7 = "https://www.xmoj.tech";
var MAX_PAGES = 40;
var PAGE_DELAY_MS = 100;
function error4(message, status) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
__name(error4, "error4");
__name2(error4, "error");
async function onRequestGet7({ request }) {
  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  if (search.length > 100) return error4("\u641C\u7D22\u5185\u5BB9\u8FC7\u957F", 400);
  try {
    const problems = [];
    let totalPages = 1;
    for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page += 1) {
      const url = new URL("/problemset.php", XMOJ_ORIGIN7);
      url.searchParams.set("page", String(page));
      if (search) url.searchParams.set("search", search);
      const response2 = await fetch(url, {
        headers: { Accept: "text/html" },
        redirect: "manual",
        signal: request.signal
      });
      if (!response2.ok || !response2.headers.get("content-type")?.includes("text/html")) {
        return error4("\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u9898\u5E93", 502);
      }
      const parsed = parseProblemsetPage(await response2.text(), page);
      problems.push(...parsed.problems);
      if (page === 1) totalPages = Math.max(1, Math.min(parsed.totalPages ?? 1, MAX_PAGES));
      if (!parsed.problems.length) break;
      if (page < totalPages) await new Promise((resolve) => setTimeout(resolve, PAGE_DELAY_MS));
    }
    return Response.json({
      problems,
      page: 1,
      totalPages: Math.max(1, Math.ceil(problems.length / 20))
    }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return error4("\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u9898\u5E93", 502);
  }
}
__name(onRequestGet7, "onRequestGet7");
__name2(onRequestGet7, "onRequestGet");
function parseSolvedProblems(html) {
  const problems = [];
  const seen = /* @__PURE__ */ new Set();
  const call = /p\(\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  let match2;
  while ((match2 = call.exec(html)) !== null) {
    const id = Number.parseInt(match2[1], 10);
    if (seen.has(id))
      continue;
    seen.add(id);
    problems.push({
      id,
      attempts: Number.parseInt(match2[2], 10),
      url: `${XMOJ_ORIGIN3}/problem.php?id=${id}`
    });
  }
  return problems;
}
__name(parseSolvedProblems, "parseSolvedProblems");
__name2(parseSolvedProblems, "parseSolvedProblems");
function parseUserProfile(html, username) {
  const root = parse(html);
  const text = normaliseText(root.querySelector(".container")?.textContent ?? html);
  const headerMatch = text.match(new RegExp(`${escapeRegExp(username)}\\s*-{2}\\s*([^\\s\u77ED]+)`));
  const nick = headerMatch ? headerMatch[1].trim() : "";
  const solvedMatch = text.match(/解决\s*(\d+)/);
  const solvedTotal = solvedMatch ? Number.parseInt(solvedMatch[1], 10) : null;
  const problems = parseSolvedProblems(html);
  const statistics = root.querySelectorAll("#statics tr").flatMap((row) => {
    const cells = row.querySelectorAll("td");
    const label = normaliseText(cells[0]?.textContent);
    const link = cells[1]?.querySelector('a[href*="jresult="]');
    const verdict = Number(link?.getAttribute("href")?.match(/jresult=(\d+)/)?.[1]);
    const count3 = Number(link?.textContent.trim());
    return link && !/^(解决|Solved)/i.test(label) && Number.isFinite(verdict) && Number.isFinite(count3) ? [{ label, count: count3, verdict }] : [];
  });
  const series = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
  for (const match2 of html.matchAll(/\bd([12])\.push\(\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]\s*\)/g)) {
    const timestamp = Number(match2[2]), count3 = Number(match2[3]);
    if (Number.isSafeInteger(timestamp) && timestamp > 0 && timestamp <= 864e13 && Number.isSafeInteger(count3)) series[Number(match2[1]) - 1].set(timestamp, count3);
  }
  const activity = [.../* @__PURE__ */ new Set([...series[0].keys(), ...series[1].keys()])].sort((a, b) => a - b).map((timestamp) => ({ timestamp, submitted: series[0].get(timestamp) ?? 0, accepted: series[1].get(timestamp) ?? 0 }));
  const failures = statistics.filter((s) => s.verdict >= 5 && s.verdict <= 10).reduce((sum, s) => sum + s.count, 0);
  const solved = problems.length;
  let totalAC = 0, cappedAC = 0;
  for (const count3 of series[1].values()) {
    totalAC += count3;
    cappedAC += count3 <= 8 ? count3 : 8 + 8 * Math.log(1 + (count3 - 8) / 8);
  }
  const volume = 1 - Math.exp(-solved * (totalAC > 0 ? cappedAC / totalAC : 1) / 350);
  const precision = (solved + 10) / (solved + failures + 40);
  const accuracy = precision < 0.15 ? 0 : precision < 0.4 ? (precision - 0.15) / 0.25 : precision < 0.55 ? 1 : Math.max(0.3, 1 - (precision - 0.55) * 2);
  const rating = solved ? Math.round(3e3 * Math.pow(0.57 * volume + 0.33 * accuracy * solved / (solved + 80) + 0.1 * (1 - Math.exp(-series[0].size / 250)), 0.9)) : 0;
  return {
    rating,
    statistics,
    activity,
    username,
    nick,
    solvedTotal: solvedTotal ?? problems.length,
    problems,
    profileUrl: `${XMOJ_ORIGIN3}/userinfo.php?user=${encodeURIComponent(username)}`
  };
}
__name(parseUserProfile, "parseUserProfile");
__name2(parseUserProfile, "parseUserProfile");
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
__name(escapeRegExp, "escapeRegExp");
__name2(escapeRegExp, "escapeRegExp");
var XMOJ_ORIGIN8 = "https://www.xmoj.tech";
async function onRequestGet8({ request }) {
  const username = new URL(request.url).searchParams.get("username")?.trim() ?? "";
  if (!username || username.length > 128 || /[\u0000-\u001f\u007f]/.test(username)) {
    return Response.json({ error: "\u65E0\u6548\u7684\u7528\u6237\u540D" }, { status: 400 });
  }
  const upstreamUrl = new URL("/userinfo.php", XMOJ_ORIGIN8);
  upstreamUrl.searchParams.set("user", username);
  try {
    const response2 = await fetch(upstreamUrl, {
      headers: { Accept: "text/html" },
      redirect: "manual",
      signal: request.signal
    });
    if (!response2.ok || !response2.headers.get("content-type")?.includes("text/html")) {
      return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u7528\u6237\u4E3B\u9875" }, {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return Response.json(parseUserProfile(await response2.text(), username), {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" }
    });
  } catch {
    return Response.json({ error: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u7528\u6237\u4E3B\u9875" }, {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
__name(onRequestGet8, "onRequestGet8");
__name2(onRequestGet8, "onRequestGet");
var XMOJ_ORIGIN9 = "https://www.xmoj.tech";
function error5(message, status) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
__name(error5, "error5");
__name2(error5, "error");
async function onRequestGet9({ request }) {
  const input = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const [source, target] of [
    ["user", "user_id"],
    ["problemId", "problem_id"],
    ["result", "jresult"],
    ["language", "language"],
    ["top", "top"],
    ["prevTop", "prevtop"]
  ]) {
    const value = input.get(source)?.trim();
    if (!value) continue;
    if (source === "problemId" || source === "top" || source === "prevTop") {
      if (!/^\d{1,12}$/.test(value)) return error5(`\u65E0\u6548\u7684 ${source} \u53C2\u6570`, 400);
    } else if (value.length > 100) {
      return error5(`\u7B5B\u9009\u6761\u4EF6\u8FC7\u957F`, 400);
    }
    query.set(target, value);
  }
  try {
    const upstreamUrl = new URL("/status.php", XMOJ_ORIGIN9);
    upstreamUrl.search = query.toString();
    const response2 = await fetch(upstreamUrl, {
      headers: { Accept: "text/html" },
      redirect: "manual",
      signal: request.signal
    });
    if (!response2.ok || !response2.headers.get("content-type")?.includes("text/html")) {
      return error5("\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u8BC4\u6D4B\u8BB0\u5F55", 502);
    }
    return Response.json(parseStatusPage(await response2.text()), {
      headers: { "Cache-Control": "public, max-age=15, s-maxage=30", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return error5("\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u8BC4\u6D4B\u8BB0\u5F55", 502);
  }
}
__name(onRequestGet9, "onRequestGet9");
__name2(onRequestGet9, "onRequestGet");
var XMOJ_ORIGIN10 = "https://www.xmoj.tech";
var COOKIE_NAME = "__Host-xmoj-session";
var SESSION_TTL_SECONDS = 8 * 60 * 60;
var COOKIE_OPTIONS = "Path=/; HttpOnly; Secure; SameSite=Lax";
function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(encodeBase64Url, "encodeBase64Url");
__name2(encodeBase64Url, "encodeBase64Url");
function decodeBase64Url(value) {
  const normalised = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalised + "=".repeat((4 - normalised.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
__name(decodeBase64Url, "decodeBase64Url");
__name2(decodeBase64Url, "decodeBase64Url");
async function getKey(env2) {
  if (!env2.XMOJ_SESSION_KEY) throw new Error("\u7F51\u9875\u7248\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u914D\u7F6E");
  let raw;
  try {
    raw = Uint8Array.from(atob(env2.XMOJ_SESSION_KEY), (char) => char.charCodeAt(0));
  } catch {
    throw new Error("\u7F51\u9875\u7248\u4F1A\u8BDD\u5BC6\u94A5\u914D\u7F6E\u65E0\u6548");
  }
  if (raw.length !== 32) throw new Error("\u7F51\u9875\u7248\u4F1A\u8BDD\u5BC6\u94A5\u914D\u7F6E\u65E0\u6548");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
__name(getKey, "getKey");
__name2(getKey, "getKey");
async function seal(env2, payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await getKey(env2),
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  return encodeBase64Url(result);
}
__name(seal, "seal");
__name2(seal, "seal");
async function unseal(env2, value) {
  try {
    const bytes = decodeBase64Url(value);
    if (bytes.length < 29 || bytes.length > 4096) return null;
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.subarray(0, 12) },
      await getKey(env2),
      bytes.subarray(12)
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext));
    if (typeof payload.sessionId !== "string" || !/^[A-Za-z0-9._~-]{1,256}$/.test(payload.sessionId) || typeof payload.username !== "string" || !payload.username || typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
__name(unseal, "unseal");
__name2(unseal, "unseal");
function sessionCookie(request) {
  const cookies = request.headers.get("Cookie") ?? "";
  const match2 = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([A-Za-z0-9_-]+)(?:;|$)`));
  return match2?.[1] ?? null;
}
__name(sessionCookie, "sessionCookie");
__name2(sessionCookie, "sessionCookie");
async function readSession(request, env2) {
  const sealed = sessionCookie(request);
  return sealed ? unseal(env2, sealed) : null;
}
__name(readSession, "readSession");
__name2(readSession, "readSession");
function json(data, status = 200, headers) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}
__name(json, "json");
__name2(json, "json");
function emptySession() {
  return {
    authenticated: false,
    user: null,
    sessionId: null,
    verifiedAt: null,
    rememberedUsername: null,
    canSilentLogin: false
  };
}
__name(emptySession, "emptySession");
__name2(emptySession, "emptySession");
function clearCookie() {
  return `${COOKIE_NAME}=; ${COOKIE_OPTIONS}; Max-Age=0`;
}
__name(clearCookie, "clearCookie");
__name2(clearCookie, "clearCookie");
function isSameOriginMutation(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}
__name(isSameOriginMutation, "isSameOriginMutation");
__name2(isSameOriginMutation, "isSameOriginMutation");
function upstreamCookie(sessionId) {
  return `PHPSESSID=${sessionId}`;
}
__name(upstreamCookie, "upstreamCookie");
__name2(upstreamCookie, "upstreamCookie");
async function verifySession(request, env2) {
  const sealed = sessionCookie(request);
  if (!sealed) return json(emptySession());
  const session = await readSession(request, env2);
  if (!session) return json(emptySession(), 401, { "Set-Cookie": clearCookie() });
  const upstream = await fetch(`${XMOJ_ORIGIN10}/loginpage.php`, {
    headers: { Cookie: upstreamCookie(session.sessionId), Accept: "text/html" },
    redirect: "manual"
  }).catch(() => null);
  if (!upstream?.ok) return json(emptySession(), 401, { "Set-Cookie": clearCookie() });
  const html = await upstream.text();
  if (!isAlreadyLoggedInResponse(html) || isLoginGate(html)) {
    return json(emptySession(), 401, { "Set-Cookie": clearCookie() });
  }
  return json({
    ...emptySession(),
    authenticated: true,
    user: { username: session.username, isAdmin: false, email: null },
    verifiedAt: Date.now()
  });
}
__name(verifySession, "verifySession");
__name2(verifySession, "verifySession");
async function login(request, env2) {
  if (!isSameOriginMutation(request)) return json({ error: "Invalid request origin" }, 403);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: "\u8BF7\u6C42\u5185\u5BB9\u8FC7\u5927" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "\u767B\u5F55\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
  }
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || username.length > 128 || !password || password.length > 1024) {
    return json({ error: "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u7528\u6237\u540D\u548C\u5BC6\u7801" }, 400);
  }
  try {
    await getKey(env2);
    const response2 = await fetch(`${XMOJ_ORIGIN10}/login.php`, {
      method: "POST",
      headers: {
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        user_id: username,
        password,
        return_url: "",
        submit: "\u767B\u5F55"
      }),
      redirect: "manual"
    });
    const setCookies = response2.headers.getSetCookie?.() ?? [response2.headers.get("set-cookie") ?? ""];
    const sessionId = setCookies.map((value) => value.match(/(?:^|,\s*)PHPSESSID=([^;,\s]+)/)?.[1]).find((value) => Boolean(value && /^[A-Za-z0-9._~-]{1,256}$/.test(value)));
    const html = await response2.text();
    const alert = parseLoginAlert(html);
    if (isLoginFailureAlert(alert)) return json({ error: alert }, 401);
    if (!sessionId) return json({ error: "\u767B\u5F55\u5931\u8D25\uFF1A\u670D\u52A1\u5668\u672A\u4E0B\u53D1\u4F1A\u8BDD Cookie" }, 401);
    const verification = await fetch(`${XMOJ_ORIGIN10}/loginpage.php`, {
      headers: { Cookie: upstreamCookie(sessionId), Accept: "text/html" },
      redirect: "manual"
    });
    const verificationHtml = await verification.text();
    if (!verification.ok || !isAlreadyLoggedInResponse(verificationHtml) || isLoginGate(verificationHtml)) {
      return json({ error: "\u767B\u5F55\u72B6\u6001\u672A\u80FD\u786E\u8BA4\uFF0C\u8BF7\u68C0\u67E5\u7528\u6237\u540D\u4E0E\u5BC6\u7801" }, 401);
    }
    const profileResponse = await fetch(`${XMOJ_ORIGIN10}/index.php`, {
      headers: { Cookie: upstreamCookie(sessionId), Accept: "text/html" },
      redirect: "manual"
    });
    const profile3 = profileResponse.ok ? parseProfile(await profileResponse.text()) : null;
    const authenticatedUsername = profile3?.username || username;
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1e3;
    const cookieValue = await seal(env2, { sessionId, username: authenticatedUsername, expiresAt });
    return json({
      ok: true,
      state: {
        ...emptySession(),
        authenticated: true,
        user: { username: authenticatedUsername, isAdmin: false, email: null },
        verifiedAt: Date.now()
      }
    }, 200, {
      "Set-Cookie": `${COOKIE_NAME}=${cookieValue}; ${COOKIE_OPTIONS}; Max-Age=${SESSION_TTL_SECONDS}`
    });
  } catch (error6) {
    return json({ error: error6 instanceof Error ? error6.message : "\u767B\u5F55\u670D\u52A1\u6682\u4E0D\u53EF\u7528" }, 503);
  }
}
__name(login, "login");
__name2(login, "login");
async function logout(request, env2) {
  if (!isSameOriginMutation(request)) return json({ error: "Invalid request origin" }, 403);
  const sealed = sessionCookie(request);
  if (sealed) {
    const session = await unseal(env2, sealed);
    if (session) {
      await fetch(`${XMOJ_ORIGIN10}/logout.php`, {
        headers: { Cookie: upstreamCookie(session.sessionId) },
        redirect: "manual"
      }).catch(() => void 0);
    }
  }
  return json(emptySession(), 200, { "Set-Cookie": clearCookie() });
}
__name(logout, "logout");
__name2(logout, "logout");
async function onRequest({ request, env: env2 }) {
  if (request.method === "GET") return verifySession(request, env2);
  if (request.method === "POST") return login(request, env2);
  if (request.method === "DELETE") return logout(request, env2);
  return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST, DELETE" });
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var XMOJ_ORIGIN11 = "https://www.xmoj.tech";
function response(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
__name(response, "response");
__name2(response, "response");
function sameOrigin(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}
__name(sameOrigin, "sameOrigin");
__name2(sameOrigin, "sameOrigin");
async function onRequestPost({ request, env: env2 }) {
  if (!sameOrigin(request)) return response({ error: "Invalid request origin" }, 403);
  const session = await readSession(request, env2);
  if (!session) return response({ error: "\u767B\u5F55\u72B6\u6001\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55" }, 401);
  const contentLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > 6e5) {
    return response({ error: "\u63D0\u4EA4\u5185\u5BB9\u8FC7\u5927" }, 413);
  }
  let input;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 6e5) {
      return response({ error: "\u63D0\u4EA4\u5185\u5BB9\u8FC7\u5927" }, 413);
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return response({ error: "\u63D0\u4EA4\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
    }
    input = parsed;
  } catch {
    return response({ error: "\u63D0\u4EA4\u8BF7\u6C42\u683C\u5F0F\u65E0\u6548" }, 400);
  }
  const problemId = Number(input.problemId);
  const languageId = Number(input.languageId);
  const source = typeof input.source === "string" ? input.source : "";
  if (!Number.isSafeInteger(problemId) || problemId < 1 || problemId > 1e9 || !Number.isSafeInteger(languageId) || languageId < 0 || languageId > 1e3 || !source.trim() || new TextEncoder().encode(source).byteLength > 512e3) {
    return response({ error: "\u63D0\u4EA4\u4FE1\u606F\u65E0\u6548" }, 400);
  }
  try {
    const cookie = `PHPSESSID=${session.sessionId}`;
    const verify = await fetch(`${XMOJ_ORIGIN11}/loginpage.php`, {
      headers: { Cookie: cookie, Accept: "text/html" },
      redirect: "manual"
    });
    const verifyHtml = await verify.text();
    if (!verify.ok || !isAlreadyLoggedInResponse(verifyHtml) || isLoginGate(verifyHtml)) {
      return response({ error: "\u767B\u5F55\u72B6\u6001\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55" }, 401);
    }
    const form = buildSubmitForm({
      problemId,
      languageId,
      source,
      enableO2: input.enableO2 === true
    });
    let result = await fetch(`${XMOJ_ORIGIN11}/submit.php`, {
      method: "POST",
      headers: {
        Cookie: cookie,
        Accept: "text/html",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(form),
      redirect: "manual"
    });
    if (result.status >= 300 && result.status < 400) {
      const location = result.headers.get("Location");
      if (!location) return response({ error: "\u63D0\u4EA4\u54CD\u5E94\u65E0\u6548" }, 502);
      const destination = new URL(location, XMOJ_ORIGIN11);
      if (destination.origin !== XMOJ_ORIGIN11) return response({ error: "\u63D0\u4EA4\u54CD\u5E94\u76EE\u6807\u65E0\u6548" }, 502);
      result = await fetch(destination, {
        headers: { Cookie: cookie, Accept: "text/html" },
        redirect: "manual"
      });
    }
    const html = await result.text();
    const solutionId = result.ok ? parseSubmitResponse(html) : null;
    if (solutionId === null) {
      return response({
        ok: false,
        solutionId: null,
        message: "\u63D0\u4EA4\u5931\u8D25\uFF0C\u670D\u52A1\u5668\u672A\u8FD4\u56DE\u63D0\u4EA4\u7F16\u53F7"
      }, 502);
    }
    return response({ ok: true, solutionId, message: "\u63D0\u4EA4\u6210\u529F" });
  } catch {
    return response({ error: "\u63D0\u4EA4\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528" }, 502);
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
var routes = [
  {
    routePath: "/api/contest-detail",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/contest-list",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/contest-rank",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/home",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/monthly",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/problem",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/problemset",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/profile",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/status",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/submit",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/session",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse2(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse2, "parse2");
__name2(parse2, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode2 = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode2(value, key);
        });
      } else {
        params[key.name] = decode2(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse2(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode2 = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode2(token));
    } else {
      var prefix = escapeString(encode2(token.prefix));
      var suffix = escapeString(encode2(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex2 = /[.+?^${}()|[\]\\]/g;
function getOriginalPathPrefix(requestPath, normalizedPrefix) {
  let end = 0;
  for (let index = 0; index < normalizedPrefix.length; index++) {
    end++;
    if (normalizedPrefix[index] === "/") {
      while (requestPath[end] === "/") {
        end++;
      }
    }
  }
  return requestPath.slice(0, end);
}
__name(getOriginalPathPrefix, "getOriginalPathPrefix");
__name2(getOriginalPathPrefix, "getOriginalPathPrefix");
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  const normalizedRequestPath = requestPath.replace(/\/+/g, "/");
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath) || routeMatcher(normalizedRequestPath);
    const originalMountMatch = mountMatcher(requestPath);
    const mountMatchResult = originalMountMatch || mountMatcher(normalizedRequestPath);
    if (matchResult && mountMatchResult) {
      const path = originalMountMatch ? originalMountMatch.path : getOriginalPathPrefix(requestPath, mountMatchResult.path);
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex2, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex2, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response2 = await handler(context2);
        if (!(response2 instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response2);
      } else if ("ASSETS") {
        const response2 = await env2["ASSETS"].fetch(request);
        return cloneResponse(response2);
      } else {
        const response2 = await fetch(request);
        return cloneResponse(response2);
      }
    }, "next");
    try {
      return await next();
    } catch (error6) {
      if (isFailOpen) {
        const response2 = await env2["ASSETS"].fetch(request);
        return cloneResponse(response2);
      }
      throw error6;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response2) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response2.status) ? null : response2.body,
    response2
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error6 = reduceError(e);
    const body = JSON.stringify(error6);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error6 = reduceError2(e);
    const body = JSON.stringify(error6);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-DGUcCV/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../.npm/_npx/c943b712072b77c4/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env2, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-DGUcCV/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.6697594189840883.js.map
