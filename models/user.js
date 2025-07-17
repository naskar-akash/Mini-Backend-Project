const mongoose = require("mongoose")
const { Schema } = mongoose;

const userSchema = new Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    posts: [
        {type: mongoose.Schema.Types.ObjectId, ref: "post"}
    ]
});
module.exports = mongoose.model('user', userSchema);