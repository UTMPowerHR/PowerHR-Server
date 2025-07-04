import fastify from 'fastify';
import ajvFormats from 'ajv-formats';

const app = fastify({
    logger: true,
    ajv: {
        plugins: [
            // Add support for additional formats like 'binary'
            (ajv) => {
                ajvFormats(ajv, ['binary']);
            },
        ],
    },
});

app.get('/test', function (request, reply) {
    reply.send({
        status: 'OK',
    });
});

app.register(import('../app.js'));

export default async (req, res) => {
    await app.ready();
    app.server.emit('request', req, res);
};
