import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { onRequestGet, md5 } from '../functions/api/avatar.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('MD5 uses UTF-8 bytes and matches known email-avatar digests', () => {
  assert.equal(md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(md5('abc'), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(md5('test@example.com'), '55502f40dc8b7c769880b10874abc9d0');
});

test('avatar endpoint returns only the digest and avatar URL', async () => {
  let requested;
  globalThis.fetch = async url => {
    requested = String(url);
    return new Response('<input name="email" value="Test@Example.com">', {
      headers: { 'Content-Type': 'text/html' },
    });
  };

  const response = await onRequestGet({
    request: new Request('https://webxmoj.example/api/avatar?username=testuser'),
    env: {},
  });
  assert.equal(response.status, 200);
  assert.equal(requested, 'https://www.xmoj.tech/userinfo.php?user=testuser');
  assert.deepEqual(await response.json(), {
    avatar: {
      hash: '55502f40dc8b7c769880b10874abc9d0',
      url: 'https://cravatar.cn/avatar/55502f40dc8b7c769880b10874abc9d0?retro=1&s=160',
    },
  });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('avatar lookup rejects invalid names and does not request upstream', async () => {
  let contacted = false;
  globalThis.fetch = async () => {
    contacted = true;
    return new Response('');
  };
  const response = await onRequestGet({
    request: new Request('https://webxmoj.example/api/avatar?username=%0A'),
    env: {},
  });
  assert.equal(response.status, 400);
  assert.equal(contacted, false);
});
