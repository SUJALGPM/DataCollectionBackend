const tlmModel = require("../models/Tlm");
const slmModel = require("../models/Slm");
const flmModel = require("../models/Flm");

//Register Flm controller...
const flmRegister = async (req, res) => {
    try {
        const { ID, NAME, PASSWORD } = req.body;
        const flm = await flmModel.findOne({ ID: ID });

        const Id = req.params.id;
        const slm = await slmModel.findById({ _id: Id });

        if (flm) {
            return res.status(400).json({
                msg: "Flm Already Exists",
                success: false
            })
        }

        const format = {
            FLMEmpID: ID,
            BDMName: NAME,
            Password: PASSWORD
        }

        const newFlm = new flmModel(format);

        // Save the new MR to the database
        await newFlm.save();
        slm.Flm.push(newFlm._id);
        await slm.save();
        return res.status(201).json({
            msg: 'Flm created successfully',
            success: true,
            Flm: newFlm,
        });
    } catch (error) {
        const errMsg = error.message
        console.log("Error in flm Create..!!");
        return res.status(500).json({
            success: false,
            errMsg
        })
    }
}

//Login Flm controller....
const flmLogin = async (req, res) => {
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


module.exports = { flmRegister, flmLogin }