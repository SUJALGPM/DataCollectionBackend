const mongoose = require('mongoose');


const mrSchema = new mongoose.Schema({
    EMPID: {
        type: String,
        required: true,
        unique: true
    },
    PSNAME: {
        type: String,
        required: false
    },
    Password: {
        type: String,
        required: false
    },
    Region: {
        type: String,
        required: false
    },
    HQ: {
        type: String,
        required: false
    },
    DOJ: {
        type: String,
        required: false
    },
    DESIGNATION: {
        type: String,
        required: false
    },
    doc: Date,
    loginLogs: [
        {
            timestamp: {
                type: Date,
                default: Date.now,
            },
            cnt: {
                type: Number,
                required: false,
                default: 0
            },
        },
    ],
    doctors: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
    ],
});


module.exports = mongoose.model('MR', mrSchema);