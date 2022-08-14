const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
        // isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
        // isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
        // isAuthenticated: req.session.isLoggedIn,
        // csrfToken: req.csrfToken()
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    // .execPopulate()  //  This supposed to works
    .then((user) => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
        // isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    // .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          // name: req.user.name,
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
        // isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};
