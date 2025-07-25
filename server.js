// Filename: server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios'); // Import axios

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Endpoint to handle contact form submissions
app.post('/send-email', async (req, res) => {
    // Destructure all fields from the body, including the reCAPTCHA token
    const { name, email, subject, message, 'g-recaptcha-response': recaptchaToken } = req.body;

    // 1. VERIFY reCAPTCHA TOKEN
    if (!recaptchaToken) {
        return res.status(400).json({ message: 'reCAPTCHA is required.' });
    }

    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
        
        // Make a request to Google's verification server
        const verificationResponse = await axios.post(verificationUrl);
        const { success } = verificationResponse.data;

        if (!success) {
            return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
        }

        // 2. IF VERIFICATION SUCCEEDS, PROCEED WITH SENDING EMAIL

        // Basic validation for other fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Email to the firm
        const mailOptionsToFirm = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `New Inquiry from Website: ${subject}`,
            html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message}</p>`
        };

        // Automatic reply to the client
        const mailOptionsToClient = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank You for Your Inquiry - Inciarte & Gonzalez Abogados',
            html: `<p>Estimado/a ${name},</p><p>Gracias por contactar a Inciarte & Gonzalez Abogados. Hemos recibido su consulta y nos pondremos en contacto con usted lo antes posible.</p><p>Agradecemos su paciencia.</p><p>Atentamente,</p><p>El Equipo de Inciarte & Gonzalez Abogados</p><p>---</p><p>Dear ${name},</p><p>Thank you for contacting Inciarte & Gonzalez Abogados. We have received your inquiry and will get back to you as soon as possible.</p><p>We appreciate your patience.</p><p>Sincerely,</p><p>The Team at Inciarte & Gonzalez Abogados</p><br>`
        };

        // Send both emails
        await transporter.sendMail(mailOptionsToFirm);
        await transporter.sendMail(mailOptionsToClient);

        res.status(200).json({ message: 'Email sent successfully!' });

    } catch (error) {
        console.error('Error during reCAPTCHA verification or email sending:', error);
        res.status(500).json({ message: 'Failed to send email due to a server error.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});