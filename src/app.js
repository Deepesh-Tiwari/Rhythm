const express = require('express');

const app = express();


// app.use("/user", (req, res) => {
//     console.log("the req just hangs up when you send nothing !!!")
// })

app.use("/", (req, res, next) => {
    console.log("this is the first middleware !!!");
    next();
});

// Response Handler
// ans multiple response handler
app.get(
    "/user",
    // OKAY !! This is not a request handler now 
    // as we are not sending response here it is not request handler
    // it is executing before a req handler and it is middleware
    [(req, res, next) => {
        //res.send("get call to user route first res handler");
        console.log("handling using first res handler");
        next();
    },
    (req, res, next) => {
        console.log("handling using second res handler");
        //res.send("get call to user route second res handler");
        next();
    },
    (req, res, next) => {
        console.log("handling using third res handler");
        //res.send("get call to user route third res handler");
        next();
    }],
    (req, res, next) => {
        console.log("handling using fourth res handler");
        res.send("get call to user route fourth res handler");
        //next();
    }
)

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