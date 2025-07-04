import fp from 'fastify-plugin';
import multipart from '@fastify/multipart';

export default fp(async (fastify) => {
    fastify.register(multipart, {
        attachFieldsToBody: false, // Change this to false
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 1,
        },
    });
});
