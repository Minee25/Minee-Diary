const express = require("express");
const router = express.Router();
const controllers = require("../controllers/index");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", controllers.home);
router.get("/profile", authMiddleware, controllers.profile); 
router.get("/diary", authMiddleware, controllers.createDiary); 

module.exports = router;