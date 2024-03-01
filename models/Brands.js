const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const brandSchema = new Schema({
    BrandName: {
        type: String,

        require: true,
        unique: true,
        trim: true
    },
}, { timestamps: true })


module.exports = mongoose.model('Brand', brandSchema)