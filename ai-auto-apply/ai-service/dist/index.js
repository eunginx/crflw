"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const pdfRoutes_1 = __importDefault(require("./routes/pdfRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 4001);
app.use(express_1.default.json({ limit: '1mb' }));
app.use((0, cors_1.default)());
app.use((req, res, next) => {
    const requestId = `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
    const start = process.hrtime.bigint();
    const loggableBody = JSON.stringify(req.body ?? {});
    const truncatedBody = loggableBody.length > 2000
        ? `${loggableBody.slice(0, 2000)}…(truncated)`
        : loggableBody;
    console.log('📥 [EXTREME][REQUEST]', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        query: req.query,
        headers: req.headers,
        body: truncatedBody,
    });
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        console.log('📤 [EXTREME][RESPONSE]', {
            requestId,
            status: res.statusCode,
            durationMs: durationMs.toFixed(3),
            contentLength: res.getHeader('content-length') ?? 'unknown',
        });
    });
    next();
});
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/pdf', pdfRoutes_1.default);
app.use((err, _req, res, _next) => {
    console.error('💥 [EXTREME][ERROR]', {
        message: err.message,
        stack: err.stack,
    });
    res.status(500).json({ error: 'Internal Server Error' });
});
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [EXTREME][UNHANDLED_REJECTION]', reason);
});
process.on('uncaughtException', (error) => {
    console.error('🔥 [EXTREME][UNCAUGHT_EXCEPTION]', {
        message: error.message,
        stack: error.stack,
    });
});
app.listen(PORT, () => {
    const maskedApiKey = process.env.OLLAMA_API_KEY
        ? `${process.env.OLLAMA_API_KEY.slice(0, 4)}***`
        : 'not_set';
    console.log('🚀 [EXTREME][STARTUP]', {
        port: PORT,
        nodeEnv: process.env.NODE_ENV ?? 'development',
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'https://ollama.com',
        ollamaModel: process.env.OLLAMA_MODEL ?? 'gpt-oss:120b',
        ollamaApiKey: maskedApiKey,
        services: {
            ai: '/api/ai',
            pdf: '/api/pdf'
        }
    });
});
