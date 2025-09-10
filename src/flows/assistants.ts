import { createThread, createMessage, runAssistant, retrieveRun, listMessages, submitToolOutputs } from '../services/openai';
import { sendText, sendMenu, sendMediaVideo } from '../services/uazapi';
import { markVideoSent } from '../services/clientes';
import { cfg } from '../config';

export async function ensureThread(row: any) {
  if (row?.thread) return row.thread as string;
  const th = await createThread();
  return th.id;
}

export async function appendUserMessage(threadId: string, message: { role: 'user', content: any }) {
  await createMessage(threadId, message);
}

export async function runAndWaitToolCalls(threadId: string, number: string, context: {
  rowId?: number|string,
  menuOn?: boolean,
  videoUrl?: string
}) {
  const run = await runAssistant(threadId);
  let status = run.status;
  let toolCalls: any[] = [];

  while (status === 'queued' || status === 'in_progress' || status === 'requires_action') {
    if (status === 'requires_action') {
      const calls = run.required_action?.submit_tool_outputs?.tool_calls || [];
      for (const c of calls) {
        const name = c.function?.name;
        const args = JSON.parse(c.function?.arguments || '{}');
        if (name === 'enviar_msg') {
          if (args?.numero && args?.texto) await sendText(args.numero, args.texto);
        } else if (name === 'numero_novo') {
          // opcional
        } else if (name === 'enviar_caixinha_interesse') {
          if (context.menuOn) await sendMenu(number, cfg.menu.text, cfg.menu.choices, cfg.menu.footer);
        } else if (name === 'enviar_video') {
          if (context.videoUrl) {
            await sendMediaVideo(number, context.videoUrl);
            if (context.rowId) await markVideoSent(Number(context.rowId));
          }
        }
        toolCalls.push({ tool_call_id: c.id, output: 'ok' });
      }
      if (toolCalls.length) {
        await submitToolOutputs(threadId, run.id, toolCalls);
        toolCalls = [];
      }
    }
    await new Promise(r => setTimeout(r, 1500));
    const current = await retrieveRun(threadId, run.id);
    status = current.status;
    if (status === 'completed') break;
    if (status === 'failed' || status === 'expired') break;
  }

  if (status === 'completed') {
    const msgs = await listMessages(threadId, 1);
    const last = msgs?.data?.[0];
    const content = last?.content?.[0];
    const text = content?.text?.value;
    if (text) return text;
  }
  return null;
}
