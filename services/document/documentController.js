import Document from '../../models/document/document.js';
import ApiError from '../../util/ApiError.js';

class DocumentController {

    async createDocument(documentData) {
        try {
            const allowedTypes = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT', 'PLAIN'];
            console.log(documentData.type);
            if (!allowedTypes.includes(documentData.type)) {
                throw new ApiError(400, 'Invalid file type');
            }

            const document = new Document(documentData);
            await document.save();
            
            const response = document.toObject();
            delete response.fileData; // Don't send file data in response
            return response;
        } catch (error) {
            throw new ApiError(400, error.message);
        }
    }

    async getAllDocuments() {
        const documents = await Document.find({})
            .select('-fileData')
            .sort({ date: -1 });
        return documents;
    }

    async getDocumentsByDepartment(department) {
        const documents = await Document.find({ department })
            .select('-fileData')
            .sort({ date: -1 });
        return documents;
    }

    async getDocumentById(id) {
        const document = await Document.findById(id);
        if (!document) {
            throw new ApiError(404, 'Document not found');
        }
        return document;
    }

    async updateDocument(id, updateData) {
        const allowedUpdates = ['notes', 'department'];
        const updates = Object.keys(updateData)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        const document = await Document.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-fileData');

        if (!document) {
            throw new ApiError(404, 'Document not found');
        }

        return document;
    }

    async deleteDocument(id) {
        const document = await Document.findByIdAndDelete(id);
        if (!document) {
            throw new ApiError(404, 'Document not found');
        }
    }

    async downloadDocument(id) {
        const document = await Document.findById(id);
        if (!document) {
            throw new ApiError(404, 'Document not found');
        }
        return {
            fileData: document.fileData,
            fileName: document.name,
            fileType: document.type
        };
    }
}

export default DocumentController;