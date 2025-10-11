const adminChecker = (req, res, next) => {
    console.log("The admin auth is getting Checked");
    const authToken = "xyz";
    const isAdminAuthorized = authToken==="xyz";

    if(!isAdminAuthorized){
        res.status(401).send("Unauthorized access is not allowed");
    }
    next();
}

const userChecker = (req, res, next) => {
    console.log("The admin auth is getting Checked");
    const authToken = "xyz";
    const isAdminAuthorized = authToken==="xyz";

    if(!isAdminAuthorized){
        res.status(401).send("Unauthorized access is not allowed");
    }
    next();
}

module.exports = { adminChecker, userChecker };