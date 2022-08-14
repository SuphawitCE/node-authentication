const { validationResult } = require('express-validator/check');
const mongoose = require('mongoose');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title,
        imageUrl,
        price,
        description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const product = new Product({
    // _id: mongoose.Types.ObjectId('62d0e027b53f8d6416c1a704'), //  Test for database error
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });

  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch((error) => {
      console.log(error);
      // return res.status(500).render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   hasError: true,
      //   product: {
      //     title,
      //     imageUrl,
      //     price,
      //     description
      //   },
      //   errorMessage: 'Database operation failed, please try again.',
      //   validationErrors: []
      // });

      // res.redirect('/500');
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('errors: ', errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        _id: prodId,
        title: updatedTitle,
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDesc
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }

      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save().then((result) => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((products) => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
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

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // Product.findByIdAndRemove(prodId)
  Product.deleteOne({ _id: prodId, userId: req.user._id })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch((error) => {
      console.log(error);
      const errors = new Error(error);
      errors.httpStatusCode = 500;
      return next(errors);
    });
};
