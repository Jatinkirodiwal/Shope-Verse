const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const runStartupMigrations = async () => {
  const [roleResult, blockedResult, productResult, orderResult] = await Promise.all([
    User.updateMany({ role: { $in: ["user", "vendor", null] } }, { $set: { role: "customer" } }),
    User.updateMany({ status: "blocked" }, { $set: { isBlocked: true } }),
    Product.updateMany(
      { $or: [{ status: { $exists: false } }, { imageUrl: { $exists: false } }] },
      [{ $set: { status: { $ifNull: ["$status", "active"] }, imageUrl: { $ifNull: ["$imageUrl", { $first: "$images.url" }] } } }]
    ),
    Order.updateMany(
      {
        $or: [
          { customer: { $exists: false } },
          { products: { $exists: false } },
          { totalAmount: { $exists: false } },
          { status: { $exists: false } }
        ]
      },
      [
        {
          $set: {
            customer: { $ifNull: ["$customer", "$user"] },
            products: { $cond: [{ $gt: [{ $size: { $ifNull: ["$products", []] } }, 0] }, "$products", "$orderItems"] },
            totalAmount: { $ifNull: ["$totalAmount", "$totalPrice"] },
            status: { $ifNull: ["$status", "$orderStatus"] }
          }
        }
      ]
    )
  ]);

  console.log(
    `Migrations complete: roles=${roleResult.modifiedCount}, blocked=${blockedResult.modifiedCount}, products=${productResult.modifiedCount}, orders=${orderResult.modifiedCount}`
  );
};

module.exports = runStartupMigrations;
