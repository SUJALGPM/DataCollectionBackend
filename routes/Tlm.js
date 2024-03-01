const express = require('express');
const router = express.Router();
const multer = require("multer");
const { tlmRegister, tlmLogin } = require('../controller/Tlm');

//TLM register route.....
router.post("/tlm-create/:id", tlmRegister);

//TLM Login route....
router.get("/tlm-login", tlmLogin);



module.exports = router;