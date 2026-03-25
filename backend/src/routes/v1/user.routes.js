const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, uploadPicture, deleteAccount } = require('../../controllers/user.controller');
const { protect } = require('../../middleware/auth');
const { upload } = require('../../config/multer');
const { uploadLimiter } = require('../../middleware/rateLimiter');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/profile/picture', uploadLimiter, upload.single('picture'), uploadPicture);
router.delete('/account', deleteAccount);

module.exports = router;
