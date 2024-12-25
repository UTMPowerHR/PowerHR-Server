import ApiError from '../../util/ApiError.js';
import EnterpriseFacade from '../../services/enterprise/enterpriseFacade.js';

class CompanyRoutes {
    constructor(fastify) {
        this.fastify = fastify;
        this.enterpriseFacade = new EnterpriseFacade();
        this.initRoutes();
    }

    initRoutes() {
        this.fastify.post(
            '/register',
            {
                schema: {
                    description: 'Register a new company',
                    tags: ['Company'],
                    body: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            email: { type: 'string' },
                            phone: { type: 'string' },
                            address: {
                                type: 'object',
                                properties: {
                                    street: { type: 'string' },
                                    city: { type: 'string' },
                                    state: { type: 'string' },
                                    zip: { type: 'string' },
                                    country: { type: 'string' },
                                },
                                required: ['street', 'city', 'state', 'zip', 'country'],
                            },
                        },
                        required: ['name', 'email', 'phone', 'address'],
                    },
                },
            },
            this.registerCompany.bind(this),
        );

        this.fastify.post(
            '/check',
            {
                schema: {
                    description: 'Check if a company exists',
                    tags: ['Company'],
                    body: {
                        type: 'object',
                        properties: {
                            email: { type: 'string' },
                        },
                        required: ['email'],
                    },
                },
            },
            this.checkCompany.bind(this),
        );

        this.fastify.get(
            '/:companyId',
            {
                schema: {
                    description: 'Get company detail',
                    tags: ['Company'],
                    params: {
                        type: 'object',
                        properties: {
                            companyId: { type: 'string' },
                        },
                        required: ['companyId'],
                    },
                },
            },
            this.getCompany.bind(this),
        );

        this.fastify.get(
            '/:companyId/profile',
            {
                schema: {
                    description: 'Get company profile',
                    tags: ['Company'],
                    params: {
                        type: 'object',
                        properties: {
                            companyId: { type: 'string' },
                        },
                        required: ['companyId'],
                    },
                },
            },
            this.getCompanyProfile.bind(this),
        );

        this.fastify.put(
            '/:companyId',
            {
                schema: {
                    description: 'Update company',
                    tags: ['Company'],
                    params: {
                        type: 'object',
                        properties: {
                            companyId: { type: 'string' },
                        },
                        required: ['companyId'],
                    },
                },
            },
            this.updateCompany.bind(this),
        );

        this.fastify.get(
            '/:companyId/employees',
            {
                schema: {
                    description: 'Get employees of a company',
                    tags: ['Company'],
                },
            },
            this.getEmployees.bind(this),
        );

        this.fastify.post(
            '/:companyId/employees',
            {
                schema: {
                    description: 'Register an employee',
                    tags: ['Company'],
                },
            },
            this.registerEmployee.bind(this),
        );

        this.fastify.put(
            '/:companyId/employees/:employeeId',
            {
                schema: {
                    description: 'Update an employee',
                    tags: ['Company'],
                },
            },
            this.updateEmployee.bind(this),
        );

        this.fastify.get(
            '/:companyId/departments',
            {
                schema: {
                    description: 'Get all departments',
                    tags: ['Company'],
                },
            },
            this.getDepartments.bind(this),
        );

        this.fastify.post(
            '/:companyId/departments',
            {
                schema: {
                    description: 'Create a new department',
                    tags: ['Company'],
                },
            },
            this.createDepartment.bind(this),
        );

        this.fastify.put(
            '/:companyId/departments/:departmentId',
            {
                schema: {
                    description: 'Update a department',
                    tags: ['Company'],
                },
            },
            this.updateDepartment.bind(this),
        );

        this.fastify.get(
            '/:companyId/analytic/turnover',
            {
                schema: {
                    description: 'Get company turnover',
                    tags: ['Company'],
                },
            },
            this.getCompanyTurnover.bind(this),
        );

        this.fastify.put(
            '/:companyId/employees/:employeeId/convert',
            {
                schema: {
                    description: 'Convert an employee to an applicant',
                    tags: ['Company'],
                    params: {
                        type: 'object',
                        properties: {
                            companyId: { type: 'string' },
                            employeeId: { type: 'string' },
                        },
                        required: ['companyId', 'employeeId'],
                    },
                },
            },
            this.convertEmployeeToApplicant.bind(this),
        );

        this.fastify.get(
            '/employmenthistory',
            {
                schema: {
                    description: 'Get employees of a company',
                    tags: ['Company'],
                },
            },
            this.getEmploymentHistory.bind(this),
        );
    }

    async registerCompany(request, reply) {
        try {
            const { name, email, phone, address } = request.body;

            const company = await this.enterpriseFacade.createCompany(name, email, phone, address);

            reply.status(201).send({
                company,
                message: 'Company created',
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getCompany(request, reply) {
        const { companyId } = request.params;

        const company = await this.enterpriseFacade.getCompanyDetail(companyId);

        reply.send(company);
    }

    async getCompanyProfile(request, reply) {
        const { companyId } = request.params;

        const company = await this.enterpriseFacade.getCompanyProfile(companyId);

        reply.send(company);
    }

    async updateCompany(request, reply) {
        const { companyId } = request.params;
        const data = request.body;

        const company = await this.enterpriseFacade.updateCompany(companyId, data);

        await this.enterpriseFacade.logAction(
            request.user.id,
            companyId,
            'Company updated',
            `Company ${companyId} updated`,
        );

        reply.send({
            company,
            message: 'Company updated',
        });
    }

    async checkCompany(request, reply) {
        const { email } = request.body;

        if (!email) {
            return reply.status(400).send({ error: 'Missing fields' });
        }

        const company = await this.enterpriseFacade.isCompanyExist(email);

        if (!company) {
            return reply.send({ exists: false });
        }

        reply.send({ exists: true });
    }

    async getEmployees(request, reply) {
        const { companyId } = request.params;
        const employees = await this.enterpriseFacade.getEmployees(companyId);
        reply.send({ employees });
    }

    async registerEmployee(request, reply) {
        try {
            const data = request.body;
            const employee = await this.enterpriseFacade.registerEmployee(data);

            await this.enterpriseFacade.logAction(
                request.user.id,
                request.user.company,
                'Employee registered',
                `Employee ${employee._id} registered`,
            );

            reply.status(201).send({
                employee,
                message: 'Employee registered',
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async updateEmployee(request, reply) {
        try {
            const { employeeId } = request.params;
            const data = request.body;

            const employee = await this.enterpriseFacade.updateEmployee(employeeId, data);

            await this.enterpriseFacade.logAction(
                request.user.id,
                request.user.company,
                'Employee updated',
                `Employee ${employeeId} updated`,
            );

            reply.send({
                employee,
                message: 'Employee updated',
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getDepartments(request, reply) {
        const { companyId } = request.params;

        const departments = await this.enterpriseFacade.getDepartments(companyId);

        reply.send({ departments });
    }

    async createDepartment(request, reply) {
        try {
            const { companyId } = request.params;
            const { name, underDepartment } = request.body;

            const department = await this.enterpriseFacade.createDepartment(companyId, name, underDepartment);

            await this.enterpriseFacade.logAction(
                request.user.id,
                companyId,
                'Department created',
                `Department ${department._id} created`,
            );

            reply.status(201).send({
                department,
                message: 'Department created',
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async updateDepartment(request, reply) {
        try {
            const { departmentId } = request.params;
            const data = request.body;

            const department = await this.enterpriseFacade.updateDepartment(departmentId, data);

            await this.enterpriseFacade.logAction(
                request.user.id,
                request.user.company,
                'Department updated',
                `Department ${departmentId} updated`,
            );

            reply.send({
                department,
                message: 'Department updated',
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async getCompanyTurnover(request, reply) {
        try {
            const { companyId } = request.params;
            const { from, to } = request.query;

            const turnover = await this.enterpriseFacade.getTurnOver(companyId, from, to);

            reply.send({ turnover });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }

    async convertEmployeeToApplicant(request, reply) {
        try {
            const { companyId, employeeId } = request.params;

            // Call the EnterpriseFacade to handle the conversion
            const applicant = await this.enterpriseFacade.convertEmployeeToApplicant(companyId, employeeId);
            console.log(request.body);
            await this.enterpriseFacade.logAction(
                request.user.id,
                companyId,
                'Employee converted to applicant',
                `Employee ${employeeId} converted to applicant`,
            );

            reply.send({
                applicant,
                message: 'Employee converted to applicant successfully',
            });
        } catch (error) {
            if (error instanceof ApiError) {
                return reply.status(error.statusCode).send({ error: error.message });
            } else {
                request.log.error(error);
                reply.status(500).send({ error: error.message || 'Something went wrong' });
            }
        }
    }
    async getEmploymentHistory(request, reply){
        try{
            const employmentHistory = await this.enterpriseFacade.getEmploymentHistory();
            return reply.send(employmentHistory);
        } catch(error){
            request.log.error(error);
            reply.status(500).send({ error: error.message || 'Something went wrong' });
        }
    }
}

export default async function (fastify) {
    new CompanyRoutes(fastify);
}
