const MrModel = require('../models/mr');
const DoctorModel = require("../models/doctor")
const PatientModel = require("../models/patient");
const AdminModel = require("../models/admin");
const flmModel = require("../models/Flm");
const brandModel = require("../models/Brands");
const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const fs = require("fs");
const csv = require('csv-parser');
const xlsx = require('xlsx');

const createMr = async (req, res) => {
    try {
        const { DIV, STATE, MRCODE, PASSWORD, MRNAME, HQ, DESG, DOJ, EFF_DATE, MOBILENO } = req.body;
        const mr = await MrModel.findOne({ MRCODE: MRCODE });

        const Id = req.params.id;
        const Flm = await flmModel.findById({ _id: Id });

        if (mr) {
            return res.status(400).json({
                msg: "Mr Already Exists",
                success: false
            })
        }
        const newMr = new MrModel({
            DIV,
            STATE,
            MRCODE,
            PASSWORD,
            MRNAME,
            HQ,
            DESG,
            DOJ,
            EFF_DATE,
            MOBILENO,
            doc: Date.now(),
        });
        // Save the new MR to the database
        await newMr.save();
        Flm.Mrs.push(newMr._id);
        await Flm.save();
        return res.status(201).json({
            msg: 'MR created successfully',
            success: true,
            mr: newMr,
        });
    } catch (error) {
        const errMsg = error.message
        console.log("Error in CreateMr");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}

const loginMr = async (req, res) => {
    try {
        const { MRCODE, PASSWORD } = req.body;
        const mr = await MrModel.findOne({ MRCODE: MRCODE });
        if (!mr) {
            return res.status(400).json({
                msg: "Mr not Found",
                success: false
            })
        } else {
            if (PASSWORD == mr.PASSWORD) {
                mr.loginLogs.push({
                    timestamp: new Date(),
                    cnt: mr.loginLogs.length + 1
                });
                await mr.save();
                return res.status(200).json({
                    msg: "Login Done",
                    success: true,
                    mr
                })
            } else {
                return res.status(400).json({
                    msg: "Password is not correct",
                    success: false
                })
            }
        }
    }
    catch (error) {
        const errMsg = error.message
        console.log("Error in loginMr");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}

// const getDoctorForThisMr = async (req, res) => {
//     try {
//         const id = req.params['id'];
//         const mr = await MrModel.findById({ _id: id }).populate('doctors').select("-_id -EMPID -Password -Region -PSNAME -HQ -DOJ -DESIGNATION -loginLogs");
//         console.log(mr);
//         if (!mr) {
//             return res.status(400).json({
//                 msg: "No Doctor Found For This MR",
//                 success: false
//             });
//         }

//         const doctorsArray = mr.doctors.map(doctor => ({
//             id: doctor._id,
//             SCCode: doctor.SCCode, // Assuming SCCode is a field in the Doctor model
//             doctorName: doctor.DoctorName,
//             specialty: doctor.Specialty, // Adjusted field name to lowercase (consistency)
//             place: doctor.Place,
//             class: doctor.CLASS, // Assuming CLASS is a field in the Doctor model
//             vf: doctor.VF, // Assuming VF is a field in the Doctor model
//             doctorPotential: doctor.DoctorPotential, // Adjusted field name to camelCase (consistency)
//             pobStatus: doctor.POBStatus, // Adjusted field name to camelCase (consistency)
//             pobCount: doctor.POBCount, // Adjusted field name to camelCase (consistency)
//             doc: doctor.doc,
//             patients: doctor.patients, // Assuming patients is an array of ObjectIDs in the Doctor model




//         }));

//         return res.status(200).json(doctorsArray);
//     } catch (error) {
//         const errMsg = error.message;
//         console.log("Error in getDoctorForThisMr");
//         return res.status(500).json({
//             success: false,
//             errMsg
//         });
//     }
// };

const getDoctorForThisMr = async (req, res) => {
    try {
        const id = req.params['id'];
        const mr = await MrModel.findById({ _id: id }).populate('doctors').select("-_id -EMPID -Password -Region -PSNAME -HQ -DOJ -DESIGNATION -loginLogs");

        if (!mr) {
            return res.status(400).json({
                msg: "No Doctor Found For This MR",
                success: false
            });
        }

        const doctorsArray = await Promise.all(mr.doctors.map(async doctor => {
            const patientDetails = await getPatientDetails(doctor.patients);
            return {
                id: doctor._id,
                SCCode: doctor.SCCode,
                doctorName: doctor.DoctorName,
                specialty: doctor.Specialty,
                place: doctor.Place,
                class: doctor.CLASS,
                vf: doctor.VF,
                doctorPotential: doctor.DoctorPotential,
                pobStatus: doctor.POBStatus,
                pobCount: doctor.POBCount,
                doc: doctor.doc,
                patients: patientDetails
            };
        }));

        return res.status(200).json(doctorsArray);
    } catch (error) {
        const errMsg = error.message;
        console.log("Error in getDoctorForThisMr", errMsg);
        return res.status(500).json({
            success: false,
            errMsg
        });
    }
};

async function getPatientDetails(patientIds) {
    return await Promise.all(patientIds.map(async patientId => {
        const patient = await PatientModel.findById(patientId);
        return {
            id: patient._id,
            patientName: patient.PatientName,
            mobileNumber: patient.MobileNumber,
            age: patient.Age,
            gender: patient.Gender,
            location: patient.Location,
            indication: patient.Indication,
            unitsPrescribed: patient.UnitsPrescribe,
            price: patient.Price,
            month: patient.Month,
            year: patient.Year,
            patientStatus: patient.PatientStatus,
            region: patient.Region,
            patientType: patient.PatientType,
            doc: patient.doc,
            repurchase: patient.Repurchase
        };
    }));
}

const getAllMR = async (req, res) => {

    try {
        const mrs = await MrModel.find({}).select("_id MRNAME");
        if (!mrs) return res.status(400);
        return res.json(mrs);
    }
    catch (error) {
        const errMsg = error.message
        console.log("Error in loginMr");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}

const getMrById = async (req, res) => {
    try {
        const mrId = req.params.mrId;
        const mr = await MrModel.findById({ _id: mrId }).exec();
        if (!mr) {
            res.status(400).json({
                success: false,
                msg: "Mr Not Found"
            })
        }
        res.json(mr);
    } catch (error) {
        const errmsg = error.message;
        console.log("Error in getMrById");
        return res.status(500).json({
            success: false,
            errmsg
        })
    }
}

const UpdateMrMobileNumber = async (req, res) => {

    try {

        const { mrId, mobileNumber } = req.body;

        const mr = await MrModel.findById({ _id: mrId });
        if (!mr) {
            res.status(400).json({
                success: false,
                msg: "Mr Not Found"
            })
        }

        mr.MOBILENO = mobileNumber;

        // Save the updated document
        const updatedMr = await mr.save();

        return res.status(200).json({
            success: true,
            mr: updatedMr,
            msg: "Mobile number updated successfully"
        });

    }

    catch (error) {
        const errmsg = error.message;
        console.log("Error in UpdateMrMobileNumber");
        return res.status(500).json({
            success: false,
            errmsg
        })
    }
}

const handleExcelSheetUpload = async (req, res) => {
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const newMr = await MrModel.find
        for (const row of sheetData) {
            let existingMr = await MrModel.findOne({ MRCODE: row.MRCODE });

            if (!existingMr) {
                existingMr = await new MrModel({
                    DIV: row.DIV,
                    STATE: row.STATE,
                    MRCODE: row.MRCODE,
                    PASSWORD: row.PASSWORD,
                    MRNAME: row.MRNAME,
                    HQ: row.HQ,
                    DESG: row.DESG,
                    DOJ: row.DOJ,
                    EFF_DATE: row.EFF_DATE,
                    MOBILENO: row.MOBILENO,
                    doc: Date.now()
                });

                await existingMr.save();
            }

            const newDoctor = await new DoctorModel({
                DRNAME: row.DRNAME,
                MOBILENO: row.MOBILENO,
                SCCODE: row.SCCODE,
                STATE: row.STATE,
                LOCALITY: row.LOCALITY,
            });

            await newDoctor.save();

            existingMr.doctors.push(newDoctor._id);
            await existingMr.save();

            const newPatient = await new PatientModel({
                PatientName: row.PatientName,
                MobileNumber: row.MobileNumber,
                PatientAge: row.PatientAge,
                PatientType: row.PatientType,
                doc: Date.now(),
                Repurchase: [
                    {
                        DurationOfTherapy: row.DurationOfTherapy,
                        TotolCartiridgesPurchase: row.TotolCartiridgesPurchase,
                        DateOfPurchase: row.DateOfPurchase,
                        TherapyStatus: row.TherapyStatus,
                        Delivery: row.Delivery,
                        TM: row.TM,
                    }
                ]
            });

            await newPatient.save();
            newDoctor.patients.push(newPatient._id);
            await newDoctor.save();
        }

        res.status(200).json({ message: 'Data uploaded successfully' });
    } catch (error) {
        console.error(error);
        const errMsg = error.message;
        res.status(500).json({ error: 'Internal server error', errMsg });
    }
};

const getMrDoctorSummary = async (req, res) => {
    try {
        const mrId = req.params.id;
        const mrDet = await MrModel.findById(mrId).populate('doctors');

        // Object to store summary data for each doctor
        let doctorSummary = [];

        // Iterate over doctors
        for (const doctor of mrDet.doctors) {
            // Fetch patients for this doctor
            const patients = await PatientModel.find({ _id: { $in: doctor.patients } });

            // Calculate total patient count for this doctor
            const totalPatientCount = patients.length;

            // Calculate total repurchase count for this doctor
            let totalRepurchaseCount = 0;
            patients.forEach(patient => {
                totalRepurchaseCount += patient.Repurchase.length;
            });

            // Calculate total cartridges purchased by patients associated with this doctor
            let totalCartiridgesPurchaseCount = 0;
            patients.forEach(patient => {
                if (patient.Repurchase) {
                    patient.Repurchase.forEach(repurchase => {
                        if (Array.isArray(repurchase.TotolCartiridgesPurchase)) {
                            totalCartiridgesPurchaseCount += repurchase.TotolCartiridgesPurchase.length;
                        }
                    });
                }
            });

            // Construct doctor summary object
            const doctorSummaryObj = {
                doctorName: doctor.DoctorName,
                totalPatientCount: totalPatientCount,
                totalRepurchaseCount: totalRepurchaseCount,
                totalCartiridgesPurchaseCount: totalCartiridgesPurchaseCount
            };

            // Push doctor summary to the array
            doctorSummary.push(doctorSummaryObj);
        }

        // Sending response with doctor summaries
        res.status(200).json(doctorSummary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' }); // Sending error response
    }
}

const getMrBrandSummary = async (req, res) => {
    try {
        const mrId = req.params.id;
        const mrDet = await MrModel.findById(mrId).populate('doctors');

        // Object to store summary data for each doctor
        let doctorSummary = [];

        // Calculate the total count of doctors under this MR
        const totalDoctors = mrDet.doctors.length;
        console.log("Total count :", totalDoctors);

        // Iterate over doctors
        for (const doctor of mrDet.doctors) {
            // Fetch patients for this doctor
            const patients = await PatientModel.find({ _id: { $in: doctor.patients } });

            // Calculate total patient count for this doctor
            const totalPatientCount = patients.length;

            // Calculate total repurchase count for this doctor
            let totalRepurchaseCount = 0;

            // Array to store unique brand names for this doctor
            let uniqueBrands = [];

            patients.forEach(patient => {
                // Increment repurchase count
                totalRepurchaseCount += patient.Repurchase.length;

                // Extract brand names from each patient's repurchase details
                patient.Repurchase.forEach(repurchase => {
                    uniqueBrands.push(...repurchase.Brands);
                });
            });

            // Remove duplicates from uniqueBrands array
            uniqueBrands = Array.from(new Set(uniqueBrands));

            // Construct doctor summary object
            const doctorSummaryObj = {
                doctorName: doctor.DoctorName,
                TotalPatientCount: totalPatientCount,
                TotalRepurchaseCount: totalRepurchaseCount,
                TotalDoctors: totalDoctors,
                Brands: uniqueBrands
            };

            // Push doctor summary to the array
            doctorSummary.push(doctorSummaryObj);
        }

        // Sending response with doctor summaries
        res.status(200).json(doctorSummary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' }); // Sending error response
    }
}

const getMrPatients = async (req, res) => {
    try {
        const mrId = req.params.id;
        const mrDet = await MrModel.findById(mrId).populate('doctors');


        // Array to store all patients
        let allPatients = [];

        // Iterate over doctors
        for (const doctor of mrDet.doctors) {
            // Fetch patients for this doctor
            const patients = await PatientModel.find({ _id: { $in: doctor.patients } });

            // Push patients to allPatients array
            allPatients.push(...patients.map(patient => ({
                doctorName: doctor.DoctorName,
                patientDetails: patient
            })));
        }

        // Sending response with all patients
        res.status(200).json(allPatients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' }); // Sending error response
    }
}

const mrUpdatePatientStatus = async (req, res) => {
    try {

        //Format data...
        const patientNewStatus = req.body.patientStatus;

        // Map "Active" and "Inactive" to Boolean values
        let patientStatus;
        if (patientNewStatus === "DISCONTINUE") {
            patientStatus = false;
        } else if (patientNewStatus === "CONTINUING") {
            patientStatus = true;
        }


        //Check MR exist or not....
        const mrID = req.params.mrID;
        const mrExist = await MrModel.findById(mrID);
        if (!mrExist) {
            res.status(404).send({ message: "MR not found...!!!", success: false });
        }

        //Check Patient exist or not....
        const patientID = req.params.patientID;
        const patientExist = await PatientModel.findById(patientID);
        if (!patientExist) {
            res.status(404).send({ message: "Patient not found...!!!", success: false });
        }


        //Update the patient Status..
        const updatePatientStatus = await PatientModel.findByIdAndUpdate(
            patientID,
            { $set: { PatientStatus: patientStatus } },
            { new: true }
        );

        if (!updatePatientStatus) {
            return res.status(500).send({ message: "Failed to Update the Patient Status..!!", success: false });
        } else {
            return res.status(201).send({ message: "MR Successfully changes the patient Status..", success: true });
        }

    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Failed to update the patient Status..!!!", success: false });
    }
}


module.exports = {
    createMr,
    loginMr,
    getDoctorForThisMr,
    getAllMR,
    getMrById,
    UpdateMrMobileNumber,
    handleExcelSheetUpload,
    getMrDoctorSummary,
    getMrBrandSummary,
    getMrPatients,
    mrUpdatePatientStatus
}