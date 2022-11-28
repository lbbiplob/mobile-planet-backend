const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Server is running");
});

const uri =
  "mongodb+srv://mobileDB:04iWjrtn97tU0h9Q@cluster0.b0rbg8o.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const usersCollection = client.db("mobileDB").collection("users");
    const categoriesCollection = client.db("mobileDB").collection("categories");
    const productsCollection = client.db("mobileDB").collection("products");
    const bookingsCollection = client.db("mobileDB").collection("bookings");
    const advertiseCollection = client.db("mobileDB").collection("advertise");
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: " " });
    });
    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoriesCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = {};
      const data = await productsCollection.find(query).toArray();
      const result = data.filter((product) => product.categoryId === id);
      console.log(result);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
    app.post("/booking", async (req, res) => {
      const product = req.body;
      const result = await bookingsCollection.insertOne(product);
      res.send(result);
    });
    app.get("/products", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const status = req.body.status;
      const option = { upsert: true };
      const updateStatus = {
        $set: {
          status,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateStatus,
        option
      );
    });
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });
    // app.get("/products/:id", async (req, res) => {
    //   const id = req.query.id;
    //   const query = { id };
    //   const products = productsCollection.find(email);
    //   const result = await products.toArray();
    //   res.send(result);
    // });
    // app.post("/advertise", async (req, res) => {
    //   const user = req.body;
    //   const result = await advertiseCollection.insertOne(user);
    //   res.send(result);
    // });
    // app.get("/advertise", async (req, res) => {
    //   const query = {};
    //   const cursor = advertiseCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.userType === "Seller" });
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`this app running in ${port}`);
});
