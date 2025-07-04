import ResumeController from '../../services/resume/resumeController.js';
// import { Resume } from '../../models/resume/index.js';
// import User from '../../models/users/user.js';

class ResumeRoutes {
    constructor(fastify) {
        this.fastify = fastify;
        this.resumeController = new ResumeController();
        this.initRoutes();
    }

    initRoutes() {
        // Test endpoint to verify data flow
        this.fastify.get(
            '/test-data',
            {
                schema: {
                    summary: 'Test data serialization',
                    tags: ['Resume'],
                },
            },
            this.testData.bind(this),
        );

        // Extract resume from PDF
        this.fastify.post(
            '/extract',
            {
                schema: {
                    consumes: ['multipart/form-data'],
                    summary: 'Extract resume data from PDF',
                    tags: ['Resume'],
                    querystring: {
                        type: 'object',
                        properties: {
                            userId: { type: 'string' },
                        },
                        required: ['userId'],
                    },
                    response: {
                        200: {
                            type: 'object',
                            additionalProperties: true,
                        },
                    },
                },
            },
            this.extractResume.bind(this),
        );

        // Save extracted resume data
        this.fastify.post(
            '/save-extracted',
            {
                schema: {
                    summary: 'Save extracted resume data',
                    tags: ['Resume'],
                    body: {
                        type: 'object',
                        required: ['userId', 'resumeData'],
                        properties: {
                            userId: { type: 'string' },
                            resumeData: { type: 'object' },
                            originalFileName: { type: 'string' },
                        },
                    },
                    response: {
                        200: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                message: { type: 'string' },
                                resume: { type: 'object' },
                            },
                        },
                    },
                },
            },
            this.saveExtractedResume.bind(this),
        );

        // Create a resume
        this.fastify.post(
            '/resume',
            {
                schema: {
                    description: 'Create a new resume',
                    tags: ['Resume'],
                    body: {
                        type: 'object',
                        properties: {
                            user: { type: 'string' },
                            basicDetail: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    title: { type: 'string' },
                                    imageURL: { type: 'string' },
                                    email: { type: 'string' },
                                    phone: { type: 'string' },
                                    location: { type: 'string' },
                                    websiteUrl: {
                                        type: 'object',
                                        properties: {
                                            linkedin: { type: 'string' },
                                            github: { type: 'string' },
                                            portfolio: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        required: ['user'],
                    },
                },
            },
            this.createResume.bind(this),
        );

        // Get a single resume by ID
        this.fastify.get(
            '/resume/:id',
            {
                schema: {
                    description: 'Get a resume by ID',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                        },
                        required: ['id'],
                    },
                },
            },
            this.getResumeById.bind(this),
        );

        // Get all resumes
        this.fastify.get(
            '/resumes',
            {
                schema: {
                    description: 'Get all resumes',
                    tags: ['Resume'],
                },
            },
            this.getAllResumes.bind(this),
        );

        // Get resume by user ID
        this.fastify.get(
            '/resume/user/:user',
            {
                schema: {
                    description: 'Get a resume by user ID',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            user: { type: 'string' },
                        },
                        required: ['user'],
                    },
                },
            },
            this.getResumeByUserId.bind(this),
        );

        // Update a resume
        this.fastify.put(
            '/resume/:id',
            {
                schema: {
                    description: 'Update a resume',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                        },
                        required: ['id'],
                    },
                    body: {
                        type: 'object',
                        properties: {
                            basicDetail: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    title: { type: 'string' },
                                    imageURL: { type: 'string' },
                                    email: { type: 'string' },
                                    phone: { type: 'string' },
                                    location: { type: 'string' },
                                    websiteUrl: {
                                        type: 'object',
                                        properties: {
                                            linkedin: { type: 'string' },
                                            github: { type: 'string' },
                                            portfolio: { type: 'string' },
                                        },
                                    },
                                },
                            },
                            summary: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: { type: 'array', items: { type: 'string' } },
                                },
                            },
                            objective: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: { type: 'array', items: { type: 'string' } },
                                },
                            },
                            experience: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                company: { type: 'string' },
                                                location: { type: 'string' },
                                                title: { type: 'string' },
                                                date: {
                                                    type: 'object',
                                                    properties: {
                                                        from: { type: 'string' },
                                                        to: { type: 'string' },
                                                    },
                                                },
                                                description: { type: 'array', items: { type: 'string' } },
                                            },
                                        },
                                    },
                                },
                            },
                            education: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                institution: { type: 'string' },
                                                degree: { type: 'string' },
                                                date: {
                                                    type: 'object',
                                                    properties: {
                                                        from: { type: 'string' },
                                                        to: { type: 'string' },
                                                    },
                                                },
                                                description: { type: 'array', items: { type: 'string' } },
                                            },
                                        },
                                    },
                                },
                            },
                            awards: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                from: { type: 'string' },
                                                date: { type: 'string' },
                                                description: { type: 'array', items: { type: 'string' } },
                                            },
                                        },
                                    },
                                },
                            },
                            languages: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                level: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                            technicalSkills: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                level: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                            softSkills: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                level: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                            voluntering: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                from: { type: 'string' },
                                                date: {
                                                    type: 'object',
                                                    properties: {
                                                        from: { type: 'string' },
                                                        to: { type: 'string' },
                                                    },
                                                },
                                                description: { type: 'array', items: { type: 'string' } },
                                            },
                                        },
                                    },
                                },
                            },
                            references: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    value: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                company: { type: 'string' },
                                                phone: { type: 'string' },
                                                email: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                            template: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    settings: {
                                        type: 'object',
                                        properties: {
                                            titleColor: { type: 'string' },
                                            contentColor: { type: 'string' },
                                            backgroundColor1: { type: 'string' },
                                            backgroundColor2: { type: 'string' },
                                            backgroundColor3: { type: 'string' },
                                        },
                                    },
                                    pages: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                columns: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            list: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        name: { type: 'string' },
                                                                        typeCard: { type: 'string' },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            this.updateResume.bind(this),
        );

        // Delete a resume
        this.fastify.delete(
            '/resume/:id',
            {
                schema: {
                    description: 'Delete a resume',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                        },
                        required: ['id'],
                    },
                },
            },
            this.deleteResume.bind(this),
        );

        // Generate and save resume file
        this.fastify.post(
            '/resume/generate/:id',
            {
                schema: {
                    description: 'Generate a downloadable resume file',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                        },
                        required: ['id'],
                    },
                },
            },
            this.generateResumeFile.bind(this),
        );

        // Serve the downloadable resume file
        this.fastify.get(
            '/resume/download/:id/:fileName',
            {
                schema: {
                    description: 'Download a resume file',
                    tags: ['Resume'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            fileName: { type: 'string' },
                        },
                        required: ['id', 'fileName'],
                    },
                },
            },
            this.serveResumeFile.bind(this),
        );

        // Test endpoint
        this.fastify.get(
            '/test',
            {
                schema: {
                    summary: 'Test resume routes',
                    tags: ['Resume'],
                },
            },
            this.testRoutes.bind(this),
        );
    }

    async testData(request, reply) {
        const testData = {
            success: true,
            extractedData: {
                basicDetail: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1234567890',
                    location: 'New York, NY',
                    websiteUrl: {
                        linkedin: 'https://linkedin.com/in/johndoe',
                        github: 'https://github.com/johndoe',
                        portfolio: 'https://johndoe.com',
                    },
                },
                education: {
                    value: [
                        {
                            institution: 'Test University',
                            degree: 'Bachelor of Science',
                            date: { from: '01/2020', to: '12/2023' },
                            description: ['Computer Science'],
                        },
                    ],
                },
                experience: {
                    value: [
                        {
                            company: 'Test Company',
                            title: 'Software Developer',
                            location: 'New York, NY',
                            date: { from: '01/2024', to: 'Present' },
                            description: ['Developed web applications'],
                        },
                    ],
                },
                technicalSkills: {
                    value: [
                        { name: 'JavaScript', level: 'Advanced' },
                        { name: 'React', level: 'Intermediate' },
                    ],
                },
                softSkills: { value: [] },
                languages: { value: [] },
                awards: { value: [] },
                voluntering: { value: [] },
                references: { value: [] },
            },
            message: 'Test data',
        };

        console.log('=== TEST DATA ENDPOINT ===');
        console.log('Sending test data:', JSON.stringify(testData, null, 2));

        reply.type('application/json');
        return reply.send(testData);
    }

    async extractResume(request, reply) {
        try {
            console.log('Received multipart form data');

            const userId = request.query.userId;
            console.log('UserId from query:', userId);

            if (!userId) {
                return reply.code(400).send({
                    success: false,
                    message: 'User ID is required in query parameters',
                });
            }

            if (!request.isMultipart()) {
                return reply.code(400).send({
                    success: false,
                    message: 'Request must be multipart/form-data',
                });
            }

            const parts = request.parts();
            console.log('Parts generator created successfully');

            let fileData = null;
            let partCount = 0;

            try {
                for await (const part of parts) {
                    partCount++;
                    console.log(`Processing part ${partCount}:`, {
                        type: part.type,
                        fieldname: part.fieldname,
                        filename: part.filename,
                        mimetype: part.mimetype,
                        encoding: part.encoding,
                    });

                    if (part.type === 'file' && part.fieldname === 'file') {
                        console.log('Found file part:', {
                            filename: part.filename,
                            mimetype: part.mimetype,
                            fieldname: part.fieldname,
                        });
                        fileData = part;
                        console.log('File part assigned successfully');
                        break;
                    } else if (part.type === 'field') {
                        console.log('Found field:', {
                            fieldname: part.fieldname,
                            value: part.value,
                        });
                        await part.value;
                    } else {
                        console.log('Skipping unknown part type:', part.type);
                        if (part.file) {
                            part.file.resume();
                        }
                    }
                }
            } catch (parsingError) {
                console.error('Error during multipart parsing:', parsingError);
                return reply.code(400).send({
                    success: false,
                    message: 'Error parsing multipart form data',
                });
            }

            console.log(`Total parts processed: ${partCount}`);
            console.log('Final values:', {
                hasFileData: !!fileData,
                userId: userId,
                fileName: fileData?.filename,
                mimeType: fileData?.mimetype,
            });

            if (!fileData) {
                return reply.code(400).send({
                    success: false,
                    message: 'No file uploaded',
                });
            }

            console.log('All validation passed, extracting resume...');
            const result = await this.resumeController.extractResume(fileData, userId);

            console.log('=== ROUTE RESPONSE DEBUG ===');
            console.log('Result success:', result.success);
            console.log('Result has extractedData:', !!result.extractedData);
            console.log('ExtractedData keys:', result.extractedData ? Object.keys(result.extractedData) : 'NO DATA');
            console.log('Basic detail in result:', result.extractedData?.basicDetail?.name);

            const responseData = {
                success: true,
                extractedData: result.extractedData || {},
                message: 'Resume extracted successfully',
            };

            console.log('=== SERIALIZATION TEST ===');
            try {
                const serialized = JSON.stringify(responseData);
                console.log('Serialization successful, length:', serialized.length);
                const parsed = JSON.parse(serialized);
                console.log('Parsed extractedData keys:', Object.keys(parsed.extractedData));
                console.log('Parsed basic detail name:', parsed.extractedData?.basicDetail?.name);
            } catch (serializationError) {
                console.error('Serialization error:', serializationError);
            }

            console.log('=== FINAL RESPONSE TO FRONTEND ===');
            console.log('Response keys:', Object.keys(responseData));
            console.log('Response success:', responseData.success);
            console.log(
                'Response extractedData keys:',
                responseData.extractedData ? Object.keys(responseData.extractedData) : 'NO DATA',
            );

            reply.type('application/json');
            return reply.send(responseData);
        } catch (error) {
            console.error('Extract resume route error:', error);
            return reply.code(error.statusCode || 500).send({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    }

    async saveExtractedResume(request, reply) {
        try {
            const { userId, resumeData, originalFileName } = request.body;

            const resume = await this.resumeController.saveExtractedResume(userId, resumeData, originalFileName);

            return reply.send({
                success: true,
                message: 'Resume data saved successfully',
                resume,
            });
        } catch (error) {
            console.error('Save extracted resume route error:', error);
            return reply.code(error.statusCode || 500).send({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    }

    async createResume(request, reply) {
        try {
            const resumeData = request.body;
            const resume = await this.resumeController.createOrUpdateResume(resumeData);
            reply.status(201).send(resume);
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async getResumeById(request, reply) {
        try {
            const resumeId = request.params.id;
            const resume = await this.resumeController.getResumeById(resumeId);
            if (!resume) {
                reply.status(404).send({ error: 'Resume not found' });
                return;
            }
            reply.status(200).send(resume);
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

    async getResumeByUserId(request, reply) {
        try {
            const userId = request.params.user;
            const resume = await this.resumeController.getResumeByUserId(userId);
            if (!resume) {
                reply.status(404).send({ error: 'Resume not found' });
                return;
            }
            reply.status(200).send(resume);
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async updateResume(request, reply) {
        try {
            const resumeId = request.params.id;
            const updatedData = request.body;
            const updatedResume = await this.resumeController.updateResume({ ...updatedData, _id: resumeId });
            if (!updatedResume) {
                reply.status(404).send({ error: 'Resume not found' });
                return;
            }
            reply.status(200).send(updatedResume);
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async deleteResume(request, reply) {
        try {
            const resumeId = request.params.id;
            const deletedResume = await this.resumeController.deleteResume(resumeId);
            if (!deletedResume) {
                reply.status(404).send({ error: 'Resume not found' });
                return;
            }
            reply.status(200).send({ message: 'Resume deleted' });
        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async generateResumeFile(request, reply) {
        try {
            const resumeId = request.params.id;
            console.log('Generating resume for ID:', resumeId);

            const resume = await this.resumeController.getResumeById(resumeId);
            if (!resume) {
                console.log('Resume not found for ID:', resumeId);
                reply.status(404).send({ error: 'Resume not found' });
                return;
            }

            console.log('Resume fetched successfully:', resume);

            const pdfBuffer = await this.resumeController.generatePDF(resume);
            console.log('Generated PDF size:', pdfBuffer.length, 'bytes');

            const fileName = `resume_${resumeId}.pdf`;
            const fileUrl = `${request.protocol}://${request.hostname}/resume/resume/download/${resumeId}/${fileName}`;

            resume.downloadableLink = fileUrl;
            await resume.save();

            console.log('File URL saved:', fileUrl);

            reply.status(200).send({ fileUrl });
        } catch (error) {
            console.error('Error generating resume file:', error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async serveResumeFile(request, reply) {
        try {
            const resumeId = request.params.id;
            const fileName = request.params.fileName;

            console.log('Fetching resume with ID:', resumeId);

            const resume = await this.resumeController.getResumeById(resumeId);
            if (!resume || !resume.downloadableLink) {
                console.error('Resume not found or downloadableLink is missing for ID:', resumeId);
                reply.status(404).send({ error: 'Resume file not found' });
                return;
            }

            console.log('Resume fetched successfully:', resume);
            console.log('Generating PDF for resume ID:', resumeId);

            const pdfBuffer = await this.resumeController.generatePDF(resume);
            console.log('PDF generated successfully:', pdfBuffer.length, 'bytes');

            console.log('Serving PDF file with name:', fileName);
            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename=${fileName}`);
            reply.send(pdfBuffer);
        } catch (error) {
            console.error('Error serving resume file:', error);
            reply.status(500).send({ error: 'Something went wrong' });
        }
    }

    async testRoutes(request, reply) {
        return reply.send({
            success: true,
            message: 'Resume routes are working!',
            timestamp: new Date().toISOString(),
        });
    }
}

export default async function (fastify) {
    new ResumeRoutes(fastify);
}
