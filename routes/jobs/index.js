import ApiError from '../../util/ApiError.js';
import EnterpriseFacade from '../../services/enterprise/enterpriseFacade.js';

class JobRoutes {
    constructor(fastify) {
        this.fastify = fastify;
        this.enterpriseFacade = new EnterpriseFacade();
        this.initRoutes();
    }

    initRoutes() {
        this.fastify.post(
            '/postings',
            {
                schema: {
                    description: 'Create a new job posting',
                    tags: ['Job'],
                },
            },
            this.createPosting.bind(this),
        );

        this.fastify.get(
            '/postings',
            {
                schema: {
                    description: 'Get all job postings',
                    tags: ['Job'],
                },
            },
            this.getAllPostings.bind(this),
        );

        this.fastify.put(
            '/postings/:postingId',
            {
                schema: {
                    description: 'Update a job posting',
                    tags: ['Job'],
                    params: {
                        type: 'object',
                        properties: {
                            postingId: { type: 'string' },
                        },
                        required: ['postingId'],
                    },
                },
            },
            this.updatePosting.bind(this),
        );

        this.fastify.get(
            '/postings/:postingId',
            {
                schema: {
                    description: 'Get a job posting by ID',
                    tags: ['Job'],
                    params: {
                        type: 'object',
                        properties: {
                            postingId: { type: 'string' },
                        },
                        required: ['postingId'],
                    },
                },
            },
            this.getPosting.bind(this),
        );

        this.fastify.get(
            '/postings/company/:companyId',
            {
                schema: {
                    description: 'Get all job postings by company',
                    tags: ['Job'],
                    params: {
                        type: 'object',
                        properties: {
                            companyId: { type: 'string' },
                        },
                        required: ['companyId'],
                    },
                },
            },
            this.getPostings.bind(this),
        );

        this.fastify.post(
            '/applications',
            {
                schema: {
                    description: 'Create a new job application',
                    tags: ['Job'],
                    body: {
                        type: 'object',
                        properties: {
                            postingId: { type: 'string' },
                            applicantId: { type: 'string' },
                        },
                        required: ['postingId', 'applicantId'],
                    },
                },
            },
            this.createApplication.bind(this),
        );

        this.fastify.get(
            '/applications/applicant/:userId/list',
            {
                schema: {
                    description: 'Get all job applications by user',
                    tags: ['Job'],
                    params: {
                        type: 'object',
                        properties: {
                            userId: { type: 'string' },
                        },
                        required: ['userId'],
                    },
                },
            },
            this.getListIdApplications.bind(this),
        );

        this.fastify.get(
            '/applications/applicant/:applicantId',
            {
                schema: {
                    description: 'Get all job applications by applicant',
                    tags: ['Job'],
                    params: {
                        type: 'object',
                        properties: {
                            applicantId: { type: 'string' },
                        },
                    },
                },
            },
            this.getApplicationsByApplicant.bind(this),
        );

        this.fastify.get(
            '/applications/posting/:postingId',
            {
                schema: {
                    description: 'Get all job applications by posting',
                    tags: ['Job'],
                    params: {
                        type: 'object',
                        properties: {
                            postingId: { type: 'string' },
                        },
                    },
                },
            },
            this.getApplicationsByPosting.bind(this),
        );

        this.fastify.put(
            '/applications/:applicationId',
            {
                schema: {
                    description: 'Update a job application',
                    tags: ['Job'],
                    params: {
                        type: 'object',
                        properties: {
                            applicationId: { type: 'string' },
                        },
                        required: ['applicationId'],
                    },
                },
            },
            this.updateApplication.bind(this),
        );
    }

    async createPosting(request, reply) {
        try {
            const posting = await this.enterpriseFacade.createPosting(request.body);
            reply.status(201).send({ message: 'Success create posting', posting: { _id: posting._id } });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async updatePosting(request, reply) {
        try {
            const { postingId } = request.params;
            const updatedPosting = await this.enterpriseFacade.updatePosting(postingId, request.body);
            reply.status(200).send({ message: 'Success update posting', posting: updatedPosting });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getPosting(request, reply) {
        try {
            const { postingId } = request.params;
            const posting = await this.enterpriseFacade.getPosting(postingId);
            reply.status(200).send(posting);
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getAllPostings(request, reply) {
        try {
            const companies = await this.enterpriseFacade.getAllPostings();
            reply.status(200).send(companies);
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getPostings(request, reply) {
        try {
            const { companyId } = request.params;
            const postings = await this.enterpriseFacade.getPostings(companyId);
            reply.status(200).send(postings);
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async createApplication(request, reply) {
        try {
            const { postingId, applicantId } = request.body;
            const application = await this.enterpriseFacade.createApplication(postingId, applicantId);
            reply.status(201).send({ message: 'Success create application', application: { _id: application._id } });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getListIdApplications(request, reply) {
        try {
            const { userId } = request.params;
            const applications = await this.enterpriseFacade.getListIdApplications(userId);
            reply.status(200).send(applications);
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getApplicationsByApplicant(request, reply) {
        try {
            const { applicantId } = request.params;
            const applications = await this.enterpriseFacade.getApplicationsByApplicant(applicantId);
            reply.status(200).send(applications);
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getApplicationsByPosting(request, reply) {
        try {
            const { postingId } = request.params;
            const applications = await this.enterpriseFacade.getApplicationsByPosting(postingId);
            reply.status(200).send(applications);
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async updateApplication(request, reply) {
        try {
            const { applicationId } = request.params;
            const status = request.body;
            console.log(status);
            const updatedApplication = await this.enterpriseFacade.updateApplication(applicationId, status);
            console.log(updatedApplication);
            reply.status(200).send({ message: 'Success update application', application: updatedApplication });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }
}

export default async function (fastify) {
    new JobRoutes(fastify);
}
