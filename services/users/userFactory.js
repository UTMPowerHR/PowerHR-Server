import Applicant from '../../models/users/applicant.js';
import Employee from '../../models/users/employee.js';
import User from '../../models/users/user.js';
import SysAdmin from '../../models/users/sysadmin.js';
import JobController from '../enterprise/job/jobController.js';
import ApiError from '../../util/ApiError.js';
import ResumeController from '../resume/resumeController.js';
import Application from '../../models/enterprise/job/application.js';
import EmploymentHistory from '../../models/users/employmentHistory.js';

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
        console.log('Update called with:', { role, id, args });

        switch (role) {
            case 'applicant':
            // If statusType is 'Accepted', change role to Employee
            if (args.statusType === 'Accepted') {
                console.log('Status is Accepted for ID:', id);

                const applicant = await Applicant.findById(id).populate('appliedJobs'); ;
                 if (!applicant) {
                    console.log('Applicant not found');
                    throw new ApiError(404, 'Applicant not found');
                }

                console.log('Applicant data:', applicant);

                // Fetch the most recent job posting or specific job
                const application = await Application
                .findOne({ applicant: id })
                .populate({
                    path: 'posting',
                    populate: { path: 'job', select: 'company title' } // Populate job reference
                });

                if (!application) {
                    throw new ApiError(404, 'Application details not found');
                }

                const { posting } = application;
                console.log('Application details:', application);
                console.log('Posting details:', posting);

                // Safely access company and job title using optional chaining
                const company = posting?.job?.company || null; // Safe access to company
                const jobTitle = posting?.job?.title || 'Employee'; // Safe access to job title
                const salary = posting?.salaryRange?.min;

                console.log('Company:', company);
                console.log('Job Title:', jobTitle);

                // Update the existing application to add resume
                await Application.findByIdAndUpdate(application._id, {
                    resume: applicant.resume  // Update resume only
                });
                
                // Delete the original Applicant document
                await Applicant.deleteOne({ _id: id });

                // Create a new Employee document using the Employee model
                await Employee.create({
                    _id: applicant._id, // Preserve the same ID
                    profilePicture: applicant.profilePicture,
                    firstName: applicant.firstName,
                    lastName: applicant.lastName,
                    email: applicant.email,
                    password: applicant.password, // Preserve hashed password
                    gender: applicant.gender,
                    company: company,
                    personalEmail: args.personalEmail || applicant.email,
                    jobTitle: jobTitle,
                    salary: salary || 0,
                    hireDate: new Date(),
                });

                console.log('Role successfully updated to Employee');
            } else {
                await Applicant.findByIdAndUpdate(id, args);
            }
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

    /**
     * Converts a user (e.g., an employee) to another type (e.g., applicant)
     * @param {string} currentType - The current user type (e.g., 'employee')
     * @param {string} userId - The user ID to be converted
     * @param {object} args - Any additional arguments needed for conversion
     * @returns {object} - The newly created user of the target type
     */
    async convert(role, userId) {
        let user;
        let applications;
        let newUser;
        role = role.toLowerCase();

        if (role === 'employee') {
            // Step 1: Find the user based on the current type
            user = await Employee.findById(userId);
            if (!user) {
                throw new ApiError(404, 'Employee not found');
            }


            const jobController = new JobController();
            applications = await jobController.getApplicationsByApplicant(userId);
            const application = applications[0];

            // Step 2: Prepare the data for the applicant

            // const employmentHistory = new EmploymentHistory({
            //     _id: user._id,
            //     company: user.company,
            //     department: user.department,
            //     jobTitle: user.jobTitle,
            //     hireDate: user.hireDate,
            //     personalEmail: user.personalEmail,
            //     salary: user.salary,
            //     terminationDate: user.terminationDate,
            //     address: user.address,
            //     phone: user.phone,
            //     profilePicture: user.profilePicture,
            // });

            // await employmentHistory.save();

            const employmentHistory = {
                _id: user._id,
                company: user.company,
                department: user.department,
                jobTitle: user.jobTitle,
                hireDate: user.hireDate,
                personalEmail: user.personalEmail,
                salary: user.salary,
                terminationDate: user.terminationDate,
                address: user.address,
                phone: user.phone,
                profilePicture: user.profilePicture,
            }
            console.log(employmentHistory);
            const employmentHistoryData = new EmploymentHistory(employmentHistory);

            // await EmploymentHistory.create(employmentHistoryData);

            await employmentHistoryData.save();

            const applicantData = {
                _id: user._id, // Retain the same _id
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                password: user.password, // Ensure the hashed password is retained
                gender: user.gender,
                resume: application.resume,
                profilePicture: user.profilePicture,
                // Add additional fields if necessary
            };

            // Step 3: Delete the employee record
            await Employee.findByIdAndDelete(userId); // Delete or update as per your logic

            // Step 4: Create a new applicant while retaining the same _id
            newUser = await Applicant.create(applicantData);
        } else {
            throw new ApiError(400, `Unsupported user type: ${role}`);
        }

        // Step 5: Return the newly created applicant
        return newUser;
    }
}

export default UserFactory;
