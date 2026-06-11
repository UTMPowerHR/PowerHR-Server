import Company from '../../../models/enterprise/company/company.js';
import Department from '../../../models/enterprise/company/department.js';
import ApiError from '../../../util/ApiError.js';
import UserFactory from '../../users/userFactory.js';
import AuthController from '../../auth/authController.js';
import EmployeeCollection from '../employee/employeeCollection.js';
import EmployeeIterator from '../employee/employeeIterator.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import EmploymentHistory from '../../../models/users/employmentHistory.js';
dayjs.extend(isBetween);

class CompanyController {
    constructor() {
        this.userFactory = new UserFactory();
        this.authFacade = new AuthController();
    }

    async createCompany(name, email, phone, address) {
        let company;
        let department;

        const companyExist = await Company.findOne({ email });

        if (companyExist) {
            throw new ApiError(400, 'Company already exists');
        }

        try {
            company = await Company.create({
                name,
                email,
                phone,
                address,
            });

            department = await Department.create({
                name: 'Admin',
                company: company._id,
            });

            const adminEmail = email;
            const password = Math.random().toString(36).substring(2, 10);

            await this.authFacade.register('employee', {
                firstName: 'Admin',
                lastName: '1',
                email: adminEmail,
                personalEmail: adminEmail,
                gender: 'Prefer not to say',
                password,
                confirmPassword: password,
                company: company._id,
                jobTitle: 'Admin',
                department: department._id,
                salary: 0,
            });

            return company;
        } catch (error) {
            if (company?._id) {
                await Company.findByIdAndDelete(company._id);
            }

            if (department?._id) {
                await Department.findByIdAndDelete(department._id);
            }
            throw error;
        }
    }

    async isExist(email) {
        const company = await Company.exists({ email });

        if (company) {
            return true;
        }

        return false;
    }

    async getCompanyDetail(companyId) {
        const company = await Company.findById(companyId);

        // find all branches
        const branches = await Company.find({ parentCompany: companyId });

        // find all departments
        const departments = await Department.find({ company: companyId });

        // find all employees
        const employees = await this.userFactory.find('employee', { company: companyId });

        return { company, branches, departments, employees };
    }

    async updateCompany(companyId, args) {
        const company = await Company.findById(companyId);

        if (!company) {
            throw new ApiError(404, 'Company not found');
        }

        const newCompany = await Company.findByIdAndUpdate(companyId, args);

        return newCompany;
    }

    async getCompanyProfile(companyId) {
        const company = await Company.findById(companyId);

        return company;
    }

    // Manage Employees
    async getEmployees(companyId) {
        const employees = await this.userFactory.find('employee', { company: companyId });

        // remove password from each employee
        const temp = employees.map((employee) => {
            const obj = employee.toObject();
            delete obj.password;
            return obj;
        });

        return temp;
    }

    // Manage Departments
    async getDepartments(companyId) {
        const departments = await Department.find({ company: companyId });

        return departments;
    }

    async getDepartmentById(departmentId) {
        const department = await Department.findById(departmentId);

        if (!department) {
            throw new ApiError(404, 'Department not found');
        }

        const employees = await this.userFactory.find('employee', { department: departmentId });

        return { department, employees };
    }

    async createDepartment(companyId, name, underDepartment) {
        const department = await Department.create({
            company: companyId,
            name,
            underDepartment,
        });

        return department;
    }

    async updateDepartment(departmentId, args) {
        const department = await Department.findById(departmentId);

        if (!department) {
            throw new ApiError(404, 'Department not found');
        }

        await department.updateOne(args);

        return department;
    }

    async deleteDepartment(departmentId) {
        const department = await Department.findById(departmentId);

        if (!department) {
            throw new ApiError(404, 'Department not found');
        }

        await Department.findByIdAndDelete(departmentId);

        return true;
    }

    async getDepartmentEmployees(departmentId) {
        const employees = await this.userFactory.find('employee', { department: departmentId });

        return employees;
    }

    async setEmployeeDepartment(employeeId, departmentId) {
        const employee = await this.userFactory.findOne('employee', { _id: employeeId });

        if (!employee) {
            throw new ApiError(404, 'Employee not found');
        }

        await this.userFactory.update('employee', employeeId, { department: departmentId });

        return true;
    }

    async getTurnOver(companyId, startDate, endDate) {
        const toDate = endDate ? dayjs(endDate, 'DD/MM/YYYY') : dayjs();
        const fromDate = startDate ? dayjs(startDate, 'DD/MM/YYYY') : toDate.subtract(1, 'year');

        const employees = await this.userFactory.find('employee', {
            company: companyId,
            $or: [{ terminationDate: { $exists: false } }, { terminationDate: { $gte: fromDate.toDate() } }],
        });

        const employeesLeft = employees.filter((employee) => {
            const terminationDate = employee.terminationDate ? dayjs(employee.terminationDate) : null;
            return terminationDate && terminationDate.isBetween(fromDate, toDate, null, '[]');
        }).length;

        const totalEmployeesBeginning = employees.filter((employee) => {
            const hireDate = dayjs(employee.hireDate);
            return hireDate.isBefore(fromDate);
        }).length;

        const totalEmployeesEnd = employees.filter((employee) => {
            const hireDate = dayjs(employee.hireDate);
            return hireDate.isBefore(toDate);
        }).length;

        const averageEmployees = Math.ceil((totalEmployeesBeginning + totalEmployeesEnd) / 2);

        const turnoverRate = (employeesLeft / averageEmployees) * 100;

        return {
            rate: turnoverRate.toFixed(2),
            employees: employees.length,
            employeesLeft,
            averageEmployees,
            totalEmployeesBeginning,
            totalEmployeesEnd,
        };
    }
  
    //Employee Iterator part
    async getEmployeeCollection(companyId) {
        return await EmployeeCollection.createCollection(companyId);
    }

    async getEmployeesByDepartment(departmentId) {
        const collection = await this.getEmployeeCollection();
        const iterator = collection.getDepartmentEmployeesIterator(departmentId);
        const employees = [];
        
        while (iterator.hasNext()) {
            employees.push(iterator.next());
        }
        
        return employees;
    }

    async getEmployeesByJobTitle(companyId, jobTitle) {
        const collection = await this.getEmployeeCollection(companyId);
        const iterator = collection.getJobTitleIterator(jobTitle);
        const employees = [];
        
        while (iterator.hasNext()) {
            employees.push(iterator.next());
        }
        
        return employees;
    }

    async getEmployeesBySalaryRange(companyId, minSalary, maxSalary) {
        const collection = await this.getEmployeeCollection(companyId);
        const iterator = collection.getSalaryRangeIterator(minSalary, maxSalary);
        const employees = [];
        
        while (iterator.hasNext()) {
            employees.push(iterator.next());
        }
        
        return employees;
    }

    async getRecentlyTerminatedEmployees(companyId, withinDays) {
        const collection = await this.getEmployeeCollection(companyId);
        const iterator = collection.getTerminatedEmployeesIterator(withinDays);
        const employees = [];
        
        while (iterator.hasNext()) {
            employees.push(iterator.next());
        }
        
        return employees;
    }

    async getEmploymentHistory(){
        const employmentHistory = await EmploymentHistory.find({});

        return employmentHistory;
    }
}

export default CompanyController;
