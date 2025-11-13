const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hungerSpotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        address: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true,
            enum: [
                // States
                'Andhra Pradesh',
                'Arunachal Pradesh',
                'Assam',
                'Bihar',
                'Chhattisgarh',
                'Goa',
                'Gujarat',
                'Haryana',
                'Himachal Pradesh',
                'Jharkhand',
                'Karnataka',
                'Kerala',
                'Madhya Pradesh',
                'Maharashtra',
                'Manipur',
                'Meghalaya',
                'Mizoram',
                'Nagaland',
                'Odisha',
                'Punjab',
                'Rajasthan',
                'Sikkim',
                'Tamil Nadu',
                'Telangana',
                'Tripura',
                'Uttar Pradesh',
                'Uttarakhand',
                'West Bengal',
                // Union Territories
                'Andaman and Nicobar Islands',
                'Chandigarh',
                'Dadra and Nagar Haveli',
                'Daman and Diu',
                'Delhi',
                'Jammu and Kashmir',
                'Ladakh',
                'Lakshadweep',
                'Puducherry'
            ]
        },
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    categories: [{
        type: String,
        enum: ['everyone', 'young'],
        required: true
    }],
    contactPerson: {
        name: String,
        phone: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: false, // Optional for existing hunger spots, required for new ones
        minLength: 8,
        select: false
    },
    passwordChangedAt: Date
}, {
    timestamps: true
});

// Index for geospatial queries
hungerSpotSchema.index({ "location": "2dsphere" });

// Hash password before saving
hungerSpotSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Update passwordChangedAt when password is modified
hungerSpotSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// Method to check if password is correct
hungerSpotSchema.methods.correctPassword = async function (candidatePass, userPass) {
    return await bcrypt.compare(candidatePass, userPass);
};

// Method to check if password was changed after JWT was issued
hungerSpotSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimeStamp < changedTimeStamp;
    }
    return false;
};

module.exports = mongoose.model('HungerSpot', hungerSpotSchema);
