import Applicant from '../../models/users/applicant.js';
import Employee from '../../models/users/employee.js';
import User from '../../models/users/user.js';
import SysAdmin from '../../models/users/sysadmin.js';
import ApiError from '../../util/ApiError.js';
import ResumeController from '../resume/resumeController.js';

class UserFactory {
    /**
     * Creates a user factory
     * @constructor
     */
    constructor() {
        this.resumeController = new ResumeController();
    }

    /**
     * Creates a user based on the role
     * @param {string} role - The role of the user
     * @param {JSON} args - The user's information
     * @returns {object} - The created user
     */
    async createUser(role, args) {
        const {
            firstName,
            lastName,
            email,
            gender,
            password,
            confirmPassword,
            company,
            jobTitle,
            department,
            personalEmail,
            hireDate,
            terminationDate,
            salary,
        } = args;

        const userExists = await User.exists({ email });

        if (userExists) {
            throw new ApiError(400, 'User already exists');
        }

        switch (role) {
            case 'applicant':
                if (password !== confirmPassword) {
                    throw new ApiError(400, 'Passwords do not match');
                }

                if (password.length < 8) {
                    throw new ApiError(400, 'Password must be at least 8 characters long');
                }

                if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
                    throw new ApiError(
                        400,
                        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                    );
                }

                return new Applicant({ email, firstName, lastName, password, gender });
            case 'employee':
                return new Employee({
                    firstName,
                    lastName,
                    email,
                    gender,
                    password: '123456',
                    company: company,
                    jobTitle: jobTitle || 'Unassigned',
                    department: department,
                    personalEmail,
                    hireDate,
                    terminationDate,
                    salary,
                });
            case 'sysadmin':
                return new SysAdmin({
                    firstName,
                    lastName,
                    gender,
                    email,
                    password,
                });
            case 'user':
                return new User(args);
            default:
                throw new ApiError(400, 'Invalid role');
        }
    }

    /**
     * Registers a user
     * @param {string} role - The role of the user
     * @param {JSON} args - The user's information
     * @returns {object} - The created user
     */
    async register(role, args) {
        const user = await this.createUser(role, args);

        if (role === 'applicant') {
            await user.save();
            await this.resumeController.createResume(user._id);
        } else {
            await user.save();
        }

        return user;
    }

    /**
     * Updates a user
     * @param {string} role - The role of the user
     * @param {JSON} args - The user's information
     * @returns {object} - The updated user
     */
    async findOne(role, args) {
        switch (role) {
            case 'applicant':
                return Applicant.findOne(args);
            case 'employee':
                return Employee.findOne(args);
            case 'sysadmin':
                return SysAdmin.findOne(args);
            case 'user':
                return User.findOne(args).exec();
            default:
                throw new ApiError(400, 'Invalid role');
        }
    }

    /**
     * Finds a user
     * @param {string} role - The role of the user
     * @param {JSON} args - The user's information
     * @returns {object} - The found user
     */
    async find(role, args) {
        switch (role) {
            case 'applicant':
                return Applicant.find(args);
            case 'employee':
                return Employee.find(args);
            case 'sysadmin':
                return SysAdmin.find(args);
            case 'user':
                return User.find(args);
            default:
                throw new ApiError(400, 'Invalid role');
        }
    }

    /**
     * Finds a user by id
     * @param {string} id - The id of the user
     * @returns {object} - The found user
     */
    async findById(id) {
        const user = await User.findById(id);

        return user;
    }

    /**
     * Finds a user by id and updates it
     * @param {string} id - The id of the user
     * @param {JSON} update - The update information
     * @returns {object} - The updated user
     */
    async findByIdAndUpdate(id, update) {
        const user = await User.findByIdAndUpdate(id, update);

        return user;
    }

    /**
     * Filters a user's information
     * @param {string} id - The id of the user
     * @returns {object} - The filtered user
     */
    async getMe(id) {
        const user = await User.findById(id);

        return user.getMe();
    }

    /**
     * Saves a user
     * @param {object} user - The user to save
     */
    async save(user) {
        await user.save();
    }

    /**
     * Compares a user's password
     * @param {object} user - The user to compare
     * @param {string} password - The password to compare
     * @returns {boolean} - The result of the comparison
     */
    async comparePassword(user, password) {
        const compare = await user.comparePassword(password);

        return compare;
    }

    /**
     * Changes a user's password
     * @param {string} id - The id of the user
     * @param {string} newPassword - The new password
     * @param {string} confirmPassword - The confirmed password
     * @param {string} oldPassword - The old password
     */
    async changePassword(id, newPassword, confirmPassword, oldPassword = null) {
        if (newPassword !== confirmPassword) {
            throw new ApiError(400, 'Passwords do not match');
        }

        if (newPassword.length < 8) {
            throw new ApiError(400, 'Password must be at least 8 characters long');
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(newPassword)) {
            throw new ApiError(
                400,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            );
        }

        const user = await User.findById(id);

        if (oldPassword) {
            const compare = await user.comparePassword(oldPassword);

            if (!compare) {
                throw new ApiError(400, 'Incorrect password');
            }
        }

        user.password = newPassword;

        await user.save();
    }

    /**
     * Deletes a user
     * @param {string} id - The id of the user
     */
    async delete(id) {
        await User.findByIdAndDelete(id);
    }

    /**
     * updated user information
     * @param {string} role - The role of the user
     * @param {JSON} args - The user's information
     * @returns {object} - The updated user
     */

    async update(role, id, args) {
        switch (role) {
            case 'applicant':
                await Applicant.findByIdAndUpdate(id, args);
                break;
            case 'employee':
                await Employee.findByIdAndUpdate(id, args);
                break;
            case 'sysadmin':
                await SysAdmin.findByIdAndUpdate(id, args);
                break;
            case 'user':
                await User.findByIdAndUpdate(id, args);
                break;
            default:
                throw new ApiError(400, 'Invalid role');
        }

        return this.getMe(id);
    }
}

export default UserFactory;
