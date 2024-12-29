import mongoose from 'mongoose';

const employmentHistorySchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'  // This will reference either Employee or Applicant
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    hireDate: {
        type: Date,
        required: true
    },
    personalEmail: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true,
        default: 0
    },
    terminationDate: {
        type: Date,
        default: null
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    phone: String,
    profilePicture: String
});

const EmploymentHistory = mongoose.model('EmploymentHistory', employmentHistorySchema);

export default EmploymentHistory;