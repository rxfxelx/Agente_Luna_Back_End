import pool from './db';

export async function getClienteByNumero(numero: string) {
  const { rows } = await pool.query('SELECT * FROM clientes WHERE numero = $1 LIMIT 1', [numero]);
  return rows[0] || null;
}

export async function createCliente(numero: string, nome?: string) {
  const { rows } = await pool.query(
    'INSERT INTO clientes (numero, nome) VALUES ($1, $2) RETURNING *',
    [numero, nome || null]
  );
  return rows[0];
}

export async function updateThread(rowId: number, thread: string) {
  await pool.query('UPDATE clientes SET thread = $1 WHERE id = $2', [thread, rowId]);
}

export async function markVideoSent(rowId: number) {
  await pool.query('UPDATE clientes SET video_enviado = TRUE WHERE id = $1', [rowId]);
}
