const tlmModel = require('../models/Tlm');
const AdminModel = require("../models/admin");

//Register Tlm controller...
const tlmRegister = async (req, res) => {
    try {
        const { ID, NAME, PASSWORD } = req.body;
        const tlm = await tlmModel.findOne({ ID: ID });
        const Id = req.params.id;
        const admin = await AdminModel.findById({ _id: Id });

        if (tlm) {
            return res.status(400).json({
                msg: "Tlm Already Exists",
                success: false
            })
        }

        const format = {
            TLMEmpID: ID,
            TLMName: NAME,
            Password: PASSWORD
        }

        const newTlm = new tlmModel(format);

        // Save the new MR to the database
        await newTlm.save();
        admin.Tlm.push(newTlm._id);
        await admin.save();
        return res.status(201).json({
            msg: 'Tlm created successfully',
            success: true,
            tlm: newTlm,
        });
    } catch (error) {
        const errMsg = error.message
        console.log("Error in Tlm Create..!!");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}

//Login Tlm controller....
const tlmLogin = async (req, res) => {
    try {
        const { ID, PASSWORD } = req.body;
        const tlm = await tlmModel.findOne({ ID: ID });
        if (!tlm) {
            return res.status(400).json({
                msg: "Tlm not Found",
                success: false
            })
        } else {
            if (PASSWORD == tlm.PASSWORD) {
                tlm.loginLogs.push({
                    timestamp: new Date(),
                    cnt: tlm.loginLogs.length + 1
                });
                await tlm.save();
                return res.status(200).json({
                    msg: "Login Done",
                    success: true,
                    tlm
                })
            } else {
                return res.status(400).json({
                    msg: "Password is not correct",
                    success: false
                })
            }
        }
    }
    catch (error) {
        const errMsg = error.message
        console.log("Error in loginTlm");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}

module.exports = { tlmRegister, tlmLogin };