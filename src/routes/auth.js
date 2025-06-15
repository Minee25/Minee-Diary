const router = require("express").Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/signin", authController.signin);
router.get("/signup", authController.signup);

router.post("/signup", authController.signupPost);
router.post("/signin", authController.signinPost);
router.post("/sign-out", authController.logout);
router.put("/change-password", authMiddleware, authController.changePassword);
router.put("/change-display-name", authMiddleware, authController.changeDisplayName);

module.exports = router;