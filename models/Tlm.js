const mongoose = require('mongoose');

const tlmSchema = new mongoose.Schema({
    TLMEmpID: {
        type: String,
        unique:true,
        required: false
    },
    TLMName: {
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
    Slm: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Slm' }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Tlm', tlmSchema);
