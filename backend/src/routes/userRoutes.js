const express = require("express");
const {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser
} = require("../controllers/userController");
const { admin } = require("../middleware/adminMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, admin, getAllUsers);
router
  .route("/:id")
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;
