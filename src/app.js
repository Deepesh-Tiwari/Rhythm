const express = require('express');

const app = express();

// Response Handler
app.use("/test",(req, res) => {
    res.send("Hello from the server test page!!!");
})

app.use("/",(req, res) => {
    res.send("Hello from the server dashboard!!!");
})


app.listen(3000, () => {
    console.log("Server is listening on port 3000 .....");
});