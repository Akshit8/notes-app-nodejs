const express = require('express')
const auth = require('../middleware/auth')
const User = require('../models/user')
const multer = require('multer')
const sharp = require('sharp')

const router = new express.Router()

router.post('/users', async (req, res)=>{
    const user = new User(req.body)
    try{
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user:user,token:token})
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user : user, token:token})              //getPublicObject !! and remember shorthand notations user : user === user
    }catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req, res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    }catch(e){
        res.send(500).send()
    }
})

router.get('/users/me', auth,  async (req, res)=>{
    res.send(req.user)
})

router.patch('/users/me',auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const validupdates = ['name', 'email', 'age', 'password']
    const isValidUpdate = updates.every((update)=>{
        return validupdates.includes(update)
    })

    if(!isValidUpdate){
        return res.status(400).send({'error':'invalid updates'})
    }

    try{
        //const user = await User.findById(req.params.id)

        updates.forEach((update)=>{                 // used this approach for running middleware
            req.user[update] = req.body[update]
        })
        await req.user.save()
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new :true, runValidators:true}) //new:true returns the newly modified object
        // if(!user){
        //     res.status(404).send()
        // }
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/users/me',auth, async (req, res)=>{
    try{
        // const user = await User.findByIdAndDelete(req.params.id)
        // if(!user){
        //     return res.status(404).send()
        // }
        await req.user.remove()
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

const upload = new multer({
    limits : {
        fileSize : 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image file only'))
        }
        cb(undefined, true)
    }
})


router.post('/users/me/avatar',auth, upload.single('avatar'), async (req, res)=>{

    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error, req, res, next)=>{
    res.status(400).send({error : error.message})
})

router.delete('/users/me/avatar', auth, async(req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req, res)=>{

    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    }catch(e){
        res.status(404).send()
    }
})

module.exports = router