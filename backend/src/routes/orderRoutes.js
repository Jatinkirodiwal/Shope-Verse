const express = require("express");
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus
} = require("../controllers/orderController");
const { admin } = require("../middleware/adminMiddleware");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/admin/all", admin, getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id/status", admin, updateOrderStatus);

module.exports = router;
