const DoctorModel = require("../models/doctor");
const PatientModel = require("../models/patient");
const BrandModel = require("../models/Brands");
const MrModel = require("../models/mr");
const flmModel = require("../models/Flm");
const moment = require('moment');



const createPatients = async (req, res) => {
    try {
        const { PatientName, MobileNumber, Gender, Location, PatientAge, Reason, PatientType, Month, Year, PatientStatus, DurationOfTherapy, TotolCartiridgesPurchase, DateOfPurchase, Delivery, Demo, TherapyStatus, TM, selectedOptions, brandCount, repurchaseData } = req.body
        const id = req.params['id'];

        //Check the doctor exist or not....
        const doctor = await DoctorModel.findById({ _id: id });
        if (!doctor) return res.status(400).json({
            msg: "Doctor is Not Found",
            success: false
        });

        //Check the MR exist or not...
        const mrExist = await MrModel.findOne({ doctors: doctor });
        if (!mrExist) {
            return res.status(404).send({ message: "MR Not Found...!!!", success: false });
        }

        // const brands = selectedOptions.map(brand => brand.value);
        const patient = new PatientModel({
            PatientName: PatientName,
            MobileNumber: MobileNumber,
            Age: PatientAge,
            Gender: Gender,
            Location: Location,
            Month: Month,
            Year: Year,
            PatientStatus: PatientStatus === 'DISCONTINUE' ? false : true,
            Reason: Reason,
            PatientType: PatientType,
            doc: Date.now(),
        });


        //Repurchase data handle...
        repurchaseData.forEach(data => {
            const selectedBrand = data.selectedBrand ? data.selectedBrand.value : null;
            const calculatedTotal = data.Price * data.NoDose;
            patient.Repurchase.push({
                DurationOfTherapy: data.durationOfTherapy,
                TotolCartiridgesPurchase: data.totalCartridgesPurchase,
                DateOfPurchase: new Date(data.dop),
                EndOfPurchase: new Date(data.eop),
                TherapyStatus: data.therapyStatus,
                Delivery: data.delivery,
                TM: data.tm,
                UnitsPrescribe: data.UnitsPrescribe,
                Indication: data.Indication,
                Price: data.Price,
                NoDose: data.NoDose,
                SubComments: data.subComments,
                Total: calculatedTotal,
                Brands: [selectedBrand]
            });
        });

        //Save the new patient...
        await patient.save();
        const savedPatient = await patient.save();

        //Save the new doctor....
        doctor.patients.push(savedPatient._id);
        await doctor.save();

        // Track the repurchase data to MR Model...
        repurchaseData.forEach(data => {
            const NewPatientRepurchaseEntry = {
                DoctorName: doctor.DoctorName,
                PatientName: patient.PatientName,
                repurchaseData: {
                    ...data,
                    Total: data.Price * data.NoDose
                }
            };
            mrExist.repurchaseLogs.push(NewPatientRepurchaseEntry);
        });
        await mrExist.save();

        //Send the response....
        return res.status(201).json({ success: true, message: 'Patient created and associated with Doctor' });

    } catch (error) {
        const errMsg = error.message
        console.log("Error in createPatients");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}


const dataPushToPatient = async (req, res) => {
    const id = req.params.id;

    const {
        DurationOfTherapy,
        TotolCartiridgesPurchase,
        DateOfPurchase,
        Delivery,
        Demo,
        TherapyStatus,
        TM,
        Switch,
        SubComments,
        selectedOptions,
        repurchaseData
    } = req.body;

    try {

        //Check the patient exist or not...
        const patient = await PatientModel.findById({ _id: id });
        if (!patient) return res.status(400).json({ msg: "Patient not found" });

        //Check the doctor exist or not...
        const doctorExist = await DoctorModel.findOne({ patients: patient });
        if (!doctorExist) {
            return res.status(404).send({ message: "Doctor not found.." });
        }

        //Check the Mr exist or not...
        const mrExist = await MrModel.findOne({ doctors: doctorExist._id });
        if (!mrExist) {
            return res.status(404).send({ message: "MR not found..!!" });
        }

        //Check the flm exist or not..
        const flmExist = await flmModel.findOne({ Mrs: mrExist._id });
        if (!flmExist) {
            return res.status(404).send({ message: "Flm not found..!!" });
        }

        //Update API means add new repurchase....
        repurchaseData.forEach(data => {
            const selectedBrand = data.selectedBrand ? data.selectedBrand.value : null;
            const calculatedTotal = data.Price * data.NoDose;
            patient.Repurchase.push({
                DurationOfTherapy: data.durationOfTherapy,
                TotolCartiridgesPurchase: data.totalCartridgesPurchase,
                DateOfPurchase: new Date(data.dop),
                EndOfPurchase: new Date(data.eop),
                TherapyStatus: data.TherapyStatus,
                Delivery: data.delivery,
                TM: data.tm,
                UnitsPrescribe: data.UnitsPrescribe,
                Indication: data.Indication,
                Price: data.Price,
                NoDose: data.NoDose,
                SubComments: data.subComments,
                Total: calculatedTotal,
                Brands: [selectedBrand]
            })
        })
        patient.save();

        //After New repurchase is created logs the data...
        repurchaseData.forEach(data => {
            const NewRepurchaseEntry = {
                DoctorName: doctorExist.DoctorName,
                PatientName: patient.PatientName,
                repurchaseData: {
                    ...data,
                    Total: data.Price * data.NoDose
                }
            }

            const repurchaseDate = new Date(data.dop);
            const formattedDate = repurchaseDate.toISOString().split('T')[0];

            //Popular mr as per repurchase...
            const durationRepurchaseEntry = {
                brandName: data.selectedBrand ? data.selectedBrand.value : null,
                repurchaseDate: formattedDate,
                mrName: mrExist.PSNAME,
                doctorName: doctorExist.DoctorName,
                patientName: patient.PatientName
            };
            mrExist.repurchaseLogs.push(NewRepurchaseEntry);
            flmExist.durationWise.push(durationRepurchaseEntry);
        });
        await mrExist.save();

        //Send rsponse if all ok....
        return res.json(200);

    } catch (error) {
        const err = error.message
        console.error("Error in dataPushToPatient:");
        return res.status(500).json({ msg: "Internal Server Error", err });
    }
};


const getAllPatient = async (req, res) => {
    try {
        const patient = await PatientModel.find({});
        return res.json(patient)
    } catch (error) {
        const errMsg = error.message
        console.log("Error in createPatients");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}


const getPaitentById = async (req, res) => {

    try {
        const { id } = req.params;
        const patient = await PatientModel.findById({ _id: id });
        return res.status(200).json(patient)
    }
    catch (error) {
        const errMsg = error.message
        console.log("Error in getPaitentById");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}


const getAllBrands = async (req, res) => {
    try {
        const brands = await BrandModel.find();
        return res.json(brands);
    } catch (error) {
        console.log(error)
        return res.json({ msg: "Internal Server Error" })
    }
}


const getPatinetBrands = async (req, res) => {

    try {

        const id = req.params.id;

        const patient = await PatientModel.findById({ _id: id }).select('Repurchase.Brands')

        const brandArray = [];

        for (const entry of patient.Repurchase) {
            for (const brands of entry.Brands) {
                if (!brandArray.includes(brands)) {
                    brandArray.push(brands);
                }
            }
        }
        const Brands = []
        for (const brands of brandArray) {
            Brands.push({
                brands
            })
        }
        return res.json(Brands);
    }
    catch (error) {
        console.log(error)
        return res.json({ msg: "Internal Server Error" })
    }
}


// Function to check if the date is in the expected format "dd-mm-yyyy"
function isValidDate(dateString) {
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    return dateRegex.test(dateString);
}
const singlePatientFullDetails = async (req, res) => {
    try {
        const patientId = req.params.id;

        //Check the patient is exist or not...
        const patientExist = await PatientModel.findById(patientId);
        if (!patientExist) {
            return res.status(404).send({ message: "Patient id not found..!!", success: false });
        }

        //Fetch the patient details from associated doctor...
        const doctorFetch = await DoctorModel.findOne({ patients: patientExist });
        if (!doctorFetch) {
            return res.status(404).send({ message: "Failed to fetch doctor detail which is associated with patient...!!!", success: false });
        }

        //Iterate the patient Repurchase data...
        const patientRepurchaseDetail = patientExist.Repurchase.map(repurchase => ({
            RDURATION: repurchase.DurationOfTherapy,
            RUNITSOLD: repurchase.TotolCartiridgesPurchase,
            RDATE: isValidDate(repurchase.DateOfPurchase) ? repurchase.DateOfPurchase : new Date(repurchase.DateOfPurchase).toLocaleDateString('en-GB'),
            RSTATUS: repurchase.TherapyStatus,
            RTOTAL: repurchase.Total,
            RBRANDNAME: repurchase.Brands
        }));

        // //Iterate the patient Brand Usage...
        const patientBrandDetail = patientExist.Repurchase.map(repurchaseData => ({
            BrandName: repurchaseData.Brands
        }));

        const formateData = {
            DNAME: doctorFetch.DoctorName,
            DSPECIALITY: doctorFetch.Specialty,
            DPLACE: doctorFetch.Place,
            DSCCODE: doctorFetch.SCCode,
            DCLASS: doctorFetch.CLASS,
            DVF: doctorFetch.VF,
            DDOCTORPOTENTIAL: doctorFetch.DoctorPotential,
            DSTATUS: doctorFetch.DoctorStatus,

            PNAME: patientExist.PatientName,
            PTYPE: patientExist.PatientType,
            PNUMBER: patientExist.MobileNumber,
            PCITY: patientExist.Location,
            PAGE: patientExist.Age,
            PSTATUS: patientExist.PatientStatus,
            PGENDER: patientExist.Gender,
            PINDICATION: patientExist.Indication,
            PPRICE: patientExist.Price,
            PNODOSE: patientExist.NoDose,
            PREASON: patientExist.Reason,
            PBRAND: patientBrandDetail,
            PREPURCHASE: patientRepurchaseDetail
        }

        res.status(201).json(formateData);
    } catch (err) {
        console.log(err);
    }
}





module.exports = {
    createPatients,
    getAllPatient,
    dataPushToPatient,
    getPaitentById,
    getAllBrands,
    getPatinetBrands,
    singlePatientFullDetails
}
