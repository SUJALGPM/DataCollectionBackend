const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    SCCode: {
        type: String,
        unqiue: true,
    },
    DoctorName: {
        type: String,
    },
    Specialty: String,
    Place: String,
    CLASS: String,
    VF: String,
    DoctorPotential: String,
    POBStatus: String,
    POBCount: String,
    DoctorStatus: {
        type: Boolean,
        default: true
    },
    doc: Date,

    patients: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }
    ]
})

module.exports = mongoose.model('Doctor', doctorSchema);