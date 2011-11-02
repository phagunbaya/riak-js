var Meta = require('../lib/http-meta'),
  assert = require('assert'),
  test = require('../lib/utils').test;

test('Sets its attributes');

var meta = new Meta({ bucket: 'bucket', key: 'key', contentType: 'png', data: 'd32n92390XMIW0' });

assert.equal(meta.bucket, 'bucket');
assert.equal(meta.key, 'key');
assert.equal(meta.vclock, null);
assert.equal(meta.contentType, 'image/png');
assert.equal(meta.data, 'd32n92390XMIW0');

test('Gives back its HTTP path');

meta = new Meta({ bucket: 'bucket', key: 'key' });
assert.equal("/riak/bucket/key", meta.path);

meta.resource = 'luwak';
meta.bucket = '';
assert.equal("/luwak/key", meta.path);

test('Parses headers when loaded with a Riak HTTP response');

var riakResponse = {
  httpVersion: '1.1',
  headers: {
    vary: 'Accept-Encoding',
    server: 'MochiWeb/1.1 WebMachine/1.7.1 (participate in the frantic)',
    'x-riak-vclock': 'a85hYGBgzGDKBVIsbLvm1WYwJTLmsTLcjeE5ypcFAA==',
    'x-riak-meta-acl': 'users:r,administrators:f',
    link: '</riak/test>; rel="up", </riak/test/doc%252%24%40>; riaktag="next"',
    'last-modified': 'Wed, 10 Mar 2010 18:11:41 GMT',
    etag: '6dQBm9oYA1mxRSH0e96l5W',
    date: 'Wed, 10 Mar 2010 18:11:52 GMT',
    'content-type': 'text/rtf',
    'content-length': '2946'
  },
  statusCode: 200
}

meta = new Meta({ bucket: 'bucket', key: 'key' });
meta.loadResponse(riakResponse);

// assert.deepEqual(meta.usermeta, { acl: 'users:r,administrators:f' }); -- usermeta is not supported
assert.equal(meta.statusCode, 200);
assert.equal(meta.date, undefined);
assert.equal(new Date(meta.lastMod).getTime(), 1268244701000);
// assert.deepEqual(meta.links, [{ bucket: 'test', key: 'doc%2$@', tag: 'next' }]); -- not yet implemented
assert.equal(meta.contentType, 'text/rtf');
assert.equal(meta.path, '/riak/bucket/key');

test('Custom headers are correctly included and override');

meta = new Meta({
  links: [{ bucket: 'test', key: 'doc%2$@', tag: 'next' }],
  headers: { Authorization: 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==', 'X-Riak-Meta-fire': 'yes' }
});

headers = meta.headers;

assert.equal(headers.statusCode, undefined);
assert.equal(headers['X-Riak-Meta-fire'], 'yes');
// assert.equal(headers['Link'], '</riak/test/doc%252%24%40>; riaktag="next"'); -- not yet implemented
assert.equal(headers['Authorization'], 'Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==');

test('It returns its location from a POST request');

riakResponse = {
  headers: {
    location: '/riak/test/bzPygTesROPtGGVUKfyvp2RR49'
  },
  statusCode: 201
}

meta = new Meta();
meta.loadResponse(riakResponse);

assert.equal(meta.bucket, 'test');
assert.equal(meta.key, 'bzPygTesROPtGGVUKfyvp2RR49');
assert.equal(meta.statusCode, 201);

test('It guesses its content type');

headers = new Meta({ data: { test: true } }).headers;

assert.equal(headers['Content-Type'], 'application/json');
assert.equal(headers['Link'], undefined);

test('Does not send clientId if there is no vclock');

headers = new Meta().headers;
assert.equal(headers['X-Riak-ClientId'], undefined);

test('responseEncoding is a Riak property');

meta = new Meta({ data: new Buffer('binary-data'), responseEncoding: 'binary' });
assert.equal(meta.responseEncoding, 'binary');

test('It returns its full path including query properties');

meta = new Meta({
  bucket: 'bucket',
  key: 'key',
  r: 1,
  w: 2,
  dw: 2,
  rw: 2,
  keys: true,
  props: false,
  vtag: 'asweetvtag',
  returnbody: true,
  chunked: true
});

assert.equal("/riak/bucket/key?r=1&w=2&dw=2&rw=2&keys=true&props=false&vtag=asweetvtag&returnbody=true&chunked=true", meta.path);

test('Returns an URI-encoded path if used with encodeUri option');

meta = new Meta({
  bucket: 'spåce bucket',
  key: 'çøµπléx–key',
  encodeUri: true
});

assert.equal("/riak/sp%C3%A5ce%20bucket/%C3%A7%C3%B8%C2%B5%CF%80l%C3%A9x%E2%80%93key", meta.path);