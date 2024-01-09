const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const CartModel = require("../models/Cart.js");
const UserModel = require("../models/User.js");
const io = require("../socket.js");

//hàm thêm sản phẩm vào giỏ hàng trong cơ sở dữ liệu
const addToCart = async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    const cart = await CartModel.findOne({
      email: userEmail,
      status: "Cart",
    });
    // console.log(cart);
    if (!cart) {
      const newCart = new CartModel({
        email: userEmail,
        products: [
          {
            productId: req.body.productId,
            quan: req.body.quan,
          },
        ],
      });
      await newCart.save();
    } else {
      const existingProductIndex = cart.products.findIndex(
        (pd) => pd.productId.valueOf() === req.body.productId
      );
      //   console.log(existingProductIndex);
      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quan = req.body.quan;
        await CartModel.updateOne(
          {
            email: userEmail,
            status: "Cart",
          },
          {
            products: cart.products,
          }
        );
      } else if (existingProductIndex === -1) {
        cart.products.push({ ...req.body });
        await CartModel.updateOne(
          {
            email: userEmail,
            status: "Cart",
          },
          {
            products: cart.products,
          }
        );
      }
    }
    const result = await CartModel.findOne({
      email: userEmail,
      status: "Cart",
    });
    // console.log(result);
    io.getIO().emit("cart", { action: "add", addResult: result.products });
    return res.status(201).json({ msg: "Added!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm lấy danh sách sản phẩm trong giỏ hàng
const getCart = async (req, res) => {
  try {
    const cart = await CartModel.findOne({
      email: req.session.user.email,
      status: "Cart",
    }).populate("products.productId");
    // console.log(cart);
    return res.status(200).json({ result: cart ? cart.products : [] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm cập nhật số lượng sản phẩm trong giỏ hàng
const updateQuan = async (req, res) => {
  try {
    if (req.params.action === "desc") {
      await CartModel.updateOne(
        {
          email: req.session.user.email,
          status: "Cart",
          "products._id": req.params.id,
        },
        {
          $inc: {
            "products.$.quan": -1,
          },
        }
      );
    } else if (req.params.action === "inc") {
      await CartModel.updateOne(
        {
          email: req.session.user.email,
          status: "Cart",
          "products._id": req.params.id,
        },
        {
          $inc: {
            "products.$.quan": 1,
          },
        }
      );
    }
    const cart = await CartModel.findOne({
      email: req.session.user.email,
      status: "Cart",
    }).populate("products.productId");
    io.getIO().emit("cart", { action: "update", updatedResult: cart.products });
    return res.status(200).json({ msg: "updated!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm xóa sản phẩm ra khỏi giỏ hàng
const deleteItem = async (req, res) => {
  try {
    await CartModel.findOneAndUpdate(
      {
        email: req.session.user.email,
        status: "Cart",
      },
      {
        $pull: { products: { _id: req.params.id } },
      }
    );
    const cart = await CartModel.findOne({
      email: req.session.user.email,
      status: "Cart",
    }).populate("products.productId");
    io.getIO().emit("cart", { action: "delete", deleteResult: cart.products });
    return res.status(200).json({ msg: "deleted!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm xử việc việc thanh toán và cập nhật thông tin của khách hàng
const checkout = async (req, res) => {
  try {
    await UserModel.updateOne(
      {
        email: req.session.user.email,
      },
      { ...req.body }
    );
    const cart = await CartModel.findOne({
      email: req.session.user.email,
      status: "Cart",
    }).populate("products.productId");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Thanh toán hóa đơn ${cart._id}`,
            },
            unit_amount:
              (
                Number(
                  cart.products
                    .map((pd) => pd.productId.price * pd.quan)
                    .reduce((acc, eachPdTotal) => acc + eachPdTotal, 0)
                    .toFixed(2)
                ) + 7.95
              ).toFixed(2) * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_APP}/payment-success`,
      cancel_url: `${process.env.CLIENT_APP}/payment-cancel`,
    });
    await CartModel.updateOne(
      {
        email: req.session.user.email,
        status: "Cart",
      },
      { sessionId: session.id }
    );
    return res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm kiểm tra trạng thái thanh toán để cập nhật lại trạng thái đơn hàng
const checkPaymentStatus = async (req, res) => {
  const cart = await CartModel.findOne({
    email: req.session.user.email,
    status: "Cart",
  });
  if (cart) {
    const stripeSessionId = cart.sessionId;
    const stripeSession = await stripe.checkout.sessions.retrieve(
      stripeSessionId
    );
    // console.log(session.payment_status);
    if (stripeSession.payment_status === "paid") {
      await CartModel.updateOne(
        {
          email: req.session.user.email,
          status: "Cart",
        },
        { status: "Paid" }
      );
      io.getIO().emit("cart", { action: "paid", paid: 0 });
    }
  }
  return res.json({ msg: "Checked!" });
};
//hàm trả về lịch sử đơn hàng
const history = async (req, res) => {
  try {
    const cart = await CartModel.find({
      email: req.session.user.email,
      status: { $ne: "Cart" },
    }).populate("products.productId", "price");
    // console.log(cart);
    const userInfor = await UserModel.findOne({
      email: req.session.user.email,
    });
    return res.status(200).json({
      cart: cart.map((item) => {
        return { products: item.products, status: item.status, _id: item._id };
      }),
      user: {
        fullName: userInfor.fullName,
        address: userInfor.address,
        email: userInfor.email,
        phone: userInfor.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm cập nhật trạng thái đơn chưa được thanh toán
const updatePaymentStatus = async (req, res) => {
  try {
    await CartModel.updateOne(
      {
        email: req.session.user.email,
        status: "Cart",
      },
      { status: "Waiting for payment" }
    );
    io.getIO().emit("cart", { action: "paid", paid: 0 });
    return res.status(200).json({ msg: "Ordered!" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm trả về thông tin chi tiết đơn hàng và thông tin người dùng
const getOrderDetail = async (req, res) => {
  try {
    const order = await CartModel.findOne({
      email: req.session.user.email,
      status: { $ne: "Cart" },
      _id: req.params.id,
    }).populate("products.productId");
    // console.log(order);
    const userInfor = await UserModel.findOne({
      email: req.session.user.email,
    });
    return res.status(200).json({
      order: { products: order.products, status: order.status, _id: order._id },
      user: {
        _id: userInfor._id,
        fullName: userInfor.fullName,
        address: userInfor.address,
        email: userInfor.email,
        phone: userInfor.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateQuan,
  deleteItem,
  checkout,
  checkPaymentStatus,
  history,
  updatePaymentStatus,
  getOrderDetail,
};
