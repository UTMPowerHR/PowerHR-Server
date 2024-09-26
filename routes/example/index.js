/*
    Template for creating routes in Fastify
    
    class ExampleRoutes {

        constructor(fastify) {
            this.fastify = fastify;
            this.initRoutes();
        }

        initRoutes(){

        }
    }

    export default async function(fastify) {
        new ExampleRoutes(fastify);
    }
        
*/

import ExampleController from '../../services/example/exampleController.js';

class ExampleRoutes {
    constructor(fastify) {
        this.fastify = fastify;
        this.exampleController = new ExampleController();
        this.initRoutes();
    }

    initRoutes() {
        this.fastify.post(
            '/',
            {
                schema: {
                    description: 'Create an example',
                    tags: ['Example'],
                    summary: 'Create an example',
                    body: {
                        type: 'object',
                        required: ['name', 'email'],
                        properties: {
                            name: { type: 'string' },
                            age: { type: 'number' },
                            email: { type: 'string' },
                            address: {
                                type: 'object',
                                properties: {
                                    street: { type: 'string' },
                                    city: { type: 'string' },
                                    state: { type: 'string' },
                                    zip: { type: 'number' },
                                },
                            },
                        },
                    },
                    response: {
                        200: {
                            description: 'Successful response',
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                            },
                        },
                    },
                },
            },

            this.createExample.bind(this),
        );
    }

    async createExample(request, reply) {
        const example = request.body;
        await this.exampleController.create(example);

        return reply.send({ message: 'Example created' });
    }
}

export default async function (fastify) {
    new ExampleRoutes(fastify);
}
