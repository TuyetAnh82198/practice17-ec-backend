const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const store = new MongoDBStore({
  uri: `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.o8ckbff.mongodb.net/?retryWrites=true&w=majority`,
  databaseName: "test",
  collection: "sessions",
});
const helmet = require("helmet");
const compression = require("compression");

const products = require("./routes/products.js");
const users = require("./routes/users.js");
const isAuth = require("./middleware/isAuth.js");
const cart = require("./routes/cart.js");

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_APP);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(helmet());
app.use(compression());
app.use(express.static(path.join(__dirname, "./public/imgs")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: [process.env.CLIENT_APP, process.env.ADMIN_APP],
    default: process.env.CLIENT_APP,
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "Lax",
    },
  })
);

app.use("/products", products);
app.use("/users", users);
app.use("/cart", cart);
app.use((req, res) => {
  return res.redirect("http://localhost:3000/123");
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.o8ckbff.mongodb.net/test?retryWrites=true&w=majority`
  )
  .then((result) => {
    const io = require("./socket.js").init(
      app.listen(process.env.PORT || 5000)
    );

    io.on("connection", (socket) => {
      socket.on("frontend send messages", (data) => {
        // console.log(data);
        io.emit("server send messages", data);
      });

      socket.on("end chat", (roomId) => {
        io.emit("server send roomId to end chat", roomId);
      });
    });
  })
  .catch((err) => console.log(err));
