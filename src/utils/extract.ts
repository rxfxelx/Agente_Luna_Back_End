export function extractNumberFromChatId(chatid?: string | null) {
  if (!chatid) return null;
  const id = chatid.trim();
  const m = id.match(/^(\d+)(?:@s\.whatsapp\.net|@c\.us)$/i);
  return m ? m[1] : null;
}

export function normalizeE164BR(digits: string | null) {
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length <= 15) return `+${digits}`;
  return null;
}

export function parseVCardTel(vcard?: string | null) {
  if (!vcard) return { waid: null as string|null, display: null as string|null, e164: null as string|null };
  const text = vcard.replace(/\r/g, '');
  const lines = text.split('\n');
  let best: any = null, fallback: any = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!/^(?:item\d+\.)?TEL/i.test(line)) continue;
    const m = line.match(/^(?:item\d+\.)?TEL[^:\n]*?(?:waid=(\d+))?\s*:\s*([+()\d\s\-\.]+)/i);
    if (m) {
      const waid = m[1] || null;
      const display = (m[2] || '').trim() || null;
      const digits = display?.replace(/\D+/g, '') || null;
      const e164 = waid ? `+${waid}` : normalizeE164BR(digits);
      const rec = { waid, display, e164 };
      if (waid && !best) best = rec;
      if (!fallback) fallback = rec;
    }
  }
  return best || fallback || { waid: null, display: null, e164: null };
}

export function extractPhoneFromText(text: string) {
  const candidates = [...text.matchAll(/(\+?\d[\d\s().-]{6,}\d|\b\d{8,}\b)/g)].map(m => m[1]);
  if (!candidates.length) return { raw: null, digits: null, e164: null };
  const raw = candidates.sort((a, b) => b.replace(/\D+/g,'').length - a.replace(/\D+/g,'').length)[0];
  const digits = raw.replace(/\D+/g, '');
  const e164 = normalizeE164BR(digits);
  return { raw, digits: digits || null, e164 };
}

export function extractNameFromFreeText(text: string) {
  const clean = text.replace(/\btext\s*:\s*/gi, ' ').replace(/\bid\s*:\s*[A-F0-9-]+/gi, ' ').trim();
  let m = clean.match(/\bnome\s*[:\-]?\s*([A-Za-zÀ-ÿ'’\-]+(?:\s+[A-Za-zÀ-ÿ'’\-]+){0,3})(?=\s*(?:,|;|\bn[úu]mero\b|\btel(?:efone)?\b|\bid\b|$))/iu);
  if (m) return m[1].trim();
  m = clean.match(/\bo\s+nome(?:\s+(?:do|da))?\s*(?:respons[aá]vel)?\s*é\s*([A-Za-zÀ-ÿ'’\-]+(?:\s+[A-Za-zÀ-ÿ'’\-]+){0,3})/iu);
  if (m) return m[1].trim();
  m = clean.match(/\b(?:se\s+chama|chama-se)\s*([A-Za-zÀ-ÿ'’\-]+(?:\s+[A-Za-zÀ-ÿ'’\-]+){0,3})/iu);
  if (m) return m[1].trim();
  const m3 = clean.match(/([A-Za-zÀ-ÿ'’\-]+\s+[A-Za-zÀ-ÿ'’\-]+(?:\s+[A-Za-zÀ-ÿ'’\-]+){0,2})/u);
  return m3 ? m3[1].trim() : null;
}
