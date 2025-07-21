const multer = require("multer");
const crypto = require("crypto")
const path = require("path")

// Set up diskstorage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, (err,name) => {
      if(err) return console.log(err)
        const fn = name.toString("hex") + path.extname(file.originalname);
        cb(null, fn)
    })
  }
})

// export upload variables
const upload = multer({ storage: storage })
module.exports = upload;