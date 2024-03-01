const express = require("express")
const router = express.Router();

const { createPatients, getAllPatient, dataPushToPatient, getPaitentById, handleCreateBrands, getAllBrands, getPatinetBrands } = require("../controller/patient");

router.post('/create-patient/:id', createPatients);
router.get('/get-all-patients', getAllPatient);
router.put('/update-patient-repurchase/:id', dataPushToPatient);


router.get("/get-patient-by-id/:id", getPaitentById);



// create - brands
router.post("/create-brands", handleCreateBrands);

router.get("/get-all-brands", getAllBrands);


router.get("/get-patient-only-brands/:id", getPatinetBrands);





module.exports = router;