const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const UserModel = require("../models/User.js");

//hàm xử lý việc đăng ký
const signUp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = [];
      errors.array().forEach((err) => errs.push(err.msg));
      return res.status(400).json({ errs: errs });
    } else {
      const existingUser = await UserModel.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ errs: [], msg: "User existing!" });
      } else {
        const newUser = new UserModel({
          ...req.body,
          pass: bcrypt.hashSync(req.body.pass, 8),
        });
        await newUser.save();
        const transport = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "tailieu22072023@gmail.com",
            pass: process.env.SENDING_MAIL_PASS,
          },
        });
        await transport.sendMail({
          from: "tailieu22072023@gmail.com",
          to: req.body.email,
          subject: "Sign up successful",
          html: `<h5>
              Congratulations! Your account registration was successful. You are
              now a member of our website. Enjoy a delightful shopping
              experience!
            </h5>`,
        });
        return res.status(201).json({ errs: [], msg: "Created!" });
      }
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm xử lý việc đăng nhập
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = [];
      errors.array().forEach((err) => errs.push(err.msg));
      return res.status(400).json({ errs: errs });
    } else {
      const existingUser = await UserModel.findOne({ email: req.body.email });

      if (!existingUser) {
        return res
          .status(400)
          .json({ errs: [], msg: "Wrong email or password!" });
      } else {
        const correctPass = bcrypt.compareSync(
          req.body.pass,
          existingUser.pass
        );
        if (!correctPass) {
          return res
            .status(400)
            .json({ errs: [], msg: "Wrong email or password!" });
        } else {
          existingUser.pass = undefined;
          req.session.user = existingUser;
          return res.status(400).json({ errs: [], msg: "You are logged in!" });
        }
      }
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm kiểm tra người dùng đã đăng nhập chưa
const checkLogin = (req, res) => {
  try {
    // console.log(req.session.user);
    if (req.session.user) {
      return res.status(200).json({
        msg: "You are logged in.",
        fullName: req.session.user.fullName,
      });
    } else {
      return res.status(400).json({ msg: "Have not been logged in yet." });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm xử lý việc đăng xuất
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(400).json({ err: err.message });
    } else {
      res.clearCookie("connect.sid");
      return res.status(200).json({ msg: "You are logged out." });
    }
  });
};

module.exports = { signUp, login, checkLogin, logout };
