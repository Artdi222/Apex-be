import { cors } from '@elysiajs/cors';

export const corsPlugin = cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});
