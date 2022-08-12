const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const User = require('../models/user');

require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'gmail',
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }

      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            console.log('User has provided correct password');
            return req.session.save((err) => {
              console.log(err);
              console.log('User sessions has been saved');
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password.');
          console.log('User has provided incorrect password');
          res.redirect('/login');
        })
        .catch((error) => {
          console.log(error);
          res.redirect('/login');
        });
    })
    .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
  // Should have a validation for incoming request
  console.log('post-signup-given: ', req.body);

  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash('error', 'Email exists already, please try a different one.');
        return res.redirect('/signup');
      }

      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then((result) => {
          console.log('post-signup-response: ', result);

          res.redirect('/login');
          // Sending mail options
          return transporter.sendMail({
            from: `Bank pmlo-qa <${process.env.EMAIL_USERNAME}>`,
            to: email,
            subject: 'Sending mail from Node.js application',
            text: `User ${email} has confirm signup`,
            html: '<h1>You successfully signed up!</h1>'
          });
        })
        .catch((error) => {
          console.log('send-mail-error: ', error);
        });
    })
    .catch((error) => {
      console.log('post-signup-error: ', error);
      throw error;
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};
