// ---- shared library (inlined into every WF09 code node; needs `cfg` defined above) ----
function sha256(str) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes = []; const enc = unescape(encodeURIComponent(String(str)));
  for (let i = 0; i < enc.length; i++) bytes.push(enc.charCodeAt(i));
  const bitLen = bytes.length * 8; bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const hi = Math.floor(bitLen / 4294967296); const lo = bitLen >>> 0;
  [hi, lo].forEach((w) => { bytes.push((w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255); });
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < bytes.length; off += 64) {
    const w = new Array(64);
    for (let i = 0; i < 16; i++) w[i] = ((bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) | (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3]) >>> 0;
    for (let i = 16; i < 64; i++) { const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3); const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0; }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) { const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25); const ch = (e & f) ^ (~e & g); const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0; const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22); const mj = (a & b) ^ (a & c) ^ (b & c); const t2 = (S0 + mj) >>> 0; hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0; }
    h = [(h[0] + a) >>> 0, (h[1] + b) >>> 0, (h[2] + c) >>> 0, (h[3] + d) >>> 0, (h[4] + e) >>> 0, (h[5] + f) >>> 0, (h[6] + g) >>> 0, (h[7] + hh) >>> 0];
  }
  return h.map((x) => x.toString(16).padStart(8, '0')).join('');
}
const HS = (parts) => sha256(String(cfg.hash_salt || '') + '|' + parts.join('|')).slice(0, 24);
function normPhone(raw) {
  let s = String(raw || '').split('@')[0].trim(); const plus = s.startsWith('+');
  let d = s.replace(/\D/g, ''); if (!d) return '';
  if (!plus) { if (d.startsWith('00')) d = d.slice(2); else if (d.startsWith('0')) d = '62' + d.slice(1); }
  if (d.length < 9 || d.length > 15) return '';
  if (!plus && !d.startsWith('62')) return '';
  return '+' + d;
}
const NF = (s) => String(s || '').normalize('NFKC').toLowerCase();
const rxe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wre = (b) => new RegExp('(?<![a-z0-9])' + rxe(NF(b)) + '(?![a-z0-9])', 'i');
const WITHDRAW_WORDS = ['berhenti', 'stop', 'unsubscribe', 'hapus data', 'hapus nomor', 'tidak jadi', 'batal', 'jangan hubungi'];
const LEGAL_WORDS = ['biaya', 'bayar', 'pembayaran', 'transfer', 'dp', 'uang muka', 'cicil', 'utang', 'hutang', 'potong gaji', 'jaminan', 'garansi', 'dijamin', 'pasti berangkat', 'visa', 'izin', 'legal', 'resmi', 'p3mi', 'sip2mi', 'bp2mi', 'kp2mi', 'kontrak', 'calo', 'tipu', 'penipuan', 'lapor', 'polisi', 'ilegal', 'asuransi', 'bpjs'];
const YES_SET = ['ya', 'iya', 'setuju', 'boleh', 'ok', 'oke', 'yes', 'y'];
const NO_SET = ['tidak', 'nggak', 'ngga', 'gak', 'no', 'n', 'tdk'];
const hit = (text, words) => words.find((w) => wre(w).test(text));
function scanText(raw) {
  const t = NF(raw); const bare = t.replace(/[^a-z0-9぀-ヿ一-鿿 ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (hit(t, WITHDRAW_WORDS)) return { intent: 'WITHDRAW', det: true };
  if (hit(t, LEGAL_WORDS)) return { intent: 'LEGAL_SENSITIVE', det: true };
  if (bare.length <= 20 && YES_SET.includes(bare)) return { intent: 'CONSENT_YES', det: true };
  if (bare.length <= 20 && NO_SET.includes(bare)) return { intent: 'CONSENT_NO', det: true };
  return { intent: '', det: false };
}
const maskForAI = (s) => String(s || '').normalize('NFKC').replace(/https?:\/\/\S+/gi, '[url]').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]').replace(/\+?\d[\d\s().-]{4,}\d/g, '[num]').replace(/\d{6,}/g, '[num]').slice(0, 500);
const maskErr = (s) => String(s || '').replace(/\+?\d[\d\s().-]{4,}\d/g, '[num]').replace(/\d{6,}/g, '[num]').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]').slice(0, 250);
const dayDiff = (a, b) => Math.round((Date.parse(String(a).slice(0, 10) + 'T00:00:00Z') - Date.parse(String(b).slice(0, 10) + 'T00:00:00Z')) / 86400000);
const addDays = (d, n) => new Date(Date.parse(String(d).slice(0, 10) + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
// ---- end shared library ----
