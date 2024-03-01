const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    Name: String,
    AdminId: {
        type: String,
        unique: true,
    },
    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'REPORT_ADMIN', "1"],
        default: 1
    }
    ,
    SUPER_ADMIN_COUNT: {
        type: Number,
        default: 0
    }
    ,
    Password: String,
    Gender: String,
    MobileNumber: String,

    Slm: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Slm' }
    ]
})

module.exports = mongoose.model('admin', adminSchema)