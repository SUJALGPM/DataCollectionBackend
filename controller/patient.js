const DoctorModel = require("../models/doctor");
const PatientModel = require("../models/patient");
const BrandModel = require("../models/Brands")
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
        const dateFormat = moment(DateOfPurchase, 'DD/MM/YYYY', true);
        const doctor = await DoctorModel.findById({ _id: id });
        if (!doctor) return res.status(400).json({
            msg: "Doctor is Not Found",
            success: false
        });

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
            PatientStatus: PatientStatus === 'discontinue',
            Reason: Reason,
            PatientType: PatientType,
            doc: Date.now(),
        });



        repurchaseData.forEach(data => {
            const selectedBrand = data.selectedBrand ? data.selectedBrand.value : null;
            patient.Repurchase.push({
                DurationOfTherapy: data.durationOfTherapy,
                TotolCartiridgesPurchase: data.totalCartridgesPurchase,
                DateOfPurchase: new Date(data.dop),
                TherapyStatus: data.therapyStatus,
                Delivery: data.delivery,
                TM: data.tm,
                SubComments: data.subComments,
                Brands: [selectedBrand]
            });
        });

        await patient.save();

        const savedPatient = await patient.save();

        doctor.patients.push(savedPatient._id);
        await doctor.save();

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
    const id = req.params['id'];
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


    console.log({ repurchaseData });




    // const brands = selectedOptions.map(brands => brands.value);

    // if (isNaN(DurationOfTherapy)) {
    //     return res.status(400).json({ msg: "DurationOfTherapy must be a valid number" });
    // }

    // const dateFormat = new Date(DateOfPurchase);

    // const dateFormat = moment(DateOfPurchase, 'DD/MM/YYYY', true);
    // console.log({ dateFormat, DateOfPurchase });

    try {
        const patient = await PatientModel.findById({ _id: id });
        if (!patient) return res.status(400).json({ msg: "Patient not found" });



        repurchaseData.forEach(data => {
            const selectedBrand = data.selectedBrand ? data.selectedBrand.value : null;
            patient.Repurchase.push({
                DurationOfTherapy: data.durationOfTherapy,
                TotolCartiridgesPurchase: data.totalCartridgesPurchase,
                DateOfPurchase: new Date(data.dop),
                TherapyStatus: data.therapyStatus,
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

module.exports = {
    createPatients,
    getAllPatient,
    dataPushToPatient,
    getPaitentById,
    handleCreateBrands,
    getAllBrands,
    getPatinetBrands
}