const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config()

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1mua1t2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run (){

    try{
        const appointmentOptionsCollection = client.db('doctorsPortal').collection('appointmentOption')

        app.get('/appointmentOptions',async(req,res)=>
        {
            const query ={}
            const options = await appointmentOptionsCollection.find(query).toArray()
            res.send(options)
        })

    }
    finally{

    }

}
run().catch(console.dir);

app.get('/', async(req, res) => {
  res.send('Doctors portal running')
})

app.listen(port, ()=>console.log(`Doctors portal running on ${port}`))