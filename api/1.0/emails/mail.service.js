require('dotenv').config()

const nodemailer = require('nodemailer');
const sprintf = require('sprintf-js').sprintf;

const transports = require('./emailTransports');

const transport = nodemailer.createTransport(transports.PROD);

const messages = {
  accountCreated: {
      from: 'us@camaverse.com', // Sender address
      to: '%1$s',         // List of recipients
      subject: 'Your Account Has Been Created', // Subject line
      text: 'Welcome to Camaverse!!!' // Plain text body
  },
  loginLink: {
      from: 'us@camaverse.com', // Sender address
      to: '%1$s',        // List of recipients
      subject: 'Your login link', // Subject line
      html: `<p>Login by clicking <a href="%3$s/login/%2$s">here</a>.</p><p>If that didn't work use this link: %3$s/login/%2$s </p>`// Plain text body
  },
};

const sendMail = ( message, vars ) => {
    const msg = {...messages[message]};
    const keys = Object.keys(msg);
    keys.forEach( key => {
        msg[key] = sprintf(msg[key], vars.email, vars.token, process.env.MAIL_LOGIN_URL)
    });

   transport.sendMail(msg, function(err, info) {
       if (err) {
           console.log(err)
       } else {
           console.log(info);
       }
   })
};

module.exports = sendMail;