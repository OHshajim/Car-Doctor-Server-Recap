const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleWare 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.q9eobgc.mongodb.net/?retryWrites=true&w=majority`;

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

        const servicesConnection = client.db('CarDoctor').collection('services');
        const bookingConnection = client.db('CarDoctor').collection('bookings');

        app.get('/services', async (req, res) => {
            const result = await servicesConnection.find().toArray();
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const option = {
                projection: { _id: 1, title: 1, price: 1, img: 1 }
            }
            const result = await servicesConnection.findOne(query);
            res.send(result);
        })

        app.post('/bookings',async(req,res)=>{
            const booking =req.body ;
            const result = await bookingConnection.insertOne(booking)
            res.send(result)

        })
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