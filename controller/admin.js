const adminModels = require("../models/admin");
const tlmModel = require("../models/Tlm");
const slmModel = require("../models/Slm");
const flmModel = require('../models/Flm');
const MrModel = require("../models/mr");
const DoctorModel = require('../models/doctor');
const PatientModel = require("../models/patient");
const BrandModel = require("../models/Brands")
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const xlsx = require("xlsx");
const patient = require("../models/patient");
const SECRET = process.env.SECRET;


const handleAdminCreateAccounts = async (req, res) => {
    try {
        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;

        // Log incoming data
        console.log('Incoming data:', req.body);

        const admin = "";

        console.log('AdminId to search:', AdminId);
        try {
            admin = await adminModels.findOne({ AdminId });
            console.log('Existing Admin:', admin);
        } catch (error) {
            console.error('Error in findOne:', error);
        }



        console.log('Existing Admin:', admin);


        if (admin) {
            // Log if the condition is met
            console.log('AdminId Already Exists');

            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Pragma', 'no-cache');
            return res.status(400).json({
                msg: "AdminId Already Exists",
                success: false
            });
        }

        const newAdmin = new adminModels({
            Name: Name,
            AdminId: AdminId,
            Password: Password,
            Gender: Gender,
            MobileNumber: MobileNumber
        });

        // Log the new admin data before saving
        console.log('New Admin Data:', newAdmin);

        await newAdmin.save();

        // Log success response
        console.log('Admin successfully created:', newAdmin);

        return res.status(200).json({
            success: true,
            newAdmin
        });
    } catch (error) {
        const errMsg = error.message;

        // Log the error message
        console.log({ errMsg });

        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        });
    }
}

const handleAdminLogin = async (req, res) => {
    try {
        const { AdminId, Password } = req.body;
        console.log(req.body);
        const admin = await adminModels.findOne({ AdminId });
        console.log({ admin })
        if (admin) {
            if (admin.Password === Password) {
                const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.SECRET);
                return res.status(200).json({
                    msg: "Login",
                    success: true,
                    admin,
                    token
                })
            } else {
                return res.status(400).json({
                    msg: "Password is Incorrect",
                    success: false,
                })
            }
        } else {
            return res.status(400).json({
                msg: "Admin Not Found",
                success: false
            })
        }
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        })
    }
}

const handleAdminReports = async (req, res) => {
    try {
        const adminId = req.params.id;
        const admin = await adminModels.findById(adminId).populate({
            path: 'Slm',
            populate: {
                path: 'Flm',
                populate: {
                    path: 'Mrs',
                    populate: {
                        path: 'doctors'
                    }
                }
            }
        });

        if (!admin) {
            return res.json({ msg: "Admin Not Found" });
        }

        const mrs = admin.Slm.flatMap(slm => slm.Flm.flatMap(flm => flm.Mrs));

        const mrWithDoctors = mrs.map(mr => {
            return {
                MRNAME: mr.PSNAME,
                doctorsCount: mr.doctors.length
            };
        });

        // Find the total number of patients under each doctor
        const doctorIds = mrs.flatMap(mr => mr.doctors).flatMap(doctor => doctor._id);
        const doctorWithPatients = await DoctorModel.aggregate([
            {
                $match: {
                    _id: { $in: doctorIds }
                }
            },
            {
                $lookup: {
                    from: "patients",
                    localField: "patients",
                    foreignField: "_id",
                    as: "patients"
                }
            },
            {
                $project: {
                    DRNAME: 1,
                    patientsCount: { $size: "$patients" }
                }
            }
        ]);

        return res.json({ admin, mrs, mrWithDoctors, doctorWithPatients });
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        });
    }
};

// const handleAdminSideDetailReports = async (req, res) => {
//     const adminId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(adminId)) {
//         return res.status(400).json({ error: 'Invalid admin ID format' });
//     }

//     try {
//         const adminData = await adminModels
//             .findById(adminId)
//             .lean()
//             .exec();

//         if (!adminData || !adminData.Mrs) {
//             return res.status(404).json({ error: 'Admin not found or has no related data' });
//         }

//         const header = [
//             'adminId',
//             'adminName',
//             'Gender',
//             'MobileNumber',
//             'mrName',
//             'mrCode',
//             'mrHQ',
//             'mrDESG',
//             'mrDoc',
//             'mrTotalDoctor',
//             'doctorName',
//             'doctorScCode',
//             'doctorSpeciality',
//             'doctorLocality',
//             'doctorTotalPatients',
//             'doctorState',
//             'patientName',
//             'patientAge',
//             'PatientType',
//             'PatientDoc',
//             'patientRepurchaseLength',
//             'patientRepurchaseData',
//         ];

//         const rows = [header];

//         for (const mrId of adminData.Mrs) {
//             const mr = await MrModel
//                 .findById(mrId)
//                 .populate({
//                     path: 'doctors',
//                     model: 'Doctor',
//                     populate: {
//                         path: 'patients',
//                         model: 'Patient'
//                     }
//                 })
//                 .exec();
//             if (!mr) {
//                 continue;
//             }
//             const mrRow = [
//                 adminData.AdminId || 'N/A',
//                 adminData.Name || 'N/A',
//                 adminData.Gender || 'N/A',
//                 adminData.MobileNumber || 'N/A',
//                 mr.MRNAME || 'N/A',
//                 mr.MRCODE || 'N/A',
//                 mr.HQ || 'N/A',
//                 mr.DESG || 'N/A',
//                 mr.doc || 'N/A',
//                 mr.doctors ? mr.doctors.length || 'N/A' : 'N/A',
//                 mr.doctors ? mr.doctors[0].DRNAME || 'N/A' : 'N/A',
//                 mr.doctors ? mr.doctors[0].SCCODE || 'N/A' : 'N/A',
//                 mr.doctors ? mr.doctors[0].SPECIALITY || 'N/A' : 'N/A',
//                 mr.doctors ? mr.doctors[0].LOCALITY || 'N/A' : 'N/A',
//                 mr.doctors[0].patients[0] ? (mr.doctors[0].patients[0].length || 'N/A') : 'N/A',
//                 mr.doctors[0] ? mr.doctors[0].STATE || 'N/A' : 'N/A',
//                 mr.doctors.patients ? mr.doctors.patients.PatientName || 'N/A' : 'N/A',
//                 mr.doctors.patients ? mr.doctors.patients.PatientAge || 'N/A' : 'N/A',
//                 mr.doctors.patients ? mr.doctors.patients.PatientType || 'N/A' : 'N/A',
//                 mr.doctors.patients ? mr.doctors.patients.doc || 'N/A' : 'N/A',
//                 mr.doctors.patients ? mr.doctors.patients.Repurchase?.length || 'N/A' : 'N/A',
//                 mr.doctors.patients ? mr.doctors.patients.Repurchase || 'N/A' : 'N/A',
//             ]
//             rows.push(mrRow);
//             if (mr.doctors) {
//                 mr.doctors.forEach(doctor => {
//                     const doctorRow = [
//                         adminData.AdminId || 'N/A',
//                         adminData.Name || 'N/A',
//                         adminData.Gender || 'N/A',
//                         adminData.MobileNumber || 'N/A',
//                         mr.MRNAME || 'N/A',
//                         mr.MRCODE || 'N/A',
//                         mr.HQ || 'N/A',
//                         mr.DESG || 'N/A',
//                         mr.doc || 'N/A',
//                         mr.doctors.length || 'N/A',
//                         doctor.DRNAME || 'N/A',
//                         doctor.SCCODE || 'N/A',
//                         doctor.SPECIALITY || 'N/A',
//                         doctor.LOCALITY || 'N/A',
//                         doctor.patients ? doctor.patients.length || 'N/A' : 'N/A',
//                         doctor.STATE ? doctor.STATE || 'N/A' : 'N/A',
//                         doctor.patients ? doctor.patients.PatientName || 'N/A' : 'N/A',
//                         doctor.patients ? doctor.patients.PatientAge || 'N/A' : 'N/A',
//                         doctor.patients ? doctor.patients.PatientType || 'N/A' : 'N/A',
//                         doctor.patients ? doctor.patients.doc || 'N/A' : 'N/A',
//                         // doctor.patients ? doctor.patients.Repurchase.length || 'N/A' : 'N/A',
//                         doctor.patients ? doctor.patients.Repurchase || 'N/A' : 'N/A',
//                     ];
//                     rows.push(doctorRow);
//                 });
//             }
//         }
//         return res.json(rows);
//     } catch (error) {
//         console.error(error);
//         const errMsg = error.message;
//         return res.status(500).json({ success: false, errMsg, error: 'Internal Server Error' });
//     }
// };

// const handleAdminSideDetailReports = async (req, res) => {
//     const adminId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(adminId)) {
//         return res.status(400).json({ error: 'Invalid admin ID format' });
//     }

//     try {
//         const adminData = await adminModels
//             .findById(adminId)
//             .lean()
//             .exec();

//         if (!adminData || !adminData.Mrs) {
//             return res.status(404).json({ error: 'Admin not found or has no related data' });
//         }

//         const header = [
//             'adminId',
//             'adminName',
//             'Gender',
//             'MobileNumber',
//             'mrName',
//             'mrCode',
//             'mrHQ',
//             'mrDESG',
//             'mrDoc',
//             'mrTotalDoctor',
//             'doctorName',
//             'doctorScCode',
//             'doctorSpeciality',
//             'doctorLocality',
//             'doctorTotalPatients',
//             'doctorState',
//             'patientName',
//             'patientAge',
//             'PatientType',
//             'PatientDoc',
//             'patientRepurchaseLength',
//             'patientRepurchaseData',
//         ];

//         const rows = [header];

//         for (const mrId of adminData.Mrs) {
//             const mr = await MrModel
//                 .findById(mrId)
//                 .populate({
//                     path: 'doctors',
//                     model: 'Doctor',
//                     populate: {
//                         path: 'patients',
//                         model: 'Patient'
//                     }
//                 })
//                 .exec();
//             if (!mr) {
//                 continue;
//             }

//             if (mr.doctors) {
//                 mr.doctors.forEach(doctor => {
//                     if (doctor.patients) {
//                         doctor.patients.forEach(patient => {
//                             const patientRow = [
//                                 adminData.AdminId || 'N/A',
//                                 adminData.Name || 'N/A',
//                                 adminData.Gender || 'N/A',
//                                 adminData.MobileNumber || 'N/A',
//                                 mr.MRNAME || 'N/A',
//                                 mr.MRCODE || 'N/A',
//                                 mr.HQ || 'N/A',
//                                 mr.DESG || 'N/A',
//                                 mr.doc || 'N/A',
//                                 mr.doctors.length || 'N/A',
//                                 doctor.DRNAME || 'N/A',
//                                 doctor.SCCODE || 'N/A',
//                                 doctor.SPECIALITY || 'N/A',
//                                 doctor.LOCALITY || 'N/A',
//                                 doctor.patients ? doctor.patients.length || 'N/A' : 'N/A',
//                                 doctor.STATE ? doctor.STATE || 'N/A' : 'N/A',
//                                 patient.PatientName || 'N/A',
//                                 patient.PatientAge || 'N/A',
//                                 patient.PatientType || 'N/A',
//                                 patient.doc || 'N/A',
//                                 patient.Repurchase ? patient.Repurchase.length || 'N/A' : 'N/A',
//                                 patient.Repurchase || 'N/A',
//                             ];
//                             rows.push(patientRow);
//                         });
//                     }
//                 });
//             }
//         }

//         return res.json(rows);
//     } catch (error) {
//         console.error(error);
//         const errMsg = error.message;
//         return res.status(500).json({ success: false, errMsg, error: 'Internal Server Error' });
//     }
// };

const handleAdminSideDetailReports = async (req, res) => {
    const adminId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        return res.status(400).json({ error: 'Invalid admin ID format' });
    }

    try {
        const adminData = await adminModels
            .findById(adminId)
            .populate({
                path: 'Slm',
                model: 'Slm',
                populate: {
                    path: 'Flm',
                    model: 'Flm',
                    populate: {
                        path: 'Mrs',
                        model: 'MR',
                        populate: {
                            path: 'doctors',
                            model: 'Doctor',
                            populate: {
                                path: 'patients',
                                model: 'Patient'
                            }
                        }
                    }
                }
            })
            .lean()
            .exec();

        if (!adminData || !adminData.Slm || adminData.Slm.length === 0) {
            return res.status(404).json({ error: 'Admin not found or has no related data' });
        }

        const header = [
            'adminId',
            'adminName',
            'Gender',
            'MobileNumber',
            'mrName',
            'mrCode',
            'mrHQ',
            'mrDESG',
            'mrDoc',
            'mrTotalDoctor',
            'doctorName',
            'doctorScCode',
            'doctorSpeciality',
            'doctorLocality',
            'doctorTotalPatients',
            'doctorClass',
            'patientName',
            'patientAge',
            'PatientType',
            'PatientDoc',
            'patientRepurchaseLength',
            'patientRepurchaseData',
        ];

        const rows = [header];

        adminData.Slm.forEach(slm => {
            slm.Flm.forEach(flm => {
                flm.Mrs.forEach(mr => {
                    mr.doctors.forEach(doctor => {
                        if (doctor.patients) {
                            doctor.patients.forEach(patient => {
                                const patientRow = [
                                    adminData.AdminId || 'N/A',
                                    adminData.Name || 'N/A',
                                    adminData.Gender || 'N/A',
                                    adminData.MobileNumber || 'N/A',
                                    mr.PSNAME || 'N/A',
                                    mr.EMPID || 'N/A',
                                    mr.HQ || 'N/A',
                                    mr.DESIGNATION || 'N/A',
                                    mr.doctors.length || 'N/A',
                                    doctor.DoctorName || 'N/A',
                                    doctor.SCCode || 'N/A',
                                    doctor.Specialty || 'N/A',
                                    doctor.Place || 'N/A',
                                    doctor.patients ? doctor.patients.length || 'N/A' : 'N/A',
                                    doctor.CLASS || 'N/A',
                                    patient.PatientName || 'N/A',
                                    patient.Age || 'N/A',
                                    patient.PatientType || 'N/A',
                                    patient.doc || 'N/A',
                                    patient.Repurchase ? patient.Repurchase.length || 'N/A' : 'N/A',
                                    patient.Repurchase || 'N/A',
                                ];
                                rows.push(patientRow);
                            });
                        }
                    });
                });
            });
        });

        return res.json(rows);
    } catch (error) {
        console.error(error);
        const errMsg = error.message;
        return res.status(500).json({ success: false, errMsg, error: 'Internal Server Error' });
    }
};

const handleSuperAdminCount = async (req, res, next) => {
    const superAdminCount = await adminModels.countDocuments({ Admin_TYPE: 'SUPER_ADMIN' });
    if (superAdminCount >= 3) {
        return req.status(403).json({
            msg: "Can't create more than 3 super admin"
        })
    }
    next();
}

const handleSuperAdminCreate = async (req, res) => {
    try {
        const userId = req.headers['userId'];
        const role = req.headers['userRole'];

        const admin1 = await adminModels.findById({ _id: userId });
        if (!admin1) return res.json({ msg: "Main Admin Not Found" })
        if (role !== '1') {
            return res.json("You are not Default admin");
        }
        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;
        console.log(req.body);
        const admin = await adminModels.findOne({ AdminId: AdminId });
        if (admin) {
            return res.status(400).json({
                msg: "AdminId Already Exitsts",
                success: false,
            })
        }

        const newAdmin = new adminModels({
            Name,
            AdminId,
            Password,
            Gender,
            MobileNumber,
            role: "SUPER_ADMIN"
        })

        if (newAdmin.role === 'SUPER_ADMIN') {
            const superAdminCount = await adminModels.countDocuments({ role: 'SUPER_ADMIN' });
            if (superAdminCount >= 3) {
                return res.status(403).json({
                    msg: "Can't create more than 3 super admin",
                });
            }
            newAdmin.SUPER_ADMIN_COUNT += 1;
        }
        await newAdmin.save();
        return res.status(200).json({
            success: true,
            newAdmin
        });

    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        });
    }
}

const handleReportAdminCreate = async (req, res) => {
    try {
        const userId = req.headers['userId'];
        const role = req.headers['userRole'];
        let adminCheck = await adminModels.findById({ _id: userId });
        if (!adminCheck) return res.json({ msg: "No Admin Type Found" });
        if (role !== 'SUPER_ADMIN') return res.json({ msg: "Only SuperAdmin Create Report Admin" });
        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;
        const admin = await adminModels.findOne({ AdminId: AdminId });
        if (admin) {
            return res.status(400).json({
                msg: "Report Admin Already Exitsts",
                success: false,
            })
        }
        const reportAdmin = new adminModels({
            Name,
            AdminId,
            Password,
            Gender,
            MobileNumber,
            role: "REPORT_ADMIN"
        })
        await reportAdmin.save();
        return res.status(200).json({
            success: true,
            reportAdmin
        });
    }
    catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error in Report Admin creation ",
            errMsg
        });
    }
}

const handleCreateContentAdmin = async (req, res) => {
    try {
        const userId = req.headers['userId'];
        const role = req.headers['userRole'];

        let adminCheck = await adminModels.findById({ _id: userId });
        if (!adminCheck) return res.json({ msg: "No Admin Type Found" });

        if (role !== 'SUPER_ADMIN') return res.json({ msg: "Only SuperAdmin Create Content Admin" });


        const { Name, AdminId, Password, Gender, MobileNumber } = req.body;
        console.log({ Name, AdminId, Password, Gender, MobileNumber })
        const admin = await adminModels.findOne({ AdminId: AdminId });
        if (admin) {
            return res.status(400).json({
                msg: "Content Admin Already Exitsts",
                success: false,
            })
        }

        const contentAdmin = new adminModels({
            Name,
            AdminId,
            Password,
            Gender,
            MobileNumber,
            role: "CONTENT_ADMIN"
        })
        await contentAdmin.save();
        return res.status(200).json({
            success: true,
            contentAdmin
        });
    }
    catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: "Internal Server Error",
            errMsg
        });
    }
}

const verifyJwtForClient = async (req, res) => {

    try {
        const token = req.params.token;
        if (token) {
            const decodedToken = await jwt.verify(token, process.env.SECRET);
            const userRole = decodedToken.role;
            const userId = decodedToken.id;

            return res.json({ userRole, userId })
        } else {
            return res.json({ msg: "token not found" })
        }
    } catch (error) {
        console.error('Error decoding JWT:', error.message);
        const errMessage = error.message
        return res.json({ msg: errMessage })
    }
}

const handleAdminPatientWiseReports = async (req, res) => {
    try {
        const reports = await DoctorModel.find()
            .populate({
                path: 'patients',
                populate: {
                    path: 'Repurchase',
                },
            })
            .exec();
        const formattedReports = [];

        reports.forEach((doctor) => {
            doctor.patients.forEach((patient) => {
                const repurchases = patient.Repurchase;
                const latestRepurchase = repurchases.length > 0 ? repurchases[repurchases.length - 1] : null;
                console.log(latestRepurchase);

                const formattedReport = {
                    doctorName: doctor.DoctorName,
                    doctorSpecialty: doctor.Specialty,
                    patientName: patient.PatientName,
                    patientType: patient.PatientType,
                    patientMobileNumber: patient.MobileNumber,
                    patientAge: patient.Age,

                    status: latestRepurchase ? [latestRepurchase] : [],
                };

                formattedReports.push(formattedReport);
            });
        });

        return res.status(200).json(formattedReports);
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: 'Internal Server Error',
            errMsg,
        });
    }
};

const handleDoctorWisePatientCount = async (req, res) => {
    try {
        const mrs = await MrModel.find().populate({
            path: 'doctors',
            populate: {
                path: 'patients',
                populate: {
                    path: 'Repurchase',
                },
            },
        });

        const doctorWiseReport = [];

        const brands = await BrandModel.find().select('BrandName');

        mrs.forEach((mr) => {
            const doctors = mr.doctors;

            doctors.forEach((doctor) => {
                const doctorReport = {
                    DESG: mr.DESIGNATION,
                    REGION: mr.Region,
                    MRNAME: mr.PSNAME,
                    MRCODE: mr.EMPID,
                    DOCTORNAME: doctor.DoctorName,
                    doctorPotential: doctor.DoctorPotential,
                    doctorSccode: doctor.SCCode,
                    doctorLocality: doctor.Place,
                    doctorSpecialty: doctor.Specialty,
                    totalPatients: doctor.patients.length,
                    totalActivePatients: 0,
                    totalDropouts: 0,
                };

                const brandCounts = {};
                brands.forEach((brand) => {
                    brandCounts[brand.BrandName] = 0;
                });

                doctor.patients.forEach((patient) => {
                    const latestRepurchase = patient.Repurchase.length > 0 ? patient.Repurchase[patient.Repurchase.length - 1] : null;

                    if (latestRepurchase) {
                        if (latestRepurchase.TherapyStatus === 'Ongoing') {
                            doctorReport.totalActivePatients++;
                        } else if (latestRepurchase.TherapyStatus === 'Dropped out') {
                            doctorReport.totalDropouts++;
                        }

                        latestRepurchase.Brands.forEach((brand) => {
                            brandCounts[brand]++;
                        });
                    }
                });

                doctorWiseReport.push({
                    ...doctorReport,
                    ...brandCounts,
                });
            });
        });

        return res.status(200).json(doctorWiseReport);
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: 'Internal Server Error',
            errMsg,
        });
    }
};

const handleMrAndPatientReports = async (req, res) => {
    try {

        const mrs = await MrModel.find().populate({
            path: 'doctors',
            populate: {
                path: 'patients',
                populate: {
                    path: 'Repurchase',
                },
            },
        });


        const MrWisePatient = []

        mrs.forEach(mr => {
            const doctor = mr.doctors;
            doctor.forEach(doctor => {
                const totalPatients = doctor.patients.length;
                const NewPatientBrands = new Set();
                const ActivePatientBrands = new Set();
                const DroputPatientBrands = new Set();

                console.log(totalPatients);
                const totalActivePatients = doctor.patients.reduce((count, patient) => {
                    const latestRepurchase = patient.Repurchase.length > 0 ? patient.Repurchase[patient.Repurchase.length - 1] : null;
                    if (latestRepurchase && latestRepurchase.TherapyStatus === 'Ongoing') {
                        // NewPatientBrands.push(latestRepurchase.Repurchase.Brands[0])
                        patient.Repurchase.map(data => ActivePatientBrands.add(data.Brands[0]))

                        console.log(latestRepurchase)
                        count++;
                    }
                    return count;
                }, 0);

                const totalDropouts = doctor.patients.reduce((count, patient) => {
                    const latestRepurchase = patient.Repurchase.length > 0 ? patient.Repurchase[patient.Repurchase.length - 1] : null;
                    if (latestRepurchase && latestRepurchase.TherapyStatus === 'Dropped out') {
                        console.log(latestRepurchase)
                        patient.Repurchase.map(data => DroputPatientBrands.add(data.Brands[0]))
                        count++;
                    }
                    return count;
                }, 0);

                const totalCartidegesPurchase = doctor.patients.reduce((count, patient) => {
                    patient.Repurchase.forEach(repurchase => {

                        const cartiridgesPurchase = parseFloat(repurchase.TotolCartiridgesPurchase);
                        if (!isNaN(cartiridgesPurchase)) {
                            count += cartiridgesPurchase;
                        }
                    });

                    return count;
                }, 0);


                const totalNewPatients = doctor.patients.reduce((count, patient) => {
                    if (patient.PatientType === 'New') {
                        count++;
                        patient.Repurchase.map(data => NewPatientBrands.add(data.Brands[0]))
                    }

                    return count;
                }, 0);


                MrWisePatient.push({
                    DESG: mr.DESIGNATION,
                    REGION: mr.Region,
                    MRNAME: mr.MRNAME,
                    MRCODE: mr.MRCODE,
                    totalPatients,
                    totalNewPatients,
                    NewPatentBrands: Array.from(NewPatientBrands),
                    totalActivePatients,
                    ActivePatientBrands: Array.from(ActivePatientBrands),
                    totalCartidegesPurchase,
                    totalDropouts,
                    DroputPatientBrands: Array.from(DroputPatientBrands)
                })
            })
        })
        return res.json(MrWisePatient);
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: 'Internal Server Error',
            errMsg,
        });
    }
}

const calculateBrandDurationOfTherapy = (patient, brand) => {
    let totalDuration = 0;
    patient.Repurchase.forEach(repurchase => {
        if (repurchase.Brands.includes(brand)) {
            totalDuration += parseInt(repurchase.DurationOfTherapy) || 0;
        }
    });

    return totalDuration;
};

const calculateBrandTotolCartiridgesPurchase = (patient, brand) => {
    let totalPurchase = 0;

    patient.Repurchase.forEach(repurchase => {
        if (repurchase.Brands.includes(brand)) {
            totalPurchase += parseInt(repurchase.TotolCartiridgesPurchase) || 0;
        }
    });

    return totalPurchase;
};

const handleDetailedReport = async (req, res) => {
    try {
        const mrs = await MrModel.find().populate({
            path: 'doctors',
            populate: {
                path: 'patients',
                populate: {
                    path: 'Repurchase',
                },
            },
        });

        const detailedReport = [];

        mrs.forEach(mr => {
            mr.doctors.forEach(doctor => {
                doctor.patients.forEach(patient => {
                    patient.Repurchase.forEach(repurchase => {
                        repurchase.Brands.forEach(brand => {
                            const brandDurationOfTherapy = calculateBrandDurationOfTherapy(patient, brand);
                            const brandTotolCartiridgesPurchase = calculateBrandTotolCartiridgesPurchase(patient, brand);

                            const reportEntry = {
                                REGION: mr.Region,
                                MRCODE: mr.EMPID,
                                MRNAME: mr.PSNAME,
                                HQ: mr.HQ,
                                DESG: mr.DESIGNATION,
                                MOBILENO: mr.Number,
                                DOJ: mr.DOJ,
                                DRNAME: doctor.DoctorName,
                                PatientName: patient.PatientName,
                                MobileNumber: patient.MobileNumber,
                                PatientAge: patient.Age,
                                Brands: brand,
                                BrandDurationOfTherapy: brandDurationOfTherapy,
                                BrandTotolCartiridgesPurchase: brandTotolCartiridgesPurchase,
                            };
                            detailedReport.push(reportEntry);
                        });
                    });
                });
            });
        });

        return res.json(detailedReport);
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: 'Internal Server Error',
            errMsg,
        });
    }
};

const PrescriberReport = async (req, res) => {
    try {
        const mrs = await MrModel.find().populate({
            path: 'doctors',
            populate: {
                path: 'patients',
                populate: {
                    path: 'Repurchase',
                },
            },
        });

        const detailedReport = [];

        mrs.forEach(mr => {
            mr.doctors.forEach(doctor => {
                const doctorData = {
                    REGION: mr.Region,
                    MRCODE: mr.EMPID,
                    MRNAME: mr.PSNAME,
                    DOJ: mr.DOJ,
                    HQ: mr.HQ,
                    DESG: mr.DESIGNATION,
                    DRNAME: doctor.DoctorName,
                    MOBILENO: mr.Number,
                    newPatientsCount: 0,
                    ongoingPatientsCount: 0,
                };

                doctor.patients.forEach(patient => {
                    // Count new patients
                    if (patient.PatientType === 'New') {
                        doctorData.newPatientsCount++;
                    }

                    // Count ongoing patients
                    const ongoingRepurchase = patient.Repurchase.find(repurchase => repurchase.TherapyStatus === 'Ongoing');
                    if (ongoingRepurchase) {
                        doctorData.ongoingPatientsCount++;
                    }
                });

                detailedReport.push(doctorData);
            });
        });

        return res.json(
            detailedReport
        );
    } catch (error) {
        const errMsg = error.message;
        console.log({ errMsg });
        return res.status(500).json({
            msg: 'Internal Server Error',
            errMsg,
        });
    }
};

const handleCreateBrands = async (req, res) => {
    try {

        const { name } = req.body;
        const brand = await BrandModel.findOne({ BrandName: name });
        if (brand) return res.json({ msg: "Brand Name Already in DB" });
        await new BrandModel({
            BrandName: name
        }).save();
        return res.json({ msg: "Brand Added" });
    } catch (error) {
        console.log(error);
        return res.json({ msg: "Internal Server Error", error })
    }
}

const uplaodSheet = async (req, res) => {
    try {
        // Admin Exist or not checking......
        const AdminId = req.params.id;
        const admin = await adminModels.findById(AdminId);
        if (!admin) {
            return res.status(400).json({
                msg: "Admin Not Found"
            });
        }

        // EXCEL SHEET Upload file....
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // For loop the sheet data to store in various collections
        for (const row of sheetData) {
            console.log('Sheet Data:', row);

            // // Check the TLM exists or not
            // let existTlm = await tlmModel.findOne({ TLMEmpID: row.TLMEmpID });
            // if (!existTlm) {
            //     // TLM doesn't exist, create new TLM
            //     existTlm = new tlmModel({
            //         TLMEmpID: row.TLMEmpID,
            //         TLMName: row.TLMName,
            //         Password: row.Password,
            //     });
            //     await existTlm.save();
            //     admin.Tlm.push(existTlm._id);
            //     await admin.save();
            // }

            // Check the SLM exists or not
            let existSlm = await slmModel.findOne({ SLMEmpID: row.SLMEmpID });
            if (!existSlm) {
                // SLM doesn't exist, create new SLM
                existSlm = new slmModel({
                    SLMEmpID: row.SLMEmpID,
                    ZBMName: row.ZBMName,
                    Password: row.Password,
                    doc: Date.now()
                });
                await existSlm.save();
                admin.Slm.push(existSlm._id);
                await admin.save();
            }

            // Check the FLM exists or not
            let existFlm = await flmModel.findOne({ FLMEmpID: row.FLMEmpID });
            if (!existFlm) {
                // FLM doesn't exist, create new FLM
                existFlm = new flmModel({
                    FLMEmpID: row.FLMEmpID,
                    BDMName: row.BDMName,
                    Password: row.Password,
                    doc: Date.now()
                });
                await existFlm.save();
                existSlm.Flm.push(existFlm._id);
                await existSlm.save();
            }

            // Check the MR exists or not
            let existingMr = await MrModel.findOne({ EMPID: row.EMPID });
            if (!existingMr) {
                // MR doesn't exist, create new MR
                existingMr = new MrModel({
                    EMPID: row.EMPID,
                    PSNAME: row.PSNAME,
                    Region: row.Region,
                    Number: row.Number,
                    Password: row.Password,
                    HQ: row.HQ,
                    DOJ: row.DOJ,
                    DESIGNATION: row.DESIGNATION,
                    doc: Date.now()
                });
                await existingMr.save();
                existFlm.Mrs.push(existingMr._id);
                await existFlm.save();
            }

            // Check if a doctor with the same SCCode already exists
            let existingDoctor = await DoctorModel.findOne({ SCCode: row.SCCode.replace('`', '') });
            if (!existingDoctor) {

                // Remove the backtick from SCCode
                const cleanSCCode = row.SCCode.replace('`', '');

                // Map "Active" and "Inactive" to Boolean values
                let doctorStatus = true; // Assume default status is "Active"
                if (row.DoctorStatus === "inactive") {
                    doctorStatus = false;
                }

                // Create a new doctor entry
                existingDoctor = new DoctorModel({
                    SCCode: cleanSCCode,
                    DoctorName: row.DoctorName,
                    Specialty: row.Specialty,
                    Place: row.Place,
                    CLASS: row.CLASS,
                    VF: row.VF,
                    DoctorPotential: row.DoctorPotential,
                    POBStatus: row.POBStatus,
                    POBCount: row.POBCount,
                    DoctorStatus: doctorStatus,
                    doc: Date.now()
                });
                await existingDoctor.save();

                // Associate the doctor with the MR
                existingMr.doctors.push(existingDoctor._id);
                await existingMr.save();
            }

            // Check if a doctor with the same SCCode already exists
            let existingPatient = await PatientModel.findOne({ PatientName: row.PatientName });
            if (!existingPatient) {

                // Map "Active" and "Inactive" to Boolean values
                let patientStatus = true; // Assume default status is "Active"
                if (row.PatientStatus === "DISCONTINUE") {
                    patientStatus = false;
                }

                //Calculation of total..
                const calculateTotal = row.Price * row.NoDose;

                // Extract age from the row data and parse it as an integer
                const age = parseInt(row['Age ']);

                // Create a new doctor entry
                existingPatient = new PatientModel({
                    PatientName: row.PatientName,
                    Age: age,
                    Gender: row.Gender,
                    MobileNumber: row.MobileNumber,
                    Location: row.Location,
                    // NoUnitPurchased: row.NoUnitPurchased,
                    Month: row.Month,
                    Year: row.Year,
                    PatientStatus: patientStatus,
                    Reason: row.Reason,
                    doc: Date.now(),
                    PatientType: row.PatientType,
                    Repurchase: {
                        DurationOfTherapy: row.DurationOfTherapy,
                        TotolCartiridgesPurchase: row.NoUnitPurchased,
                        DateOfPurchase: row.DateOfPurchase,
                        Delivery: row.Delivery,
                        TherapyStatus: row.TherapyStatus,
                        UnitsPrescribe: row.UnitsPrescribe,
                        Indication: row.Indication,
                        Price: row.Price,
                        NoDose: row.NoDose,
                        Total: calculateTotal,
                        Brands: row.Brands
                    }
                });
                await existingPatient.save();

                // Associate the patient with the doctor
                existingDoctor.patients.push(existingPatient._id);
                await existingDoctor.save();
            }
        }

        res.status(200).json({ message: "Data uploaded successfully" });
    } catch (error) {
        console.error(error);
        const err = error.message;
        res.status(500).json({
            error: 'Internal server error',
            err
        });
    }
};

const adminMrList = async (req, res) => {
    try {
        const adminId = req.params.id;

        //Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        //check admin exist or not..
        const adminExist = await adminModels.findById(adminId).populate({
            path: 'Slm',
            model: 'Slm',
            populate: {
                path: 'Flm',
                model: 'Flm',
                populate: {
                    path: 'Mrs',
                    model: 'MR',
                }
            }
        });

        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        //Store in empty conatiner...
        const detailMRlist = [];

        //Loop Data of mr...
        for (const slm of adminExist.Slm) {
            for (const flm of slm.Flm) {
                for (const mrs of flm.Mrs) {
                    const report = {
                        MRID: mrs.EMPID,
                        MRNAME: mrs.PSNAME,
                        MRPASS: mrs.Password,
                        MRNUMBER: mrs.Number,
                        MRREGION: mrs.Region,
                        MRHQ: mrs.HQ,
                        MRDOJ: mrs.DOJ,
                        MRDESG: mrs.DESIGNATION,
                        MRDOC: mrs.doc,
                    }
                    detailMRlist.push(report);
                }
            }
        }

        //Send the response of loop data...
        res.status(201).json(detailMRlist);

    } catch (err) {
        console.log(err);
        res.status(501).send({ message: "Failed to mr list..!!!", success: false });
    }
}

const admingetMrId = async (req, res) => {
    try {
        const adminId = req.params.id;

        //Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        //check admin exist or not..
        const adminExist = await adminModels.findById(adminId).populate({
            path: 'Slm',
            model: 'Slm',
            populate: {
                path: 'Flm',
                model: 'Flm',
                populate: {
                    path: 'Mrs',
                    model: 'MR',
                }
            }
        });

        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        //Store in empty conatiner...
        const detailMRlist = [];

        //Loop Data of mr...
        for (const slm of adminExist.Slm) {
            for (const flm of slm.Flm) {
                for (const mrs of flm.Mrs) {
                    const report = {
                        MROBJID: mrs._id,
                        MRID: mrs.EMPID,
                        MRNAME: mrs.PSNAME,
                    }
                    detailMRlist.push(report);
                }
            }
        }

        //Send the response of loop data...
        res.status(201).json(detailMRlist);

    } catch (err) {
        console.log(err);
        res.status(501).send({ message: "Failed to mr list..!!!", success: false });
    }
}

const adminDoctorList = async (req, res) => {
    try {
        const adminId = req.params.id;

        //Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        //check admin exist or not..
        const adminExist = await adminModels.findById(adminId).populate({
            path: 'Slm',
            model: 'Slm',
            populate: {
                path: 'Flm',
                model: 'Flm',
                populate: {
                    path: 'Mrs',
                    model: 'MR',
                    populate: {
                        path: 'doctors',
                        model: 'Doctor'
                    }
                }
            }
        });


        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        //Store in empty conatiner...
        const detailDoctorlist = [];

        //Loop Data of mr...
        for (const slm of adminExist.Slm) {
            for (const flm of slm.Flm) {
                for (const mrs of flm.Mrs) {
                    for (const doctors of mrs.doctors) {
                        const report = {
                            DRNAME: doctors.DoctorName,
                            DRSCCODE: doctors.SCCode,
                            DRSPEC: doctors.Specialty,
                            DRPLACE: doctors.Place,
                            DRCLASS: doctors.CLASS,
                            DRVF: doctors.VF,
                            DRPOTENTIAL: doctors.DoctorPotential,
                            DRSTATUS: doctors.DoctorStatus,
                            DRDOC: doctors.doc,
                        }
                        detailDoctorlist.push(report);
                    }
                }
            }
        }

        //Send the response of loop data...
        res.status(201).json(detailDoctorlist);

    } catch (err) {
        console.log(err);
        res.status(501).send({ message: "Failed to doctor list..!!!", success: false });
    }
}

const admingetDoctorId = async (req, res) => {
    try {
        const adminId = req.params.id;

        //Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        //check admin exist or not..
        const adminExist = await adminModels.findById(adminId).populate({
            path: 'Slm',
            model: 'Slm',
            populate: {
                path: 'Flm',
                model: 'Flm',
                populate: {
                    path: 'Mrs',
                    model: 'MR',
                    populate: {
                        path: 'doctors',
                        model: 'Doctor'
                    }
                }
            }
        });

        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        //Store in empty conatiner...
        const detailDoctorData = [];

        //Loop Data of mr...
        for (const slm of adminExist.Slm) {
            for (const flm of slm.Flm) {
                for (const mrs of flm.Mrs) {
                    for (const doctors of mrs.doctors) {
                        const report = {
                            DROBJID: doctors._id,
                            DRSCCODE: doctors.SCCode,
                            DRNAME: doctors.DoctorName,
                        }
                        detailDoctorData.push(report);
                    }
                }
            }
        }

        //Send the response of loop data...
        res.status(201).json(detailDoctorData);

    } catch (err) {
        console.log(err);
        res.status(501).send({ message: "Failed to mr list..!!!", success: false });
    }
}

const adminPatientList = async (req, res) => {
    try {
        const adminId = req.params.id;

        //Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        //check admin exist or not..
        const adminExist = await adminModels.findById(adminId).populate({
            path: 'Slm',
            model: 'Slm',
            populate: {
                path: 'Flm',
                model: 'Flm',
                populate: {
                    path: 'Mrs',
                    model: 'MR',
                    populate: {
                        path: 'doctors',
                        model: 'Doctor',
                        populate: {
                            path: 'patients',
                            model: 'Patient'
                        }
                    }
                }
            }
        });


        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        //Store in empty conatiner...
        const detailPatientlist = [];

        //Loop Data of mr...
        for (const slm of adminExist.Slm) {
            for (const flm of slm.Flm) {
                for (const mrs of flm.Mrs) {
                    for (const doctors of mrs.doctors) {
                        for (const patients of doctors.patients) {
                            const report = {
                                PNAME: patients.PatientName,
                                PNUMBER: patients.MobileNumber,
                                PAGE: patients.Age,
                                PGENDER: patients.Gender,
                                PLOCATION: patients.Location,
                                PSTATUS: patients.PatientStatus,
                                PREASON: patients.Reason,
                                PTYPE: patients.PatientType,
                                PDOC: patients.doc,
                            }
                            detailPatientlist.push(report);
                        }
                    }
                }
            }
        }

        //Send the response of loop data...
        res.status(201).json(detailPatientlist);

    } catch (err) {
        console.log(err);
        res.status(501).send({ message: "Failed to patient list..!!!", success: false });
    }
}

// MRNAME COMING BUT SOMETHING WRONG...
const adminDetailDurationWise = async (req, res) => {
    try {
        const adminId = req.params.id;

        // Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        // Check admin exist or not..
        const adminExist = await adminModels.findById(adminId);
        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        // Store mining data...
        const brandData = {};

        // Loop data....
        for (const Admins of adminExist.Slm) {
            const slmExist = await slmModel.find({ _id: { $in: Admins } });

            for (const Slms of slmExist) {
                const flmExist = await flmModel.find({ _id: { $in: Slms.Flm } });

                for (const Flms of flmExist) {
                    const mrExist = await MrModel.find({ _id: { $in: Flms.Mrs } });

                    for (const Mrs of mrExist) {
                        const doctorExist = await DoctorModel.find({ _id: { $in: Mrs.doctors } });

                        for (const Doctors of doctorExist) {
                            const patientExist = await PatientModel.find({ _id: { $in: Doctors.patients } });

                            patientExist.forEach(patient => {
                                patient.Repurchase.forEach(repurchase => {
                                    repurchase.Brands.forEach(brandName => {
                                        const repurchaseDate = new Date(repurchase.DateOfPurchase);

                                        // Calculate days difference
                                        const currentDate = new Date();
                                        const daysDifference = Math.ceil((currentDate - repurchaseDate) / (1000 * 60 * 60 * 24));

                                        // Update brandData object
                                        if (!brandData[brandName]) {
                                            brandData[brandName] = {
                                                previousDay: { repurchaseTotal: 0, MRName: '' },
                                                lastSevenDays: { repurchaseTotal: 0, MRName: '' },
                                                lastMonth: { repurchaseTotal: 0, MRName: '' },
                                            };
                                        }

                                        if (daysDifference === 1) {
                                            brandData[brandName].previousDay.repurchaseTotal++;
                                            if (brandData[brandName].previousDay.MRName === '' || brandData[brandName].previousDay.repurchaseTotal > brandData[brandName].previousDay.repurchaseTotal) {
                                                console.log("PreviousDayWinner :", Mrs.PSNAME);
                                                brandData[brandName].previousDay.MRName = Mrs.PSNAME;
                                            }
                                        }

                                        if (daysDifference <= 7) {
                                            brandData[brandName].lastSevenDays.repurchaseTotal++;
                                            if (brandData[brandName].lastSevenDays.MRName === '' || brandData[brandName].lastSevenDays.repurchaseTotal > brandData[brandName].lastSevenDays.repurchaseTotal) {
                                                brandData[brandName].lastSevenDays.MRName = Mrs.PSNAME;
                                            }
                                        }

                                        if (daysDifference <= 30) {
                                            brandData[brandName].lastMonth.repurchaseTotal++;
                                            if (brandData[brandName].lastMonth.MRName === '' || brandData[brandName].lastMonth.repurchaseTotal > brandData[brandName].lastMonth.repurchaseTotal) {
                                                brandData[brandName].lastMonth.MRName = Mrs.PSNAME;
                                            }
                                        }
                                    });
                                });
                            });
                        }
                    }
                }
            }
        }

        res.status(201).json(brandData);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Internal Server Error", success: false });
    }

}

// const adminMRdurationReport = async (req, res) => {
//     try {
//         const adminId = req.params.id;

//         // Check admin id is getting or not..
//         if (!adminId) {
//             return res.status(404).send({ message: "Admin ID not found...!!", success: false });
//         }

//         // Check admin exist or not..
//         const adminExist = await adminModels.findById(adminId);
//         if (!adminExist) {
//             return res.status(401).send({ message: "Admin not found..!!!", success: false });
//         }

//         // Define yesterday's, last week's, and last month's dates
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const yesterdayDate = yesterday.toISOString().slice(0, 10);

//         const lastWeek = new Date();
//         lastWeek.setDate(lastWeek.getDate() - 7);
//         const lastWeekDate = lastWeek.toISOString().slice(0, 10);

//         const lastMonth = new Date();
//         lastMonth.setDate(lastMonth.getDate() - 31);
//         const lastMonthDate = lastMonth.toISOString().slice(0, 10);

//         const brandWiseData = {};

//         // Iterate through each brand in durationWise array
//         for (const brandData of adminExist.durationWise) {
//             const { brandName, repurchaseDate, mrName } = brandData;

//             // Initialize brand if not present in brandWiseData
//             if (!brandWiseData[brandName]) {
//                 brandWiseData[brandName] = {
//                     highest: { count: 0, mrname: null },
//                     yesterday: { count: 0, mrname: null },
//                     lastweek: { count: 0, mrname: null },
//                     lastmonth: { count: 0, mrname: null },
//                 };
//             }


//             // Update counts based on repurchase date and MR name
//             if (repurchaseDate === yesterdayDate) {
//                 console.log(`Incrementing yesterday count for ${brandName} - MR: ${mrName} DATE: ${repurchaseDate}`);
//                 // Check if this repurchase count is higher than the current highest count for yesterday
//                 if (brandWiseData[brandName].yesterday.count < brandWiseData[brandName].highest.count) {
//                     brandWiseData[brandName].yesterday.count = brandWiseData[brandName].highest.count;
//                     brandWiseData[brandName].yesterday.mrname = brandWiseData[brandName].highest.mrname;
//                 } else {
//                     // Update if the MR name has a higher count than the current "yesterday" count
//                     if (brandWiseData[brandName].highest.count === 0 || brandWiseData[brandName].highest.count < brandWiseData[brandName].yesterday.count) {
//                         brandWiseData[brandName].yesterday.count = brandWiseData[brandName].highest.count;
//                         brandWiseData[brandName].yesterday.mrname = brandWiseData[brandName].highest.mrname;
//                     }
//                 }
//             }


//             if (repurchaseDate >= lastWeekDate) {
//                 brandWiseData[brandName].lastweek.count++;
//                 if (!brandWiseData[brandName].lastweek.mrname ||
//                     brandWiseData[brandName].lastweek.count > brandWiseData[brandName].highest.count) {
//                     brandWiseData[brandName].lastweek.mrname = mrName;
//                 }
//             }

//             if (repurchaseDate >= lastMonthDate) {
//                 brandWiseData[brandName].lastmonth.count++;
//                 if (!brandWiseData[brandName].lastmonth.mrname ||
//                     brandWiseData[brandName].lastmonth.count > brandWiseData[brandName].highest.count) {
//                     brandWiseData[brandName].lastmonth.mrname = mrName;
//                 }
//             }

//             // Update highest MR name based on actual counts
//             if (brandWiseData[brandName].highest.count < brandWiseData[brandName].yesterday.count) {
//                 brandWiseData[brandName].highest.count = brandWiseData[brandName].yesterday.count;
//                 brandWiseData[brandName].highest.mrname = mrName;
//             }
//             if (brandWiseData[brandName].highest.count < brandWiseData[brandName].lastweek.count) {
//                 brandWiseData[brandName].highest.count = brandWiseData[brandName].lastweek.count;
//                 brandWiseData[brandName].highest.mrname = mrName;
//             }
//             if (brandWiseData[brandName].highest.count < brandWiseData[brandName].lastmonth.count) {
//                 brandWiseData[brandName].highest.count = brandWiseData[brandName].lastmonth.count;
//                 brandWiseData[brandName].highest.mrname = mrName;
//             }
//         }

//         res.status(200).json({ BrandWiseDuration: brandWiseData });

//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Internal Server Error", success: false });
//     }
// };

let a;

//Perfect running code yesterday count...
// const adminMRdurationReport = async (req, res) => {
//     try {
//         const adminId = req.params.id;

//         // Check admin id is getting or not..
//         if (!adminId) {
//             return res.status(404).send({ message: "Admin ID not found...!!", success: false });
//         }

//         // Check admin exist or not..
//         const adminExist = await adminModels.findById(adminId);
//         if (!adminExist) {
//             return res.status(401).send({ message: "Admin not found..!!!", success: false });
//         }

//         // Define yesterday's, last week's, and last month's dates
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const yesterdayDate = yesterday.toISOString().slice(0, 10);

//         const lastWeek = new Date();
//         lastWeek.setDate(lastWeek.getDate() - 7);
//         const lastWeekDate = lastWeek.toISOString().slice(0, 10);

//         const lastMonth = new Date();
//         lastMonth.setDate(lastMonth.getDate() - 31);
//         const lastMonthDate = lastMonth.toISOString().slice(0, 10);

//         const brandWiseData = {};

//         // Iterate through each brand in durationWise array
//         for (const brandData of adminExist.durationWise) {
//             const { brandName, repurchaseDate, mrName } = brandData;

//             // Initialize brand if not present in brandWiseData
//             if (!brandWiseData[brandName]) {
//                 brandWiseData[brandName] = {
//                     highest: { count: 0, mrname: null },
//                     yesterday: { count: 0, mrname: null },
//                     lastweek: { count: 0, mrname: null },
//                     lastmonth: { count: 0, mrname: null },
//                 };
//             }

//             if (repurchaseDate === yesterdayDate) {
//                 console.log(`Incrementing yesterday count for ${brandName} - MR: ${mrName} DATE: ${repurchaseDate}`);
//                 // Ensure brandWiseData[brandName][mrName] is initialized
//                 if (!brandWiseData[brandName][mrName]) {
//                     brandWiseData[brandName][mrName] = { count: 0 };
//                 }
//                 // Update yesterday's count for this MR
//                 brandWiseData[brandName][mrName].count++;
//                 // Check if this MR has a higher count than the current highest for yesterday
//                 if (brandWiseData[brandName][mrName].count > brandWiseData[brandName].yesterday.count) {
//                     brandWiseData[brandName].yesterday.count = brandWiseData[brandName][mrName].count;
//                     brandWiseData[brandName].yesterday.mrname = mrName;
//                 }
//             }


//             if (repurchaseDate >= lastWeekDate) {
//                 brandWiseData[brandName].lastweek.count++;
//                 if (!brandWiseData[brandName].lastweek.mrname ||
//                     brandWiseData[brandName].lastweek.count > brandWiseData[brandName].highest.count) {
//                     brandWiseData[brandName].lastweek.mrname = mrName;
//                 }
//             }

//             if (repurchaseDate >= lastMonthDate) {
//                 brandWiseData[brandName].lastmonth.count++;
//                 if (!brandWiseData[brandName].lastmonth.mrname ||
//                     brandWiseData[brandName].lastmonth.count > brandWiseData[brandName].highest.count) {
//                     brandWiseData[brandName].lastmonth.mrname = mrName;
//                 }
//             }

//             // Update highest MR name based on actual counts
//             if (brandWiseData[brandName].highest.count < brandWiseData[brandName].yesterday.count) {
//                 brandWiseData[brandName].highest.count = brandWiseData[brandName].yesterday.count;
//                 brandWiseData[brandName].highest.mrname = mrName;
//             }
//             if (brandWiseData[brandName].highest.count < brandWiseData[brandName].lastweek.count) {
//                 brandWiseData[brandName].highest.count = brandWiseData[brandName].lastweek.count;
//                 brandWiseData[brandName].highest.mrname = mrName;
//             }
//             if (brandWiseData[brandName].highest.count < brandWiseData[brandName].lastmonth.count) {
//                 brandWiseData[brandName].highest.count = brandWiseData[brandName].lastmonth.count;
//                 brandWiseData[brandName].highest.mrname = mrName;
//             }
//         }

//         res.status(200).json({ BrandWiseDuration: brandWiseData });

//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Internal Server Error", success: false });
//     }
// };




const adminMRdurationReport = async (req, res) => {
    try {
        const adminId = req.params.id;

        // Check admin id is getting or not..
        if (!adminId) {
            return res.status(404).send({ message: "Admin ID not found...!!", success: false });
        }

        // Check admin exist or not..
        const adminExist = await adminModels.findById(adminId);
        if (!adminExist) {
            return res.status(401).send({ message: "Admin not found..!!!", success: false });
        }

        // Define yesterday's, last week's, and last month's dates
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().slice(0, 10);

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekDate = lastWeek.toISOString().slice(0, 10);

        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 31);
        const lastMonthDate = lastMonth.toISOString().slice(0, 10);

        const brandWiseData = {};

        // Iterate through each brand in durationWise array
        for (const brandData of adminExist.durationWise) {
            const { brandName, repurchaseDate, mrName } = brandData;

            // Initialize brand if not present in brandWiseData
            if (!brandWiseData[brandName]) {
                brandWiseData[brandName] = {
                    highest: { count: 0, mrname: null },
                    yesterday: { count: 0, mrname: null },
                    lastweek: { count: 0, mrname: null },
                    lastmonth: { count: 0, mrname: null },
                };
            }

            if (repurchaseDate === yesterdayDate) {
                // console.log(`Incrementing yesterday count for ${brandName} - MR: ${mrName} DATE: ${repurchaseDate}`);

                // Ensure brandWiseData[brandName][mrName] is initialized
                if (!brandWiseData[brandName][mrName]) {
                    brandWiseData[brandName][mrName] = { count: 0 };
                }
                // Update yesterday's count for this MR
                brandWiseData[brandName][mrName].count++;
                // Check if this MR has a higher count than the current highest for yesterday
                if (brandWiseData[brandName][mrName].count > brandWiseData[brandName].yesterday.count) {
                    brandWiseData[brandName].yesterday.count = brandWiseData[brandName][mrName].count;
                    brandWiseData[brandName].yesterday.mrname = mrName;
                }
            }


            if (repurchaseDate >= lastWeekDate) {
                console.log(`Incrementing last week count for ${brandName} - MR: ${mrName} DATE: ${repurchaseDate}`);

                // Ensure brandWiseData[brandName].lastweek is initialized
                if (!brandWiseData[brandName].lastweek) {
                    brandWiseData[brandName].lastweek = { count: 0 };
                }

                // Update last week's count for this MR
                brandWiseData[brandName].lastweek.count++;

                // Check if this MR has a higher count than the current highest for last week
                if (
                    !brandWiseData[brandName].lastweek.mrname ||
                    brandWiseData[brandName].lastweek.count > brandWiseData[brandName].highest.count
                ) {
                    brandWiseData[brandName].lastweek.mrname = mrName;
                }
            }


            if (repurchaseDate >= lastMonthDate) {
                brandWiseData[brandName].lastmonth.count++;
                if (!brandWiseData[brandName].lastmonth.mrname ||
                    brandWiseData[brandName].lastmonth.count > brandWiseData[brandName].highest.count) {
                    brandWiseData[brandName].lastmonth.mrname = mrName;
                }
            }

            // Update highest MR name based on actual counts
            if (brandWiseData[brandName].highest.count < brandWiseData[brandName].yesterday.count) {
                brandWiseData[brandName].highest.count = brandWiseData[brandName].yesterday.count;
                brandWiseData[brandName].highest.mrname = mrName;
            }
            if (brandWiseData[brandName].highest.count < brandWiseData[brandName].lastweek.count) {
                brandWiseData[brandName].highest.count = brandWiseData[brandName].lastweek.count;
                brandWiseData[brandName].highest.mrname = mrName;
            }
            if (brandWiseData[brandName].highest.count < brandWiseData[brandName].lastmonth.count) {
                brandWiseData[brandName].highest.count = brandWiseData[brandName].lastmonth.count;
                brandWiseData[brandName].highest.mrname = mrName;
            }
        }

        res.status(200).json({ BrandWiseDuration: brandWiseData });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error", success: false });
    }
};
















module.exports = {
    handleAdminCreateAccounts,
    handleAdminLogin,
    handleAdminReports,
    handleAdminSideDetailReports,
    handleSuperAdminCount,
    handleSuperAdminCreate,
    handleReportAdminCreate,
    handleCreateContentAdmin,
    verifyJwtForClient,
    handleAdminPatientWiseReports,
    handleDoctorWisePatientCount,
    handleMrAndPatientReports,
    handleDetailedReport,
    PrescriberReport,
    uplaodSheet,
    handleCreateBrands,
    adminMrList,
    admingetMrId,
    adminDoctorList,
    admingetDoctorId,
    adminPatientList,
    adminDetailDurationWise,
    adminMRdurationReport
}
