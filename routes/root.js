import Firebase from '../util/Firebase.js';

class ExampleRoute {
    constructor(fastify) {
        this.fastify = fastify;
        this.initRoutes();
    }

    initRoutes() {
        this.fastify.get(
            '/',
            {
                schema: {
                    description: 'Example of root route',
                    tags: ['Root'],
                    summary: 'Root',
                    response: {
                        200: {
                            description: 'Successful response',
                            type: 'object',
                            properties: {
                                root: {
                                    type: 'boolean',
                                },
                                env: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            this.getRoot.bind(this),
        );

        this.fastify.get(
            '/basic',
            {
                schema: {
                    description: 'Example of root route',
                    tags: ['Root'],
                    summary: 'Root',
                    response: {
                        200: {
                            description: 'Successful response',
                            type: 'object',
                            properties: {
                                root: {
                                    type: 'boolean',
                                },
                            },
                        },
                    },
                },
            },
            this.getBasic.bind(this),
        );

        this.fastify.get(
            '/param/:id',
            {
                schema: {
                    description: 'Example of parameter route',
                    tags: ['Root'],
                    summary: 'Test',
                    params: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: 'The id of the test',
                            },
                        },
                    },
                    response: {
                        200: {
                            description: 'Successful response',
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            this.getParam.bind(this),
        );

        this.fastify.post(
            '/body',
            {
                schema: {
                    description: 'Example of body route',
                    tags: ['Root'],
                    summary: 'Body',
                    body: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                description: 'The message to return',
                            },
                        },
                    },
                    response: {
                        200: {
                            description: 'Successful response',
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            this.getBody.bind(this),
        );

        this.fastify.post(
            '/file',
            {
                schema: {
                    description: 'Example of file upload route',
                    tags: ['Root'],
                    summary: 'File',
                    consumes: ['multipart/form-data'],
                    body: {
                        type: 'object',
                        properties: {
                            file: {
                                isFile: true,
                            },
                        },
                    },
                    response: {
                        200: {
                            description: 'Successful response',
                            type: 'object',
                            properties: {
                                url: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            this.sendFile.bind(this),
        );
    }

    async getRoot(request, reply) {
        const ENV = process.env.NODE_ENV;

        return reply.send({ root: true, env: ENV });
    }

    async getBasic(request, reply) {
        return reply.send({ root: true });
    }

    async getParam(request, reply) {
        return reply.send({ id: request.params.id });
    }

    async getBody(request, reply) {
        return reply.send({ message: request.body.message });
    }

    async sendFile(request, reply) {
        const data = await request.body.file.toBuffer();

        const fileName = request.body.file.filename;
        const fileBuffer = Buffer.from(data);
        const metadata = {
            contentType: request.body.file.mimetype,
        };

        const firebase = await Firebase.getInstance();

        const url = await firebase.uploadFile(fileName, fileBuffer, metadata);

        return reply.send({ url });
    }
}

export default async function (fastify) {
    new ExampleRoute(fastify);
}
