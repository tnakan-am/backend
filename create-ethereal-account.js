const nodemailer = require('nodemailer');

async function createEtherealAccount() {
  try {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    console.log('Ethereal Email Test Account Created:');
    console.log('=====================================');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('SMTP Host:', testAccount.smtp.host);
    console.log('SMTP Port:', testAccount.smtp.port);
    console.log('');
    console.log('Add these to your .env file:');
    console.log('-----------------------------');
    console.log(`SMTP_HOST=${testAccount.smtp.host}`);
    console.log(`SMTP_PORT=${testAccount.smtp.port}`);
    console.log(`SMTP_USER=${testAccount.user}`);
    console.log(`SMTP_PASS=${testAccount.pass}`);
    console.log(`SMTP_FROM=${testAccount.user}`);
    console.log('');
    console.log('View sent emails at: https://ethereal.email/messages');
    console.log('Login with the email and password above');
  } catch (error) {
    console.error('Error creating test account:', error);
  }
}

createEtherealAccount();