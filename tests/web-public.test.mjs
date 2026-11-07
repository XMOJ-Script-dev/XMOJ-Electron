import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestGet as problem } from '../functions/api/problem.ts';
import { onRequestGet as problemset } from '../functions/api/problemset.ts';
import { onRequestGet as status } from '../functions/api/status.ts';

const originalFetch = globalThis.fetch;
const origin = 'https://webxmoj.example';

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('problemset uses a bounded search and fixed upstream origin', async () => {
  const requests = [];
  globalThis.fetch = async url => {
    requests.push(String(url));
    return new Response(
      '<table id="problemset"><tbody><tr><td>1</td><td><a href="/problem.php?id=100">100 - Sample</a></td><td></td></tr></tbody></table>',
      { headers: { 'Content-Type': 'text/html' } },
    );
  };
  const response = await problemset({
    request: new Request(`${origin}/api/problemset?search=sample&url=https://attacker.example`),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(requests.length, 1);
  assert.equal(requests[0], 'https://www.xmoj.tech/problemset.php?page=1&search=sample');
  assert.equal(result.problems[0].id, 100);
});

test('oversized problemset searches are rejected before upstream access', async () => {
  let fetched = false;
  globalThis.fetch = async () => {
    fetched = true;
    return new Response('');
  };
  const response = await problemset({
    request: new Request(`${origin}/api/problemset?search=${'x'.repeat(101)}`),
  });
  assert.equal(response.status, 400);
  assert.equal(fetched, false);
});

test('problem endpoint validates ids and uses the fixed resource path', async () => {
  let fetched = false;
  const invalid = await problem({
    request: new Request(`${origin}/api/problem?id=1e8`),
  });
  assert.equal(invalid.status, 400);

  globalThis.fetch = async url => {
    fetched = true;
    assert.equal(String(url), 'https://www.xmoj.tech/problem.php?id=123');
    return new Response('<html><body></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };
  const valid = await problem({
    request: new Request(`${origin}/api/problem?id=123&url=https://attacker.example`),
  });
  assert.equal(valid.status, 200);
  assert.equal(fetched, true);
});

test('status filters are encoded to the fixed public status page', async () => {
  let fetchedUrl;
  globalThis.fetch = async url => {
    fetchedUrl = String(url);
    return new Response('<html><body></body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  };
  const response = await status({
    request: new Request(`${origin}/api/status?user=alice%26url%3Dattacker&top=12`),
  });
  assert.equal(response.status, 200);
  assert.equal(fetchedUrl, 'https://www.xmoj.tech/status.php?user_id=alice%26url%3Dattacker&top=12');
});
