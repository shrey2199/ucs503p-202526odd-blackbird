const mongoose = require('mongoose');

const hungerSpotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        address: String,
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
    }]
    ,
    acceptedFoodTypes: [{
        type: String,
        enum: ['fresh food', 'shelf stable food', 'fast food', 'groceries']
    }],
    capacity: {
    type: Number,
    required: true // in kg per day
},
    currentLoad: {
    type: Number,
    default: 0
},
    contactPerson: {
    name: String,
    phone: String
},
    isActive: {
    type: Boolean,
    default: true
},
    priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
}
}, {
    timestamps: true
});

// Index for geospatial queries
hungerSpotSchema.index({ "location": "2dsphere" });

module.exports = mongoose.model('HungerSpot', hungerSpotSchema);
