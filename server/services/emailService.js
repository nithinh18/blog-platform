// Dev-mode email stub. No SMTP credentials are configured, so instead of
// sending real email we log what would be sent. Swap this out for a real
// transport (e.g. nodemailer + SMTP/SendGrid credentials) in production.
const sendEmail = async ({ to, subject, text }) => {
  console.log('--- [dev email stub] ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log('------------------------');
  return { delivered: false, dev: true };
};

module.exports = { sendEmail };
