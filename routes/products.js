const express = require("express");

const {
  getProducts,
  getProductsByType,
  getProductsByBrand,
  getDetail,
} = require("../controllers/products.js");

const route = express.Router();

route.get("/get-top-8", getProducts);
route.get("/get/type/:type/:page", getProductsByType);
route.get("/get/brand/:brand/:page", getProductsByBrand);
route.get("/detail/:id", getDetail);

module.exports = route;
