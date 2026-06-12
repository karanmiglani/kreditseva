const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require('path');
const fs = require('fs');
const pageRoutes = require('./routes/pageRoutes');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cors({
  origin: ['https://kreditseva.onrender.com', 'https://www.kreditseva.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// const autRoutes = require('./routes/authRoutes');
// const blogRoutes = require('./routes/blogRoutes');
// const dashBoardRoutes = require('./routes/dashboardRoutes');
// const leadRoutes = require('./routes/loanApplicationRoutes');


// Static files

app.use('/css', express.static(path.join(__dirname,'../css')));
app.use('/js', express.static(path.join(__dirname,'../js')));
app.use('/images', express.static(path.join(__dirname,'../images')));
app.use('/pages', express.static(path.join(__dirname,'../pages')));
app.use('/admin', express.static(path.join(__dirname,'../admin'), {
    index : false
}));

app.set('view engine' , 'ejs');
app.set('views', path.join(__dirname,'../views'));
app.use(pageRoutes);
// app.use('/api/auth',autRoutes);
// app.use('/api/blog/', blogRoutes);
// app.use('/api/dashboard',dashBoardRoutes);
// app.use('/api/leads', leadRoutes);


const port = process.env.PORT;


const server = app.listen(port,() => {
    console.log("Server runing at port 3000...");
})

server.on('error', (err) => {
    console.error('Listen Error:', err);
});