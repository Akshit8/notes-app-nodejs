const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

sgMail.send({
    to : 'akimac842@gmail.com',
    from : 'akshitsadana@gmail.com',
    subject : 'this is a test email',
    text : 'this mail has been sent using sendgrid'
})