CREATE TABLE IF NOT EXISTS public.clientes (
  id             SERIAL PRIMARY KEY,
  numero         VARCHAR(20) UNIQUE NOT NULL,
  nome           TEXT,
  thread         TEXT,
  video_enviado  BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS public.interesses (
  id      SERIAL PRIMARY KEY,
  nome    TEXT,
  numero  VARCHAR(20) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clientes_numero   ON public.clientes (numero);
CREATE INDEX IF NOT EXISTS idx_interesses_numero ON public.interesses (numero);
