import ResumeController from '../../services/resume/resumeController.js';

class ResumeRoutes {
    constructor(fastify) {
        this.fastify = fastify;
        this.resumeController = new ResumeController();
        this.initRoutes();
    }

    initRoutes() {
        // Create a resume
        this.fastify.post(
            '/create',
            {
                schema: {
                    description: 'Create a new resume',
                    tags: ['Resume'],
                    body: {
                        type: 'object',
                        properties: {
                            user: { type: 'string', description: 'User ID' },
                        },
                        required: ['user'],
                    },
                },
            },
            this.createResume.bind(this),
        );

        // Get a single resume by user ID
        this.fastify.get(
            '/:userId',
            {
                schema: {
                    description: 'Get resume by user ID',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            userId: { type: 'string', description: 'User ID' },
                        },
                        required: ['userId'],
                    },
                },
            },
            this.getResumeByUser.bind(this),
        );

        // Get all resumes (e.g., for TOPSIS analysis)
        this.fastify.get(
            '/',
            {
                schema: {
                    description: 'Get all resumes',
                    tags: ['Resume'],
                },
            },
            this.getAllResumes.bind(this),
        );

        // Update a resume
        this.fastify.put(
            '/update',
            {
                schema: {
                    description: 'Update a resume',
                    tags: ['Resume'],
                    body: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string', description: 'Resume ID' },
                        },
                        required: ['_id'],
                    },
                },
            },
            this.updateResume.bind(this),
        );

        // Delete a resume
        this.fastify.delete(
            '/:resumeId',
            {
                schema: {
                    description: 'Delete a resume by ID',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            resumeId: { type: 'string', description: 'Resume ID' },
                        },
                        required: ['resumeId'],
                    },
                },
            },
            this.deleteResume.bind(this),
        );


        // this.fastify.get(
        //     '/update',
        //     {
        //         schema: {
        //             description: 'Update a resume',
        //             tags: ['Resume'],
        //         },
        //     },
        //     this.updateResume.bind(this),
        // );
    }

    async createResume(request, reply) {
        try {
            const { user } = request.body;
            await this.resumeController.createResume(user);

            reply.status(201).send({ message: 'Resume created successfully' });
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async getResumeByUser(request, reply) {
        try {
            const { userId } = request.params;
            const resume = await this.resumeController.getResumeByUser(userId);

            if (!resume) {
                reply.status(404).send({ error: 'Resume not found' });
            } else {
                reply.status(200).send(resume);
            }
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async getAllResumes(request, reply) {
        try {
            const resumes = await this.resumeController.getAllResumes();
            reply.status(200).send(resumes);
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async updateResume(request, reply) {
        try {
            const resume = request.body;
            await this.resumeController.updateResume(resume);

            reply.status(200).send({ message: 'Resume updated successfully' });
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async deleteResume(request, reply) {
        try {
            const { resumeId } = request.params;
            await this.resumeController.deleteResume(resumeId);

            reply.status(200).send({ message: 'Resume deleted successfully' });
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    // async updateResume(request, reply) {
    //     try {
    //         const resume = request.body;

    //         await this.resumeController.updateResume(resume);

    //         reply.status(200).send({ message: 'Resume updated' });
    //     } catch (error) {
    //         request.log.error(error);
    //         reply.status(500).send({ error: 'Something went wrong' });
    //     }
    // }
}

export default async function (fastify) {
    new ResumeRoutes(fastify);
}
