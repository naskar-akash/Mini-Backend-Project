const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userModel = require("./models/user");
const postModel = require("./models/post");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;

mongoose
  .connect("mongodb://localhost:27017/miniproject")
  .then(() => {
    console.log("MongoDB connected!");
  })
  .catch((err) => {
    console.log("MongoDB connection error! ", err);
  });

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Middleware for protected routing
const isLogged = (req, res, next) => {
  if (req.cookies.token === "") return res.redirect("/login");
  else{
    let data = jwt.verify(req.cookies.token, "secret")
    req.user = data;
    next();
  }
};

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLogged, async (req, res) => {
  let user = await userModel.findOne({email: req.user.email}).populate("posts")
  res.render("profile", {user})
})

app.get("/like/:id", isLogged, async (req, res) => {
  let post = await postModel.findOne({_id: req.params.id}).populate("user")
  if (!post.likes.includes(req.user.userid)) {
    post.likes.push(req.user.userid)
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
  }
  await post.save()
  res.redirect("/profile")
})

app.get("/edit/:id", isLogged, async (req, res) => {
  let post = await postModel.findOne({_id: req.params.id}).populate("user")
  res.render("edit",{post})
})

app.get("/delete/:id", isLogged, async (req, res) => {
  await postModel.findOne({_id: req.params.id})
  await postModel.findOneAndDelete({_id: req.params.id})
  res.redirect("/profile")
})

app.post("/register", async (req, res) => {
  let { username, name, email, age, password } = req.body;

  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User has already registered!");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        name,
        email,
        age,
        password: hash,
      });
      const token = jwt.sign({ email: email, userid: user._id }, "secret");
      res.cookie("token", token);
      res.send("registered!");
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send("Something went wrong");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      const token = jwt.sign({ email: email, userid: user._id }, "secret");
      res.cookie("token", token);
      res.status(500).redirect("/profile");
    } else {
      res.redirect("/login");
    }
  });
});

app.post("/posts", isLogged, async (req, res) => {
  let user = await userModel.findOne({email: req.user.email})
  let {content} = req.body;

  let post = await postModel.create({
    user: user._id,
    content
  })
  user.posts.push(post._id)
  await user.save()
  res.redirect("/profile")
})

app.post("/update/:id", isLogged, async (req, res) => {
  await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content})
  res.redirect("/profile")
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
