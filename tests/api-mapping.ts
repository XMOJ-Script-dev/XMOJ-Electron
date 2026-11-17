import type { HttpClient } from '../electron/http.ts';
import { fetchContestList, fetchContestDetail } from '../electron/judge-api.ts';
import { buildSubmitForm, parseLanguages, parseProblemDetail } from '../electron/problems.ts';
let failures = 0;
let passed = 0;
function check(label: string, condition: boolean, detail = '') {
    if (condition) {
        passed++;
        console.log(`  [PASS] ${label}`);
    }
    else {
        failures++;
        console.log(`  [FAIL] ${label}${detail ? ` :: ${detail}` : ''}`);
    }
}
interface StubRoute {
    status?: number;
    body: string;
    contentType?: string;
}
function jsonHttp(routes: Record<string, StubRoute>) {
    const calls: string[] = [];
    const http = {
        calls,
        async get(url: string) {
            calls.push(url);
            const key = Object.keys(routes).find((k) => url.includes(k));
            if (!key)
                throw new Error(`stub: unexpected url ${url}`);
            const route = routes[key]!;
            return {
                status: route.status ?? 200,
                url,
                headers: new Headers({ 'content-type': route.contentType ?? 'application/json' }),
                body: route.body,
                serverTime: 0,
            };
        },
    };
    return http as unknown as HttpClient & {
        calls: string[];
    };
}
console.log('\n=== fetchContestList: createdBy -> creator 映射 ===');
{
    const payload = {
        total: 3,
        totalPages: 1,
        pageNum: 1,
        pageSize: 25,
        list: [
            { contestId: 1, title: '只有 createdBy', startTime: '2026-01-01 00:00:00', endTime: '2026-01-02 00:00:00', defunct: 'N', createdBy: 'alice' },
            { contestId: 2, title: '两者都有', createdBy: 'alice', creator: 'bob' },
            { contestId: 3, title: '都没有', startTime: null, endTime: null, defunct: null },
        ],
    };
    const http = jsonHttp({ '/api/contest/list': { body: JSON.stringify(payload) } });
    const res = await fetchContestList(http);
    check('ok', res.ok === true, JSON.stringify(res.error));
    check('请求默认第 1 页', http.calls[0]!.includes('/api/contest/list?pageNum=1'), http.calls[0]);
    const list = res.data?.list ?? [];
    check('3 条列表', list.length === 3, String(list.length));
    check('creator 缺失时取 createdBy', list[0]?.creator === 'alice', JSON.stringify(list[0]?.creator));
    check('两者都在时 creator 优先', list[1]?.creator === 'bob', JSON.stringify(list[1]?.creator));
    check('都没有时 creator 为 null', list[2]?.creator === null, JSON.stringify(list[2]?.creator));
    check('createdBy 被剥离（条目 1）', !('createdBy' in list[0]!), JSON.stringify(list[0]));
    check('createdBy 被剥离（条目 2）', !('createdBy' in list[1]!), JSON.stringify(list[1]));
    check('其他字段透传：title', list[0]?.title === '只有 createdBy', JSON.stringify(list[0]?.title));
    check('其他字段透传：startTime', list[0]?.startTime === '2026-01-01 00:00:00', JSON.stringify(list[0]?.startTime));
    check('其他字段透传：defunct null', list[0]?.defunct === 'N' && list[2]?.defunct === null, JSON.stringify(list[2]?.defunct));
    check('其他字段透传：creator 原本存在且未被覆盖字段丢失', list[1]?.title === '两者都有', JSON.stringify(list[1]));
    check('顶层分页字段透传', res.data?.total === 3 && res.data?.totalPages === 1 && res.data?.pageSize === 25, JSON.stringify({ total: res.data?.total, totalPages: res.data?.totalPages, pageSize: res.data?.pageSize }));
}
{
    const http = jsonHttp({ '/api/contest/list?pageNum=2': { body: JSON.stringify({ total: 0, totalPages: 0, pageNum: 2, pageSize: 25, list: [] }) } });
    const res = await fetchContestList(http, 2);
    check('page 参数进 URL', http.calls[0]!.includes('pageNum=2'), http.calls[0]);
    check('空 list 返回空数组', res.ok && (res.data?.list.length ?? -1) === 0, JSON.stringify(res.data?.list));
}
{
    const http = jsonHttp({ '/api/contest/list': { body: JSON.stringify({ total: 0, totalPages: 0, pageNum: 1, pageSize: 25 }) } });
    const res = await fetchContestList(http);
    check('list 字段缺失时容错为空数组', res.ok && Array.isArray(res.data?.list) && res.data!.list.length === 0, JSON.stringify(res.data?.list));
}
{
    const http = jsonHttp({ '/api/contest/list': { body: '<html>not json</html>', contentType: 'text/html' } });
    const res = await fetchContestList(http);
    check('非 JSON 响应：ok=false', res.ok === false, String(res.ok));
    check('非 JSON 响应：错误文案', res.error === '返回的不是 JSON', JSON.stringify(res.error));
}
{
    const http = jsonHttp({ '/api/contest/list': { status: 403, body: JSON.stringify({ detail: '比赛私有' }) } });
    const res = await fetchContestList(http);
    check('HTTP 403：ok=false', res.ok === false && res.status === 403, String(res.status));
    check('HTTP 403：detail 作为错误', res.error === '比赛私有', JSON.stringify(res.error));
}
{
    const http = jsonHttp({ '/api/contest/list': { body: '{broken json' } });
    const res = await fetchContestList(http);
    check('坏 JSON：ok=false', res.ok === false, String(res.ok));
    check('坏 JSON：解析失败文案', res.error === '响应解析失败', JSON.stringify(res.error));
}
console.log('\n=== fetchContestDetail: contest.creator 映射 + problems 规整 ===');
{
    const payload = {
        contest: {
            contestId: 10786,
            title: '周赛',
            startTime: '2026-01-01 00:00:00',
            endTime: '2026-01-01 12:00:00',
            defunct: 'N',
            createdBy: 'alice',
        },
        problems: [
            { contestId: 10786, num: 'a', problemId: '1000', problemTitle: 'A+B Problem', myStatus: 'AC' },
            { contestId: 10786, num: 'B', problemId: 1001, title: '回文串', myStatus: null },
            { contestId: 10786, num: 'c', problemId: 'oops', problemTitle: '坏 id' },
            { contestId: 10786, num: 'D', problemTitle: '未公开题目' },
        ],
        myRole: 'admin',
        canExport: true,
        submitUrl: '/contest/10786/submit',
    };
    const http = jsonHttp({ '/api/contest/10786/A': { body: JSON.stringify(payload) } });
    const res = await fetchContestDetail(http, 10786);
    check('ok', res.ok === true, JSON.stringify(res.error));
    check('请求路径 /api/contest/{id}/A', http.calls[0]!.includes('/api/contest/10786/A'), http.calls[0]);
    const contest = res.data?.contest;
    check('contest.creator 缺失时取 createdBy', contest?.creator === 'alice', JSON.stringify(contest?.creator));
    check('contest.createdBy 被剥离', contest && !('createdBy' in contest), JSON.stringify(contest));
    check('contest 其他字段透传', contest?.title === '周赛' && contest?.defunct === 'N', JSON.stringify(contest));
    const problems = res.data?.problems ?? [];
    check('4 道题目', problems.length === 4, String(problems.length));
    check('num 规整为大写', problems[0]?.num === 'A' && problems[1]?.num === 'B', JSON.stringify(problems.map((p) => p.num)));
    check('problemId 字符串转数字', problems[0]?.problemId === 1000, String(problems[0]?.problemId));
    check('problemId 数字保持', problems[1]?.problemId === 1001, String(problems[1]?.problemId));
    check('problemId 坏值转 null', problems[2]?.problemId === null, String(problems[2]?.problemId));
    check('problemId 缺失转 null', problems[3]?.problemId === null, String(problems[3]?.problemId));
    check('problemTitle 优先', problems[0]?.title === 'A+B Problem', JSON.stringify(problems[0]?.title));
    check('title 兜底', problems[1]?.title === '回文串', JSON.stringify(problems[1]?.title));
    check('myStatus -> status', problems[0]?.status === 'AC', JSON.stringify(problems[0]?.status));
    check('myStatus 缺失 -> status null', problems[2]?.status === null, JSON.stringify(problems[2]?.status));
    check('myRole 透传', res.data?.myRole === 'admin', JSON.stringify(res.data?.myRole));
    check('canExport 透传', res.data?.canExport === true, String(res.data?.canExport));
    check('submitUrl 透传', res.data?.submitUrl === '/contest/10786/submit', JSON.stringify(res.data?.submitUrl));
}
{
    const payload = {
        contest: { contestId: 5, title: 'x', createdBy: 'alice', creator: 'bob' },
        problems: [],
    };
    const http = jsonHttp({ '/api/contest/5/A': { body: JSON.stringify(payload) } });
    const res = await fetchContestDetail(http, 5);
    const contest = res.data?.contest;
    check('两者都在时 contest.creator 优先', contest?.creator === 'bob', JSON.stringify(contest?.creator));
    check('可选字段默认值：myRole null', res.data?.myRole === null, JSON.stringify(res.data?.myRole));
    check('可选字段默认值：canExport false', res.data?.canExport === false, String(res.data?.canExport));
    check('可选字段默认值：submitUrl null', res.data?.submitUrl === null, JSON.stringify(res.data?.submitUrl));
    check('problems 缺失容错为空数组', Array.isArray(res.data?.problems) && res.data!.problems.length === 0, JSON.stringify(res.data?.problems));
}
console.log('\n=== fetchContestDetail: contest 字段缺失守卫 ===');
{
    const http = jsonHttp({ '/api/contest/6/A': { body: JSON.stringify({ problems: [] }) } });
    const res = await fetchContestDetail(http, 6);
    check('contest 缺失返回 ok:false', res.ok === false, String(res.ok));
    check('contest 缺失返回错误信息', typeof res.error === 'string' && res.error.length > 0, String(res.error));
    check('contest 缺失 data 为 null', res.data === null, JSON.stringify(res.data));
}
console.log('\n=== buildSubmitForm：字段名与网站表单一致 ===');
{
    const form = buildSubmitForm({ problemId: 999, contestId: 10786, contestPid: 1000, languageId: 1, source: 'int main(){}', enableO2: false });
    check('cid/pid 优先于 id（无 id 字段）', !('id' in form), JSON.stringify(form));
    check('cid = contestId', form.cid === '10786', form.cid);
    check('pid = contestPid', form.pid === '1000', form.pid);
    check('language 字段名', form.language === '1', form.language);
    check('source 字段名', form.source === 'int main(){}', form.source);
    check('enableO2 未勾选不发送', !('enable_O2' in form), JSON.stringify(form));
}
{
    const form = buildSubmitForm({ problemId: 1000, languageId: 3, source: 'print(1)', enableO2: true });
    check('普通提交用 id', form.id === '1000', form.id);
    check('无比赛字段', !('cid' in form) && !('pid' in form), JSON.stringify(form));
    check('勾选 O2 发送 enable_O2=on', form.enable_O2 === 'on', JSON.stringify(form.enable_O2));
}
{
    const form = buildSubmitForm({ problemId: 1000, contestId: 10786, languageId: 1, source: 'x', enableO2: false });
    check('仅 contestId 无 contestPid 时回退 id', form.id === '1000' && !('cid' in form), JSON.stringify(form));
    const form2 = buildSubmitForm({ problemId: 1000, contestPid: 1, languageId: 1, source: 'x', enableO2: false });
    check('仅 contestPid 无 contestId 时回退 id', form2.id === '1000' && !('pid' in form2), JSON.stringify(form2));
}
{
    const form = buildSubmitForm({ problemId: 1, languageId: 0, source: '', enableO2: false });
    check('字段集合精确为 {language, source, id}', JSON.stringify(Object.keys(form).sort()) === JSON.stringify(['id', 'language', 'source']), JSON.stringify(Object.keys(form).sort()));
}
console.log('\n=== parseLanguages：#language 下拉解析 ===');
{
    const html = `<html><body><select id="language" name="language">
      <option value="0">C</option>
      <option value="1" selected>C++</option>
      <option value="3">C++11</option>
      <option value="">空 value 应跳过</option>
      <option value="abc">非数字 value 应跳过</option>
      <option value="9"></option>
    </select></body></html>`;
    const langs = parseLanguages(html);
    check('解析出 3 项', langs.length === 3, JSON.stringify(langs));
    check('id 为数字', langs[0]?.id === 0 && langs[1]?.id === 1 && langs[2]?.id === 3, JSON.stringify(langs.map((l) => l.id)));
    check('name 保留', langs[1]?.name === 'C++', JSON.stringify(langs.map((l) => l.name)));
    check('跳过空/非数字 value 与空 name', langs.every((l) => [0, 1, 3].includes(l.id)), JSON.stringify(langs));
}
{
    check('缺 select 返回 []', parseLanguages('<html><body><p>无下拉</p></body></html>').length === 0);
    check('空 select 返回 []', parseLanguages('<html><body><select id="language"></select></body></html>').length === 0);
    const fallback = parseLanguages('<html><body><select name="language"><option value="6">Python3</option></select></body></html>');
    check('select[name="language"] 兜底', fallback.length === 1 && fallback[0]?.id === 6 && fallback[0]?.name === 'Python3', JSON.stringify(fallback));
    const idWins = parseLanguages('<html><body><select id="language" name="language"><option value="1">A</option></select><select name="language"><option value="2">B</option></select></body></html>');
    check('#language 优先于 name="language"', idWins.length === 1 && idWins[0]?.id === 1, JSON.stringify(idWins));
}
console.log('\n=== assembleStatement（经 parseProblemDetail 锁定文档化行为） ===');
{
    const html = `<html><body>
  <h2>问题 1000 -- A+B Problem</h2>
  <div class="cnt-row">
    <div class="cnt-row-head">题目描述</div>
    <div class="cnt-row-body"><div class="content lang_cn">读入两个整数 <b>A</b> 和 <b>B</b>，输出它们的和。</div></div>
  </div>
  <div class="cnt-row">
    <div class="cnt-row-head">样例</div>
    <div class="cnt-row-body"><div class="data-sample">
      <span class="sampledata">1 2</span>
      <span class="sampledata">3</span>
    </div></div>
  </div>
  </body></html>`;
    const detail = parseProblemDetail(html, 1000);
    check('标题剥离「问题 N --」前缀', detail.title === 'A+B Problem', JSON.stringify(detail.title));
    check('statementHtml 包含题面卡片内容', detail.statementHtml.includes('读入两个整数'), JSON.stringify(detail.statementHtml));
    check('statementHtml 含卡片标题 <h3>', detail.statementHtml.includes('<h3>题目描述</h3>'), JSON.stringify(detail.statementHtml));
    check('statementHtml 不含样例数据文本', !detail.statementHtml.includes('1 2') && !detail.statementHtml.includes('>3<'), JSON.stringify(detail.statementHtml));
    check('statementHtml 不含样例标记（sampledata/data-sample）', !/sampledata|data-sample/i.test(detail.statementHtml), JSON.stringify(detail.statementHtml));
    check('样例只进 samples 数组', detail.samples.length === 1 && detail.samples[0]?.input === '1 2' && detail.samples[0]?.output === '3', JSON.stringify(detail.samples));
    check('样例卡片保留标题但正文不含样例', detail.statementHtml.includes('<h3>样例</h3>'), JSON.stringify(detail.statementHtml));
    check('多张卡片以换行拼接', detail.statementHtml.includes('\n') && detail.statementHtml.indexOf('。\n<h3>样例</h3>') !== -1, JSON.stringify(detail.statementHtml));
}
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`} (pass=${passed}, fail=${failures})\n`);
process.exit(failures === 0 ? 0 : 1);
