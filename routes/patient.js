const express = require("express")
const router = express.Router();

const { createPatients, getAllPatient, dataPushToPatient, getPaitentById, handleCreateBrands, getAllBrands, getPatinetBrands, singlePatientFullDetails } = require("../controller/patient");

router.post('/create-patient/:id', createPatients);
router.get('/get-all-patients', getAllPatient);
router.put('/update-patient-repurchase/:id', dataPushToPatient);
router.get("/get-patient-by-id/:id", getPaitentById);
router.post("/create-brands", handleCreateBrands);
router.get("/get-all-brands", getAllBrands);
router.get("/get-patient-only-brands/:id", getPatinetBrands);
router.get("/single-patient-full-detail/:id", singlePatientFullDetails);


module.exports = router;