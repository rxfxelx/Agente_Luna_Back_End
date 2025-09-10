import pool from './db';

export async function getInteresseByNumero(numero: string) {
  const { rows } = await pool.query('SELECT * FROM interesses WHERE numero = $1 LIMIT 1', [numero]);
  return rows[0] || null;
}

export async function createInteresse(nome: string, numero: string) {
  const { rows } = await pool.query(
    'INSERT INTO interesses (nome, numero) VALUES ($1, $2) RETURNING *',
    [nome, numero]
  );
  return rows[0];
}
