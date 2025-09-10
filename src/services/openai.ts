import axios from 'axios';
import { cfg } from '../config';

const api = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: { Authorization: `Bearer ${cfg.openai.apiKey}`, 'OpenAI-Beta': 'assistants=v2' }
});

export async function createThread() { const res = await api.post('/threads', {}); return res.data; }
export async function createMessage(threadId: string, content: any) { return api.post(`/threads/${threadId}/messages`, content); }
export async function runAssistant(threadId: string) { const res = await api.post(`/threads/${threadId}/runs`, { assistant_id: cfg.openai.assistantId }); return res.data; }
export async function retrieveRun(threadId: string, runId: string) { const res = await api.get(`/threads/${threadId}/runs/${runId}`); return res.data; }
export async function listMessages(threadId: string, limit = 15) { const res = await api.get(`/threads/${threadId}/messages?order=desc&limit=${limit}`); return res.data; }
export async function submitToolOutputs(threadId: string, runId: string, tool_outputs: any[]) { const res = await api.post(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, { tool_outputs }); return res.data; }

// Vision helper for describing an image URL
export async function visionDescribe(imageUrl: string) {
  const res = await api.post('/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Você é um assistente multimodal. Ao receber a imagem abaixo, descreva objetivamente o que vê, sem comentários adicionais.' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 300
  });
  const content = res.data?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : (content || '');
}
