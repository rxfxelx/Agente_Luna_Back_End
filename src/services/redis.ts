import Redis from 'ioredis';
const r = new Redis(process.env.REDIS_URL as string);
export const redis = {
  async pushBuffer(number: string, text: string, messageId: string) {
    const key = `${number}_buffer_helsenia`;
    await r.rpush(key, `text:${text},id:${messageId}`);
  },
  async getAll(number: string): Promise<string[]> {
    const key = `${number}_buffer_helsenia`;
    const list = await r.lrange(key, 0, -1);
    return list || [];
  },
  async del(number: string) {
    const key = `${number}_buffer_helsenia`;
    await r.del(key);
  }
};
