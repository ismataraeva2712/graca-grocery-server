const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// jwt function
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'you are unauthorised' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'access forbidden' })
        }
        console.log('decoded', decoded)
        req.decoded = decoded
        next();
    })

}

app.get('/', (req, res) => {
    res.send('Hello World!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ti9kvkp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const foodCollection = client.db('grocaGrocery').collection('items')

        app.get('/items', async (req, res) => {
            const query = {}
            const cursor = foodCollection.find(query)
            const foods = await cursor.toArray()
            res.send(foods)

        })
        app.get('/items/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const food = await foodCollection.findOne(query)
            res.send(food)

        })
        app.put('/items/:id', async (req, res) => {
            const id = req.params.id
            const updatedQuantity = req.body
            console.log(updatedQuantity)
            const query = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.quantity
                }
            }
            const result = await foodCollection.updateOne(query, updatedDoc, options)
            res.send(result)
        })
        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await foodCollection.deleteOne(query)
            res.send(result)
        })
        app.post('/items', async (req, res) => {
            const newItem = req.body
            const result = await foodCollection.insertOne(newItem)
            res.send(result)
        })
        app.get('/myItem', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const cursor = foodCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/myItem', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const query = { email: email }
                const cursor = foodCollection.find(query)
                const result = await cursor.toArray()
                res.send(result)
            }
            else {
                res.status(403).send({ message: 'access forbidden' })
            }
        })
    }
    finally {

    }

}
run().catch(console.dir)



app.listen(port, () => {
    console.log(`groca-grocery listening on port ${port}`)
})