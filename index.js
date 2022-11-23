const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config()

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1mua1t2.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJwt(req,res,next){
    const authHeader = req.headers.authorization
    console.log(authHeader)
    if(!authHeader)
    {
       return res.status(401).send('unauthorized')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN , function(err, decoded){
        if(err)
        {
            return res.status(403).send({message:'forbidden access'})
        }
        req.decoded = decoded
        next()
    })
} 

async function run (){

    try{
        const appointmentOptionsCollection = client.db('doctorsPortal').collection('appointmentOption')
        const bookingsCollection = client.db('doctorsPortal').collection('bookings')
        const usersCollection = client.db('doctorsPortal').collection('users')
        const doctorsCollection = client.db('doctorsPortal').collection('doctors')

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

        app.get('/bookings',verifyJwt, async(req,res)=>{
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if(email != decodedEmail)
            {
                return res.status(403).send({message:'forbidden access'})
            }
            const query ={
                email:email
            }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        

        app.get('/jwt',async(req,res)=>{
            const email = req.query.email
            const query ={
                email:email
            }
            const user = await usersCollection.findOne(query)
            if(user)
            {
                const token = jwt.sign({email},process.env.ACCESS_TOKEN, { expiresIn:'1D'} );
                return res.send({accessToken:token})
            }
            res.status(403).send({accessToken:''})

        })
        app.get('/appointmentSpeciality', async (req, res) => {
            const query = {}
            const result = await appointmentOptionsCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })

        app.get('/users',async(req,res)=>
        {
            const query = {}
            const result = await usersCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/users',async(req,res)=>
        {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })
        app.get('/users/admin/:email',async(req,res)=>
        {
            const email = req.params.email
            const query = {email}
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin :user?.role ==='admin' })
        })

        app.put('/users/admin/:id',verifyJwt ,async(req,res)=>
        {
            const decodedEmail = req.decoded.email;
            const query ={email:decodedEmail}
            const user = await usersCollection.findOne(query)
            if(user?.role!=='admin') {
                return res.status(403).send({message:'forbidden access'})
            }
           const id = req.params.id;
           const filter = ({_id:ObjectId(id)})
           const options = { upsert: true };
          
           const updateDoc = {
             $set: {
              role:'admin'
             },
           };
           const result = await usersCollection.updateOne(filter, updateDoc, options)
           res.send(result)
        })

        app.post('/doctors',async(req,res)=>
        {
            const doctor = req.body
            const result = await doctorsCollection.insertOne(doctor)
            res.send(result)
        })

        app.get('/doctors',async(req,res)=>
        {
            const query = {}
            const result = await doctorsCollection.find(query).toArray()
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