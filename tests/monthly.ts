import assert from 'node:assert/strict';
import { parseMonthlyBoard } from '../electron/extras.ts';
const html = `<div class="col-md-8">
<h4 class="ui block top attached header"><div class="content">关于月赛</div></h4><div class="segment">报名规则</div>
<h4 class="ui block top attached header"><div class="content">月赛公告</div><small>2099-01-01</small></h4><div class="segment news_content"><p><b>正文</b></p></div>
</div><div class="col-md-4"><h4 class="ui block top attached header"><div class="content">我的月赛</div></h4><div class="segment"><a href="/open_contest_score.php">成绩查询</a></div></div>
<script>var list = [["近期比赛","2099-01-04"],["已结束","2098-01-01"]];</script>`;
const time = new Date(2099, 0, 1).getTime();
const board = parseMonthlyBoard(html, time);
assert.equal(board.cards[0].title, '关于月赛');
assert.equal(board.cards.at(-1)?.title, '我的月赛');
assert.deepEqual(board.countdown, [{ event: '近期比赛', date: '2099-01-04', days: 3 }]);
assert.equal(board.serverTime, time);
console.log('Monthly parsing passed: announcements, my monthly links, server clock and countdown.');
