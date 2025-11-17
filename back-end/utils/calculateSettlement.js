// backend/utils/calculateSettlement.js
const { Expense, Settlement, User, Group } = require('../models/schema');

/**
 * Helper: ensure we can read user id string from either populated or plain ref
 */
function userIdString(u) {
  if (!u) return null;
  if (typeof u === 'string') return u;
  if (u._id) return u._id.toString();
  return (u.user && u.user._id) ? u.user._id.toString() : (u.user ? u.user.toString() : null);
}

/**
 * computeBalances
 * Input:
 *  - expenses: array of Expense documents (with splits populated or as refs)
 *  - members: array of User documents (populated)
 * Output:
 *  - Map keyed by userId string -> { id, username, balance }
 *    Note: balance > 0 means this user paid more than their share (they should receive money)
 *          balance < 0 means this user owes money
 */
function computeBalances(expenses, members) {
  const balances = new Map();

  // Initialize
  members.forEach(member => {
    const id = member._id.toString();
    balances.set(id, { id, username: member.username, balance: 0 });
  });

  // Sum over expenses
  expenses.forEach(expense => {
    const payerId = userIdString(expense.paidBy);
    const amt = Number(expense.amount) || 0;

    // payer gets credited by full amount paid
    if (payerId && balances.has(payerId)) {
      balances.get(payerId).balance += amt;
    }

    // subtract shares for each participant according to splitType
    if (expense.splitType === 'custom' && Array.isArray(expense.splits) && expense.splits.length > 0) {
      expense.splits.forEach(s => {
        const uid = userIdString(s.user);
        const shareAmt = Number(s.amount) || 0;
        if (uid && balances.has(uid)) balances.get(uid).balance -= shareAmt;
      });
    } else {
      // equal split: if splits list exists (list of users included) use that length,
      // otherwise default to members length
      const participants = Array.isArray(expense.splits) && expense.splits.length > 0
        ? expense.splits.map(s => userIdString(s.user))
        : members.map(m => m._id.toString());
      const validParticipants = participants.filter(p => p && balances.has(p));
      const share = validParticipants.length > 0 ? (amt / validParticipants.length) : 0;
      validParticipants.forEach(uid => {
        balances.get(uid).balance -= share;
      });
    }
  });

  return balances;
}

/**
 * computeSettlementPairsFromBalances
 * Input: balances Map from computeBalances
 * Output: array of settlement pairs { from: {id, username}, to: {id, username}, amount }
 * Greedy algorithm: match largest creditor with largest debtor until settled
 */
function computeSettlementPairsFromBalances(balancesMap) {
  // Convert to arrays
  const arr = Array.from(balancesMap.values()).map(u => ({ ...u }));
  // creditors: balance > 0  (they should receive)
  // debtors: balance < 0  (they owe)
  const creditors = arr.filter(u => u.balance > 0.01).sort((a,b) => b.balance - a.balance);
  const debtors = arr.filter(u => u.balance < -0.01).sort((a,b) => a.balance - b.balance); // most negative first

  const pairs = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const amount = Math.min(credit.balance, -debt.balance);
    if (amount <= 0.0001) break;

    pairs.push({
      from: { id: debt.id, username: debt.username },
      to: { id: credit.id, username: credit.username },
      amount: Number(amount.toFixed(2))
    });

    // adjust
    credit.balance = Number((credit.balance - amount).toFixed(2));
    debt.balance = Number((debt.balance + amount).toFixed(2)); // debt.balance negative, add amount towards zero

    if (credit.balance <= 0.01) i++;
    if (debt.balance >= -0.01) j++;
  }

  return pairs;
}

/**
 * computePerExpenseSettlements
 * Input: single expense doc and members list.
 * Output: settlement pairs limited to this expense only.
 */
function computePerExpenseSettlements(expense, members) {
  // Build balances for this single expense (reuse computeBalances)
  const balances = computeBalances([expense], members); // returns Map
  return computeSettlementPairsFromBalances(balances);
}

/**
 * calculateAndSaveSettlements(groupId)
 * - Recalculates global balances from all expenses
 * - Subtracts payments that are 'completed' (only completed payments should reduce debt)
 * - Produces general pending Settlement rows to reflect net obligations
 * - Leaves expense-specific settlements untouched
 */
const calculateAndSaveSettlements = async (groupId) => {
  const group = await Group.findById(groupId).populate('members', 'username');
  if (!group) return;

  const expenses = await Expense.find({ group: groupId })
    .populate('paidBy', 'username')
    .populate('splits.user', 'username');

  // 1) base theoretical balances (who owes / is owed) from all expenses
  const balances = computeBalances(expenses, group.members); // Map

  // 2) subtract ONLY completed payments (verified by creditor)
  //    Do NOT subtract payments in 'paid_pending_verification' status
  //    Those should still show as owed until creditor verifies
  const completedPayments = await Settlement.find({
    group: groupId,
    status: 'completed'
  });

  completedPayments.forEach(p => {
    const debtorId = p.debtor.toString();
    const creditorId = p.creditor.toString();
    const amountPaid = Number(p.paidAmount || p.amount || 0);
    
    // Debtor paid -> their balance increases (becomes less negative)
    if (balances.has(debtorId)) {
      balances.get(debtorId).balance += amountPaid;
    }
    // Creditor received -> their balance decreases (becomes less positive)
    if (balances.has(creditorId)) {
      balances.get(creditorId).balance -= amountPaid;
    }
  });

  // 3) compute new general settlement pairs from balances
  const pairs = computeSettlementPairsFromBalances(balances); // array of { from,to,amount }

  // 4) persist "general" pending settlements (expenseId == null) into DB
  //    We'll upsert matching debtor-creditor pairs with status 'pending'
  const existingGeneral = await Settlement.find({
    group: groupId,
    status: 'pending',
    expenseId: null
  });

  const processed = new Set();

  for (const p of pairs) {
    // try to find existing general row
    const ex = existingGeneral.find(s =>
      s.debtor.toString() === p.from.id && s.creditor.toString() === p.to.id
    );

    if (ex) {
      ex.amount = p.amount;
      await ex.save();
      processed.add(ex._id.toString());
    } else {
      const created = await Settlement.create({
        group: groupId,
        debtor: p.from.id,
        creditor: p.to.id,
        amount: p.amount,
        status: 'pending',
        expenseId: null
      });
      processed.add(created._id.toString());
    }
  }

  // Delete old pending general settlements that are no longer needed
  for (const s of existingGeneral) {
    if (!processed.has(s._id.toString())) {
      await Settlement.findByIdAndDelete(s._id);
    }
  }
};

module.exports = {
  computeBalances,
  computeSettlementPairsFromBalances,
  computePerExpenseSettlements,
  calculateAndSaveSettlements
};