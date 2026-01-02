const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // ✅ DEBUGGING & FIXES
    logger: true,        // Log SMTP traffic to console
    debug: true,         // Include debug info
    allowIPv6: false,    // Force IPv4 (Fixes many Docker network issues)
});

// Verify connection configuration
console.log(`🔌 Attempting to connect to ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}...`);

transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ Email Service Error:", error);
    } else {
        console.log("✅ Email Service is ready to send messages");
    }
});

const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("📧 Email sent: %s", info.messageId);
        return info;

    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = sendEmail;