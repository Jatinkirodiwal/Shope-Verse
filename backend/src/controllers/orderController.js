const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, taxPrice = 0, shippingPrice = 0 } = req.body;

    if (!shippingAddress || !paymentMethod) {
      res.status(400);
      throw new Error("Shipping address and payment method are required");
    }

    let items = orderItems;

    if (!items || items.length === 0) {
      const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        res.status(400);
        throw new Error("No order items provided and cart is empty");
      }

      items = cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity
      }));
    }

    const orderProducts = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product || item.productId);
        if (!product) {
          res.status(404);
          throw new Error("Product not found");
        }

        const quantity = Number(item.quantity);
        if (!quantity || quantity < 1) {
          res.status(400);
          throw new Error("Each order item needs a quantity of at least 1");
        }

        if (quantity > product.stock) {
          res.status(400);
          throw new Error(`${product.name} does not have enough stock`);
        }

        const price = product.discountPrice > 0 ? product.discountPrice : product.price;
        return {
          product,
          quantity,
          price
        };
      })
    );

    const normalizedItems = orderProducts.map(({ product, quantity, price }) => ({
      product: product._id,
      name: product.name,
      quantity,
      price,
      image: product.images[0] ? product.images[0].url : ""
    }));

    const itemsPrice = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalPrice = itemsPrice + Number(taxPrice) + Number(shippingPrice);

    const order = await Order.create({
      user: req.user._id,
      customer: req.user._id,
      orderItems: normalizedItems,
      products: normalizedItems,
      shippingAddress,
      paymentMethod,
      orderStatus: "confirmed",
      status: "confirmed",
      taxPrice,
      shippingPrice,
      totalPrice,
      totalAmount: totalPrice
    });

    await Promise.all(
      orderProducts.map(({ product, quantity }) => {
        product.stock = Math.max(product.stock - quantity, 0);
        return product.save();
      })
    );

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const allowedOrderStatuses = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled", "return", "returned"];
    const allowedPaymentStatuses = ["pending", "paid", "unpaid", "failed", "refunded"];
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    if (orderStatus) {
      if (!allowedOrderStatuses.includes(orderStatus)) {
        res.status(400);
        throw new Error("Invalid order status");
      }
      order.orderStatus = orderStatus;
      order.status = orderStatus;
      if (orderStatus === "delivered") {
        order.deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        res.status(400);
        throw new Error("Invalid payment status");
      }
      order.paymentStatus = paymentStatus;
    }

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
