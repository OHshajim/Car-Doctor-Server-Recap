const express = require("express");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParse = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleWare 
app.use(cors({
    origin: [
        'https://car-doctor-17321.web.app',
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParse());


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.q9eobgc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// custom middleware
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token
    if (!token) {
        return res.status(401).send({ message: 'unAuthorized Access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unAuthorized Access' })
        }
        req.user = decoded;
        next()
    })
}


async function run() {
    try {

        const servicesConnection = client.db('CarDoctor').collection('services');
        const bookingConnection = client.db('CarDoctor').collection('bookings');

        // auth related api 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log("user for token", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })
        })
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log(user);
            res.clearCookie('token', { maxAge: 0 })
                .send({ success: true })
        })

        // services related api

        app.get('/services', async (req, res) => {
            const result = await servicesConnection.find().toArray();
            res.send(result)
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const option = {
                projection: { _id: 1, title: 1, price: 1, img: 1, service_id: 1 }
            }
            const result = await servicesConnection.findOne(query, option);
            res.send(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const updatedBooking = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingConnection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.get("/bookings", verifyToken, async (req, res) => {
            let query = {};
            console.log("token", req.cookies);
            console.log( "user: ",req.user);

            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: "Forbidden access" })
            }
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingConnection.find(query).toArray()
            res.send(result)
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingConnection.insertOne(booking)
            res.send(result)
        });

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingConnection.deleteOne(query)
            res.send(result)
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Doctor is running ")
})

app.listen(port, () => {
    console.log(`Car Doctor is running on ${port}`);
})