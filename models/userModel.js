const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'A Name is Required for User.'],
        trim: true,
        minLength: [3, 'Minimum Length is 3.'],
        maxLength: [20, 'Maximum Length is 20.']
    },
    phoneNumber: {
        type: String,
        required: [true, 'An phone number is required.'],
        trim: true,
        unique: true,
        validate: {
            validator: validator.isMobilePhone,
            message: 'Phone Number is not valid.'
        }
    },
    photo: {
        type: String
    },
    password: {
        type: String,
        required: [true, 'Pls provide a password.'],
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Pls confirm your password.'],
        validate: {
            validator: function (el) { return el === this.password },
            message: 'Passwords are not the same.'
        }

    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    otp: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    userType: {
        type: String,
        enum: ['donor', 'volunteer'],
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            require: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Donor specific fields
    organizationType: {
        type: String,
        enum: ['restaurant', 'wedding', 'event', 'institution', 'individual'],
        required: function () { return this.userType === 'donor'; }
    },
    // Volunteer specific fields
    availability: {
        type: Map,
        of: [{
            startTime: String,
            endTime: String
        }],
        default: new Map()
    },
    vehicleInfo: {
        hasVehicle: {
            type: Boolean,
            default: false
        },
        capacity: Number // in kg
    },
    trainingStatus: {
        type: String,
        enum: ['pending', 'completed', 'expired'],
        default: 'pending'
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalAssignments: {
        type: Number,
        default: 0
    }
}, {timestamps: true});

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function (next) {

    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();

});

userSchema.pre('save', async function (next) {

    if (!this.isModified('otp')) return next();

    if (this.otp === undefined) return next();

    this.otp = await bcrypt.hash(this.otp, 12);
    next();

})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;

    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function (candidatePass, userPass) {
    return await bcrypt.compare(candidatePass, userPass);
};

userSchema.methods.correctOtp = async function (submittedOTP, sentOPT) {
    return await bcrypt.compare(submittedOTP, sentOPT);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimeStamp) {

    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimeStamp < changedTimeStamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = generateOTP();

    this.passwordResetToken = bcrypt.hash(resetToken, 12);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    return resetToken;
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;