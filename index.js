require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// Use cors middleware
app.use(cors());
app.use(express.json());

// Define a route
app.get("/", (req, res) => {
  res.send("Study Circle Sever is running!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const uri =
  "mongodb+srv://samiullahsagor:QooUhDVx0kkvIN9q@cluster0.unfglor.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {


    /////////////////////user APIs////////////////////
    const usersCollection = client.db("StudyCircle").collection("users");

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });


///////////////////sessions and materials APIs/////////////////////

const sessionCollection = client.db("StudyCircle").collection("sessions");

app.post("/sessions", async (req, res) => {
  const session = req.body;
  console.log(session);
  const result = await sessionCollection.insertOne(session);
  res.send(result);
});

app.get("/sessions", async (req, res) => {
  const data = sessionCollection.find();
  const result = await data.toArray();
  res.send(result);
});



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
