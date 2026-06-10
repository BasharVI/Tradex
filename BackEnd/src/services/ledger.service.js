const FundLedger = require("../models/FundLedger");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Atomic cash mutation + ledger write.
 *
 * @param {object} args
 * @param {string} args.userId
 * @param {number} args.amount   signed delta to availableCash
 * @param {string} args.type     one of FundLedger.TYPES
 * @param {string} [args.description]
 * @param {string} [args.referenceType]
 * @param {import("mongoose").Types.ObjectId} [args.referenceId]
 * @param {import("mongoose").ClientSession} [args.session]
 * @returns {Promise<{balanceAfter:number, ledgerId:any}>}
 */
async function postEntry({
  userId,
  amount,
  type,
  description = "",
  referenceType = null,
  referenceId = null,
  session,
}) {
  const delta = round2(amount);

  // Atomic guard: if this is a debit, only apply when balance is sufficient.
  const filter = { _id: userId };
  if (delta < 0) filter.availableCash = { $gte: -delta };

  const opts = { new: true, projection: "availableCash" };
  if (session) opts.session = session;

  const updated = await User.findOneAndUpdate(
    filter,
    { $inc: { availableCash: delta } },
    opts
  );
  if (!updated) {
    throw new AppError(
      "Insufficient cash for this operation",
      400,
      "INSUFFICIENT_CASH"
    );
  }

  const entry = await FundLedger.create(
    [
      {
        userId,
        type,
        amount: delta,
        balanceAfter: round2(updated.availableCash),
        description,
        referenceType,
        referenceId,
      },
    ],
    { session }
  );

  return { balanceAfter: updated.availableCash, ledgerId: entry[0]._id };
}

module.exports = { postEntry };
