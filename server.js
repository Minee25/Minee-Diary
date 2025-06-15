require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const app = express();
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const { setUserLocals } = require("./src/middleware/setUserLocals")

const port = process.env.PORT || 8000;

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

// Routes
app.use("/", require("./src/routes/index"));
app.use("/", require("./src/routes/auth"));

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});