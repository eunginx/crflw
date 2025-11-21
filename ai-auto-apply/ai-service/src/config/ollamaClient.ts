import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL ?? 'https://ollama.com',
  headers: process.env.OLLAMA_API_KEY
    ? {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      }
    : undefined,
});

export default ollama;
