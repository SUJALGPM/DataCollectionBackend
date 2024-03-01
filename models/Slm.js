const mongoose = require('mongoose');

const slmSchema = new mongoose.Schema({
    SLMEmpID: {
        type: String,
        unique: true,
        required: false
    },
    ZBMName: {
        type: String,
        required: false
    },
    Password: {
        type: String,
        required: false
    },
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
    Flm: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Flm' }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Slm', slmSchema);
