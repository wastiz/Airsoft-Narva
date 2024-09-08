const nodemailer = require("nodemailer");
const eventConfig = require("./event-config.json");

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'narvacqbarena@gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
})

const sendMail = async (mailOptions) => {
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error(error);
    }
}

module.exports = {sendMail}