const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  donorWilling: {
    type: Boolean,
    required: true,
    default: false
  },
  foodDetails: {
    category: {
      type: String,
      required: true
    },
    description: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['kg', 'pieces', 'packets', 'portions'],
      default: 'kg'
    },
    expiryTime: {
      type: Date,
      required: true
    },
    images: [
        {
            data: Buffer,
            contentType: String
        }
    ]
  },
  pickupLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  assignedHungerSpot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HungerSpot',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'volunteer_assigned', 'in_transit', 'delivered', 'rejected'],
    default: 'pending'
  },
  requestTime: {
    type: Date,
    default: Date.now
  },
  assignmentTime: Date,
  deliveryTime: Date,
  rejectionReason: String,
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  notes: String
}, {
  timestamps: true
});

// Index for geospatial queries and status filtering
foodSchema.index({ "pickupLocation.coordinates": "2dsphere" });
foodSchema.index({ status: 1, requestTime: 1 });
foodSchema.index({ donorId: 1, status: 1 });

module.exports = mongoose.model('Food', foodSchema);
