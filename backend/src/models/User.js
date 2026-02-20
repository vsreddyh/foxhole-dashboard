const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['Member', 'Trusted', 'Admin', 'Super Admin', 'Maintainer'];

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 32,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ROLES,
            default: 'Member',
        },
    },
    { timestamps: true }
);

// Compare plain password with stored hash
userSchema.methods.comparePassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
};

// Return safe user object (no password hash)
userSchema.methods.toSafeObject = function () {
    return {
        _id: this._id,
        username: this.username,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const User = mongoose.model('User', userSchema);

module.exports = { User, ROLES };
