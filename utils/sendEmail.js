const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, firstName, code) => {
  const { data, error } = await resend.emails.send({
    from: 'HISSA Connect <onboarding@resend.dev>',
    to: email,
    subject: 'Verify Your HISSA Connect Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #7f1d1d; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">HISSA Connect</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a1a;">Hi ${firstName}!</h2>
          <p style="color: #555;">Thank you for signing up. Use the verification code below to complete your registration:</p>
          <div style="background-color: #7f1d1d; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #555;">This code expires in <strong>10 minutes</strong>.</p>
          <p style="color: #555;">If you didn't create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} HISSA Connect. All rights reserved.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(error.message);
  }

  console.log('Email sent successfully:', data);
};

module.exports = { sendVerificationEmail };