import DocumentController from '../../services/document/documentController.js';
import ApiError from '../../util/ApiError.js';

class DocumentRoutes {
    constructor(fastify) {
        this.fastify = fastify;
        this.documentController = new DocumentController();
        this.initRoutes();
    }

    initRoutes() {
        //Upload document
        this.fastify.post(
            '/upload',
            {
                schema: {
                    description: 'Upload a document',
                    tags: ['Documents'],
                    consumes: ['multipart/form-data'],
                    // body: {
                    //     type: 'object',
                    //     properties: {
                    //         file: { isFile: true }, // or isFile: true
                    //         uploader: { type: 'string' },
                    //         department: { type: 'string' },
                    //         notes: { type: 'string' }
                    //     },
                    //     required: ['file', 'uploader', 'department']
                    // }
                }
            },
            this.uploadDocument.bind(this)
        );                

        // Get all documents
        this.fastify.get(
            '/',
            {
                schema: {
                    description: 'Get all documents',
                    tags: ['Documents']
                }
            },
            this.getAllDocuments.bind(this)
        );

        // Get documents by department
        this.fastify.get(
            '/department/:department',
            {
                schema: {
                    description: 'Get documents by department',
                    tags: ['Documents'],
                    params: {
                        type: 'object',
                        properties: {
                            department: { type: 'string' }
                        },
                        required: ['department']
                    }
                }
            },
            this.getDocumentsByDepartment.bind(this)
        );

        // Get document by ID
        this.fastify.get(
            '/:id',
            {
                schema: {
                    description: 'Get document by ID',
                    tags: ['Documents'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' }
                        },
                        required: ['id']
                    }
                }
            },
            this.getDocumentById.bind(this)
        );

        // Update document
        this.fastify.put(
            '/:id',
            {
                schema: {
                    description: 'Update document',
                    tags: ['Documents'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' }
                        },
                        required: ['id']
                    },
                    body: {
                        type: 'object',
                        properties: {
                            notes: { type: 'string' },
                            department: { type: 'string' }
                        }
                    }
                }
            },
            this.updateDocument.bind(this)
        );

        // Delete document
        this.fastify.delete(
            '/:id',
            {
                schema: {
                    description: 'Delete document',
                    tags: ['Documents'],
                    params: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' }
                        },
                        required: ['id']
                    }
                }
            },
            this.deleteDocument.bind(this)
        );
    }

    async uploadDocument(request, reply) {
        try {
            // Access file and form fields from the body
            const { file, uploader, department, notes } = request.body;
            console.log(request.body);
            // Validate if file exists
            if (!file) {
                return reply.code(400).send({ error: 'No file uploaded' });
            }
    
            // Validate uploader and department fields
            if (!uploader || !department) {
                return reply.code(400).send({ error: 'Uploader and department are required' });
            }
    
            // Extract the actual values from the field objects
            const uploaderValue = uploader.value; // Extract value from uploader field
            const departmentValue = department.value; // Extract value from department field
            const notesValue = notes.value || ''; // Extract value from notes field (or use empty string if not provided)
    
            // Access the file stream and convert it to buffer
            const fileBuffer = await file.toBuffer();  // Access the file stream correctly
            const fileSize = (fileBuffer.length / 1024).toFixed(2) + 'KB';
    
            // Prepare the document data
            const document = {
                name: file.filename,  // Use the filename directly
                type: file.mimetype.split('/')[1].toUpperCase(),
                size: fileSize,
                uploader: uploaderValue, // Use the extracted uploader value
                department: departmentValue, // Use the extracted department value
                notes: notesValue, // Use the extracted notes value
                fileData: fileBuffer,
                date: new Date()
            };
    
            // Call the controller to save the document
            const savedDoc = await this.documentController.createDocument(document);
    
            // Respond with the saved document
            return reply.code(201).send(savedDoc);
        } catch (error) {
            request.log.error(error);
            return reply.code(error.statusCode || 500).send({ error: error.message || 'Failed to upload document' });
        }
    }       

    async getAllDocuments(request, reply) {
        try {
            const documents = await this.documentController.getAllDocuments();
            return reply.send(documents);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch documents' });
        }
    }
    
    async getDocumentsByDepartment(request, reply) {
        try {
            const { department } = request.params;
            const documents = await this.documentController.getDocumentsByDepartment(department);
            return reply.send(documents);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch documents' });
        }
    }

    async getDocumentById(request, reply) {
        try {
            const { id } = request.params;
            const document = await this.documentController.getDocumentById(id);
            if (!document) {
                return reply.code(404).send({ error: 'Document not found' });
            }
            return reply.send(document);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch document' });
        }
    }

    async updateDocument(request, reply) {
        try {
            const { id } = request.params;
            const update = request.body;
            const document = await this.documentController.updateDocument(id, update);
            return reply.send(document);
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to update document' });
        }
    }

    async deleteDocument(request, reply) {
        try {
            const { id } = request.params;
            await this.documentController.deleteDocument(id);
            return reply.code(204).send();
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Failed to delete document' });
        }
    }
}

export default async function(fastify) {
    new DocumentRoutes(fastify);
}