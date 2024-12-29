import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT', 'PLAIN',] 
    },
    size: {
        type: String,
        required: true
    },
    uploader: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    department: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        default: ''
    },
    fileData: {
        type: Buffer,
        required: true
    }
});

const Document = mongoose.model('Document', documentSchema);
export default Document;