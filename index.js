const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const apicache = require("apicache")
const { loggerMiddleware } = require("./Bucket/Logger");


dotenv.config();
app.use(cors());


app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
// testing
app.get('/', (req, res) => res.send("hello World"))

try {
    mongoose.connect(process.env.DATABASE, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true
    }).then(() => {
        console.log("Database connected To ATLAS");
    });
} catch (e) {
    console.error(e);
}


const mrRouter = require('./routes/mr');
const doctorRouter = require('./routes/doctor');
const patientRouter = require("./routes/patient");
const adminRouter = require("./routes/admin");
const tlmRouter = require("./routes/Tlm");
const slmRouter = require("./routes/Slm");
const flmRouter = require("./routes/Flm");


app.use('/api', mrRouter);
app.use('/api', doctorRouter);
app.use("/api", patientRouter);
app.use('/api', adminRouter);
app.use('/api', tlmRouter);
app.use('/api', slmRouter);
app.use('/api', flmRouter);


// Use loggerMiddleware before defining routes
app.use(loggerMiddleware);



app.listen(7000, () => {
    console.log("server is running at ", 7000)
})