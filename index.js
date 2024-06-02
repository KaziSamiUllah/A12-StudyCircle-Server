require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.unfglor.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
      no;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    ///////////////////sessions and materials APIs/////////////////////

    const sessionCollection = client.db("StudyCircle").collection("sessions");

    app.post("/sessions", async (req, res) => {
      const session = req.body;
      const result = await sessionCollection.insertOne(session);
      res.send(result);
    });

    app.get("/sessions", async (req, res) => {
      const data = sessionCollection.find();
      const result = await data.toArray();
      res.send(result);
    });

    app.get("/sessionsdata/:id", async (req, res) => {
      const ID = req.params.id;
      const query = { _id: new ObjectId(ID) };
      const sessionData = await sessionCollection.findOne(query);
      res.send(sessionData);
    });

    app.get("/sessions/:email", async (req, res) => {
      const email = req.params.email;
      const query = { tutorEmail: email };
      const tutorSessions = await sessionCollection.find(query).toArray();
      res.send(tutorSessions);
    });

    app.put("/updateSessions/:id", async (req, res) => {
      const data = req.body;
      const paramsId = req.params.id;
      console.log(data);
      const filter = { _id: new ObjectId(paramsId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          materials: {
            "materialTitle": data.materialTitle,
            "link": data.link,
            "URL": data.URL,
          },
        },
      };
      const result = await sessionCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/sessions/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sessionCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
