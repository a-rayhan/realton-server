const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yib2rqv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        const userCollection = client.db("realtonDb").collection("users");
        const propertiesCollection = client.db("realtonDb").collection("properties");
        const reviewsCollection = client.db("realtonDb").collection("reviews");

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token });
        })

        // Middlewares
        const verifyToken = (req, res, next) => {
            // console.log(req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorized Access' })
            }

            const token = req.headers.authorization.split(' ')[1];
            // console.log(token);

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
                if (error) {
                    return res.status(401).send({ message: 'Unauthorized Access' })
                }

                // console.log(decoded);
                req.decoded = decoded;
                next();
            })
        }

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';

            if (!isAdmin) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

            next();
        }

        // users
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            // console.log(req.decoded.email);
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

            const query = { email: email };
            const user = await userCollection.findOne(query);
            // console.log(user);

            let admin = false;

            if (user) {
                admin = user?.role == 'admin';
            }

            // console.log(admin);

            res.send({ admin })
        })

        app.get('/users/agent/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            // console.log(req.decoded.email);
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }

            const query = { email: email };
            const user = await userCollection.findOne(query);
            // console.log(user);

            let agent = false;

            if (user) {
                agent = user?.role == 'agent';
            }

            // console.log(agent);

            res.send({ agent })
        })

        app.post('/users', async (req, res) => {
            const userItem = req.body;
            // Insert user if user doesn/t exist
            const query = { email: userItem.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ massage: 'User email already exist', insertedId: null })
            }
            const result = await userCollection.insertOne(userItem);
            res.send(result);
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.patch('/users/agent/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'agent'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        // add items
        app.get('/properties', async (req, res) => {
            const result = await propertiesCollection.find().toArray();
            res.send(result);
        })

        app.post('/properties', async (req, res) => {
            const propertyItem = req.body;
            const result = await propertiesCollection.insertOne(propertyItem);
            res.send(result);
        })

        app.patch('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'accepted'
                }
            }
            const result = await propertiesCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.put('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const propertyData = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateData = {
                $set: {
                    title: propertyData.title,
                    price: propertyData.price,
                    photo: propertyData.photo,
                    location: propertyData.location,
                    rating: propertyData.rating,
                    description: propertyData.description,
                }
            }
            const result = await propertiesCollection.updateOne(filter, updateData, options);
            res.send(result);
        })

        app.delete('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await propertiesCollection.deleteOne(query);
            res.send(result);
        })

        // reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        })

        app.post('/reviews', async (req, res) => {
            const reviewItem = req.body;
            const result = await reviewsCollection.insertOne(reviewItem);
            res.send(result);
        })


        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', async (req, res) => {
    res.send('<h1>Realton server is running</h1>')
})

app.listen(port, () => {
    console.log(`Realton app listening on port ${port}`)
})