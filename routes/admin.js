const express = require("express")
const router = express.Router();
const multer = require('multer');
const fs = require('fs');

const { handleAdminCreateAccounts, handleAdminLogin, handleAdminReports, handleAdminSideDetailReports, handleSuperAdminCount, handleSuperAdminCreate, handleCreateContentAdmin, verifyJwtForClient, handleReportAdminCreate, handleAdminPatientWiseReports, handleDoctorWisePatientCount, handleMrAndPatientReports, handleDetailedReport, PrescriberReport, uplaodSheet, deleteCollection, handleCreateBrands, adminMrList, adminDoctorList, admingetMrId, adminPatientList, admingetDoctorId, adminDetailDurationWise, adminMRdurationReport, adminBranchDetailReport, adminPatientDurationReport, adminMrPatientDurationReport } = require('../controller/admin');
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


{/****************************************  ALL-POST-REQUEST  ****************************************/ }
router.post("/admin-create-account", handleAdminCreateAccounts);
router.post("/admin-login", handleAdminLogin);
router.post("/create-super-dc-admin", isAuthenticated, handleSuperAdminCount, handleSuperAdminCreate);
router.post("/create-content-dc-admin", isAuthenticated, handleCreateContentAdmin);
router.post("/create-report-dc-admin", isAuthenticated, handleReportAdminCreate);
router.post("/admin-upload/:id", upload, uplaodSheet);
router.post("/create-brands", handleCreateBrands);



{/****************************************  ALL-GET-REQUEST  ****************************************/ }
router.get("/admin-reports/:id", handleAdminReports);
router.get("/admin-mr-doctor-patients-reports/:id", handleAdminSideDetailReports);
router.get("/verify-jwt/:token", verifyJwtForClient);
router.get("/admin-patient-wise-reports", handleAdminPatientWiseReports);
router.get("/Doctor-Wise-Patient-Recruited-Count", handleDoctorWisePatientCount);
router.get("/Mr-And-Patient-Reports", handleMrAndPatientReports);
router.get("/Admin-Detailed-Reports", handleDetailedReport);
router.get("/Admin-Prescriber-Report", PrescriberReport);
router.get("/admin-mr-list/:id", adminMrList);
router.get("/admin-mr-Data/:id", admingetMrId);
router.get("/admin-doctor-list/:id", adminDoctorList);
router.get("/admin-doctor-Data/:id", admingetDoctorId);
router.get("/admin-patient-list/:id", adminPatientList);
router.get("/admin-mrDetail-duration/:id", adminMRdurationReport);
router.get("/admin-branch-patient-duration/:id", adminPatientDurationReport);
router.get("/admin-combine-mr-patient-duration/:id", adminMrPatientDurationReport);
router.get("/admin-branch-detail-report/:id", adminBranchDetailReport);





module.exports = router

