const MrModel = require('../models/mr');
const slmModel = require("../models/Slm");
const DoctorModel = require("../models/doctor")
const PatientModel = require("../models/patient");
const AdminModel = require("../models/admin");
const flmModel = require("../models/Flm");
const brandModel = require("../models/Brands");
const xlsx = require('xlsx');
const moment = require('moment');
const colors = require('colors');



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
        const { EMPID, Password } = req.body;

        const mr = await MrModel.findOne({ EMPID: EMPID });
        if (!mr) {
            return res.status(400).json({
                msg: "Mr not Found",
                success: false
            })
        } else {
            if (Password == mr.Password) {
                mr.loginLogs.push({
                    timestamp: new Date(),
                    cnt: mr.loginLogs.length + 1
                });
                await mr.save();
                return res.status(200).json({
                    msg: "Login Success",
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
        const mrs = await MrModel.find({}).select("_id PSNAME");
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
        const mrExist = await MrModel.findById({ _id: mrId }).exec();

        //Check the MrExist or not...
        if (!mrExist) {
            res.status(400).json({
                success: false,
                msg: "Mr Not Found"
            })
        }

        //Check the FLM is exist or not...
        const flmExist = await flmModel.findOne({ Mrs: mrExist }).exec();
        if (!flmExist) {
            return res.status(404).send({ message: "FLM is not found..!!!", success: false });
        }

        //Check the SLM is exist or not..
        const slmExist = await slmModel.findOne({ Flm: flmExist }).exec();
        if (!slmExist) {
            return res.status(404).send({ message: "SLM is not found..!!!", success: false });
        }

        const formatedResponse = {
            MROBJID: mrExist._id,
            MRID: mrExist.EMPID,
            MRNAME: mrExist.PSNAME,
            MRNUMBER: mrExist.Number,
            MRPASSWORD: mrExist.Password,
            MRREGION: mrExist.Region,
            MRHQ: mrExist.HQ,
            MRDOJ: mrExist.DOJ,
            MRDESIGNATION: mrExist.DESIGNATION,
            FLMName: flmExist.BDMName,
            SLMName: slmExist.ZBMName,
            DOCTORSID: mrExist.doctors
        }

        res.json(formatedResponse);

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

        const updatedMr = await MrModel.updateOne(
            { _id: mrId },
            { $set: { Number: mobileNumber } }
        );

        if (updatedMr.nModified === 0) {
            return res.status(400).json({
                success: false,
                msg: "Mr Not Found"
            });
        }

        return res.status(200).json({
            success: true,
            msg: "Mobile number updated successfully"
        });

    } catch (error) {
        console.log("Error in UpdateMrMobileNumber:", error.message);
        return res.status(500).json({
            success: false,
            errmsg: error.message
        });
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

function isValidDate(dateString) {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    return dateRegex.test(dateString);
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
            for (const patient of patients) {
                for (const repurchase of patient.Repurchase) {

                    const patientData = {
                        PatientName: patient.PatientName,
                        MobileNumber: patient.MobileNumber,
                        Age: patient.Age,
                        Gender: patient.Gender,
                        Location: patient.Location,
                        Indication: patient.Indication,
                        UnitsPrescribe: patient.UnitsPrescribe,
                        Price: patient.Price,
                        NoDose: patient.NoDose,
                        Month: patient.Month,
                        Status: patient.PatientStatus,
                        DurationOfTherapy: repurchase.DurationOfTherapy,
                        TotolCartiridgesPurchase: repurchase.TotolCartiridgesPurchase,
                        DateOfPurchase: isValidDate(repurchase.DateOfPurchase) ? repurchase.DateOfPurchase : new Date(repurchase.DateOfPurchase).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-'),
                        TherapyStatus: repurchase.TherapyStatus,
                        Delivery: repurchase.Delivery,
                        TM: repurchase.TM,
                        SubComments: repurchase.SubComments,
                        brandName: repurchase.Brands.join(", ")
                    };
                    allPatients.push(patientData);
                }
            }
        }

        // Sending response with all patients
        res.status(200).json(allPatients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getMrAllPatients = async (req, res) => {
    try {
        const mrId = req.params.mrId;

        //Check MR present or not...
        const mrExist = await MrModel.findById(mrId).populate({
            path: 'doctors',
            populate: {
                path: 'patients',
                model: 'Patient'
            }
        });

        //Check MR exist or not...
        if (!mrExist) {
            return res.status(404).send({ message: "MR NOT FOUND...!!!", success: false });
        }

        //Loop data for processing...
        const detailAllPatients = []

        for (const doctors of mrExist.doctors) {
            for (const patients of doctors.patients) {
                // for (const Prepurchase of patients.Repurchase) {
                const report = {
                    PID: patients._id,
                    PNAME: patients.PatientName || 'N/A',
                    PNUMBER: patients.MobileNumber || 'N/A',
                    PAGE: patients.Age || 'N/A',
                    PGENDER: patients.Gender || 'N/A',
                    PLOCATION: patients.Location || 'N/A',
                    PSTATUS: patients.PatientStatus,
                    PTYPE: patients.PatientType || 'N/A',
                    PREASON: patients.Reason || 'N/A',
                    PDOC: patients.doc || 'N/A',
                    // PDURATIONTHERAPY: Prepurchase.DurationOfTherapy || 'N/A',
                    // PUNITSOLD: Prepurchase.TotolCartiridgesPurchase || 'N/A',
                    // PDOP: Prepurchase.DateOfPurchase || 'N/A',
                    // PTSTATUS: Prepurchase.TherapyStatus || 'N/A',
                    // PDELIVARY: Prepurchase.Delivery || 'N/A',
                    // PTM: Prepurchase.TM || 'N/A',
                    // PCOMMENTS: Prepurchase.SubComments || 'N/A',
                    // PUNITPRESCRIBE: Prepurchase.UnitsPrescribe || 'N/A',
                    // PINDICATION: Prepurchase.Indication || 'N/A',
                    // PPRICE: Prepurchase.Price || 'N/A',
                    // PNODOSE: Prepurchase.NoDose || 'N/A',
                    // PTOTAL: Prepurchase.Total || 'N/A',
                    // PBRAND: Prepurchase.Brands.length ? Prepurchase.Brands.join(', ') : 'N/A',
                }
                detailAllPatients.push(report);
                // }
            }
        }

        res.status(201).json(detailAllPatients);

    } catch (err) {
        console.log(err);
        res.status(501).send({ message: "Failed to load the data...!!!", success: false });
    }
}

//Update the status patient..
// const mrUpdatePatientStatus = async (req, res) => {
//     try {

//         //Format data...
//         const patientNewStatus = req.body.patientStatus;

//         // Map "Active" and "Inactive" to Boolean values
//         let patientStatus;
//         if (patientNewStatus === "DISCONTINUE") {
//             patientStatus = false;
//         } else if (patientNewStatus === "CONTINUING") {
//             patientStatus = true;
//         }


//         //Check MR exist or not....
//         const mrID = req.params.mrID;
//         const mrExist = await MrModel.findById(mrID);
//         if (!mrExist) {
//             res.status(404).send({ message: "MR not found...!!!", success: false });
//         }

//         //Check Patient exist or not....
//         const patientID = req.params.patientID;
//         const patientExist = await PatientModel.findById(patientID);
//         if (!patientExist) {
//             res.status(404).send({ message: "Patient not found...!!!", success: false });
//         }


//         //Update the patient Status..
//         const updatePatientStatus = await PatientModel.findByIdAndUpdate(
//             patientID,
//             { $set: { PatientStatus: patientStatus } },
//             { new: true }
//         );

//         if (!updatePatientStatus) {
//             return res.status(500).send({ message: "Failed to Update the Patient Status..!!", success: false });
//         } else {
//             return res.status(201).send({ message: "MR Successfully changes the patient Status..", success: true });
//         }

//     } catch (err) {
//         console.log(err);
//         res.status(500).send({ message: "Failed to update the patient Status..!!!", success: false });
//     }
// }

const mrAddNewBrand = async (req, res) => {
    try {
        const { DurationOfTherapy, TotolCartiridgesPurchase, DateOfPurchase, EndOfPurchase, Delivery, Brands, TherapyStatus, TM, UnitsPrescribe, Indication, Price, NoDose, SubComments } = req.body;

        //Check the mrExist or not...
        const mrid = req.params.mrID;
        const mrExist = await MrModel.findById(mrid);
        if (!mrExist) {
            return res.status(404).send({ message: "MR not found..!!!", success: false });
        }

        //Check the patient Exist or not...
        const patientid = req.params.patientID;
        const patientExist = await PatientModel.findById(patientid);
        if (!patientExist) {
            return res.status(404).send({ message: "Patient not found..!!!", success: false });
        }

        //Check the doctor exist or not...
        const doctorExist = await DoctorModel.findOne({ patients: patientExist });
        if (!doctorExist) {
            return res.status(404).send({ message: "Doctor Not Found..!!" });
        }

        //Check the flm exist or not..
        const flmExist = await flmModel.findOne({ Mrs: { $in: mrExist._id } });
        if (!flmExist) {
            return res.status(404).send({ message: "Flm not found..!!" });
        }


        //Check the flm exist or not..
        const slmExist = await slmModel.findOne({ Flm: { $in: flmExist._id } });
        if (!slmExist) {
            return res.status(404).send({ message: "Slm not found..!!" });
        }

        //Check the flm exist or not..
        const adminExist = await AdminModel.findOne({ Slm: { $in: slmExist._id } });
        console.log("existed admin :", adminExist);
        if (!adminExist) {
            return res.status(404).send({ message: "Admin not found..!!" });
        }

        //Calculated total...
        const calculateTotal = Price * NoDose;

        //Format data before uploading....
        const formData = {
            DurationOfTherapy: DurationOfTherapy,
            TotolCartiridgesPurchase: TotolCartiridgesPurchase,
            DateOfPurchase: DateOfPurchase,
            EndOfPurchase: EndOfPurchase,
            TherapyStatus: TherapyStatus,
            Delivery: Delivery,
            TM: TM,
            UnitsPrescribe: UnitsPrescribe,
            Indication: Indication,
            Price: Price,
            NoDose: NoDose,
            Total: calculateTotal,
            SubComments: SubComments,
            Brands: Brands
        }

        //Push the new Repurchase data...
        patientExist.Repurchase.push(formData);
        await patientExist.save();

        //Format data before log..
        const formatedData = {
            DoctorName: doctorExist.DoctorName,
            PatientName: patientExist.PatientName,
            repurchaseData: formData
        }

        //Popular mr as per repurchase...
        const repurchaseDate = new Date(DateOfPurchase);
        const formattedDate = repurchaseDate.toISOString().split('T')[0];
        const durationRepurchaseEntry = {
            brandName: Brands,
            repurchaseDate: formattedDate,
            slmName: slmExist.ZBMName,
            flmName: flmExist.BDMName,
            mrName: mrExist.PSNAME,
            doctorName: doctorExist.DoctorName,
            patientName: patientExist.PatientName
        };


        //Track the record of usage...
        mrExist.repurchaseLogs.push(formatedData);
        await mrExist.save();

        //Save popular mr repurchae wise...
        adminExist.durationWise.push(durationRepurchaseEntry);
        await adminExist.save();

        //Check the response...
        res.status(201).send({ message: "MR Successfully added new brand in patient...", success: true });

    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Failed to add new brand with repurchase data in patient..!!", success: false });
    }
};

const mrGetDataBrandWise = async (req, res) => {
    try {
        const mrId = req.params.mrId;

        const mrWithDoctors = await MrModel.findOne({ _id: mrId }).populate({
            path: 'doctors',
            populate: {
                path: 'patients',
            },
        });

        if (!mrWithDoctors) {
            return res.status(404).json({ message: 'MR not found' });
        }

        const brandNames = [];

        const brandNameGet = await brandModel.find({}).select('BrandName');
        for (const brand of brandNameGet) {
            brandNames.push(brand.BrandName);
        }

        const totalCounts = {
            totalDoctor: mrWithDoctors.doctors.length,
            totalallbrandsPatientCount: 0,
            totalRepurchaseCount: 0,
        };

        const brandStats = {};

        const doctorCounts = {
            INFIMABDoctor: 0,
            TOFASHINEDoctor: 0,
            HEADONDoctor: 0,
            HUMIMABDoctor: 0,
        };

        mrWithDoctors.doctors.forEach((doctor) => {
            brandNames.forEach((brandName) => {
                const activePatientCount = doctor.patients.filter((patient) =>
                    patient.Repurchase.some(
                        (purchase) =>
                            purchase.Brands &&
                            Array.isArray(purchase.Brands) &&
                            purchase.Brands.includes(brandName) &&
                            patient.PatientStatus === true
                    )
                ).length;

                const inactivePatientCount = doctor.patients.filter((patient) =>
                    patient.Repurchase.some(
                        (purchase) =>
                            purchase.Brands &&
                            Array.isArray(purchase.Brands) &&
                            purchase.Brands.includes(brandName) &&
                            patient.PatientStatus === false
                    )
                ).length;

                const totalRepurchaseCount = doctor.patients.reduce((count, patient) => {
                    const repurchaseCount = patient.Repurchase.reduce(
                        (repCount, purchase) =>
                            purchase.Brands &&
                                Array.isArray(purchase.Brands) &&
                                purchase.Brands.includes(brandName)
                                ? repCount + 1
                                : repCount,
                        0
                    );

                    return count + repurchaseCount;
                }, 0);

                const TotalPatientCount = activePatientCount + inactivePatientCount;

                totalCounts.totalallbrandsPatientCount += TotalPatientCount;
                totalCounts.totalRepurchaseCount += totalRepurchaseCount;

                if (!brandStats[brandName]) {
                    brandStats[brandName] = {
                        totalPatientCount: 0,
                        activePatientCount: 0,
                        inactivePatientCount: 0,
                        totalRepurchaseCount: 0,
                    };
                }

                brandStats[brandName].totalPatientCount += TotalPatientCount;
                brandStats[brandName].activePatientCount += activePatientCount;
                brandStats[brandName].inactivePatientCount += inactivePatientCount;
                brandStats[brandName].totalRepurchaseCount += totalRepurchaseCount;
            });

            // Update doctor counts
            if (doctor.patients.some((patient) => patient.Repurchase.some((purchase) => purchase.Brands.includes('INFIMAB')))) {
                doctorCounts.INFIMABDoctor += 1;
            }

            if (doctor.patients.some((patient) => patient.Repurchase.some((purchase) => purchase.Brands.includes('TOFASHINE')))) {
                doctorCounts.TOFASHINEDoctor += 1;
            }

            if (doctor.patients.some((patient) => patient.Repurchase.some((purchase) => purchase.Brands.includes('HEADON')))) {
                doctorCounts.HEADONDoctor += 1;
            }

            if (doctor.patients.some((patient) => patient.Repurchase.some((purchase) => purchase.Brands.includes('HUMIMAB-HC')))) {
                doctorCounts.HUMIMABDoctor += 1;
            }
        });

        const responseData = {
            totalDoctor: totalCounts.totalDoctor,
            totalallbrandsPatientCount: totalCounts.totalallbrandsPatientCount,
            totalRepurchaseCount: totalCounts.totalRepurchaseCount,
            brands: brandNames.map((brandName) => {
                const brandData = brandStats[brandName];
                const brandTotolCartiridgesPurchase = mrWithDoctors.doctors.reduce(
                    (count, doctor) => {
                        const hasPatientWithBrand = doctor.patients.some(
                            (patient) =>
                                patient.Repurchase.some(
                                    (purchase) =>
                                        purchase.Brands &&
                                        Array.isArray(purchase.Brands) &&
                                        purchase.Brands.includes(brandName)
                                ) && patient.PatientStatus === true
                        );

                        return (
                            count +
                            doctor.patients.reduce((purchaseCount, patient) => {
                                return (
                                    purchaseCount +
                                    patient.Repurchase.reduce(
                                        (brandCount, repurchase) =>
                                            repurchase.Brands &&
                                                Array.isArray(repurchase.Brands) &&
                                                repurchase.Brands.includes(brandName)
                                                ? brandCount + repurchase.TotolCartiridgesPurchase
                                                : brandCount,
                                        0
                                    )
                                );
                            }, 0)
                        );
                    },
                    0
                );

                return {
                    [brandName]: {
                        totalPatientCount: brandData.totalPatientCount,
                        activePatientCount: brandData.activePatientCount,
                        inactivePatientCount: brandData.inactivePatientCount,
                        totalRepurchaseCount: brandData.totalRepurchaseCount,
                        TotolCartiridgesPurchase: brandTotolCartiridgesPurchase,
                    },
                };
            }),
            ...doctorCounts,
        };

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const mrGetDoctorBrandWise = async (req, res) => {
    try {
        const mrId = req.params.mrId; // Assuming you get MR ID from request params

        // Find the MR document by ID
        const mrData = await MrModel.findById(mrId);

        // If MR data is not found
        if (!mrData) {
            return res.status(404).json({ message: "MR not found", success: false });
        }

        // Get the doctor IDs associated with this MR
        const doctorIds = mrData.doctors;

        // Initialize an object to store doctor specialities and their corresponding brand-wise patient counts
        const specialityBrandCounts = {};

        // Iterate through each doctor ID associated with this MR
        for (const doctorId of doctorIds) {
            // Find the doctor document by ID
            const doctor = await DoctorModel.findById(doctorId);

            // If doctor data is found
            if (doctor) {
                // Use doctor's speciality as the key instead of doctor's name
                const doctorSpeciality = doctor.Specialty;

                // Initialize an object to store brand-wise patient counts for this speciality
                const brandCounts = {};

                // Iterate through each patient ID associated with this doctor
                for (const patientId of doctor.patients) {
                    // Find the patient document by ID
                    const patient = await PatientModel.findById(patientId);

                    // If patient data is found
                    if (patient) {
                        // Iterate through each repurchase object
                        for (const repurchase of patient.Repurchase) {
                            // Check if repurchase object has Brands property
                            if (repurchase.Brands && Array.isArray(repurchase.Brands)) {
                                // Iterate through each brand in the Brands array
                                for (const brand of repurchase.Brands) {
                                    // Increment the brand count for this speciality
                                    if (!brandCounts[brand]) {
                                        brandCounts[brand] = 1;
                                    } else {
                                        brandCounts[brand]++;
                                    }
                                }
                            }
                        }
                    }
                }

                // Add the brand counts of this speciality to the overall speciality brand counts
                if (!specialityBrandCounts[doctorSpeciality]) {
                    specialityBrandCounts[doctorSpeciality] = {};
                }
                for (const brand in brandCounts) {
                    if (!specialityBrandCounts[doctorSpeciality][brand]) {
                        specialityBrandCounts[doctorSpeciality][brand] = brandCounts[brand];
                    } else {
                        specialityBrandCounts[doctorSpeciality][brand] += brandCounts[brand];
                    }
                }
            }
        }

        // Construct the response object with doctor speciality and corresponding brand-wise patient counts
        const responseObj = {};
        for (const speciality in specialityBrandCounts) {
            responseObj[speciality] = specialityBrandCounts[speciality];
        }

        // Respond with the speciality-wise brand counts
        res.status(200).json({ "DrSpeciality": responseObj });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to fetch the data brand-wise", success: false });
    }
}

const mrAddTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { task } = req.body;

        // Check if MR exists
        const mrInstance = await MrModel.findById(id);
        if (!mrInstance) {
            return res.status(404).json({ message: 'MR not found' });
        }

        // Create a new todo task
        const newTodo = {
            task: task,
            // Date: new Date().toLocaleDateString(),
            // Time: new Date().toLocaleTimeString()
        };

        // Add the new task to MR's TodoData
        mrInstance.TodoData.push(newTodo);

        // Save the updated MR instance
        await mrInstance.save();

        res.status(200).json({ message: 'New task added successfully', todo: newTodo });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to add new todo task' });
    }
};

const getMrTodoList = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if MR exists
        const mrInstance = await MrModel.findById(id).populate('TodoData');
        if (!mrInstance) {
            return res.status(404).json({ message: 'MR not found' });
        }

        // Extract todo list from MR instance
        const todoList = mrInstance.TodoData;

        res.status(200).json({ todoList });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to fetch todo list' });
    }
};

const deleteMrTodo = async (req, res) => {
    try {
        const { id, taskId } = req.params;

        // Check if MR exists
        const mrInstance = await MrModel.findById(id);
        if (!mrInstance) {
            return res.status(404).json({ message: 'MR not found' });
        }

        // Find the todo task by ID
        const todoToRemoveIndex = mrInstance.TodoData.findIndex(todo => todo._id == taskId);
        if (todoToRemoveIndex === -1) {
            return res.status(404).json({ message: 'Todo task not found in MR' });
        }

        // Remove the todo task from MR's TodoData
        mrInstance.TodoData.splice(todoToRemoveIndex, 1);

        // Save the updated MR instance
        await mrInstance.save();

        res.status(200).json({ message: 'Todo task deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Failed to delete todo task' });
    }
};

const mrGetScheduleData = async (req, res) => {



    try {

        const mrid = req.params.mrid;



        // Assuming there's a field in the MR model that references the Patient model

        const mr = await MrModel.findById(mrid).populate({

            path: 'doctors',

            populate: {

                path: 'patients',

                populate: {

                    path: 'Repurchase.Brands', // Adjust the path based on your schema

                    //   model: 'Brands',

                },

            },

        });



        if (!mr) {

            return res.status(404).json({ message: 'MR not found' });

        }



        // Extract relevant information

        // const repurchaseDetails = mr.doctors.flatMap((doctor) =>

        //   doctor.patients

        //     .filter((patient) => patient.Repurchase.length > 0)

        //     .map((patient) => ({

        //       DoctorName: doctor.DoctorName,

        //       PatientName: patient.PatientName,

        //       MobileNumber: patient.MobileNumber,

        //       Location: patient.Location,

        //       EndOfPurchase: patient.Repurchase[0].EndOfPurchase,

        //     //   Brands: patient.Repurchase[0].Brands,

        //     }))

        // );



        const repurchaseDetails = mr.doctors.flatMap((doctor) =>

            doctor.patients

                .filter((patient) => patient.Repurchase.length > 0)

                .map((patient) => {

                    const repurchaseInfo = patient.Repurchase[0]; // Assuming there's only one repurchase record

                    const endOfPurchaseDate = new Date(repurchaseInfo.EndOfPurchase);

                    const formattedEndOfPurchase = `${endOfPurchaseDate.getDate()}/${endOfPurchaseDate.getMonth() + 1}/${endOfPurchaseDate.getFullYear()}`;



                    return {

                        EndOfPurchase: formattedEndOfPurchase,

                        DoctorName: doctor.DoctorName,

                        PatientName: patient.PatientName,

                        PatientMobileNumber: patient.MobileNumber,

                        PatientLocation: patient.Location,

                        PatientBrand: repurchaseInfo.Brands, // Join the brand names if it's an array

                    };

                })

        );



        res.json({ ScheduleData: repurchaseDetails });

    } catch (error) {

        console.error(error);

        res.status(500).json({ message: 'Internal Server Error' });

    }

}

//Final Automatic APIs.......Patient-Status-Update...... after 30 seconds.....
const mrUpdatePatientStatus = async () => {
    // try {
    //     // Define patientNewStatus directly within the function
    //     const patientNewStatus = "DISCONTINUE";

    //     // Find all patients
    //     const allPatients = await PatientModel.find();

    //     // Update the status of patients
    //     for (const patient of allPatients) {

    //         //Previous status of patient...
    //         const previousStatus = patient.PatientStatus;

    //         //Auto time increment logic...
    //         const lastEndOfPurchase = moment(patient.Repurchase.EndOfPurchase);
    //         console.log("Previous Date EOP:", lastEndOfPurchase.format());

    //         // Add 30 seconds to lastEndOfPurchase
    //         const updatedEndOfPurchase = moment(lastEndOfPurchase).add(30, 'seconds');
    //         console.log("Updated Date EOP:", updatedEndOfPurchase.format()); // Format using moment()

    //         // Set patient status to inactive if updatedEndOfPurchase is in the past
    //         patient.PatientStatus = updatedEndOfPurchase <= new Date() ? true : false;
    //         // patient.PatientStatus = updatedEndOfPurchase <= new Date() ? false : true;
    //         await patient.save();

    //         // Print or log patient information
    //         console.log(`Patient ${patient.PatientName} status updated from ${previousStatus} to ${patient.PatientStatus}`);
    //     }

    //     console.log(`Updated status for all patients.`);
    // } catch (err) {
    //     console.error('Error updating patient status:', err);
    // }
};
setTimeout(mrUpdatePatientStatus, 30 * 1000);


// Update patient status after 30 days....
// const patientStatusUpdateDuration = async (req, res) => {
//     try {
//         // Find all patients.....
//         const allPatients = await PatientModel.find();

//         // Update the status of patients
//         for (const patient of allPatients) {

//             //Get last repurchase of each patient....
//             let lastRepurchaseDate = '';
//             patient.Repurchase.forEach((purchase) => {
//                 console.log('End of purchase', purchase.EndOfPurchase);
//                 lastRepurchaseDate = purchase.EndOfPurchase
//             });

//             let lastRepurchaseDate1 = moment(lastRepurchaseDate);
//             console.log("pick date :", lastRepurchaseDate);

//             if (!lastRepurchaseDate1.isValid()) {
//                 lastRepurchaseDate1 = moment(patient.Repurchase.EndOfPurchase, "YYYY-MM-DD");
//             } else {
//                 lastRepurchaseDate1 = lastRepurchaseDate1.format("YYYY-MM-DD");
//             }

//             console.log(`Standardized Date: ${patient.PatientName} ${lastRepurchaseDate1}`.bgBlue.white);

//             // Add 4 days to the last repurchase date for testing purposes
//             const nextInactiveDate = moment(lastRepurchaseDate1, "YYYY-MM-DD").add(4, "days");
//             console.log("Next Inactive Date:", nextInactiveDate.format("DD-MM-YYYY"));

//             // Get today's date in "dd-mm-yyyy" format
//             const todayDate = moment().format("DD-MM-YYYY");
//             console.log("Current Date (dd-mm-yyyy):", todayDate);


//             console.log(typeof nextInactiveDate.format("DD-MM-YYYY"));
//             console.log(typeof todayDate);

//             // Compare dates after formatting them to the same format
//             if (nextInactiveDate.format("DD-MM-YYYY") <= todayDate) {

//                 // Update patient status to inactive
//                 patient.PatientStatus = false;
//                 await patient.save();

//                 // Log the updated patient's name
//                 console.log(`Updated status for patient: ${patient.PatientName}`.bgYellow.black);
//             }
//         }

//         res.status(200).json({ message: "Patient statuses updated successfully." });
//     } catch (err) {
//         console.error("Error updating patient statuses:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };


const patientStatusUpdateDuration = async (req, res) => {
    try {
        // Find all patients
        const allPatients = await PatientModel.find();

        // Update the status of patients
        for (const patient of allPatients) {

            if (!patient) {
                console.error('Undefined patient object encountered.');
                continue;
            }

            if (!patient.Repurchase || !Array.isArray(patient.Repurchase)) {
                console.error('Invalid Repurchase array for patient:', patient);
                continue;
            }

            if (!patient || typeof patient.PatientStatus === 'undefined') {
                console.error('Undefined or missing status for patient:', patient);
                continue;
            }

            let lastRepurchaseDate = '';
            patient.Repurchase.forEach((purchase) => {
                // console.log('End of purchase', purchase.EndOfPurchase);
                lastRepurchaseDate = purchase.EndOfPurchase;
            });

            let lastRepurchaseDateMoment = moment(lastRepurchaseDate, [
                moment.ISO_8601,
                'ddd MMM DD YYYY HH:mm:ss ZZ',
            ]);

            console.log("pick date :", lastRepurchaseDateMoment);
            if (!lastRepurchaseDateMoment.isValid()) {
                // Handle invalid dates
                console.error(`Invalid date format for patient: ${patient.PatientName}`);
                continue; // Skip to the next patient
            }

            const lastRepurchaseDateFormatted = lastRepurchaseDateMoment.format('YYYY-MM-DD');
            console.log(`Standardized Date: ${patient.PatientName} ${lastRepurchaseDateFormatted}`.bgBlue.white);

            // Add 4 days to the last repurchase date for testing purposes
            const nextInactiveDate = moment(lastRepurchaseDateFormatted, 'YYYY-MM-DD').add(180, 'days');
            console.log("Next Inactive Date:", nextInactiveDate.format("DD-MM-YYYY"));

            // Get today's date in "dd-mm-yyyy" format
            const todayDate = moment().format("DD-MM-YYYY");
            console.log("Current Date (dd-mm-yyyy):", todayDate);

            // // Compare dates after formatting them to the same format
            // if (nextInactiveDate.format("DD-MM-YYYY") <= todayDate) {
            //     // Update patient status to inactive
            //     patient.PatientStatus = false;
            //     await patient.save();

            //     // Log the updated patient's name
            //     console.log(`Updated status for patient: ${patient.PatientName}`.bgYellow.black);
            // }

            if (moment(nextInactiveDate).isSameOrBefore(moment(todayDate, "DD-MM-YYYY"))) {
                // Update patient status to inactive
                patient.PatientStatus = false;
                await patient.save();

                // Log the updated patient's name
                console.log(`Updated status for patient: ${patient.PatientName}`.bgYellow.black);
            }

        }

        res.status(200).json({ message: "Patient statuses updated successfully." });
    } catch (err) {
        console.error("Error updating patient statuses:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Set up a timer to call the patientStatusUpdateDuration function every 10000 seconds
const updateInterval = 24 * 60 * 60 * 1000;
setInterval(async () => {
    try {
        await patientStatusUpdateDuration();
    } catch (err) {
        console.error("Error updating patient status:", err);
    }
}, updateInterval);








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
    mrUpdatePatientStatus,
    mrAddNewBrand,
    mrGetDoctorBrandWise,
    mrGetDataBrandWise,
    mrGetScheduleData,
    mrAddTodo,
    getMrTodoList,
    deleteMrTodo,
    getMrAllPatients,
    patientStatusUpdateDuration
}