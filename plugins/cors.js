import cors from '@fastify/cors';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
    fastify.register(cors, {
        origin: [
            'http://localhost:5173',
            'https://power-hr.vercel.app',
            'https://power-hr-development.vercel.app',
            'https://power-hr-client.vercel.app',
        ],
        credentials: true,
    });
});