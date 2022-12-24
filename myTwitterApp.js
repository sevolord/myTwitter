const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const session = require('express-session');

// Connect to the MS SQL database using Sequelize
const sequelize = new Sequelize('myDB', 'admin', '123', {
  dialect: 'mssql'
});

// Define models for the users and messages
const User = sequelize.define('user', {
  login: {
    type: Sequelize.STRING,
    unique: true
  },
  password: Sequelize.STRING
});
User.sync();
const Message = sequelize.define('message', {
  sender: Sequelize.STRING,
  message: Sequelize.STRING
});
Message.sync();

// Set up the Express server and middleware
const app = express();
app.use(session({
    secret: 'my-secret-key', // Use a secret key to encrypt the session data
    resave: false,
    saveUninitialized: true
  }));

// Чтобы встроить компонент express.static в процесс обработки запроса, вызывается функция app.use(). 
// Эта функция позволяет добавлять различные компоненты, которые еще называются middleware, в конвейер обработки запроса:
app.use(express.static(__dirname));//используем все файлы из директории
// app.use(function (request, response) {
//     response.sendFile(__dirname + "/index.html");
// });



app.use(bodyParser.urlencoded({ extended: false }));

// Define routes for the registration, login, and messages pages
app.post('/register', (req, res) => {
  // Check if a user with the same login already exists
  User.findOne({
    where: {
      login: req.body.login
    }
  }).then(user => {
    if (user) {
      // If a user with the same login already exists, redirect to the login form
      res.redirect('/login.html');
    } else {
      // If the login is available, create a new user with the provided login and password
      User.create({
        login: req.body.login,
        password: req.body.password
      }).then(() => {
        // If the "Save data" checkbox was checked, set a cookie with the login and password
          res.cookie('login', req.body.login);
          res.cookie('password', req.body.password);
        // Redirect to the login form
        res.redirect('/login.html');
      });
    }
  });
});
app.post('/login', (req, res) => {
  // Find a user with the provided login and password
  User.findOne({
    where: {
      login: req.body.login,
      password: req.body.password
    }
  }).then(user => {
    if (user) {
      // If a matching user is found, set a session variable with the user's login
      req.session.login = req.body.login;
      // If the "Automatically logged on at the next login" switch was checked, set a cookie with the login and password
      if (req.body.autoLogin) {
        res.cookie('login', req.body.login);
        res.cookie('password', req.body.password);
      }
      // Redirect to the messages page
      res.redirect('/messages.html');
    } else {
      // If no matching user is found, redirect to the login form
      res.redirect('/login.html');
    }
  });
});
 // Add a route for handling GET requests to /messages
 app.get('/messages', (req, res) => {
    // Retrieve a list of all messages from the database
    Message.findAll().then(messages => {
      res.json(messages);
    });
  });
// Add a route for handling POST requests to /messages
app.post('/messages', (req, res) => {
    // Add the message to the database
    Message.create({
      sender: req.session.login,
      message: req.body.message
    }).then(() => {
      res.sendStatus(200);
    });
  });
  
  // Add a route for handling DELETE requests to /messages/:id
  app.delete('/messages/:id', (req, res) => {
    // Delete the message from the database
    Message.destroy({
      where: {
        id: req.params.id,
        sender: req.session.login
      }
    }).then(() => {
      res.sendStatus(200);
    });
  });
  
 

// Start the server
app.listen(3000, () => {
console.log('Server listening on port 3000');
});
