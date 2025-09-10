import express from 'express';
import { webhook } from './routes/webhook';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(webhook);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Luna PACLead backend ON :${port}`);
});
