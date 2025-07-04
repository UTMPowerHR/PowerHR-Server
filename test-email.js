import Email from './util/Email.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
    try {
        console.log('Testing email configuration...');
        console.log('Email:', process.env.EMAIL);
        console.log('Password configured:', !!process.env.EMAIL_PASSWORD);

        await Email.sendHtmlEmail(
            'kagineswaran@gmail.com', // Replace with your test email
            'Test Email from PowerHR System',
            `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Test Email</h2>
        <p>This is a test email to verify the email functionality is working correctly.</p>
        <p>If you receive this email, the configuration is working!</p>
      </div>
      `,
        );

        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Test email failed:', error);
    }
}

testEmail();
