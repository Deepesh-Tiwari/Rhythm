const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},

	connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 10000
});

// Verify connection configuration
transporter.verify(function (error, success) {
	if (error) {
		console.log("❌ Email Service Error:", error);
	} else {
		console.log("✅ Email Service is ready to send messages");
	}
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

		console.log("📧 Email sent: %s", info.messageId);
		return info;

	} catch (error) {
		console.error("Error sending email:", error);
		throw error;
	}
};

module.exports = sendEmail;