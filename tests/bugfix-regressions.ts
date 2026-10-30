import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseProblemsetPage, parseStatusPage, parseCountdown, describeVerdictCode, verdictCodeFromLabel } from '../electron/parsers.ts';
import { parseContestRank, fetchContestRank } from '../electron/rank.ts';
import type { HttpClient } from '../electron/http.ts';
const here = path.dirname(fileURLToPath(import.meta.url));
const dump = (name: string) => readFileSync(path.join(here, 'live-dump', name), 'utf8');
console.log('=== 标题清洗：仅剥离「数字+分隔符」前缀 ===');
{
    const html = `<html><body><table id="problemset"><tbody>
  <tr><td></td><td><a href="problem.php?id=11710">11710: 24小时降水量</a></td><td>0/0</td></tr>
  <tr><td></td><td><a href="problem.php?id=11710">11710 - 24小时降水量</a></td><td>0/0</td></tr>
  <tr><td></td><td><a href="problem.php?id=11710">24小时降水量</a></td><td>0/0</td></tr>
  <tr><td></td><td><a href="problem.php?id=1000">1000 - A+B Problem</a></td><td>0/0</td></tr>
  </tbody></table></body></html>`;
    const page = parseProblemsetPage(html);
    assert.equal(page.problems.length, 4);
    assert.equal(page.problems[0]?.title, '24小时降水量', JSON.stringify(page.problems[0]?.title));
    assert.equal(page.problems[1]?.title, '24小时降水量', JSON.stringify(page.problems[1]?.title));
    assert.equal(page.problems[2]?.title, '24小时降水量', JSON.stringify(page.problems[2]?.title));
    assert.equal(page.problems[3]?.title, 'A+B Problem', JSON.stringify(page.problems[3]?.title));
}
console.log('=== JUDGE_RESULTS code 3（运行并评判 -> pending） ===');
{
    assert.equal(verdictCodeFromLabel('运行并评判'), 3, String(verdictCodeFromLabel('运行并评判')));
    assert.equal(describeVerdictCode(3).verdict, 'pending', describeVerdictCode(3).verdict);
    assert.equal(describeVerdictCode(3).label, 'Running', describeVerdictCode(3).label);
    const html = `<html><body><table id="result-tab"><tbody>
  <tr class="oddrow"><td></td><td>1623001</td><td><a href='userinfo.php?user=alice'>alice</a></td><td><div class=center><a href='problem.php?id=1000' target='_blank'>1000</a></div></td><td><a href='reinfo.php?sid=1623001' class='btn btn-info' title='点击看详细'>运行并评判</a></td><td class='hidden-xs'><div id=center>0</div></td><td class='hidden-xs'><div id=center>0</div></td><td class='hidden-xs'><a target=_blank href=showsource.php?id=1623001>C++</a></td><td class='hidden-xs'>100 B</td><td>2026-10-09 22:24:21</td><td class='hidden-xs'>saturn</td><td class='hidden-xs'>-O2</td></tr>
  </tbody></table></body></html>`;
    const page = parseStatusPage(html);
    const [s] = page.submissions;
    assert.equal(s?.verdictCode, 3, String(s?.verdictCode));
    assert.equal(s?.verdict, 'pending', String(s?.verdict));
}
console.log('=== userRating 不再误抓判题机列 ===');
{
    const page = parseStatusPage(dump('status.html'));
    assert.ok(page.submissions.length > 0, 'fixture rows parsed');
    for (const s of page.submissions) {
        assert.equal(s.userRating, null, `id=${s.id} userRating=${JSON.stringify(s.userRating)}`);
        assert.equal(s.user, 'shanwenxiao', JSON.stringify(s.user));
    }
    const withBadge = parseStatusPage(`<html><body><table id="result-tab"><tbody>
  <tr><td></td><td>1</td><td><a href='userinfo.php?user=alice'>alice</a></td><td><a href='problem.php?id=1000'>1000</a></td><td class="status_y">Accepted</td><td>1 KB</td><td>1 MS</td><td>C++</td><td>10 B</td><td>2026-10-09 22:24:21</td><td class='hidden-xs'>Expert</td></tr>
  </tbody></table></body></html>`);
    assert.equal(withBadge.submissions[0]?.userRating, 'Expert', JSON.stringify(withBadge.submissions[0]?.userRating));
}
console.log('=== 榜单元格 AC 颜色（G=255 或一血 #aaaaff） ===');
{
    const html = `<html><body><table id="rank"><thead><tr><th>排名</th><th>用户</th><th>昵称</th><th>通过</th><th>得分</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>
  <tr><td>1</td><td>alice</td><td></td><td>4</td><td>400</td><td class=well style='background-color:#33ff33'>100</td><td class=well style='background-color:#73ff73'>100</td><td class=well style='background-color:#aaaaff'>100</td><td class=well style="background-color: rgb(51, 255, 51)">100</td></tr>
  <tr><td>2</td><td>bob</td><td></td><td>0</td><td>10</td><td class=well style='background-color:#ffa0a0'>10</td><td class=well style='background-color:#eeeeee'></td><td class=well style='background-color: rgb(255, 160, 160)'>5</td><td class=well></td></tr>
  </tbody></table></body></html>`;
    const rank = parseContestRank(html, 1, false);
    const first = rank.rows[0]?.cells.map((c) => c.accepted);
    assert.deepEqual(first, [true, true, true, true], JSON.stringify(first));
    const second = rank.rows[1]?.cells.map((c) => c.accepted);
    assert.deepEqual(second, [false, false, false, false], JSON.stringify(second));
}
{
    for (const [file, oi] of [['audit-contestrank-oi-10786.html', true], ['audit-contestrank-correct-10786.html', false]] as const) {
        const rank = parseContestRank(dump(file), 10786, oi);
        assert.ok(rank.rows.length > 0, `${file} rows`);
        const acceptedCount = rank.rows.reduce((sum, row) => sum + row.cells.filter((c) => c.accepted).length, 0);
        assert.ok(acceptedCount > 0, `${file} accepted cells via G=255 heuristic`);
    }
}
{
    const jsonText = dump('audit-contest-rank-correct-json.json');
    const payload = JSON.parse(jsonText);
    const colors = new Set<string>();
    for (const row of payload.rows ?? [])
        for (const cell of row.cells ?? [])
            if (cell.bgColor)
                colors.add(String(cell.bgColor).toLowerCase());
    assert.ok(colors.has('33ff33'), JSON.stringify([...colors]));
    assert.ok(colors.has('aaaaff'), JSON.stringify([...colors]));
    const http = {
        get: async (url: string) => {
            assert.ok(url.includes('rank-correct'), url);
            return {
                status: 200,
                url,
                headers: new Headers({ 'content-type': 'application/json' }),
                body: jsonText,
                serverTime: 0,
            };
        },
    } as unknown as HttpClient;
    const rank = await fetchContestRank(http, 10786, false);
    assert.ok(rank.rows.length > 0, 'json rows');
    const acceptedCount = rank.rows.reduce((sum, row) => sum + row.cells.filter((c) => c.accepted).length, 0);
    assert.ok(acceptedCount > 0, `json accepted cells, got ${acceptedCount}`);
    for (const row of rank.rows) {
        for (let i = 0; i < row.cells.length; i++) {
            const cell = row.cells[i]!;
            const bg = String((payload.rows as { cells?: { bgColor?: string }[] }[])[rank.rows.indexOf(row)]?.cells?.[i]?.bgColor ?? '').toLowerCase();
            if (bg === 'eeeeee')
                assert.equal(cell.accepted, false, `bgColor=${bg} text=${cell.text}`);
            else if (/^[0-9a-f]{2}ff[0-9a-f]{2}$/.test(bg) || bg === 'aaaaff')
                assert.equal(cell.accepted, true, `bgColor=${bg} text=${cell.text}`);
        }
    }
}
console.log('=== 倒计时保持网站源顺序 ===');
{
    const items = parseCountdown(dump('index.html'));
    assert.ok(items.length > 1, `got ${items.length}`);
    assert.equal(items[0]?.event, 'GESP 2026 12月', JSON.stringify(items[0]?.event));
    for (let i = 1; i < items.length; i++)
        assert.ok(items[i - 1]!.days >= items[i]!.days, `order broken at ${i}: ${items[i - 1]!.days} < ${items[i]!.days}`);
}
console.log('Bug-fix regressions passed.');
