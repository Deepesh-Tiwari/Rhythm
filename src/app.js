const express = require('express');
const app = express();
const {adminChecker, userChecker} = require('./middlewares/authMiddleware')


// app.use("/user", (req, res) => {
//     console.log("the req just hangs up when you send nothing !!!")
// })

app.use("/admin", adminChecker)

app.get("/user", userChecker, (req, res) => {
    
    res.send("user data sent");
});

app.get("/admin/getAllData", (req, res) => {
    
    res.send("ALL THE DATA TO ADMIN");
});

app.get("/admin/deleteAUser", (req, res) => {
    
    res.send("USER IS DELETED");
});



app.listen(3000, () => {
    console.log("Server is listening on port 3000 .....");
});