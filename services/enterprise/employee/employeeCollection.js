import EmployeeIterator from "./employeeIterator";
import Employee from "../../../models/users/employee";

class EmployeeCollection {
    constructor() {
        this.employees = [];
    }

    async loadEmployees() {
        this.employees = await Employee.find({}).populate('company department');
    }

    getCompanyIterator(companyId) {
        const filteredEmployees = this.employees.filter(
            employee => employee.company._id.toString() === companyId.toString()
        );
        return new EmployeeIterator(filteredEmployees);
    }

    getDepartmentIterator(departmentId) {
        const filteredEmployees = this.employees.filter(
            employee => employee.department?._id.toString() === departmentId.toString()
        );
        return new EmployeeIterator(filteredEmployees);
    }

    getJobTitleIterator(jobTitle) {
        const filteredEmployees = this.employees.filter(
            employee => employee.jobTitle.toLowerCase() === jobTitle.toLowerCase()
        );
        return new EmployeeIterator(filteredEmployees);
    }

    getSalaryRangeIterator(minSalary, maxSalary) {
        const filteredEmployees = this.employees.filter(
            employee => employee.salary >= minSalary && employee.salary <= maxSalary
        );
        return new EmployeeIterator(filteredEmployees);
    }

    static async createCollection() {
        const collection = new EmployeeCollection();
        await collection.loadEmployees();
        return collection;
    }
}

export default EmployeeCollection;