const express = require('express');
const path = require('path');


const staticMiddleware = (app) => {
    app.use('/css', express.static(path.join(__dirname,'../css')));
    app.use('/js', express.static(path.join(__dirname,'../js')));
    app.use('/images', express.static(path.join(__dirname,'../images')));
    app.use('/pages', express.static(path.join(__dirname,'../pages')));
    app.use('/admin', express.static(path.join(__dirname,'../admin')));
}


module.exports  = staticMiddleware;