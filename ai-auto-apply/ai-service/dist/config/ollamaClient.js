"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ollama_1 = require("ollama");
const ollama = new ollama_1.Ollama({
    host: process.env.OLLAMA_BASE_URL ?? 'https://ollama.com',
    headers: process.env.OLLAMA_API_KEY
        ? {
            Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
        }
        : undefined,
});
exports.default = ollama;
