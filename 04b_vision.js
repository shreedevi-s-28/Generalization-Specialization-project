/* ===== ER / EER diagram image recognition =====
   The browser never talks to an AI service and holds no API key. It validates the image, downscales it and POSTs it to
   the EER Lab server (server.py): POST /api/recognize-diagram. The server holds the key, calls the vision model, parses
   and validates the answer and returns structured JSON. If the server is missing or not configured, recognition is
   reported as unavailable. Nothing is faked. */
class RecogError extends Error { constructor(code, message) { super(message); this.code = code; } }

const VISION_MAX_BYTES = 8e6, VISION_MAX_EDGE = 1568;
const VISION_TYPES = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' };
/* Real format from the first bytes (the browser-reported MIME type and the extension can both be wrong). */
async function sniffImageType(file) {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  return '';
}
/* Validate an uploaded file. Returns {ok:true,type} or {ok:false,msg}. */
async function validateDiagramFile(f) {
  let type = '';
  try { type = await sniffImageType(f); } catch (e) { return { ok: false, msg: 'The file could not be read from disk. Try selecting it again.' }; }
  if (type === 'application/pdf') return { ok: true, type, pdf: true };
  if (!VISION_TYPES[type]) return { ok: false, msg: 'This is not a PNG, JPG or WebP image (its contents do not match). Export the diagram as one of those formats.' };
  if (f.size > VISION_MAX_BYTES) return { ok: false, msg: `The image is ${(f.size / 1e6).toFixed(1)} MB. The limit is 8 MB. Save a smaller copy.` };
  if (f.size < 1500) return { ok: false, msg: 'The file is too small to be a diagram.' };
  return { ok: true, type };
}
/* Decode, downscale to at most 1568px on the long edge and return a PNG/JPEG Blob ready to upload. */
function prepareImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); rej(new RecogError('read_failed', 'The browser could not decode this image. It may be corrupt. Re-export it and try again.')); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth, h = img.naturalHeight;
      if (w < 120 || h < 120) return rej(new RecogError('unreadable', `The image is only ${w}×${h}px, too small to read any text from. Use a larger export.`));
      const k = Math.min(1, VISION_MAX_EDGE / Math.max(w, h)), cw = Math.round(w * k), ch = Math.round(h * k);
      const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const cx = cv.getContext('2d');
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch); cx.drawImage(img, 0, 0, cw, ch);
      cv.toBlob(png => {
        if (!png) return rej(new RecogError('read_failed', 'The image could not be prepared for upload.'));
        if (png.size <= 5.5e6) return res({ blob: png, origW: w, origH: h });
        cv.toBlob(jpg => jpg ? res({ blob: jpg, origW: w, origH: h }) : rej(new RecogError('too_large', 'The image is too large even after shrinking.')), 'image/jpeg', 0.9);
      }, 'image/png');
    };
    img.src = url;
  });
}

/* Ask the server what it can do. Never throws. */
async function visionCapability() {
  const why = 'The EER Lab server is not reachable, so images cannot be read. Start it with “python3 server.py” and open the app at the address it prints (not by double-clicking index.html).';
  try {
    const r = await fetch('/api/recognition-status', { cache: 'no-store' });
    if (!r.ok || !/json/.test(r.headers.get('content-type') || '')) return { ok: false, why };
    const j = await r.json();
    return j.available ? { ok: true, label: 'EER Lab server · ' + (j.model || 'vision model') } : { ok: false, why: j.reason || 'The server has image recognition switched off.' };
  } catch (e) { return { ok: false, why }; }
}

/* Upload the image; the server returns validated JSON {entities, relationships, isas, uncertain, model}. */
async function recognizeDiagram(file, signal) {
  const cap = await visionCapability();
  if (!cap.ok) throw new RecogError('unavailable', cap.why);
  const v = await validateDiagramFile(file);
  if (!v.ok) throw new RecogError('read_failed', v.msg);
  if (v.pdf) throw new RecogError('read_failed', 'PDFs cannot be read here. Export the diagram as PNG, JPG or WebP.');
  const img = await prepareImage(file);
  let r;
  try { r = await fetch('/api/recognize-diagram', { method: 'POST', headers: { 'Content-Type': img.blob.type }, body: img.blob, signal }); }
  catch (e) {
    if (e && e.name === 'AbortError') throw new RecogError('cancelled', 'Stopped.');
    throw new RecogError('unavailable', 'Lost contact with the EER Lab server. Check that “python3 server.py” is still running.');
  }
  let body = null; try { body = await r.json(); } catch (e) { }
  if (!r.ok) { const er = (body && body.error) || {}; throw new RecogError(er.code || 'api', er.message || ('The server returned an error (HTTP ' + r.status + ').')); }
  if (!body || !Array.isArray(body.entities) || !body.entities.length) throw new RecogError('bad_response', 'The server reply was not a valid recognition result.');
  const arr = x => Array.isArray(x) ? x : [];
  return { result: { entities: body.entities, relationships: arr(body.relationships), isas: arr(body.isas), uncertain: arr(body.uncertain) }, provider: 'EER Lab server · ' + (body.model || 'vision model'), img: { w: img.origW, h: img.origH } };
}
const RECOG_ERR_TITLE = { unavailable: 'Recognition is not available', read_failed: 'The image could not be read', unreadable: 'The diagram is not readable', not_er: 'Not recognised as an ER/EER diagram', auth: 'Server API key problem', network: 'Server could not reach the AI service', rate_limited: 'Rate limit reached', model: 'Model not found', overloaded: 'AI service busy', bad_response: 'Unusable AI reply', api: 'AI service error', too_large: 'Image too large', forbidden: 'Request blocked', cancelled: 'Stopped' };
