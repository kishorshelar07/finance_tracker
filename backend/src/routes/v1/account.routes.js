const express = require('express');
const router = express.Router();
const { getAccounts, createAccount, updateAccount, deleteAccount, toggleArchive, transfer, getAccountTransactions } = require('../../controllers/account.controller');
const { protect } = require('../../middleware/auth');
const { accountValidator } = require('../../middleware/validate');

router.use(protect);

router.get('/', getAccounts);
router.post('/', accountValidator, createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.patch('/:id/archive', toggleArchive);
router.post('/transfer', transfer);
router.get('/:id/transactions', getAccountTransactions);

module.exports = router;
