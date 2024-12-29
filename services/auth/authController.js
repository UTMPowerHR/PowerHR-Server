import UserFactory from '../users/userFactory.js';
import ApiError from '../../util/ApiError.js';
import bcrypt from 'bcrypt';
import Authentication from '../../models/auth/authentication.js';
import Jwt from '../../util/Jwt.js';
import Email from '../../util/Email.js';
import dayjs from 'dayjs';

const frontEndUrl = process.env.FRONTEND_URL;

class AuthController {
    constructor() {
        this.userFactory = new UserFactory();
    }

    async register(role, userData) {
        const user = await this.userFactory.register(role, userData);

        const token = Jwt.generateToken({ id: user._id, type: 'active' }, '7d');

        await Authentication.create({
            user: user._id,
            token: {
                activate: {
                    token,
                    changePassword: role !== 'applicant',
                },
            },
        });

        // Email account activation
        const subject = 'Account Activation';
        const text = `Hello ${user.firstName} ${user.lastName},\n\nPlease verify your account by clicking the following link: ${frontEndUrl}/activate?token=${token}\n`;

        if (role === 'applicant') {
            await Email.sendEmail(user.email, subject, text);
        } else {
            await Email.sendEmail(user.personalEmail, subject, text);
        }

        return user;
    }

    async activate(token, password = null, confirmPassword = null) {
        const authentication = await Authentication.findOne({ 'token.activate.token': token });

        if (!authentication) {
            throw new ApiError(400, 'Invalid token');
        }

        try {
            Jwt.verifyToken(token);
        } catch (error) {
            throw new ApiError(400, 'Token expired');
        }

        authentication.active = true;
        authentication.token.activate.token = undefined;

        if (password && confirmPassword) {
            await this.userFactory.changePassword(authentication.user, password, confirmPassword);
            authentication.token.activate.changePassword = false;
        }

        await authentication.save();

        // Email account activation
        const user = await this.userFactory.findOne('user', { _id: authentication.user });
        const subject = 'Account Activated';
        const text = `Hello ${user.firstName} ${user.lastName},\n\nThis is a confirmation that your account has been activated.\n`;

        await Email.sendEmail(user.email, subject, text);

        return true;
    }

    async login(email, password) {
        const user = await this.userFactory.findOne('user', { email });

        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const authentication = await Authentication.findOne({ user: user._id });

        if (user?.terminationDate && dayjs(user.terminationDate).isBefore(dayjs())) {
            await this.userFactory.convert(user.__t, user._id);
        }

        if (!authentication.active) {
            throw new ApiError(401, 'Account not activated');
        }

        const correctPassword = await bcrypt.compare(password, user.password);

        if (!correctPassword) {
            throw new ApiError(401, 'Invalid email or password');
        }

        const userPublic = await this.userFactory.getMe(user._id);

        const token = Jwt.generateToken({ id: user._id, type: 'access', company: user?.company }, '1d');

        return { user: userPublic, token };
    }

    async resetPasswordEmail(email) {
        const user = await this.userFactory.findOne('user', { email });

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Find user id in authentication collection
        const authentication = await Authentication.findOne({ user: user._id });

        if (authentication.token.reset.token) {
            try {
                Jwt.verifyToken(authentication.token.reset.token);

                if (authentication.token.reset.counter > 3) {
                    throw new ApiError(400, 'Too many requests. Please try again after 1 hour');
                }

                if (authentication.token.reset.counter === undefined) {
                    authentication.token.reset.counter = 0;
                }

                authentication.token.reset.counter += 1;
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    authentication.token.reset.token = undefined;
                    authentication.token.reset.counter = 0;
                } else {
                    throw error;
                }
            }
        }

        const token = Jwt.generateToken({ email, type: 'reset' }, '1h');

        authentication.token.reset.token = token;

        await authentication.save();

        // Email password reset link
        const subject = 'Password Reset';
        const text = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${frontEndUrl}/reset-password?token=${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`;

        await Email.sendEmail(email, subject, text);

        return token;
    }

    async resetPassword(token, password, confirmPassword) {
        const authentication = await Authentication.findOne({ 'token.reset.token': token });

        if (!authentication) {
            throw new ApiError(400, 'Invalid token');
        }

        try {
            Jwt.verifyToken(token);
        } catch (error) {
            throw new ApiError(400, 'Token expired');
        }

        await this.userFactory.changePassword(authentication.user, password, confirmPassword);

        authentication.token.reset.token = undefined;
        authentication.token.reset.counter = 0;

        await authentication.save();

        return true;
    }

    async verifyToken(token) {
        // Find token in authentication collection (token reset or token activate
        const authentication = await Authentication.findOne({
            $or: [{ 'token.reset.token': token }, { 'token.activate.token': token }],
        });

        if (!authentication) {
            throw new ApiError(400, 'Invalid token');
        }

        try {
            Jwt.verifyToken(token);
        } catch (error) {
            throw new ApiError(400, 'Token expired');
        }

        return authentication;
    }

    async changePassword(id, newPassword, confirmPassword, oldPassword) {
        await this.userFactory.changePassword(id, newPassword, confirmPassword, oldPassword);

        return true;
    }
}

export default AuthController;
