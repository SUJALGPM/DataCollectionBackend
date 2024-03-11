const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    Brands: {
        type: String,
        require: true,
        unique: true
    },
}, { timestamps: true })

const PatientSchema = new mongoose.Schema({
    PatientName: {
        type: String
    },
    MobileNumber: Number,
    Age: Number,
    Gender: String,
    Location: String,
    Month: String,
    Year: Number,
    PatientStatus: {
        type: Boolean,
        default: true
    },
    Reason: String,
    PatientType: String,
    doc: Date,
    Repurchase: [{
        DurationOfTherapy: {
            type: Number,
            default: 6
        },
        TotolCartiridgesPurchase: {
            type: Number,
            default: 3
        },
        DateOfPurchase: String,
        EndOfPurchase: String,
        TherapyStatus: {
            type: String,
            default: "Ongoing"
        },
        Delivery: {
            type: String,
            default: "Self"
        },
        TM: {
            type: String,
            default: ""
        },
        SubComments: {
            type: String,
            default: ""
        },
        UnitsPrescribe: Number,
        Indication: String,
        Price: Number,
        NoDose: String,
        Total: {
            type: String,
            default: ""
        },
        Brands: [String]
    }]
});

module.exports = mongoose.model('Patient', PatientSchema)