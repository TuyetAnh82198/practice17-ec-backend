const ProductModel = require("../models/Product.js");

//hàm trả về danh sách sản phẩm
const getProducts = async (req, res) => {
  try {
    const pds = await ProductModel.find({});
    res.status(200).json({ result: pds });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm trả về danh sách sản phẩm dựa vào loại đồ uống (phân trang mỗi trang 9 sản phẩm)
const getProductsByType = async (req, res) => {
  try {
    const type = req.params.type;
    if (type === "all") {
      const pds = await ProductModel.find({});
      const page = req.params.page;
      const result = pds.slice((page - 1) * 9, page * 9);
      return res
        .status(200)
        .json({ result: result, totalPages: Math.ceil(pds.length / 9) });
    } else if (type === "soft-drinks") {
      const pds = await ProductModel.find({ type: "Soft Drinks" });
      const page = req.params.page;
      const result = pds.slice((page - 1) * 9, page * 9);
      return res
        .status(200)
        .json({ result: result, totalPages: Math.ceil(pds.length / 9) });
    } else if (type === "juices") {
      const pds = await ProductModel.find({ type: "Juices" });
      const page = req.params.page;
      const result = pds.slice((page - 1) * 9, page * 9);
      return res
        .status(200)
        .json({ result: result, totalPages: Math.ceil(pds.length / 9) });
    } else if (type === "teas") {
      const pds = await ProductModel.find({ type: "Teas" });
      const page = req.params.page;
      const result = pds.slice((page - 1) * 9, page * 9);
      return res
        .status(200)
        .json({ result: result, totalPages: Math.ceil(pds.length / 9) });
    } else if (type === "dairy-drinks") {
      const pds = await ProductModel.find({ type: "Dairy Drinks" });
      const page = req.params.page;
      const result = pds.slice((page - 1) * 9, page * 9);
      return res
        .status(200)
        .json({ result: result, totalPages: Math.ceil(pds.length / 9) });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};
//hàm trả về danh sách sản phẩm dựa vào brand (phân trang mỗi trang 9 sản phẩm)
const getProductsByBrand = async (req, res) => {
  try {
    const brand = req.params.brand;
    if (brand.trim().length !== 0) {
      const pds = await ProductModel.find({
        name: {
          $regex: brand,
          $options: "i",
        },
      });
      // console.log(pds);
      const page = req.params.page;
      const result = pds.slice((page - 1) * 9, page * 9);
      return res
        .status(200)
        .json({ result: result, totalPages: Math.ceil(pds.length / 9) });
    } else {
      const pds = await ProductModel.find({});
      const page = req.params.page;
      const result = pds.slice((page - 1) * 9, page * 9);
      return res
        .status(200)
        .json({ result: result, totalPages: Math.ceil(pds.length / 9) });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

//hàm trả về thông tin chi tiết của sản phẩm và danh sách sản phẩm cùng chung danh mục
const getDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const pd = await ProductModel.findOne({ _id: id });
    if (pd) {
      const pds = await ProductModel.find({
        type: pd.type,
        _id: { $ne: pd._id },
      });
      return res.status(200).json({ pd, pds });
    } else {
      return res.status(400).json({ message: "Found no" });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

module.exports = {
  getProducts,
  getProductsByType,
  getProductsByBrand,
  getDetail,
};
