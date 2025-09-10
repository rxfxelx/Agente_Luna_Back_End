import 'dotenv/config';

export const cfg = {
  port: Number(process.env.PORT || 8080),
  openai: { apiKey: process.env.OPENAI_API_KEY!, assistantId: process.env.OPENAI_ASSISTANT_ID! },
  db: { url: process.env.DATABASE_URL! },
  redis: { url: process.env.REDIS_URL! },
  uazapi: {
    base: process.env.UAZAPI_BASE!,
    token: process.env.UAZAPI_TOKEN!,
    tokenAudio: process.env.UAZAPI_TOKEN_AUDIO || process.env.UAZAPI_TOKEN!,
    notifyNumber: process.env.UAZAPI_NOTIFY_NUMBER!,
  },
  whatsapp: { specialSender: process.env.WHATSAPP_SPECIAL_SENDER! },
  menu: {
    text: process.env.MENU_TEXT!,
    choices: (process.env.MENU_CHOICES || '').split('|').map(s => s.trim()).filter(Boolean),
    footer: process.env.MENU_FOOTER || '',
  }
};
