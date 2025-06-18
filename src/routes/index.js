const express = require("express");
const router = express.Router();
const controllers = require("../controllers/index");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", controllers.home);
router.get("/profile", authMiddleware, controllers.profile);
router.get("/diary", authMiddleware, controllers.createDiary);
router.post("/diary", authMiddleware, (req, res, next) => {
  const upload = req.app.locals.upload;
  upload.single('logo')(req, res, next);
}, controllers.createDiary);
router.post("/memory", authMiddleware, (req, res, next) => {
  // Get upload middleware from app locals
  const upload = req.app.locals.upload;
  upload.single('image')(req, res, next);
}, controllers.addMemory);
router.post("/memory/:memoryId/like", controllers.likeMemory);
router.get("/:id", controllers.showDiary);

module.exports = router;