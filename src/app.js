const express = require('express');
const app = express();
const {adminChecker, userChecker} = require('./middlewares/authMiddleware')
const {connectDB } = require("./config/database")
const {User} = require('./models/user');

app.use(express.json());

app.post("/signUp", async(req, res) => {
    //console.log(req.body);
    const user = new User(req.body);

    try {
        await user.save();
        res.send("user created sucessfully");
    } catch (error) {
        res.status(400).send("Some Problem with server" + error.message);
    }

})

app.post("/getUser", async(req, res) => {
    const username = req.body.username;
    try {
        const user = await User.find({userName : username});
        if(user.length === 0){
            res.status(404).send("User Not Found")
        }
        res.send(user);
    } catch (error) {
        res.status(400).send("Some Problem with server" + error.message);
    }
})

app.get("/feed", async(req, res) => {
    try {
        const user = await User.find({});
        if(user.length === 0){
            res.status(404).send("User Not Found")
        }
        res.send(user);
    } catch (error) {
        res.status(400).send("Some Problem with server" +  error.message);
    }
})

app.patch("/updateUser", async(req, res) => {

    const data = req.body;
    const id = req.body.id;


    try {
        const user = await User.findByIdAndUpdate(id, data, { returnDocument: "before" , runValidators: true});
        res.send(user);
    } catch (error) {
        res.status(400).send("Some Problem with server" + error.message);
    }

})

app.delete("/deleteUser", async(req, res) => {

    const id = req.body.id;

    try {
        const user = await User.findOneAndDelete(id);
        res.send(user);
    } catch (error) {
        res.status(400).send("Some Problem with server" +  error.message);
    }

})


connectDB()
  .then(() => {
    console.log("✅ Database Connection established .....");
    app.listen(3000, () => {
        console.log("Server is listening on port 3000 .....");
    });
  })
  .catch((err) => {
    console.log("❌ Database Connection error ....." + err.message);
  });

