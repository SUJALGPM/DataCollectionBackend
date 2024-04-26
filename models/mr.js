const mongoose = require('mongoose');

//MR Schema.....
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
    Number: {
        type: Number,
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
    doctorLogs: [],
    repurchaseLogs: [],
    durationWise: [],
    doctors: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
    ],
    TodoData: {
        type: [{
            task: {
                type: String,
                required: false
            },
            Date: {
                type: String,
                default: () => {
                    const currentDate = new Date();
                    const day = currentDate.getDate().toString().padStart(2, '0');
                    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
                    const year = currentDate.getFullYear();
                    return `${day}/${month}/${year}`;
                }
            },
            Time: {
                type: String,
                default: () => {
                    const currentTime = new Date();
                    const hours = currentTime.getHours().toString().padStart(2, '0');
                    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
                    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
                    return `${hours}:${minutes}:${seconds}`;
                }
            }
        }],
        default: []
    }
});


module.exports = mongoose.model('MR', mrSchema);
