const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK);
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
    const reportedCollection = client.db("mobileDB").collection("reported");
    const advertiseCollection = client.db("mobileDB").collection("advertise");
    const paymentCollection = client.db("mobileDB").collection("payment");
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
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };

      const updateStatus = {
        $set: {
          verify: true,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateStatus,
        option
      );

      res.send(result);
    });
    app.get("/users/sellers", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      const result = users.filter((user) => user?.userType === "Seller");
      res.send(result);
    });
    app.get("/users/buyers", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      const result = users.filter((user) => user?.userType === "Buyer");
      res.send(result);
    });
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
    app.post("/reported", async (req, res) => {
      const product = req.body;
      const result = await reportedCollection.insertOne(product);
      res.send(result);
    });
    app.get("/reported", async (req, res) => {
      const query = {};
      const result = await reportedCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/reported/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const query = { _id: id };
      const result = await productsCollection.deleteOne(filter);
      const update = await reportedCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/booking", async (req, res) => {
      const product = req.body;
      const result = await bookingsCollection.insertOne(product);
      res.send(result);
    });
    app.post("/payment", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      const id = payment.paymentId;
      const filter = { bookingId: id };
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
        },
      };
      const updatePhone = await bookingsCollection.updateOne(filter, updateDoc);
      const updateResult = await productsCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.get("/booking", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = bookingsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.findOne(query);
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.userType === "Admin" });
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`this app running in ${port}`);
});
