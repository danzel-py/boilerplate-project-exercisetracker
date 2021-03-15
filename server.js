const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true })


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.urlencoded())

const logSchema = new mongoose.Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: () => new Date()}
})

const userSchema = new mongoose.Schema({
  username: String,
  log: {type: [logSchema]}
})

const User = mongoose.model('User', userSchema)

app.route('/api/exercise/new-user')
    .post((req,res)=>{
      User.findOne({username: req.body.username},(err,user)=>{
        if(err) return console.log(err)
        console.log('found')
        if (!user){
          User.create({username: req.body.username},(err,newU)=>{
            if(err) return console.log(err)
            res.send({username: req.body.username, _id: newU.toObject()._id})
          })
        }
        else{
          res.send("Username already taken")
        }
      })
    })


app.route('/api/exercise/users')
    .get((req,res)=>{
      User.find({},'username _id',(err,arr)=>{
        if(err) return console.log(err)
        res.send(arr)
      })
    })

app.route('/api/exercise/log')
    .get((req,res)=>{
      // case only userid
      if(req.query.from){
        var fromDate = new Date(req.query.from)
        var fromSpec = true
      }
      else{
        var fromDate = new Date(0)
        var fromSpec = false
      }
      if(req.query.to){
        var toDate = new Date(req.query.to)
        var toSpec = true
      }
      else{
        var toDate = new Date('2098-01-10')
        var toSpec = false
      }
      if(req.query.limit){
        var limit = req.query.limit
      }
      else{
        var limit = 9282
      }

      User.findById(req.query.userId, (err,data)=>{
        if (err) return console.log(err)
        const logs = data.toObject().log
        const filteredLogs = logs.filter((log)=>log.date>fromDate).filter((log)=>log.date<toDate).slice(0,limit)
        const count = filteredLogs.length
        filteredLogs.forEach((log)=>{
          log.date = log.date.toString().slice(0,15)
        })
        res.send({
          _id: req.query.userId,
          username: data.toObject().username,
          ...(fromSpec) && {from: fromDate.toString().slice(0,15)}, //conditional keyvalue pairs
          ...(toSpec) && {to: toDate.toString().slice(0,15)},
          count: count,
          log: filteredLogs
        })
      })




      /* res.send(User.aggregate(
        [{ $match: {_id: req.query.userId}},
        { $unwind: '$log'},
        { $match: {date: {$lte: toDate, $gte: fromDate}}},
        { $limit: limit}]
      )).exec((err,data)=>{
        if(err) console.log(err)
        res.send(data)
      }) */
    })

app.route('/api/exercise/add')
    .post((req,res)=>{
      User.findById(req.body.userId,(err,user)=>{
        if(err) return res.send(req.body.userId+" is not a userId")
        const regex = /[^0-9]/
        if(req.body.date){
          if(regex.test(req.body.date) === true){
            var datt = new Date(req.body.date)
          }
          else{
            var datt = new Date(parseInt(req.body.date))
          }
        }
        else{
          var datt = new Date()
        }
        user.log.push({
          duration: req.body.duration,
          description: req.body.description,
          date: datt
        })
        user.save((err,data)=>{
          if(err) return console.log(err)
          res.send({
            _id: req.body.userId,
            username: data.toObject().username,
            date: datt.toString().slice(0,15),
            duration: parseInt(req.body.duration),
            description: req.body.description
          })
        })
      })
    })



/* LATER :
1. push the log => parent.child.push({ thing: thing})


*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
