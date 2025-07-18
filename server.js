// Filename: server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors'); // Required for cross-origin requests

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// Middleware
app.use(bodyParser.json()); // To parse JSON request bodies
app.use(cors()); // Enable CORS for all origins (for development, restrict in production)

// IMPORTANT: Configure your email transporter
// You'll need to replace these with your actual email service credentials.
// For example, if using Gmail, you might need to set up an App Password.
// DO NOT hardcode sensitive credentials in production. Use environment variables.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // e.g., 'smtp.gmail.com' for Gmail
    port: 587, // or 465 for SSL
    secure: false, // true for 465, false for other ports (like 587)
    auth: {
        user: process.env.EMAIL_USER, // Your firm's email address
        pass: process.env.EMAIL_PASS // Your email password or app-specific password
    },
    tls: {
        // Do not fail on invalid certs (use only in development/testing if needed)
        rejectUnauthorized: false
    }
});

// Endpoint to handle contact form submissions
app.post('/send-email', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Email to the firm
    const mailOptionsToFirm = {
        from: process.env.EMAIL_USER, // Must be the same as your transporter's user
        to: process.env.EMAIL_USER, // The email address where the firm receives inquiries
        replyTo: email,
        subject: `New Inquiry from Website: ${subject}`,
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `
    };

    // Automatic reply to the client
    const mailOptionsToClient = {
        from: process.env.EMAIL_USER, // Must be the same as your transporter's user
        to: email, // Client's email address
        subject: 'Thank You for Your Inquiry - Inciarte & Gonzalez Abogados',
        html: `
            <p>Estimado/a ${name},</p>
            <p>Gracias por contactar a Inciarte & Gonzalez Abogados. Hemos recibido su consulta y nos pondremos en contacto con usted lo antes posible.</p>
            <p>Agradecemos su paciencia.</p>
            <p>Atentamente,</p>
            <p>El Equipo de Inciarte & Gonzalez Abogados</p>
            <p>---</p>
            <p>Dear ${name},</p>
            <p>Thank you for contacting Inciarte & Gonzalez Abogados. We have received your inquiry and will get back to you as soon as possible.</p>
            <p>We appreciate your patience.</p>
            <p>Sincerely,</p>
            <p>The Team at Inciarte & Gonzalez Abogados</p>
            <br>
        `
    };

    try {
        // Send email to the firm
        await transporter.sendMail(mailOptionsToFirm);
        console.log('Email sent to firm successfully');

        // Send automatic reply to the client
        await transporter.sendMail(mailOptionsToClient);
        console.log('Automatic reply sent to client successfully');

        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email.', error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
