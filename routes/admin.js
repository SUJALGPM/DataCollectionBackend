const express = require("express")
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

const { handleAdminCreateAccounts, handleAdminLogin, handleAdminReports, handleAdminSideDetailReports, handleSuperAdminCount, handleSuperAdminCreate, handleCreateContentAdmin, verifyJwtForClient, handleReportAdminCreate, handleAdminPatientWiseReports, handleDoctorWisePatientCount, handleMrAndPatientReports, handleDetailedReport, PrescriberReport, uplaodSheet, deleteCollection } = require('../controller/admin');
const { isAuthenticated } = require("../middleware/auth");


//Multer configure....
const ExcelDirectory = 'sheetFolder';

if (!fs.existsSync(ExcelDirectory)) {
    fs.mkdirSync(ExcelDirectory);
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, ExcelDirectory)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage }).single('file');



router.post("/admin-create-account", handleAdminCreateAccounts);
router.post("/admin-login", handleAdminLogin);
router.get("/admin-reports/:id", handleAdminReports);
router.get("/admin-mr-doctor-patients-reports/:id", handleAdminSideDetailReports);
router.post("/create-super-dc-admin", isAuthenticated, handleSuperAdminCount, handleSuperAdminCreate);
router.post("/create-content-dc-admin", isAuthenticated, handleCreateContentAdmin);
router.post("/create-report-dc-admin", isAuthenticated, handleReportAdminCreate);
router.get("/verify-jwt/:token", verifyJwtForClient);
router.get("/admin-patient-wise-reports", handleAdminPatientWiseReports);
router.get("/Doctor-Wise-Patient-Recruited-Count", handleDoctorWisePatientCount);
router.get("/Mr-And-Patient-Reports", handleMrAndPatientReports);
router.get("/Admin-Detailed-Reports", handleDetailedReport);
router.get("/Admin-Prescriber-Report", PrescriberReport);
router.post("/admin-upload/:id", upload, uplaodSheet);


module.exports = router

