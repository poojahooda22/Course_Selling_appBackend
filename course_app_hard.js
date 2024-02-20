const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

const SECRET = "my-secret-key";

//define mongoose schemas
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
});

const adminSchema = new mongoose.Schema({
    username: String,
    password: String
});

const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    imageLink: String,
    published: Boolean
});


//define mongoose models
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);


const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET, (err, user) => {
            if(err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

//connect to mongoDB

mongoose.connect("mongodb+srv://phooda938:phooda938@cluster0.kof5uvs.mongodb.net/", {useNewUrlParser: true, useUnifiedTopology: true})

//admin routes
app.post('/admin/signup', async (req, res) => {
    const {username, password} = req.body;
    const admin = await Admin.findOne({ username});

    if(admin) {
        res.status(403).json({message: 'Admin already exists'});
    } else {
        const newAdmin = new Admin({ username, password});
        await newAdmin.save();
        const token = jwt.sign({username, role: 'admin'}, SECRET, {expiresIn: '1h'});
        res.json({message: 'Admin created successfully', token});
    }

})