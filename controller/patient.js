const DoctorModel = require("../models/doctor");
const PatientModel = require("../models/patient");
const BrandModel = require("../models/Brands");
const MrModel = require("../models/mr");
const moment = require('moment');


// const createPatients = async (req, res) => {
//     try {
//         const { PatientName, MobileNumber, PatientAge, PatientType, DurationOfTherapy, TotolCartiridgesPurchase, DateOfPurchase, Delivery, Demo, TherapyStatus, TM, selectedOptions, brandCount, repurchaseData } = req.body
//         const id = req.params['id'];
//         const dateFormat = moment(DateOfPurchase, 'DD/MM/YYYY', true);
//         const doctor = await DoctorModel.findById({ _id: id });
//         if (!doctor) return res.status(400).json({
//             msg: "Doctor is Not Found",
//             success: false
//         });

//         // const brands = selectedOptions.map(brand => brand.value);

//         const patient = new PatientModel({
//             PatientName,
//             MobileNumber,
//             PatientAge,
//             PatientType,
//             doc: Date.now(),
//         });



//         repurchaseData.forEach(data => {
//             const selectedBrand = data.selectedBrand ? data.selectedBrand.value : null;
//             patient.Repurchase.push({
//                 DurationOfTherapy: data.durationOfTherapy,
//                 TotolCartiridgesPurchase: data.totalCartridgesPurchase,
//                 DateOfPurchase: new Date(data.dop),
//                 TherapyStatus: data.therapyStatus,
//                 Delivery: data.delivery,
//                 TM: data.tm,
//                 SubComments: data.subComments,
//                 Brands: [selectedBrand]
//             });
//         });

//         await patient.save();

//         const savedPatient = await patient.save();

//         doctor.patients.push(savedPatient._id);
//         await doctor.save();

//         return res.status(201).json({ success: true, message: 'Patient created and associated with Doctor' });

//     } catch (error) {
//         const errMsg = error.message
//         console.log("Error in createPatients");
//         return res.status(500).json({
//             success: false,
//             errMsg
//         })
//     }
// }


const createPatients = async (req, res) => {
    try {
        const { PatientName, MobileNumber, Gender, Location, Indication, UnitsPrescribe, NoUnitPurchased, Price, PatientAge, NoDose, Reason, PatientType, Month, Year, PatientStatus, DurationOfTherapy, TotolCartiridgesPurchase, DateOfPurchase, Delivery, Demo, TherapyStatus, TM, selectedOptions, brandCount, repurchaseData } = req.body
        const id = req.params['id'];

        //Check the doctor exist or not....
        const doctor = await DoctorModel.findById({ _id: id });
        if (!doctor) return res.status(400).json({
            msg: "Doctor is Not Found",
            success: false
        });

        //Check the MR exist or not...
        const mrExist = await MrModel.findOne({ doctors: doctor });
        console.log("Mr detail :", mrExist);

        // const brands = selectedOptions.map(brand => brand.value);
        const patient = new PatientModel({
            PatientName: PatientName,
            MobileNumber: MobileNumber,
            Age: PatientAge,
            Gender: Gender,
            Location: Location,
            Indication: Indication,
            UnitsPrescribe: UnitsPrescribe,
            Price: Price,
            NoDose: NoDose,
            NoUnitPurchased: NoUnitPurchased,
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
            const CalculateTotal = Price * NoDose;
            patient.Repurchase.push({
                DurationOfTherapy: data.durationOfTherapy,
                TotolCartiridgesPurchase: data.totalCartridgesPurchase,
                DateOfPurchase: new Date(data.dop),
                EndOfPurchase: new Date(data.eop),
                TherapyStatus: data.therapyStatus,
                Delivery: data.delivery,
                TM: data.tm,
                SubComments: data.subComments,
                Total: CalculateTotal,
                Brands: [selectedBrand]
            });
        });

        //Save the new patient...
        await patient.save();
        const savedPatient = await patient.save();

        //Save the new doctor....
        doctor.patients.push(savedPatient._id);
        await doctor.save();

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
        const patient = await PatientModel.findById({ _id: id });
        if (!patient) return res.status(400).json({ msg: "Patient not found" });



        repurchaseData.forEach(data => {
            const selectedBrand = data.selectedBrand ? data.selectedBrand.value : null;
            patient.Repurchase.push({
                DurationOfTherapy: data.durationOfTherapy,
                TotolCartiridgesPurchase: data.totalCartridgesPurchase,
                DateOfPurchase: new Date(data.dop),
                EndOfPurchase: new Date(data.eop),
                TherapyStatus: data.TherapyStatus,
                Delivery: data.delivery,
                TM: data.tm,
                SubComments: data.subComments,
                Brands: [selectedBrand]

            })
        })

        patient.save();

        return res.json(200);




        if (Switch === 1) {

            // YES CONDITION
            const repurchaseData = {
                DurationOfTherapy,
                TotolCartiridgesPurchase,
                DateOfPurchase: dateFormat,
                Delivery,
                Demo,
                TherapyStatus,
                Brands: brands
            };
            if (TherapyStatus === 'Dropped out') {
                repurchaseData.SubComments = SubComments;
            }
            if (Delivery === 'Team mate') {
                repurchaseData.TM = TM
            }
            patient.Repurchase.push(repurchaseData);
            await patient.save();
        } else if (Switch === 0) {

            const repurchaseData = {
                TotolCartiridgesPurchase,
                DateOfPurchase: dateFormat,
                Delivery,
                Demo,
                TherapyStatus,
                Brands: brands
            };
            if (TherapyStatus === 'Dropped out') {
                repurchaseData.SubComments = SubComments;
            }
            if (Delivery === 'Team mate') {
                repurchaseData.TM = TM
            }
            patient.Repurchase.push(repurchaseData);
            await patient.save();
        }
        return res.json(patient);
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
    handleCreateBrands,
    getAllBrands,
    getPatinetBrands,
    singlePatientFullDetails
}
