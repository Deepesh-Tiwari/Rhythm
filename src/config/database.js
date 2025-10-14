const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect("mongodb+srv://admin:PG7pb5RZ8ZdI9tiF@nodeapi.sfntguc.mongodb.net/Rhythm");
};

module.exports = {connectDB}
