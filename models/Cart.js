const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CartSchema = new Schema({
  email: { type: String, required: true },
  //trạng thái giỏ hàng
  status: { type: String, required: false, default: "Cart" },
  sessionId: { type: String, required: false },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      //số lượng
      quan: { type: Number, required: true },
    },
  ],
});
module.exports = mongoose.model("carts", CartSchema);
