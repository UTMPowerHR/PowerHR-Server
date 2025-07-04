import nodeMailer from 'nodemailer';

export default class Email {
    /** Send an email
     * @param {string} to - Email recipient
     * @param {string} subject - Email subject
     * @param {string} text - Email body
     * @returns {Promise<void>}
     * */
    static async sendEmail(to, subject, text) {
        try {
            // Check if email credentials are configured
            if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
                console.warn('Email credentials not configured. Skipping email sending.');
                return { error: true, message: 'Email credentials not configured' };
            }

            const transporter = nodeMailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // Use STARTTLS
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    // Don't fail on invalid certs for development
                    rejectUnauthorized: false,
                    // Allow legacy server
                    ciphers: 'SSLv3',
                },
                // Add connection timeout
                connectionTimeout: 60000, // 60 seconds
                greetingTimeout: 30000, // 30 seconds
                socketTimeout: 60000, // 60 seconds
            });

            // Test the connection
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified successfully');

            const mailOptions = {
                from: `"PowerHR System" <${process.env.EMAIL}>`,
                to,
                subject,
                text,
                html: text.replace(/\n/g, '<br>'),
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);

            // Try alternative configuration if the first one fails
            if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
                console.log('Trying alternative email configuration...');
                return await this.sendEmailAlternative(to, subject, text);
            }

            throw error;
        }
    }

    /** Alternative email configuration for problematic networks */
    static async sendEmailAlternative(to, subject, text) {
        try {
            const transporter = nodeMailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // Use SSL
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });

            const mailOptions = {
                from: `"PowerHR System" <${process.env.EMAIL}>`,
                to,
                subject,
                text,
                html: text.replace(/\n/g, '<br>'),
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully (alternative config):', info.messageId);
            return info;
        } catch (error) {
            console.error('Alternative email configuration also failed:', error);
            throw error;
        }
    }

    /** Send HTML email
     * @param {string} to - Email recipient
     * @param {string} subject - Email subject
     * @param {string} htmlContent - HTML email body
     * @returns {Promise<void>}
     * */
    static async sendHtmlEmail(to, subject, htmlContent) {
        try {
            // Check if email credentials are configured
            if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
                console.warn('Email credentials not configured. Skipping email sending.');
                return { error: true, message: 'Email credentials not configured' };
            }

            const transporter = nodeMailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // Use STARTTLS
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    // Don't fail on invalid certs for development
                    rejectUnauthorized: false,
                    ciphers: 'SSLv3',
                },
                // Add connection timeout
                connectionTimeout: 60000,
                greetingTimeout: 30000,
                socketTimeout: 60000,
            });

            // Test the connection
            console.log('Verifying SMTP connection...');
            await transporter.verify();
            console.log('SMTP connection verified successfully');

            const mailOptions = {
                from: `"PowerHR System" <${process.env.EMAIL}>`,
                to,
                subject,
                html: htmlContent,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('HTML email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending HTML email:', error);

            // Try alternative configuration if the first one fails
            if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
                console.log('Trying alternative HTML email configuration...');
                return await this.sendHtmlEmailAlternative(to, subject, htmlContent);
            }

            throw error;
        }
    }

    /** Alternative HTML email configuration */
    static async sendHtmlEmailAlternative(to, subject, htmlContent) {
        try {
            const transporter = nodeMailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // Use SSL
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });

            const mailOptions = {
                from: `"PowerHR System" <${process.env.EMAIL}>`,
                to,
                subject,
                html: htmlContent,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('HTML email sent successfully (alternative config):', info.messageId);
            return info;
        } catch (error) {
            console.error('Alternative HTML email configuration also failed:', error);
            throw error;
        }
    }
}
