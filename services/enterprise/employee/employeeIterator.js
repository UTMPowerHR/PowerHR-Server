class EmployeeIterator {
    constructor(employees) {
        this.employees = employees;
        this.index = 0;
    }

    hasNext() {
        return this.index < this.employees.length;
    }

    next() {
        return this.hasNext() ? this.employees[this.index++] : null;
    }

    current() {
        return this.employees[this.index];
    }

    reset() {
        this.index = 0;
    }
}

export default EmployeeIterator;
