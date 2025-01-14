import CompanyController from './company/companyController.js';
import FormController from './form/formController.js';
import AuthController from '../auth/authController.js';
import UserFactory from '../users/userFactory.js';
import JobController from './job/jobController.js';
import LogController from './log/logController.js';

class EnterpriseFacade {
    constructor() {
        this.companyController = new CompanyController();
        this.formController = new FormController();
        this.authController = new AuthController();
        this.userFactory = new UserFactory();
        this.logController = new LogController();
        this.jobController = new JobController(this);
    }

    //Applicant
    async findByIdAndUpdateApplicant(applicantId, args) {
        return await this.userFactory.findByIdAndUpdate(applicantId, args);
    }

    // Company
    async createCompany(name, email, phone, address) {
        return await this.companyController.createCompany(name, email, phone, address);
    }

    async isCompanyExist(email) {
        return await this.companyController.isExist(email);
    }

    async getCompanyDetail(companyId) {
        return await this.companyController.getCompanyDetail(companyId);
    }

    async updateCompany(companyId, args) {
        return await this.companyController.updateCompany(companyId, args);
    }

    async getCompanyProfile(companyId) {
        return await this.companyController.getCompanyProfile(companyId);
    }

    async getEmployees(companyId) {
        return await this.companyController.getEmployees(companyId);
    }

    async getDepartments(companyId) {
        return await this.companyController.getDepartments(companyId);
    }

    async getDepartmentById(departmentId) {
        return await this.companyController.getDepartmentById(departmentId);
    }

    async createDepartment(companyId, name, underDeparment = null) {
        return await this.companyController.createDepartment(companyId, name, underDeparment);
    }

    async updateDepartment(departmentId, args) {
        return await this.companyController.updateDepartment(departmentId, args);
    }

    async deleteDepartment(departmentId) {
        return await this.companyController.deleteDepartment(departmentId);
    }

    async getDepartmentEmployees(departmentId) {
        return await this.companyController.getDepartmentEmployees(departmentId);
    }

    async setEmployeeDepartment(employeeId, departmentId) {
        return await this.companyController.setEmployeeDepartment(employeeId, departmentId);
    }

    async registerEmployee(args) {
        return await this.authController.register('employee', args);
    }

    async updateEmployee(employeeId, args) {
        return await this.userFactory.update(args.__t.toLowerCase(), employeeId, args);
    }

    async convertEmployeeToApplicant(employeeId) {
        return await this.userFactory.convert('employee', employeeId);
    }

    // Form
    async createForm(createdBy, company, name, description) {
        return await this.formController.createForm(createdBy, company, name, description);
    }

    async updateForm(form) {
        return await this.formController.updateForm(form);
    }

    async deleteForm(formId) {
        await this.formController.deleteForm(formId);
    }

    async getFormsByUser(userId) {
        return await this.formController.getFormsByUser(userId);
    }

    async getFormByIdWithSnapshot(formId) {
        return await this.formController.getFormByIdWithSnapshot(formId);
    }

    async getPublishFormsByCompany(companyId, userId) {
        return await this.formController.getPublishFormsByCompany(companyId, userId);
    }

    async getPublishFormById(formId) {
        return await this.formController.getPublishFormById(formId);
    }

    async submitForm(formId, userId, responses) {
        return await this.formController.submitForm(formId, userId, responses);
    }

    async getFeedbacksByFormId(formId) {
        return await this.formController.getFeedbacksByFormId(formId);
    }

    // Job
    async createPosting(data) {
        return await this.jobController.createPosting(data);
    }

    async updatePosting(postingId, args) {
        return await this.jobController.updatePosting(postingId, args);
    }

    async getPosting(postingId) {
        return await this.jobController.getPosting(postingId);
    }

    async getPostings(companyId) {
        return await this.jobController.getPostings(companyId);
    }

    async getAllPostings() {
        return await this.jobController.getAllPostings();
    }

    async createApplication(postingId, applicantId) {
        return await this.jobController.createApplication(postingId, applicantId);
    }

    async getApplicationsByPosting(postingId) {
        return await this.jobController.getApplicationsByPosting(postingId);
    }

    async getAllApplication(companyId, status) {
        return await this.jobController.getAllApplication(companyId, status);
    }

    async getListIdApplications(userId) {
        return await this.jobController.getListIdApplications(userId);
    }

    async getApplicationsByApplicant(applicantId) {
        return await this.jobController.getApplicationsByApplicant(applicantId);
    }

    async updateApplication(applicationId, status) {
        return await this.jobController.updateApplication(applicationId, status);
    }

    async analyticOptionsApplications(companyId, status) {
        return await this.jobController.analyticOptionsApplications(companyId, status);
    }

    async analyticCompletedApplications(companyId, years, employmentTypes, jobTitles, status) {
        return await this.jobController.analyticCompletedApplications(
            companyId,
            years,
            employmentTypes,
            jobTitles,
            status,
        );
    }

    async filterApplications(postingId, bodyRequirements) {
        return await this.jobController.filterApplications(postingId, bodyRequirements);
    }

    async getPostingListByCompanyId(companyId) {
        return await this.jobController.getPostingListByCompanyId(companyId);
    }

    // Log
    async logAction(user, company, action, description) {
        return await this.logController.logAction(user, company, action, description);
    }

    async getCompanyLogs(company, filters) {
        return await this.logController.getCompanyLogs(company, filters);
    }

    //analytic
    async getTurnOver(companyId, startDate, endDate) {
        return await this.companyController.getTurnOver(companyId, startDate, endDate);
    }

    async getEmploymentHistory(){
    
        return await this.companyController.getEmploymentHistory();
    }
}

export default EnterpriseFacade;
