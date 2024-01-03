const express = require("express");
const { body } = require("express-validator");

const {
  signUp,
  login,
  checkLogin,
  logout,
} = require("../controllers/users.js");

const route = express.Router();

route.post(
  "/sign-up",
  [
    body("fullName")
      .trim()
      .notEmpty()
      .withMessage("Full name cannot be empty!"),
    body("email").isEmail().withMessage("Please enter a valid email!"),
    body("pass")
      .trim()
      .notEmpty()
      .withMessage("Password cannot be empty!")
      .isLength({ min: 8 })
      .withMessage("Password must be more than 8 characters"),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number cannot be empty!"),
  ],
  signUp
);
route.post(
  "/login",
  [
    body("email").trim().notEmpty().withMessage("Email cannot be empty!"),
    body("pass").trim().notEmpty().withMessage("Password cannot be empty!"),
  ],
  login
);
route.get("/check-login", checkLogin);
route.get("/logout", logout);

module.exports = route;
