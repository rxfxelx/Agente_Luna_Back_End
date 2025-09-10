function normalize(s = '') {
  try {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/\b\d{3,}\b/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return String(s).toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

const AUTO_KWS = [
  'mensagem automatica',
  'equipe de atendimento automatico',
  'mensagem enviada por nosso sistema',
  'nao responda esta mensagem',
  'obrigado pelo contato',
  'fora do expediente',
  'estamos atendendo',
  'protocolo',
  'mensagem automatica para testes de integracao'
];

const WHITELIST_INIT = ['5 mit','5mit','5-mit','5 min','5-min','5min'];

function jaroWinkler(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const s1 = a, s2 = b;
  const maxDist = Math.floor(Math.max(s1.length, s2.length)/2) - 1;
  const s1Match = Array(s1.length).fill(false);
  const s2Match = Array(s2.length).fill(false);
  let matches = 0, transpositions = 0;

  for (let i=0;i<s1.length;i++){
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, s2.length);
    for (let j=start;j<end;j++){
      if (!s2Match[j] && s1[i] === s2[j]) { s1Match[i]=s2Match[j]=true; matches++; break; }
    }
  }
  if (!matches) return 0;

  let k=0;
  for (let i=0;i<s1.length;i++){
    if (s1Match[i]) {
      while(!s2Match[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  transpositions /= 2;
  const m = matches;
  const jaro = (m/s1.length + m/s2.length + (m - transpositions)/m)/3;

  let prefix=0, maxPrefix=4;
  while(prefix<maxPrefix && s1[prefix]===s2[prefix]) prefix++;

  return jaro + prefix*0.1*(1-jaro);
}

export function detectAutoOrRepeat(lastMessages: string[]) {
  const nm = lastMessages.map(normalize);
  const hasAuto = lastMessages.some(m => {
    const n = normalize(m);
    return AUTO_KWS.some(k => n.includes(k));
  });
  const rep3 = (nm.length === 3 && nm[0]) ? nm.every(s => jaroWinkler(nm[0], s) >= 0.96) : false;
  return { hasAuto, rep3 };
}

export function whitelistFirstMessage(allMessages: string[]) {
  if (!allMessages.length) return false;
  const first = normalize(allMessages[0]);
  return WHITELIST_INIT.some(w => first.includes(w));
}
