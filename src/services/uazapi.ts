import axios from 'axios';
import { cfg } from '../config';
const api = axios.create({ baseURL: cfg.uazapi.base, headers: { Accept: 'application/json' } });
export async function sendText(number: string, text: string) { return api.post('/send/text', { number, text }, { headers: { token: cfg.uazapi.token } }); }
export async function sendMenu(number: string, text: string, choices: string[], footerText?: string) {
  return api.post('/send/menu', { number, type: 'button', text, choices, footerText }, { headers: { token: cfg.uazapi.token } });
}
export async function sendMediaVideo(number: string, url: string) { return api.post('/send/media', { number, type: 'video', file: url }, { headers: { token: cfg.uazapi.token } }); }
