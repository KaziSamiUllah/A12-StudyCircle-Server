require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

///////////////Middleware///////////////
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://study-circle-a12.web.app",
    "https://study-circle-a12.firebaseapp.com"],
  credentials: true,
  optionSuccessStatus: 200,
}));
app.use(express.json());

const verifyToken = (req, res, next) => {
  // console.log('ami middle')


  const token = req.headers.token;
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
      jwt.verify(token, process.env.TOKEN_SECRET, (err, decode) => {
          if (err) {
              console.log(err)
             return res.status(401).send({ message: 'forbidden access' })
          }
          console.log(decode);
          req.user = decode
          next();
      })
  }
  console.log(token);


}






// Define a route
app.get("/", (req, res) => {
  res.send("Study Circle Sever is running!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
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
///////////JWT APIs//////////////////
// JWT Generate
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '365d' });
res.send( {token} )
})






    /////////////////Payment APIs///////////////////////
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, "amount inside the intent");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    /////////////////////user APIs////////////////////
    const userCollection = client.db("StudyCircle").collection("users");

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    app.get("/usersbyRole/:role", async (req, res) => {
      const role = req?.params?.role;
      console.log(role);
      const query = { role: role };
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });

    app.get("/allUsers", verifyToken, async (req, res) => {
      console.log(req.query.search);
      const searchItem = req.query.search;
      
      if (!!searchItem) {
        filter = {
          $or: [
            { name: { $regex: searchItem, $options: "i" } },
            { email: { $regex: searchItem, $options: "i" } }, 
          ],
        };
        const user = await userCollection.find(filter).toArray();
        res.send(user);
      }
      else{
        const user = await userCollection.find().toArray();
        res.send(user);
      }

      
    });

    app.put("/editUsers/:id", async (req, res) => {
      const data = req.body;
      const paramsId = req.params.id;
      console.log(data, paramsId);
      const filter = { _id: new ObjectId(paramsId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: data.newRole,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    ///////////////////sessions APIs/////////////////////

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

    app.get("/approvedSessions", async (req, res) => {
      const query = { status: "Approved" };
      const approved = await sessionCollection.find(query).toArray();
      res.send(approved);
    });

    app.get("/sessions/:email", async (req, res) => {
      const email = req.params.email;
      const query = { tutorEmail: email };
      const tutorSessions = await sessionCollection.find(query).toArray();
      res.send(tutorSessions);
    });

    app.get("/sessionsByStatus/:status", async (req, res) => {
      const status = req.params.status;
      // console.log(status);
      const query = { status: status };
      const sessionStatus = await sessionCollection.find(query).toArray();
      res.send(sessionStatus);
    });

    app.put("/updateSessions/:id", async (req, res) => {
      const data = req.body;
      const paramsId = req.params?.id;
      console.log(data, paramsId);
      const filter = { _id: new ObjectId(paramsId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: data.status,
          reason: data.reason || "",
          fee: data.fee || 0,
        },
      };
      const result = await sessionCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.put("/updateSessionFull/:id", async (req, res) => {
      const data = req.body;
      const paramsId = req.params?.id;
      console.log(data, paramsId);
      const filter = { _id: new ObjectId(paramsId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          sessionTitle: data.sessionTitle,
          tutorName: data.tutorName,
          tutorEmail: data.tutorEmail,
          sessionDescription: data.sessionDescription,
          regStart: data.regStart,
          regEnd: data.regEnd,
          classStart: data.classStart,
          classEnd: data.classEnd,
          status: data.status,
          lessons: data.lessons,
          fee: data.fee,
          duration: data.duration,
        },
      };
      const result = await sessionCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // app.patch("/updateSessions/:id", async (req, res) => {
    //   const data = req.body;
    //   const paramsId = req.params.id;
    //   console.log(data);
    //   const filter = { _id: new ObjectId(paramsId) };
    //   const options = { upsert: true };
    //   const updateDoc = {
    //     $push: {
    //       materials: data,
    //     },
    //   };

    //   const result = await sessionCollection.updateOne(
    //     filter,
    //     updateDoc,
    //     options
    //   );
    //   res.send(result);
    // });

    app.delete("/sessions/:id", async (req, res) => {
      const ID = req.params.id;
      console.log(ID);
      const query = { _id: new ObjectId(ID) };
      const result = await sessionCollection.deleteOne(query);
      res.send(result);
    });

    //////// Materials API/////////////
    const materialCollection = client.db("StudyCircle").collection("materials");

    app.post("/materials", async (req, res) => {
      const material = req.body;
      const result = await materialCollection.insertOne(material);
      res.send(result);
    });

    app.get("/materials", async (req, res) => {
      const result = await materialCollection.find().toArray();
      res.send(result);
    });

    app.get("/materials/:email", async (req, res) => {
      const email = req.params.email;
      const query = { tutorEmail: email };
      const tutorMaterials = await materialCollection.find(query).toArray();
      res.send(tutorMaterials);
    });

    app.get("/materialsbyID/:id", async (req, res) => {
      const ID = req.params.id;
      const query = { _id: new ObjectId(ID) };
      const material = await materialCollection.findOne(query);
      res.send(material);
    });

    app.put("/materials/:id", async (req, res) => {
      const data = req.body;
      const paramsId = req.params.id;
      // console.log(data, paramsId);
      const filter = { _id: new ObjectId(paramsId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          materialTitle: data.materialTitle,
          link: data.link,
          URL: data.URL,
        },
      };
      const result = await materialCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/materials/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await materialCollection.deleteOne(query);
      res.send(result);
    });

    ///////////////////Student related API//////////////////
    const bookingCollection = client.db("StudyCircle").collection("bookings");
    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      console.log(bookings);
      const result = await bookingCollection.insertOne(bookings);
      res.send(result);
    });

    app.get("/bookingsByEmail/:email", async (req, res) => {
      const email = req.params.email;
      const query = { StudentEmail: email };
      const tutorMaterials = await bookingCollection.find(query).toArray();
      res.send(tutorMaterials);
    });

    app.get("/bookedSessionMaterials/:email", async (req, res) => {
      const studentEmail = req.params.email;
      console.log(studentEmail);
      var pipeline = [
        {
          $match: {
            StudentEmail: studentEmail,
          },
        },

        {
          $lookup: {
            from: "materials",
            localField: "sessionID",
            foreignField: "sessionID",
            as: "materialsdata",
          },
        },

        {
          $unwind: "$materialsdata",
        },
        {
          $project: {
            _id: 0,
            materialTitle: "$materialsdata.materialTitle",
            tutorEmail: "$materialsdata.tutorEmail",
            tutorName: "$materialsdata.tutorName",
            sessionTitle: "$materialsdata.sessionTitle",
            sessionID: "$materialsdata.sessionID",
            link: "$materialsdata.link",
            URL: "$materialsdata.URL",
          },
        },
      ];

      // Execute the aggregation pipeline
      var result = await bookingCollection.aggregate(pipeline).toArray();
      console.log(result);
      res.send(result);
    });

    ///////////////////Notes /////////////////////////

    const noteCollection = client.db("StudyCircle").collection("notes");
    app.post("/notes", async (req, res) => {
      const note = req.body;
      const result = await noteCollection.insertOne(note);
      res.send(result);
    });

    app.get("/notes/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await noteCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/notesById/:id", async (req, res) => {
      const ID = req.params.id;

      const query = { _id: new ObjectId(ID) };
      const result = await noteCollection.findOne(query);
      res.send(result);
    });

    app.put("/updateNotes/:id", async (req, res) => {
      const data = req.body;
      const paramsId = req.params.id;

      const filter = { _id: new ObjectId(paramsId) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          noteTitle: data.noteTitle,
          noteDescription: data.noteDescription,
        },
      };
      const result = await noteCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/notesById/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await noteCollection.deleteOne(query);
      res.send(result);
    });

    //////////////////////reviews///////////////////////
    const reviewCollection = client.db("StudyCircle").collection("reviews");
    app.post("/reviews", async (req, res) => {
      const reviewData = req.body;
      // console.log(reviewData);
      const result = await reviewCollection.insertOne(reviewData);
      res.send(result);
      const reviewedSession = reviewData.sessionID.toString();
      if (result.acknowledged == true) {
        updateAverageRating(reviewedSession);
      }
    });

    app.get("/reviews/:sessionID", async (req, res) => {
      const sessionID = req.params.sessionID;
      // console.log(sessionID);
      const query = { sessionID: sessionID };
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    const updateAverageRating = async (reviewedSession) => {
      console.log(reviewedSession);

      const result = await reviewCollection
        .aggregate([
          { $match: { sessionID: reviewedSession } },
          {
            $group: {
              _id: "$sessionID",
              averageRating: { $avg: "$rating" },
            },
          },
        ])
        .toArray();
      console.log(result);

      if (result.length > 0) {
        const newAverageRating = result[0].averageRating.toFixed(2);
        const filter = { _id: new ObjectId(reviewedSession) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            rating: parseFloat(newAverageRating),
          },
        };
        const update = await sessionCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        console.log(update);

        // console.log(
        //   `Updated average rating for session ${reviewedSession} to ${newAverageRating}`
        // );
      }
    };

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
