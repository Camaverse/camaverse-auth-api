const transports = {
 PROD: {
     service: 'gmail',
     auth: {
         user: 'root@camaverse.com',
         pass: 'AsDf12!@-'
     }
 },
 DEV: {
    host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
        user: '9b5c8236956a18',
            pass: 'cef86e390c56d4'
    }
}
}

module.exports = transports;