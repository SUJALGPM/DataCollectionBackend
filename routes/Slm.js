const express = require('express');
const router = express.Router();
const multer = require("multer");
const { slmRegister, slmLogin } = require('../controller/Slm');

//SLM register route.....
router.post("/slm-create/:id", slmRegister);

//SLM Login route....
router.get("/slm-login", slmLogin);



module.exports = router;