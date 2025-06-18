const router = require("express").Router();
const authController = require("../controllers/authController");
const { authMiddleware, isAuthenticated } = require("../middleware/authMiddleware");

router.get("/auth/signin", isAuthenticated, authController.signin);
router.get("/auth/signup", isAuthenticated, authController.signup);

router.post("/auth/signup", isAuthenticated, authController.signupPost);
router.post("/auth/signin", isAuthenticated, authController.signinPost);
router.post("/auth/sign-out", isAuthenticated, authController.logout);
router.put("/auth/change-password", authMiddleware, authController.changePassword);
router.put("/auth/change-display-name", authMiddleware, authController.changeDisplayName);

module.exports = router;