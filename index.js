const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const admin = require("firebase-admin");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zjved.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("service"));
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));


const port = 5000;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect((err) => {
  const serviceCollection = client.db("creative").collection("agency");
  const reviewCollection = client.db("creative").collection("review");
  const orderCollection = client.db("creative").collection("order");
  const adminCollection = client.db("creative").collection("admin");
  console.log("Connected");

  app.get("/services", (req, res) => {
    serviceCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });

  app.get("/reviews", (req, res) => {
    reviewCollection.find({}).toArray((err, docs) => {
      res.send(docs);
    });
  });

  app.post("/addUserOrder", (req, res) => {
    const events = req.body;
    orderCollection.insertOne(events).then((result) => {
      res.send(result.insertedCount);
    });
  });

  app.get("/userOrder", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            orderCollection
              .find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          } else {
            res.status(401).send("Unauthorized access");
          }
        })
        .catch(function (error) {
          res.status(401).send("Unauthorized access");
        });
    } else {
      res.status(401).send("Unauthorized access");
    }
  });

  app.post("/addReview", (req, res) => {
    const events = req.body;
    reviewCollection.insertOne(events).then((result) => {
      res.send(result.insertedCount);
    });
  });

  app.get("/orders", (req, res) => {
    orderCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });


  app.post('/addOrder', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const project = req.body.project;
    const details = req.body.details;
    const price = req.body.price;
    const status = req.body.status;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        const image= {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };
        orderCollection.insertOne({name, email, project, details, price, status, image})
        .then(result => {
                res.send(result.insertedCount > 0);
        })
    
})


    app.post("/addService", (req, res) => {
      const file = req.files.file;
      const title = req.body.title;
      const description = req.body.description;

      const newImg = file.data;
      const encImg = newImg.toString("base64");

      const image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, "base64"),
      };
      serviceCollection
        .insertOne({ title, description, image })
        .then((result) => {
          res.send(result.insertedCount > 0);
        });
    });

    app.post("/addAdmin", (req, res) => {
      const events = req.body;
      adminCollection.insertOne(events).then((result) => {
        res.send(result.insertedCount);
      });
    });

    app.get("/admins", (req, res) => {
      adminCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });


    app.patch(`/updateOrders`, (req, res) => {
      orderCollection.updateOne({_id: ObjectId(req.body.id)},
      {
          $set: {status: req.body.status}
      })
      .then (result => {
          console.log(result);
      })
  })



app.get("/", (req, res) => {
  res.send("Hello World!");
});
  
});

app.listen(process.env.PORT || port);


