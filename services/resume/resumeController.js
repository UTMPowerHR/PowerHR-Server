import Resume from '../../models/resume/resume.js';

class ResumeController {
    async createResume(userId) {
        await Resume.create({ user: userId });
    }

    async getResumeByUser(userId) {
        return await Resume.findOne({ user: userId });
    }

    async getAllResumes() {
        return await Resume.find();
    }

    async updateResume(resume) {
        return await Resume.findByIdAndUpdate(resume._id, resume, { new: true });
    }

    async deleteResume(resumeId) {
        return await Resume.findByIdAndDelete(resumeId);
    }
    
    // async updateResume(resume) {
    //     await Resume.findByIdAndUpdate(resume._id, resume);
    // }
}

export default ResumeController;
