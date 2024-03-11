const MrModel = require('../models/mr');
const DoctorModel = require('../models/doctor');
const PatienModel = require("../models/patient");


const createDoctor = async (req, res) => {
    try {
        const { DoctorName, Specialty, SCCode, Place, CLASS, VF, DoctorPotential } = req.body
        const { id } = req.params;

        const newDoctor = new DoctorModel({
            DoctorName,
            Specialty,
            SCCode,
            Place,
            CLASS,
            VF,
            DoctorPotential,
            doc: Date.now(),
        });

        //Save the new doctor in database...
        const savedDoctor = await newDoctor.save();

        //Check MrExist or not...
        const mr = await MrModel.findById(id);
        if (mr) {
            mr.doctors.push(savedDoctor._id);
            await mr.save();
        } else {
            return res.status(404).json({ success: false, message: 'MR not found' });
        }
        
        return res.status(201).json({ success: true, message: 'Doctor created and associated with MR' });
    }
    catch (error) {
        console.error('Error in createDoctor:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const getPatientForThisDoctor = async (req, res) => {
    try {
        const id = req.params['id'];
        const doctor = await DoctorModel.findById({ _id: id }).populate('patients').select('-_id -SCCODE -DRNAME -QUALIFICATION -SPECIALITY -SPECBYPRACTICE -PLANNEDVISITS -CLASS -LOCALITY -STATION -STATE -ADDRESS -PIN -MOBILENO -EMAIL -TOTAL_POTENTIAL -BUSTODIV -PATIENTSPERDAY');

        if (!doctor) return res.status(400).json({
            msg: "No Doctor Found For This MR",
            success: false
        })
        return res.status(200).json(doctor)
    }
    catch (error) {
        const errMsg = error.message
        console.log("Error in getPatientForThisDoctor");
        return res.status(500).json({
            success: false,
            errMsg
        });
    }
}

const getAllDoctors = async (req, res) => {
    try {
        const getAllDoctors = await DoctorModel.find({}).select("-patients");
        return res.json(getAllDoctors);
    }
    catch (error) {
        const errMsg = error.message
        console.log("Error in getAllDoctors");
        return res.status(500).json({
            success: false,
            errMsg
        });
    }
}

const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params
        const doctor = await DoctorModel.findById(id)
        return res.json(doctor)
    }
    catch (error) {
        const errMsg = error.message
        console.log("Error in getDoctorById");
        return res.status(500).json({
            success: false,
            errMsg
        });
    }
}


const getMrReports = async (req, res) => {
    const { mrId } = req.params;

    try {
        const mr = await MrModel.findById(mrId).populate({
            path: 'doctors',
            populate: {
                path: 'patients',
                model: 'Patient'
            }
        });

        if (!mr) {
            return res.status(400).json({
                msg: "MR NOT FOUND"
            });
        }

        const totalDoctors = mr.doctors.length;
        const totalPatients = mr.doctors.reduce((acc, doctor) => acc + doctor.patients.length, 0);

        const totalRepurchases = mr.doctors.reduce((acc, doctor) => {
            return acc + doctor.patients.reduce((patientAcc, patient) => {
                return patientAcc + (patient.Repurchase ? patient.Repurchase.length : 0);
            }, 0);
        }, 0);

        res.status(200).json({
            success: true,
            totalDoctors,
            totalPatients,
            totalRepurchases
        });
    } catch (error) {
        const errMsg = error.message;
        console.log("Error in getMrReports");
        return res.status(500).json({
            success: false,
            errMsg
        });
    }
};




module.exports = {
    createDoctor,
    getPatientForThisDoctor,
    getAllDoctors,
    getDoctorById,
    getMrReports
}