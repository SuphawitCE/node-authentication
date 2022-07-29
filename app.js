const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

require('dotenv').config();

const errorController = require('./controllers/error');
const User = require('./models/user');

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;

const app = express();

const collectionName = 'shop';
const dbURI = `mongodb+srv://${username}:${password}@cluster0.ypnh4.mongodb.net/${collectionName}`;

const store = new MongoDBStore({
  uri: dbURI,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store
  })
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(dbURI)
  .then((result) => {
    User.findOne().then((user) => {
      if (!user) {
        const userInfo = {
          name: 'Bank',
          email: 'test@gmail.com',
          cart: { items: [] }
        };

        const user = new User(userInfo);
        user.save();
      }
    });

    console.log('Server are running...');
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
