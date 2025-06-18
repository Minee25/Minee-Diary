require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const app = express();
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const { setUserLocals } = require("./src/middleware/setUserLocals")

const port = process.env.PORT || 8000;

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Check token and set user data for all routes
app.use(setUserLocals);

// Layout
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Make upload middleware available to routes
app.locals.upload = upload;

// Routes
app.use("/", require("./src/routes/index"));
app.use("/", require("./src/routes/auth"));

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});