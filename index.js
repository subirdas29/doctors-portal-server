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
        const bookingsCollection = client.db('doctorsPortal').collection('bookings')
        const usersCollection = client.db('doctorsPortal').collection('users')

        app.get('/appointmentOptions',async(req,res)=>
        {
            const date = req.query.date;
            const query ={}
            const options = await appointmentOptionsCollection.find(query).toArray()
            const bookedQuery = {appointmentDate:date}
            const alreadyBooked = await bookingsCollection.find(bookedQuery).toArray()

            options.forEach(option =>
                {
                    const optionsBooked = alreadyBooked.filter(book=>book.treatment === option.name)
                    // console.log(optionsBooked)
                    const bookSlots = optionsBooked.map(book =>book.slot)
                    const remaining = option.slots.filter(slot => !bookSlots.includes(slot))
                    option.slots = remaining;
                   
                }
            
            )


            res.send(options)
        })
        app.post('/bookings',async(req,res)=>
        {
            const booking = req.body
            const query ={
                appointmentDate: booking.appointmentDate,
                
                treatment:booking.treatment,
                email:booking.email,
            }
            const bookingDate = await bookingsCollection.find(query).toArray();
            if(bookingDate.length)
            {
               const message= `you already have a booking on ${booking.appointmentDate}`
                return res.send({acknowledged:false , message})
            }

            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
            
        })

        app.get('/bookings',async(req,res)=>{
            const email = req.query.email
            const query ={
                email:email
            }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/users',async(req,res)=>
        {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
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