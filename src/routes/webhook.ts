import { Router } from 'express';
import { getClienteByNumero, createCliente, updateThread } from '../services/clientes';
import { detectAutoOrRepeat, whitelistFirstMessage } from '../flows/detectors';
import { extractNumberFromChatId } from '../utils/extract';
import { handleInbound } from '../flows/dispatcher';
import { ensureThread, appendUserMessage, runAndWaitToolCalls } from '../flows/assistants';

export const webhook = Router();

webhook.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const m = body?.message || body?.body?.message || {};
    const chatid: string = m.chatid;
    const sender: string = m.sender;
    const senderName: string = m.senderName;
    const content: string = m.content;
    const messageid: string = m.messageid;
    const mediaUrl: string = body?.data?.content?.media?.url || m?.data?.content?.media?.url;

    const lastMsgs = [(m.text || m.content || '')].filter(Boolean);
    const { hasAuto, rep3 } = detectAutoOrRepeat(lastMsgs);
    const isWhitelist = whitelistFirstMessage(lastMsgs);
    const trigger = (hasAuto || rep3) && !isWhitelist;
    if (!trigger) { /* segue */ }

    const numero = extractNumberFromChatId(chatid);
    const row = await getClienteByNumero(numero!);
    let rowId = row?.id;
    let threadId = row?.thread;

    if (!row) {
      const created = await createCliente(numero!, senderName);
      rowId = created.id;
      threadId = created.thread;
    }

    if (!threadId) {
      const th = await ensureThread(row || { id: rowId });
      threadId = th;
      await updateThread(Number(rowId), threadId);
    }

    await handleInbound(
      {
        messageType: m.messageType, type: m.type, content, chatid, messageid, mediaUrl,
        buttonOrListid: m.buttonOrListid,
        contact: { displayName: m.content?.displayName, vcard: m.content?.vcard },
        sender, senderName
      },
      {
        ensureThreadFn: async () => threadId!,
        runAndReplyFn: async (userMsg) => {
          await appendUserMessage(threadId!, userMsg);
          const text = await runAndWaitToolCalls(threadId!, numero!, {
            rowId,
            menuOn: true,
            videoUrl: undefined
          });
          return text;
        }
      }
    );

    res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
});
