const express = require('express');

const app = express();


// Response Handler
app.get("/user",(req, res) => {
    res.send("get call to user route");
})

// Response Handler
app.put("/user",(req, res) => {
    res.send("put call to user route");
})

// Response Handler
app.patch("/user",(req, res) => {
    res.send("patch call to user route");
})

// Response Handler
app.post("/user",(req, res) => {
    res.send("post call to user route");
})

// Response Handler
app.delete("/user",(req, res) => {
    res.send("delete call to user route");
})


// Response Handler
app.get("/test",(req, res) => {
    res.send({
        firstname: "Deepesh",
        lastname :"Tiwari"
    });
})

// Response Handler
app.use("/test",(req, res) => {
    res.send("Hello from the server test page!!!");
})


app.listen(3000, () => {
    console.log("Server is listening on port 3000 .....");
});