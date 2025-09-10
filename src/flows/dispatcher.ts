import { extractNumberFromChatId, parseVCardTel } from '../utils/extract';
import { redis } from '../services/redis';
import { sendText } from '../services/uazapi';
import { visionDescribe } from '../services/openai';

type Inbound = {
  messageType?: 'Conversation'|'ExtendedTextMessage'|'AudioMessage'|'image'|'TemplateButtonReplyMessage'|'ContactMessage';
  type?: 'text';
  content?: string;
  chatid?: string;
  messageid?: string;
  mediaUrl?: string;
  buttonOrListid?: string;
  contact?: { displayName?: string; vcard?: string; };
  sender?: string;
  senderName?: string;
};

export async function handleInbound(msg: Inbound, opts: {
  ensureThreadFn: () => Promise<string>,
  runAndReplyFn: (payload: any) => Promise<string | null>
}) {
  const chatNumber = extractNumberFromChatId(msg.chatid || '');
  if (!chatNumber) return;

  if (msg.messageType === 'Conversation' || msg.messageType === 'ExtendedTextMessage' || msg.type === 'text') {
    const text = (msg.content || '').trim();
    if (text) {
      await redis.pushBuffer(chatNumber, text, msg.messageid || '');
      await new Promise(r => setTimeout(r, 20000));
      const all = await redis.getAll(chatNumber);
      const idOfFirst = (all[0] || '').match(/id:([A-Za-z0-9-]+)/)?.[1] || '';
      if (msg.messageid === idOfFirst) {
        await redis.del(chatNumber);
        const texts = all.map(s => (s.match(/text:(.*?)(?:,id:|$)/)?.[1] || '').replace(/\r?\n+/g, ' ').trim()).filter(Boolean);
        const combined = texts.join(', ');
        const message = { role: 'user' as const, content: [{ type: 'text', text: combined }] };
        const reply = await opts.runAndReplyFn(message);
        if (reply) await sendText(chatNumber, reply);
      }
    }
    return;
  }

  if (msg.messageType === 'AudioMessage') {
    const message = { role: 'user' as const, content: [{ type: 'text', text: '(áudio transcrito aqui)' }] };
    const reply = await opts.runAndReplyFn(message);
    if (reply) await sendText(chatNumber, reply);
    return;
  }

  if (msg.messageType === 'image') {
    const description = await visionDescribe(msg.mediaUrl!);
    const message = { role: 'user' as const, content: [{ type: 'text', text: description }] };
    const reply = await opts.runAndReplyFn(message);
    if (reply) await sendText(chatNumber, reply);
    return;
  }

  if (msg.messageType === 'ContactMessage') {
    const nameLine = `Nome do responsavel:${msg.contact?.displayName || ''}`;
    const message = { role: 'user' as const, content: [{ type: 'text', text: `Numero do cliente foi enviado e ${nameLine}` }] };
    const reply = await opts.runAndReplyFn(message);
    if (reply) await sendText(chatNumber, reply);
    const tel = parseVCardTel(msg.contact?.vcard || '');
    return;
  }

  if (msg.messageType === 'TemplateButtonReplyMessage') {
    const buttonText = msg.buttonOrListid || '';
    const message = { role: 'user' as const, content: [{ type: 'text', text: buttonText }] };
    const reply = await opts.runAndReplyFn(message);
    if (reply) await sendText(chatNumber, reply);
    return;
  }
}
