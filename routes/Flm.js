const express = require('express');
const router = express.Router();
const multer = require("multer");
const { flmRegister, flmLogin } = require('../controller/Flm');

//FLM register route.....
router.post("/flm-create/:id", flmRegister);

//FLM Login route....
router.get("/flm-login", flmLogin);



module.exports = router;