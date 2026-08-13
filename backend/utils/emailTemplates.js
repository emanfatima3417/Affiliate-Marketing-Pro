const { formatCurrency, formatDate } = require("./formatters");

// Shared wrapper so every transactional email looks consistent without
// duplicating the same HTML boilerplate in every controller that sends one.
function wrapEmail(bodyHtml) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a2233;">
      <div style="padding: 24px 0 8px;">
        <span style="font-weight: 800; font-size: 18px;">Marketplace <span style="color: #1f7a4d;">Pro</span></span>
      </div>
      <div style="border: 1px solid #e5e0d8; border-radius: 8px; padding: 24px; background: #fff;">
        ${bodyHtml}
      </div>
      <p style="font-size: 12px; color: #7a7568; margin-top: 16px;">
        Affiliate Marketplace Pro — this is an automated message, please don't reply directly to this email.
      </p>
    </div>
  `;
}

function orderConfirmationEmail(user, order) {
  const itemRows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${i.quantity} × ${i.title}</td><td style="padding:6px 0; text-align:right;">${formatCurrency(i.price * i.quantity)}</td></tr>`
    )
    .join("");

  return {
    subject: `Order confirmed - ${order.orderNumber}`,
    html: wrapEmail(`
      <p>Hi ${user.name},</p>
      <p>Thanks for your order! Here's a summary:</p>
      <p style="font-weight:700;">Order ${order.orderNumber}</p>
      <table style="width:100%; border-collapse: collapse; font-size: 14px;">
        ${itemRows}
        <tr><td style="padding-top:10px; font-weight:700; border-top:1px solid #e5e0d8;">Total</td>
            <td style="padding-top:10px; font-weight:700; text-align:right; border-top:1px solid #e5e0d8;">${formatCurrency(order.total)}</td></tr>
      </table>
      <p style="margin-top:16px;">We'll email you again once your order ships.</p>
    `),
    text: `Order ${order.orderNumber} confirmed. Total: ${formatCurrency(order.total)}. Thanks for shopping with us, ${user.name}!`,
  };
}

function sellerStatusEmail(user, status) {
  const approved = status === "approved";
  return {
    subject: approved ? "Your seller account has been approved" : "Update on your seller application",
    html: wrapEmail(`
      <p>Hi ${user.name},</p>
      ${
        approved
          ? `<p>Good news — your seller account (<strong>${user.storeName || "your store"}</strong>) has been
             approved. You can now log in and start listing products.</p>`
          : `<p>Your seller application was not approved at this time. If you believe this was a mistake, please
             reach out to support.</p>`
      }
    `),
    text: approved
      ? `Your seller account has been approved. Log in to start listing products.`
      : `Your seller application was not approved. Contact support if you have questions.`,
  };
}

function commissionEarnedEmail(user, amount, order) {
  return {
    subject: `You earned a commission - ${formatCurrency(amount)}`,
    html: wrapEmail(`
      <p>Hi ${user.name},</p>
      <p>Nice work — a purchase was just made through one of your affiliate links.</p>
      <p style="font-size: 22px; font-weight: 800; color: #1f7a4d; margin: 12px 0;">+${formatCurrency(amount)}</p>
      <p style="font-size: 14px; color: #555;">Order ${order.orderNumber} · ${formatDate(order.createdAt || new Date())}</p>
      <p style="margin-top:16px;">This has been added to your affiliate balance. Log in to your dashboard to see your full commission history.</p>
    `),
    text: `You earned ${formatCurrency(amount)} in commission from order ${order.orderNumber}.`,
  };
}

function payoutProcessedEmail(user, amount) {
  return {
    subject: `Payout sent - ${formatCurrency(amount)}`,
    html: wrapEmail(`
      <p>Hi ${user.name},</p>
      <p>A payout of <strong>${formatCurrency(amount)}</strong> has been processed for your affiliate balance.</p>
      <p style="margin-top:16px;">Log in to your dashboard to see your updated commission history.</p>
    `),
    text: `A payout of ${formatCurrency(amount)} has been processed to your account.`,
  };
}

module.exports = { orderConfirmationEmail, sellerStatusEmail, commissionEarnedEmail, payoutProcessedEmail };
