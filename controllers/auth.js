const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator/check');

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
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
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
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('errors: ', errors.array());

    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email,
            password
          },
          validationErrors: []
        });
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
          console.log('User has provided incorrect password');

          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email,
              password
            },
            validationErrors: []
          });
        })
        .catch((error) => {
          console.log(error);
          res.redirect('/login');
        });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.postSignup = (req, res, next) => {
  // Should have a validation for incoming request
  console.log('post-signup-given: ', req.body);

  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('errors: ', errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
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
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;

  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        // Send email
        res.redirect('/');

        transporter.sendMail({
          from: `Bank pmlo-qa <${process.env.EMAIL_USERNAME}>`,
          to: email,
          subject: 'Password Reset',
          text: `User ${email} has confirm signup`,
          html: `
          <h1>Reset password</h1>
          <p>You requested a password reset</p>
          <p>
            Click this 
            <a href="http://localhost:3000/reset/${token}" > link </a> 
            to set a new password 
          </p>
          `
        });
      })
      .catch((error) => {
        console.log('post-reset-error: ', error);
        const errors = new Error(error);
        errors.httpStatusCode = 500;
        return next(errors);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then((user) => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'Reset Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      console.log('Reset password confirmed');
      res.redirect('/login');
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};
