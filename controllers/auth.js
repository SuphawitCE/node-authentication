const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  // Extract cookie boolean value eg: loggedIn=true||false and convert string to boolean
  // const isLoggedIn = req.get('Cookie').trim().split('=')[1] === 'true';
  // console.log('getLogin: ', isLoggedIn); //  string

  console.log('getLogin: ', req.session.isLoggedIn);
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false // isLoggedIn
  });
};

exports.postLogin = (req, res, next) => {
  // Setting cookie to header, loggedIn=true
  // Max-Age=10
  // Secure
  // res.setHeader('Set-Cookie', 'loggedIn=true; HttpOnly');

  // Session middleware
  // req.session.isLoggedIn = true;

  User.findById('62d0ddb3170caf89de10be60')
    .then((user) => {
      req.session.isLoggedIn = true;
      req.session.user = user;
      req.session.save((error) => {
        console.log(error);
        res.redirect('/');
      });
    })
    .then((error) => {
      console.log('post-login-error: ', error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((error) => {
    console.log('post-logout-error: ', error);
    res.redirect('/');
  });
};
