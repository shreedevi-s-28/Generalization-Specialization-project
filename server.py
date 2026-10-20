#!/usr/bin/env python3
"""EER Lab server: serves the app and provides the secure ER/EER image-recognition endpoint.

    export ANTHROPIC_API_KEY=sk-ant-...      (or put it in a .env file next to this script)
    python3 server.py                        -> http://127.0.0.1:8000

Endpoints
    GET  /api/recognition-status   -> {"available": bool, "reason": str, "model": str}   (never returns the key)
    POST /api/recognize-diagram    raw PNG/JPEG/WebP body -> {"entities","relationships","isas","uncertain","model"}

The API key is read from the environment only. It is never sent to the browser, never logged.
Standard library only: no pip install needed.
"""
import base64, json, os, re, sys, threading, time, urllib.error, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))


def load_env_file():
    p = os.path.join(ROOT, '.env')
    if not os.path.isfile(p):
        return
    for line in open(p, encoding='utf-8'):
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env_file()
MODEL = os.environ.get('ANTHROPIC_MODEL', 'claude-sonnet-5-5')
UPSTREAM = os.environ.get('ANTHROPIC_BASE_URL', 'https://api.anthropic.com').rstrip('/')
MAX_IMAGE_BYTES = 6 * 1024 * 1024
RATE_LIMIT, RATE_WINDOW = int(os.environ.get('RECOG_RATE_PER_MIN', '10')), 60   # requests per IP per minute
UPSTREAM_TIMEOUT = 120

SYSTEM = ('You are an exact transcription tool for entity-relationship (ER) and enhanced ER (EER) diagrams. '
          'You only report what is actually drawn and legible. You never guess, never complete a diagram from domain '
          'knowledge and never invent names, attributes or constraints.')
PROMPT = """Read the attached image. It should be an ER or EER diagram (Elmasri-Navathe, Chen, crow's-foot or UML-like notation).

Transcribe ONLY what is visible. If something is not drawn or cannot be read, use null (for flags) or leave it out, and add a short note to "uncertain". Do not invent anything.

Reply with ONLY one JSON object, no prose, no markdown fences:
{
 "isErDiagram": true|false,
 "readable": true|false,
 "reason": "one sentence, required when isErDiagram or readable is false",
 "entities": [ { "name": "", "weak": true|false|null, "attributes": [ { "name": "", "key": true|false|null, "partialKey": true|false|null, "foreignKey": "name of the referenced entity or null", "derived": true|false|null, "multivalued": true|false|null, "uncertain": true|false } ], "uncertain": true|false } ],
 "relationships": [ { "name": "", "a": "entity name", "b": "entity name", "cardA": "1"|"N"|"M"|null, "cardB": "1"|"N"|"M"|null, "totalA": true|false|null, "totalB": true|false|null, "uncertain": true|false } ],
 "isas": [ { "superclass": "", "subclasses": [""], "disjoint": true|false|null, "total": true|false|null, "uncertain": true|false } ],
 "uncertain": [ "short notes about anything hard to read, cut off, ambiguous or not shown" ]
}
Rules:
- key=true only for attributes drawn as keys (underlined / marked PK).
- foreignKey: only when the diagram explicitly marks an attribute as a foreign key (FK, "references ..."). Otherwise null. Do not infer foreign keys from names.
- cardA is the cardinality on the "a" side exactly as drawn (1, N, M). null when not drawn.
- totalA/totalB: true for a double line (total participation), false for a single line (partial), null when the notation does not show it.
- isas: a superclass/subclass (specialization/generalization, ISA triangle or circle). disjoint=true for 'd', false for 'o'/overlap, null when no letter is shown. total=true for a double line from the superclass, false for a single line, null when not shown.
- Use entity names exactly as written. relationships "a" and "b" must be names that also appear in "entities".
- A relationship with three or more participants: list the pairs you can read and mention the ternary relationship in "uncertain".
- If the image is not an ER/EER diagram set isErDiagram=false. If it is but too blurry/small to read set readable=false."""


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def sniff(b):
    if b[:4] == b'\x89PNG':
        return 'image/png'
    if b[:3] == b'\xff\xd8\xff':
        return 'image/jpeg'
    if b[:4] == b'RIFF' and b[8:12] == b'WEBP':
        return 'image/webp'
    return ''


def parse_model_json(text):
    t = re.sub(r'^```(?:json)?\s*|\s*```$', '', (text or '').strip(), flags=re.I)
    try:
        return json.loads(t)
    except ValueError:
        a, z = t.find('{'), t.rfind('}')
        if a >= 0 and z > a:
            try:
                return json.loads(t[a:z + 1])
            except ValueError:
                pass
    raise ApiError(502, 'bad_response', 'The AI replied, but not with readable JSON. Try again; if it keeps happening use a clearer image.')


def s(x):
    return '' if x is None else str(x).strip()


def tri(v):
    return v if isinstance(v, bool) else None


def card(v):
    if v in ('1', 1):
        return '1'
    if v in ('N', 'M', 'n', 'm', '*'):
        return 'N'
    return None


def normalize(d):
    """Validate/clean the model output. Enforces 'do not invent': anything referring to unknown entities is dropped and disclosed."""
    if not isinstance(d, dict):
        raise ApiError(502, 'bad_response', 'The AI reply had an unexpected shape.')
    if d.get('isErDiagram') is False:
        raise ApiError(422, 'not_er', 'This image was not recognised as an ER/EER diagram.' + (' ' + s(d.get('reason')) if d.get('reason') else ''))
    if d.get('readable') is False:
        raise ApiError(422, 'unreadable', 'The diagram could not be read.' + (' ' + s(d.get('reason')) if d.get('reason') else ' Try a larger or sharper image.'))
    uncertain = [s(x) for x in (d.get('uncertain') if isinstance(d.get('uncertain'), list) else []) if s(x)]
    entities, seen = [], set()
    for e in (d.get('entities') if isinstance(d.get('entities'), list) else []):
        if not isinstance(e, dict):
            continue
        name = s(e.get('name'))
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        attrs, an = [], set()
        for a in (e.get('attributes') if isinstance(e.get('attributes'), list) else []):
            a = {'name': a} if isinstance(a, str) else (a if isinstance(a, dict) else {})
            n = s(a.get('name'))
            if not n or n.lower() in an:
                continue
            an.add(n.lower())
            attrs.append({'name': n, 'key': a.get('key') is True, 'partialKey': a.get('partialKey') is True,
                          'foreignKey': s(a.get('foreignKey')) or None, 'derived': a.get('derived') is True,
                          'multivalued': a.get('multivalued') is True, 'uncertain': bool(a.get('uncertain'))})
        entities.append({'name': name, 'weak': tri(e.get('weak')), 'uncertain': bool(e.get('uncertain')), 'attributes': attrs})
    if not entities:
        raise ApiError(422, 'unreadable', 'No entities could be read from this image. It may not be an ER/EER diagram or may be too unclear.')
    names = {e['name'].lower() for e in entities}
    fixed = {n: n for n in names}
    # foreign keys: keep only those that reference an entity that exists in the diagram
    for e in entities:
        fks = []
        for a in e['attributes']:
            if a['foreignKey']:
                if a['foreignKey'].lower() in names:
                    ref = next(x['name'] for x in entities if x['name'].lower() == a['foreignKey'].lower())
                    a['foreignKey'] = ref
                    fks.append({'attribute': a['name'], 'references': ref})
                else:
                    uncertain.append('Foreign key %s.%s points to "%s", which is not an entity in the diagram; the foreign-key mark was dropped.' % (e['name'], a['name'], a['foreignKey']))
                    a['foreignKey'] = None
        e['foreignKeys'] = fks
    rels, dropped = [], 0
    raw_rels = d.get('relationships') if isinstance(d.get('relationships'), list) else []
    for r in raw_rels:
        if not isinstance(r, dict):
            dropped += 1
            continue
        a, b = s(r.get('a')), s(r.get('b'))
        if a.lower() in names and b.lower() in names and a.lower() != b.lower():
            rels.append({'name': s(r.get('name')), 'a': a, 'b': b, 'cardA': card(r.get('cardA')), 'cardB': card(r.get('cardB')),
                         'totalA': tri(r.get('totalA')), 'totalB': tri(r.get('totalB')), 'uncertain': bool(r.get('uncertain'))})
        else:
            dropped += 1
    isas = []
    raw_isas = d.get('isas') if isinstance(d.get('isas'), list) else []
    for g in raw_isas:
        if not isinstance(g, dict):
            dropped += 1
            continue
        sup = s(g.get('superclass'))
        subs = [s(x) for x in (g.get('subclasses') if isinstance(g.get('subclasses'), list) else []) if s(x).lower() in names]
        if sup.lower() in names and subs:
            isas.append({'superclass': sup, 'subclasses': subs, 'disjoint': tri(g.get('disjoint')), 'total': tri(g.get('total')), 'uncertain': bool(g.get('uncertain'))})
        else:
            dropped += 1
    if dropped:
        uncertain.append('%d relationship/specialization item(s) referred to entity names that are not in the entity list and were left out.' % dropped)
    return {'entities': entities, 'relationships': rels, 'isas': isas, 'uncertain': uncertain}


def call_model(media_type, b64):
    key = os.environ.get('ANTHROPIC_API_KEY', '').strip()
    if not key:
        raise ApiError(503, 'unavailable', 'Image recognition is not configured on the server. Set ANTHROPIC_API_KEY and restart server.py.')
    body = json.dumps({'model': MODEL, 'max_tokens': 6000, 'temperature': 0, 'system': SYSTEM,
                       'messages': [{'role': 'user', 'content': [
                           {'type': 'image', 'source': {'type': 'base64', 'media_type': media_type, 'data': b64}},
                           {'type': 'text', 'text': PROMPT}]}]}).encode()
    req = urllib.request.Request(UPSTREAM + '/v1/messages', data=body, method='POST',
                                 headers={'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01'})
    try:
        with urllib.request.urlopen(req, timeout=UPSTREAM_TIMEOUT) as r:
            resp = json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read().decode('utf-8')).get('error', {}).get('message', '')
        except Exception:
            msg = ''
        sys.stderr.write('upstream HTTP %s: %s\n' % (e.code, msg[:200]))      # never logs the key
        if e.code in (401, 403):
            raise ApiError(502, 'auth', 'The server\'s API key was rejected by the AI provider. The server administrator must fix ANTHROPIC_API_KEY.')
        if e.code == 404:
            raise ApiError(502, 'model', 'The configured model "%s" was not found for this key. Set ANTHROPIC_MODEL to a vision-capable model.' % MODEL)
        if e.code == 429:
            raise ApiError(429, 'rate_limited', 'The AI provider rate limit or quota was reached. Wait a moment and try again.')
        if e.code == 413:
            raise ApiError(413, 'too_large', 'The AI provider says the image is too large. Use a smaller export.')
        if e.code >= 500:
            raise ApiError(502, 'overloaded', 'The AI provider is temporarily overloaded or down. Try again in a minute.')
        raise ApiError(502, 'api', 'The AI provider returned an error (HTTP %s).' % e.code)
    except (urllib.error.URLError, OSError) as e:
        if 'timed out' in str(e):
            raise ApiError(504, 'network', 'The AI provider took too long to answer. Try again.')
        raise ApiError(502, 'network', 'The server could not reach the AI provider. Check the server\'s internet connection.')
    text = '\n'.join(c.get('text', '') for c in resp.get('content', []) if c.get('type') == 'text')
    if not text:
        raise ApiError(502, 'bad_response', 'The AI returned an empty reply' + (' (it declined to process the image).' if resp.get('stop_reason') == 'refusal' else '.'))
    return parse_model_json(text), resp.get('stop_reason') == 'max_tokens'


_hits, _lock = {}, threading.Lock()


def rate_ok(ip):
    now = time.time()
    with _lock:
        q = [t for t in _hits.get(ip, []) if now - t < RATE_WINDOW]
        if len(q) >= RATE_LIMIT:
            _hits[ip] = q
            return False
        q.append(now)
        _hits[ip] = q
        return True


STATIC = {'/': 'index.html', '/index.html': 'index.html'}
MIME = {'.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp'}


class Handler(BaseHTTPRequestHandler):
    server_version = 'EERLab'

    def log_message(self, fmt, *a):
        sys.stderr.write('%s %s\n' % (self.address_string(), fmt % a))

    def _send(self, status, obj=None, raw=None, ctype='application/json'):
        data = raw if raw is not None else json.dumps(obj).encode()
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)

    def _err(self, e):
        self._send(e.status, {'error': {'code': e.code, 'message': e.message}})

    def _same_origin(self):
        o = self.headers.get('Origin')
        return not o or urlparse(o).netloc == self.headers.get('Host')

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/recognition-status':
            on = bool(os.environ.get('ANTHROPIC_API_KEY', '').strip())
            return self._send(200, {'available': on, 'model': MODEL, 'reason': '' if on else 'The server has no AI key configured. Set ANTHROPIC_API_KEY (or add it to .env) and restart server.py.'})
        rel = STATIC.get(path) or (path.lstrip('/') if path.startswith('/assets/') else None)
        if rel:
            full = os.path.realpath(os.path.join(ROOT, rel))
            if full.startswith(os.path.join(ROOT, '')) and os.path.isfile(full):
                return self._send(200, raw=open(full, 'rb').read(), ctype=MIME.get(os.path.splitext(full)[1].lower(), 'application/octet-stream'))
        self._send(404, {'error': {'code': 'not_found', 'message': 'Not found'}})

    def do_POST(self):
        try:
            if urlparse(self.path).path != '/api/recognize-diagram':
                raise ApiError(404, 'not_found', 'Not found')
            if not self._same_origin():
                raise ApiError(403, 'forbidden', 'Cross-site requests are not allowed.')
            ctype = (self.headers.get('Content-Type') or '').split(';')[0].strip().lower()
            if ctype not in ('image/png', 'image/jpeg', 'image/webp'):
                raise ApiError(415, 'read_failed', 'Send the diagram as a PNG, JPEG or WebP image body.')
            n = int(self.headers.get('Content-Length') or 0)
            if n <= 0 or n > MAX_IMAGE_BYTES:
                raise ApiError(413, 'too_large', 'The upload is empty or larger than the %d MB limit.' % (MAX_IMAGE_BYTES // 2**20))
            if not rate_ok(self.client_address[0]):
                raise ApiError(429, 'rate_limited', 'Too many requests. Wait a minute and try again.')
            raw = self.rfile.read(n)
            real = sniff(raw)
            if not real:
                raise ApiError(400, 'read_failed', 'The file is not a PNG, JPG or WebP image.')
            if not os.environ.get('ANTHROPIC_API_KEY', '').strip():
                raise ApiError(503, 'unavailable', 'Image recognition is not configured on the server. Set ANTHROPIC_API_KEY and restart server.py.')
            data, truncated = call_model(real, base64.b64encode(raw).decode())   # media type comes from the bytes, not the client
            result = normalize(data)
            if truncated:
                result['uncertain'].append('The AI reply was cut off because the diagram is large. Some items at the end may be missing.')
            result['model'] = MODEL
            self._send(200, result)
        except ApiError as e:
            self._err(e)
        except Exception as e:                                   # never leak internals or secrets
            sys.stderr.write('internal error: %r\n' % (e,))
            self._err(ApiError(500, 'internal', 'Unexpected server error.'))


if __name__ == '__main__':
    host, port = os.environ.get('HOST', '127.0.0.1'), int(os.environ.get('PORT', '8000'))
    if not os.path.isfile(os.path.join(ROOT, 'index.html')):
        sys.exit('index.html not found. Run: python3 build.py')
    print('EER Lab on http://%s:%d   | image recognition: %s (model %s)' % (host, port, 'READY' if os.environ.get('ANTHROPIC_API_KEY', '').strip() else 'NOT CONFIGURED - set ANTHROPIC_API_KEY', MODEL))
    ThreadingHTTPServer((host, port), Handler).serve_forever()
