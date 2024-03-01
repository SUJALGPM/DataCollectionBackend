const express = require('express');
const router = express.Router();
const multer = require("multer")

const { createMr, loginMr, getDoctorForThisMr, getAllMR, getMrById, UpdateMrMobileNumber, handleExcelSheetUpload, getMrDoctorSummary, getMrBrandSummary, getMrPatients, mrUpdatePatientStatus, mrAddNewBrand, mrGetDoctorBrandWise, mrGetDataBrandWise } = require('../controller/mr');

const upload = multer({ dest: 'uploads/' });

router.post("/create-mr/:id", createMr);
router.post("/login-mr", loginMr);
router.get("/get-mr-doctor/:id", getDoctorForThisMr);
router.get("/get-all-mr", getAllMR);
router.get("/get-mr-by-id/:mrId", getMrById);


router.put("/update-mr-mobile-number", UpdateMrMobileNumber);

router.post("/upload-mr-doctor-patients", upload.single('file'), handleExcelSheetUpload);

router.get("/get-mr-Doctor-brand/:id", getMrDoctorSummary);

router.get("/get-mr-brandwise/:id", getMrBrandSummary);

router.get("/get-mr-patients/:id", getMrPatients);

router.put("/change-patient-status/:mrID/:patientID", mrUpdatePatientStatus);

router.post("/add-new-brand-repurchase/:mrID/:patientID", mrAddNewBrand);

router.get("/get-mr-brandwise-data/:mrId", mrGetDataBrandWise);

router.get("/get-mr-doctor-brandwise/:mrId", mrGetDoctorBrandWise);

module.exports = router;