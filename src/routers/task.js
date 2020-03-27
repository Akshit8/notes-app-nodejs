const express = require('express')
const auth = require('../middleware/auth')
const Task = require('../models/task')
const User = require('../models/user')

const router = new express.Router()

router.post('/tasks',auth, async (req, res)=>{
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner : req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt_asc(desc)
router.get('/tasks',auth,  async (req, res)=>{

    const match = {}
    const sort = {}

    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }

    try{
        //const user = await User.findById(req.user._id) already have the user
        await req.user.populate({
            path : 'tasks',
            match : match,               // match requires an object with key value to match the criteris ::here completed = false
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort : sort
            }
        }).execPopulate()
        //const tasks = await Task.find({})
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(e)
    }
})

router.get("/tasks/:id",auth,  async (req, res)=>{
    const _id = req.params.id
    try{
        //const task = await Task.findById(_id)
        const task = await Task.findOne({_id:_id, owner : req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id',auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const validupdates = ['description', 'completed']
    const isValidUpdate = updates.every((update)=>{
        return validupdates.includes(update)
    })

    if(!isValidUpdate){
        return res.status(400).send({'error':'invalid updates'})
    }

    try{
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new :true, runValidators:true}) //new:true returns the newly modified object
        const task = await Task.findOne({_id:req.params.id, owner : req.user._id})
        if(!task){
            res.status(404).send()
        }
        updates.forEach((update)=>{
            return task[update] = req.body[update]
        })
        await task.save()
        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id',auth,  async (req, res)=>{
    try{
        //const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({_id:req.params.id, owner : req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

module.exports = router
