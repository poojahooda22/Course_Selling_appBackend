const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

const SECRET = "my-secret-key";

//define mongoose schemas
const userSchema = new mongoose.Schema({
    username: {type: String},
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
});

app.post('/admin/login', async(req, res) => {
    const {username, password} = req.headers;
    const admin = await Admin.findOne({username, password});
    if(admin) {
        const token = jwt.sign({username, role: 'admin'}, SECRET, {expiresIn: '1h'});
        res.json({message: 'Logged in successfully', token});
    } else {
        res.status(403).json({message: 'Invalid or password'});
    }
});


app.post('/admin/courses', authenticateJwt, async (req, res) => {
    const course = new Course(req.body);
    await course.save();
    res.json({message: 'Course created successfully', courseId: course.id });    
})

app.put('/admin/courses/:courseId', authenticateJwt, async (req, res) => {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true});
    if(course) {
        res.json({message: 'course updated successfully'});
    } else {
        res.status(404).json({ message: 'course not found'});
    }
});

app.get('admin/courses', authenticateJwt, async(req, res) => {
    const courses = await Course.find({});

    res.json({courses});
});

//user routes

app.post('/users/signup', async (req, res) => {
    const {username, password} = req.body;
    const user = await User.findOne({ username});
    if(user) {
        res.status(403).json({message: 'User already exists'});
    } else {
        const newUser = new User({ username, password});
        await newUser.save();
        const token = jwt.sign({username, role: 'user'}, SECRET, {expiresIn: '1h'});
        res.json({message: 'User created successfully', token});
    }
});

app.post('/users/login', async(req, res) => {
    const {username, password} = req.headers;
    const user = await User.findOne({username, password});
    if(user) {
        const token = jwt.sign({username, role: 'user'}, SECRET, {expiresIn: '1h'});
        res.json({message: 'logged in seccessfully ', token});
    } else {
        res.status(403).json({message: 'Invalid username or password'});
    }
})

app.get('/users/courses', authenticateJwt, async (req, res) => {
    const courses = await Course.find({published: true});
    res.json({ courses });
  });

app.post('/users/courses/:courseId', authenticateJwt, async(req, res) => {
    const course = await Course.findById(req.params.courseId);
    if(course) {
        const user = await User.findOne({username: rq.user.username});
        if(user) {
            user.purchasedCourses.push(course);
            await user.save();
            res.json({message: 'course purchased successfully!'});
        } else {
            res.status(403).json({message: 'user not found'});
        }
    } else {
        res.status(404).json({message: 'course not found'})
    }
});

app.get('/users/purchasedCourses', authenticateJwt, async (req, res) => {
    const user = await User.findOne({username: req.user.username}).populate('purchasedCourses');
    if(user) {
        res.json({ purchasedCourses: user.purchasedCourses || [] });
    } else {
        res.status(403).json({message: 'user not found'});
    }
})

app.listen(3000, () => console.log('Server running on port 3000'));