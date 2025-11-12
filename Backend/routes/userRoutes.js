const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.param('id', (req, res, next, val) => {
    console.log('User ID is:', val);
    next();
})

router.post('/signup', authController.signup);
router.post('/verify', authController.verifyOtp);
router.post('/login', authController.login);

router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetPassword', authController.resetPassword);

router.patch('/updateMyPassword', authController.protect, authController.updatePassword);

router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router
.route('/:id')
.get(userController.getUser)

module.exports = router;