const express = require('express');
const router = express.Router();
const {
  getAccounts, createAccount, updateAccount,
  deleteAccount, toggleArchive, transfer, getAccountTransactions,
} = require('../../controllers/account.controller');
const { protect } = require('../../middleware/auth');
const { accountValidator } = require('../../middleware/validate');

router.use(protect);

router.get('/', getAccounts);

// BUG FIX: Static routes MUST come BEFORE /:id param routes.
// Old code had POST /transfer AFTER PUT /:id — Express matched
// POST /transfer → PUT /:id with id="transfer" → wrong handler!
router.post('/transfer', transfer);

router.post('/', accountValidator, createAccount);
router.get('/:id/transactions', getAccountTransactions);  // specific sub-route before generic /:id
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.patch('/:id/archive', toggleArchive);

module.exports = router;
