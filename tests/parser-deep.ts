import assert from 'node:assert/strict';
import { parseProblemsetPage, parseStatusPage, parseCountdown, describeVerdictCode, classifyVerdict, verdictCodeFromLabel, JUDGE_PENDING_THRESHOLD } from '../electron/parsers.ts';
import { parseContestRank, fetchContestRank } from '../electron/rank.ts';
import { fetchSource } from '../electron/sources.ts';
import type { HttpClient } from '../electron/http.ts';
import type { SubmissionVerdict } from '../src/shared/types.ts';
let failures = 0;
let passed = 0;
function check(label: string, condition: boolean, detail = '') {
    if (condition)
        passed++;
    else
        failures++;
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ` :: ${detail}` : ''}`);
}
console.log('\n=== ① 标题清洗矩阵（数字+分隔符前缀剥离） ===');
{
    const rows = [
        ['11710', '11710: 24小时降水量', '24小时降水量'],
        ['11710', '11710 - 24小时降水量', '24小时降水量'],
        ['11710', '24小时降水量', '24小时降水量'],
        ['1000', '1000 - A+B Problem', 'A+B Problem'],
        ['1001', '1001: Hello World', 'Hello World'],
        ['1002', '1002: 动态规划入门', '动态规划入门'],
        ['1003', 'A+B Problem', 'A+B Problem'],
        ['1004', '1004', '1004'],
        ['1005', '1005 – 全角破折号', '全角破折号'],
    ] as const;
    const body = rows.map(([id, raw]) => `<tr><td></td><td><a href="problem.php?id=${id}">${raw}</a></td><td>0/0</td></tr>`).join('\n');
    const page = parseProblemsetPage(`<html><body><table id="problemset"><tbody>${body}</tbody></table></body></html>`);
    check('row count', page.problems.length === rows.length, `got ${page.problems.length}`);
    rows.forEach(([id, raw, expected], index) => {
        check(`id=${id} "${raw}" -> "${expected}"`, page.problems[index]?.title === expected, JSON.stringify(page.problems[index]?.title));
    });
    const blank = parseProblemsetPage(`<html><body><table id="problemset"><tbody>
  <tr><td></td><td><a href="problem.php?id=2000">   </a></td></tr>
  <tr><td></td><td><a href="problem.php?id=2001"></a></td></tr>
  <tr><td></td><td><a href="problem.php?id=2002">   </a></td><td>A+B Problem</td><td>0/0</td></tr>
  </tbody></table></body></html>`);
    check('纯空白标题容错 -> 题目 2000', blank.problems[0]?.title === '题目 2000', JSON.stringify(blank.problems[0]?.title));
    check('空标题容错 -> 题目 2001', blank.problems[1]?.title === '题目 2001', JSON.stringify(blank.problems[1]?.title));
    check('空白链接回退到第三列文本', blank.problems[2]?.title === 'A+B Problem', JSON.stringify(blank.problems[2]?.title));
    check('空白行 id 仍解析', blank.problems[0]?.id === 2000 && blank.problems[1]?.id === 2001 && blank.problems[2]?.id === 2002);
}
console.log('\n=== ② JUDGE_RESULTS 全 code 矩阵 (0-11 + 非法) ===');
{
    const expected: [number, string, SubmissionVerdict][] = [
        [0, 'Waiting', 'pending'],
        [1, 'Pending', 'pending'],
        [2, 'Compiling', 'pending'],
        [3, 'Running', 'pending'],
        [4, 'Accepted', 'accepted'],
        [5, 'Presentation Error', 'presentation_error'],
        [6, 'Wrong Answer', 'wrong_answer'],
        [7, 'Time Limit Exceeded', 'time_limit'],
        [8, 'Memory Limit Exceeded', 'memory_limit'],
        [9, 'Output Limit Exceeded', 'output_limit'],
        [10, 'Runtime Error', 'runtime_error'],
        [11, 'Compile Error', 'compile_error'],
    ];
    for (const [code, label, verdict] of expected) {
        const described = describeVerdictCode(code);
        check(`code ${code} -> ${label}/${verdict}`, described.label === label && described.verdict === verdict, `${described.label}/${described.verdict}`);
    }
    for (const code of [-1, 12, 13, 99, 3.5, NaN]) {
        const described = describeVerdictCode(code);
        check(`非法 code ${String(code)} -> Unknown/other`, described.label === 'Unknown' && described.verdict === 'other', `${described.label}/${described.verdict}`);
    }
    const nullDescribed = describeVerdictCode(null);
    check('null code -> Unknown/other', nullDescribed.label === 'Unknown' && nullDescribed.verdict === 'other');
    check('code 3 -> pending（Status.vue 轮询依赖）', describeVerdictCode(3).verdict === 'pending' && JUDGE_PENDING_THRESHOLD === 4);
    check('0-3 全部 pending', [0, 1, 2, 3].every((c) => describeVerdictCode(c).verdict === 'pending'));
    check('4+ 全部非 pending', [4, 5, 6, 7, 8, 9, 10, 11].every((c) => describeVerdictCode(c).verdict !== 'pending'));
}
console.log('\n=== ②b classifyVerdict 归类矩阵 ===');
{
    const cases: [string[], string, SubmissionVerdict][] = [
        [['status_y'], '', 'accepted'],
        [['status_w'], '', 'pending'],
        [['status_n'], '', 'wrong_answer'],
        [['status_n', 'status_y'], 'Wrong Answer', 'accepted'],
        [[], 'Accepted', 'accepted'],
        [[], '正确', 'accepted'],
        [[], 'Waiting', 'pending'],
        [[], 'Pending', 'pending'],
        [[], 'Compiling', 'pending'],
        [[], 'Running', 'pending'],
        [[], '运行并评判', 'pending'],
        [[], 'Wrong Answer', 'wrong_answer'],
        [[], '答案错误', 'wrong_answer'],
        [[], 'Time Limit Exceeded', 'time_limit'],
        [[], 'Memory Limit Exceeded', 'memory_limit'],
        [[], 'Output Limit Exceeded', 'output_limit'],
        [[], 'Runtime Error', 'runtime_error'],
        [[], 'Compile Error', 'compile_error'],
        [[], 'Presentation Error', 'presentation_error'],
        [[], '', 'pending'],
        [[], '神秘结果', 'other'],
    ];
    for (const [classes, text, expected] of cases) {
        const actual = classifyVerdict(classes, text);
        check(`classifyVerdict(${JSON.stringify(classes)}, "${text}") -> ${expected}`, actual === expected, actual);
    }
}
console.log('\n=== ②c verdictCodeFromClasses 往返（status0-status11 经 parseStatusPage） ===');
{
    const labels: [number, string][] = [
        [0, '等待'], [1, '等待重判'], [2, '编译中'], [3, '运行并评判'], [4, '正确'], [5, '格式错误'],
        [6, '答案错误'], [7, '时间超限'], [8, '内存超限'], [9, '输出超限'], [10, '运行错误'], [11, '编译错误'],
    ];
    const body = labels.map(([code, text], i) => `<tr><td></td><td>${5000 + i}</td><td><a href='userinfo.php?user=u${i}'>u${i}</a></td><td><a href='problem.php?id=1000'>1000</a></td><td class='status${code}'>${text}</td><td>1 KB</td><td>1 MS</td><td>C++</td><td>10 B</td><td>2026-10-09 22:24:21</td></tr>`).join('\n');
    const page = parseStatusPage(`<html><body><table id="result-tab"><tbody>${body}</tbody></table></body></html>`);
    check('12 行全部解析', page.submissions.length === labels.length, `got ${page.submissions.length}`);
    labels.forEach(([code, text], i) => {
        const s = page.submissions[i];
        check(`status${code}(${text}) -> code ${code}/${describeVerdictCode(code).verdict}`, s?.verdictCode === code && s?.verdict === describeVerdictCode(code).verdict, `${s?.verdictCode}/${s?.verdict}`);
    });
    const upper = parseStatusPage(`<html><body><table id="result-tab"><tbody>
  <tr><td></td><td>6001</td><td><a href='userinfo.php?user=alice'>alice</a></td><td><a href='problem.php?id=1000'>1000</a></td><td class='STATUS4'>正确</td><td>1 KB</td><td>1 MS</td><td>C++</td><td>10 B</td><td>2026-10-09 22:24:21</td></tr>
  </tbody></table></body></html>`);
    check('大写 STATUS4 命中', upper.submissions[0]?.verdictCode === 4, String(upper.submissions[0]?.verdictCode));
    const invalid = parseStatusPage(`<html><body><table id="result-tab"><tbody>
  <tr><td></td><td>6002</td><td><a href='userinfo.php?user=bob'>bob</a></td><td><a href='problem.php?id=1000'>1000</a></td><td class='status12'>Compile OK</td><td>1 KB</td><td>1 MS</td><td>C++</td><td>10 B</td><td>2026-10-09 22:24:21</td></tr>
  </tbody></table></body></html>`);
    check('status12 非法 code 走文本归类', invalid.submissions[0]?.verdictCode === null && invalid.submissions[0]?.verdict === 'compile_error', `${invalid.submissions[0]?.verdictCode}/${invalid.submissions[0]?.verdict}`);
    check('verdictCodeFromLabel("运行并评判") === 3', verdictCodeFromLabel('运行并评判') === 3, String(verdictCodeFromLabel('运行并评判')));
}
console.log('\n=== ③ parseStatusPage 合成行矩阵（userRating / 裸数值 / 单位提取） ===');
{
    const html = `<html><body><table id="result-tab"><tbody>
  <tr class="oddrow"><td></td><td>1623001</td><td><a href='userinfo.php?user=alice'>alice</a></td><td><a href='problem.php?id=1000'>1000</a></td><td><a href='reinfo.php?sid=1623001'>正确</a></td><td>1712 KB</td><td>15 MS</td><td><a href='showsource.php?id=1623001'>C++</a></td><td>256 B</td><td>2026-10-09 22:24:21</td><td>saturn</td><td>-O2</td></tr>
  <tr class="evenrow"><td></td><td>1623002</td><td><a href='userinfo.php?user=bob'>bob</a></td><td><a href='problem.php?id=1001'>1001</a></td><td class="status_y">Accepted</td><td>3 MB</td><td>2 S</td><td>Python3</td><td>64 B</td><td>2026-10-09 22:25:00</td><td class='hidden-xs'>Expert</td><td class='hidden-xs'>-O2</td></tr>
  <tr class="oddrow"><td></td><td>1623003</td><td><a href='userinfo.php?user=carol'>carol</a></td><td><div class=center><a href='problem.php?id=1002' target='_blank'>1002</a></div></td><td><a href='reinfo.php?sid=1623003' class='btn btn-warning'>答案错误</a></td><td class='hidden-xs'><div id=center class=red>9376</div></td><td class='hidden-xs'><div id=center class=red>65</div></td><td class='hidden-xs'><a target=_blank href=showsource.php?id=1623003>G++</a></td><td class='hidden-xs'>1788 B</td><td>2026-10-09 22:26:00</td><td class='hidden-xs'>-</td><td class='hidden-xs'>-O2</td></tr>
  </tbody></table></body></html>`;
    const page = parseStatusPage(html);
    check('3 行解析', page.submissions.length === 3, `got ${page.submissions.length}`);
    const [a, b, c] = page.submissions;
    check('判题机 saturn 不被抓为 rating', a?.userRating === null, JSON.stringify(a?.userRating));
    check('-O2 不被抓为 rating', a?.userRating === null);
    check('用户 alice 正确', a?.user === 'alice', JSON.stringify(a?.user));
    check('内存 1712KB', a?.memoryKb === 1712, String(a?.memoryKb));
    check('时间 15MS', a?.timeMs === 15, String(a?.timeMs));
    check('代码长度 256B', a?.codeLength === 256, String(a?.codeLength));
    check('语言 C++', a?.language === 'C++', JSON.stringify(a?.language));
    check('badge Expert 保留为 rating', b?.userRating === 'Expert', JSON.stringify(b?.userRating));
    check('MB -> KB 换算 3MB=3072', b?.memoryKb === 3072, String(b?.memoryKb));
    check('S -> MS 换算 2S=2000', b?.timeMs === 2000, String(b?.timeMs));
    check('语言 Python3', b?.language === 'Python3', JSON.stringify(b?.language));
    check('裸内存 9376 保留', c?.memoryKb === 9376, String(c?.memoryKb));
    check('裸时间 65 保留', c?.timeMs === 65, String(c?.timeMs));
    check('语言 G++', c?.language === 'G++', JSON.stringify(c?.language));
    check('verdict 答案错误', c?.verdict === 'wrong_answer', String(c?.verdict));
}
console.log('\n=== ④ 榜单元格 AC 颜色全矩阵 ===');
{
    const acColors = ['#33ff33', '#53ff73', '#93ff93', '#aaffaa', '#00ff00', '#53ff53', '#aaaaff', 'rgb(51, 255, 51)', '33ff33'];
    const nonAcColors = ['#eeeeee', '#ffa0a0', 'rgb(255, 160, 160)', '#ff5555', '#aaaaee', 'red', ''];
    const fixed = '<th>排名</th><th>用户</th><th>昵称</th><th>通过</th><th>得分</th>';
    const header = fixed + [...acColors, ...nonAcColors].map((_, i) => `<th>P${i}</th>`).join('');
    const cells = [...acColors, ...nonAcColors].map((color) => color === ''
        ? '<td class=well>0</td>'
        : `<td class=well style="background-color: ${color}">1</td>`).join('');
    const html = `<html><body><table><thead><tr>${header}</tr></thead><tbody>
  <tr><td>1</td><td>alice</td><td></td><td>5</td><td>500</td>${cells}</tr>
  <tr><td>2</td><td>bob</td><td></td><td>0</td><td>0</td>${cells.replace(/background-color: /g, 'background:')}</tr>
  </tbody></table></body></html>`;
    const rank = parseContestRank(html, 1, true);
    check('2 行解析', rank.rows.length === 2, `got ${rank.rows.length}`);
    check('题头数量', rank.headers.length === acColors.length + nonAcColors.length, String(rank.headers.length));
    const first = rank.rows[0]?.cells.map((cell) => cell.accepted) ?? [];
    for (let i = 0; i < acColors.length; i++)
        check(`AC 色 ${acColors[i]}`, first[i] === true, String(first[i]));
    for (let i = 0; i < nonAcColors.length; i++)
        check(`非 AC 色 ${nonAcColors[i] || '(空)'}`, first[acColors.length + i] === false, String(first[acColors.length + i]));
    const second = rank.rows[1]?.cells.map((cell) => cell.accepted) ?? [];
    check('background: 简写同样生效', second.every((v) => v === true || v === false) && second.slice(0, acColors.length).every(Boolean), JSON.stringify(second));
    check('#aaaaff 一血视为 AC', first[6] === true);
    check('rgb(51,255,51) 视为 AC', first[7] === true);
    check('裸 33ff33 视为 AC', first[8] === true);
    check('行元数据', rank.rows[0]?.rank === 1 && rank.rows[0]?.userId === 'alice' && rank.rows[0]?.solved === 5 && rank.rows[0]?.score === 500, JSON.stringify(rank.rows[0] && { rank: rank.rows[0].rank, userId: rank.rows[0].userId, solved: rank.rows[0].solved, score: rank.rows[0].score }));
}
console.log('\n=== ④b rank-correct JSON 通道颜色矩阵 ===');
{
    const bgColors = ['33ff33', 'aaaaff', 'eeeeee', 'ffa0a0', '53ff73'];
    const payload = {
        contest: { contestId: 42, title: '测试赛' },
        headers: bgColors.map((_, i) => ({ num: `P${i}` })),
        rows: [{ rank: 1, userId: 'alice', nick: '', solved: 3, total: 300, cells: bgColors.map((bg) => ({ text: '1', bgColor: bg })) }],
    };
    const http = {
        get: async (url: string) => ({
            status: 200,
            url,
            headers: new Headers({ 'content-type': 'application/json' }),
            body: JSON.stringify(payload),
            serverTime: 0,
        }),
    } as unknown as HttpClient;
    const rank = await fetchContestRank(http, 42, false);
    check('JSON 行解析', rank.rows.length === 1, `got ${rank.rows.length}`);
    check('标题透传', rank.title === '测试赛', JSON.stringify(rank.title));
    bgColors.forEach((bg, i) => {
        const expectAc = bg !== 'eeeeee' && bg !== 'ffa0a0';
        check(`bgColor ${bg} -> ${expectAc}`, rank.rows[0]?.cells[i]?.accepted === expectAc, String(rank.rows[0]?.cells[i]?.accepted));
    });
}
console.log('\n=== ⑤ 倒计时保持网站源顺序（不排序） ===');
{
    const html = `<script>
    var today = new Date(new Date().setHours(0,0,0,0));
    var list = [ [ "Late", "2099-12-25" ], [ "Early", "2099-12-05" ], [ "Past", "2000-01-01" ], [ "Mid", "2099-12-15" ], [ "Final", "2099-12-31" ] ];
  </script>`;
    const items = parseCountdown(html);
    check('5 项中 4 项未来事件', items.length === 4, JSON.stringify(items.map((i) => i.event)));
    check('源顺序保持 [Late, Early, Mid, Final]', items.map((i) => i.event).join(',') === 'Late,Early,Mid,Final', items.map((i) => i.event).join(','));
    check('days 未排序', items.map((i) => i.days).join(',') === [25, 5, 15, 31].map((d) => {
        const now = new Date();
        const target = new Date(2099, 11, d).getTime();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return Math.floor((target - midnight) / 86400000);
    }).join(','), items.map((i) => i.days).join(','));
    check('Past 事件被过滤', !items.some((i) => i.event === 'Past'));
    check('日期字符串原样保留', items[0]?.date === '2099-12-25', JSON.stringify(items[0]?.date));
}
console.log('\n=== ⑥ fetchSource：尾部 /****** 注释块与 <!--not cached--> 剥离 ===');
{
    const client = (body: string, status = 200) => ({ get: async () => ({ status, body }) }) as unknown as HttpClient;
    const banner = '/**************************************************************\n * XMOJ JudgeServer - powered by HUSTOJ\n **************************************************************/\n';
    const source = await fetchSource(client(`int main() { return 0; }\n\n${banner}`), 1);
    check('尾部 banner 块剥离', source === 'int main() { return 0; }', JSON.stringify(source));
    const onlyBanner = await fetchSource(client(banner), 2);
    check('仅 banner 时返回空串', onlyBanner === '', JSON.stringify(onlyBanner));
    const inline = await fetchSource(client('const char* s = "/******";'), 3);
    check('字符串字面量中的 /****** 不误伤', inline === 'const char* s = "/******";', JSON.stringify(inline));
    const midCode = await fetchSource(client('/**** header note ****/\nint main() {}\n'), 4);
    check('代码前部大注释块保留', midCode === '/**** header note ****/\nint main() {}\n', JSON.stringify(midCode));
    const leadingMarker = await fetchSource(client('<!--not cached-->\nint main() {}'), 5);
    check('前部 <!--not cached--> 剥离', leadingMarker === 'int main() {}', JSON.stringify(leadingMarker));
    const trailingMarker = await fetchSource(client(`print(1)\n<!-- not-cached -->\n`), 6);
    check('尾部 <!--not cached--> 剥离', trailingMarker === 'print(1)', JSON.stringify(trailingMarker));
    const both = await fetchSource(client(`<!--not cached-->\nint main() {}\n${banner}`), 7);
    check('两种标记叠加剥离', both === 'int main() {}', JSON.stringify(both));
    const untouched = await fetchSource(client('#include <bits/stdc++.h>\n/* normal comment */\nint main() { return 0; }'), 8);
    check('普通代码完全不动', untouched === '#include <bits/stdc++.h>\n/* normal comment */\nint main() { return 0; }', JSON.stringify(untouched));
    check('HTML 响应 -> null', await fetchSource(client('<html><body>hidden</body></html>'), 9) === null);
    check('非 200 -> null', await fetchSource(client('', 403), 10) === null);
}
console.log(`\nParser deep suite: ${passed} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
