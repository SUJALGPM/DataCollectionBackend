const tlmModel = require("../models/Tlm");
const slmModel = require("../models/Slm");
const AdminModel = require("../models/admin");

//Register Slm controller...
const slmRegister = async (req, res) => {
    try {
        const { ID, NAME, PASSWORD } = req.body;
        const slm = await slmModel.findOne({ ID: ID });

        const Id = req.params.id;
        const admin = await AdminModel.findById({ _id: Id });

        if (slm) {
            return res.status(400).json({
                msg: "Slm Already Exists",
                success: false
            })
        }

        const format = {
            SLMEmpID: ID,
            ZBMName: NAME,
            Password: PASSWORD
        }

        const newSlm = new slmModel(format);

        // Save the new MR to the database
        await newSlm.save();
        admin.Slm.push(newSlm._id);
        await admin.save();
        return res.status(201).json({
            msg: 'Slm created successfully',
            success: true,
            Slm: newSlm,
        });
    } catch (error) {
        const errMsg = error.message
        console.log("Error in slm Create..!!");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}

//Login Slm controller....
const slmLogin = async (req, res) => {
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


module.exports = { slmRegister, slmLogin }