import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    profilePicture: {
        type: String,
    },

    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Prefer not to say'],
        required: true,
    },
});

userSchema.methods.comparePassword = async function (password) {
    const compare = await bcrypt.compare(password, this.password);
    return compare;
};

userSchema.methods.getMe = function () {
    const userObject = this.toObject();
    delete userObject.password;
    userObject.role = userObject.__t;
    delete userObject.__t;
    return userObject;
};

userSchema.methods.getPublicProfile = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.__t;
    delete userObject.appliedJobs;
    return userObject;
};

userSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt(10);
    if (!this.password.startsWith('$2b$')) {
        this.password = await bcrypt.hash(this.password, salt);
    }

    //email is lowercase
    this.email = this.email.toLowerCase();

    //name is uppercase
    this.firstName = this.firstName.toUpperCase();
    this.lastName = this.lastName.toUpperCase();
    next();
});

userSchema.pre('create', async function (next) {
    const salt = await bcrypt.genSalt(10);
    const hash = bcrypt.hash(this.password, salt);
    this.password = hash;

    //email is lowercase
    this.email = this.email.toLowerCase();

    //name is uppercase
    this.firstName = this.firstName.toUpperCase();
    this.lastName = this.lastName.toUpperCase();
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
