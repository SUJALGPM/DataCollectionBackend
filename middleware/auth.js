const jwt = require("jsonwebtoken")
const SECRET = process.env.SECRET


// This will take The Token  and validate the process
const isAuthenticated = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, SECRET, (err, decodedToken) => {
                console.log(err);
                console.log(decodedToken);
                if (err) {
                    return res.sendStatus(403);
                }
                if (!decodedToken) {
                    return res.sendStatus(403);
                }
                if (typeof decodedToken === "string") {
                    return res.sendStatus(403);
                }
                req.headers['userId'] = decodedToken.id;
                req.headers['userRole'] = decodedToken.role;
                next();
            }); req
        }
        else {
            res.send(401)
        }

    } catch (error) {
        console.log(error)
        return res.json({ msg: "Internal Server Error" })
    }

}


module.exports = {
    isAuthenticated
}