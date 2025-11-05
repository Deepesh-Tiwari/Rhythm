const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const sendEmail = async (options) => {
  try {
    // 2. Define the email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // 3. Send the email and get info
    const info = await transporter.sendMail(mailOptions);

    // For development with Ethereal, log the preview URL
    if (process.env.EMAIL_HOST.includes("ethereal.email")) {
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

  } catch (error) {
    console.error("Error sending email:", error);
    // In a real app, you might want to throw this error
    // or use a more robust logging service.
  }
};

module.exports = sendEmail;