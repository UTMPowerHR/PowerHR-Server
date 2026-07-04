import cors from '@fastify/cors';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
    const allowedOrigins = [
        'http://localhost:5173',
        'https://power-hr.vercel.app',
        'https://power-hr-development.vercel.app',
        'https://power-hr-client.vercel.app',
        'https://power-hr-client-v3.vercel.app/'
    ];

    if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }

    fastify.register(cors, {
        origin: allowedOrigins,
        credentials: true,
    });
});