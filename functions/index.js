const functions = require('firebase-functions');
const admin = require("firebase-admin")
const nodemailer = require('nodemailer');
const { google } = require('googleapis');


admin.initializeApp()

// firebase functions:config:set credentials.email=cloudcerebro.dev.09.2020@gmail.com

// firebase functions:config:set credentials.password=

// Enable less secure apps from security in Google account settings or

// Enable two-step authentication and set app password

// Enable unlock captcha from https://accounts.google.com/b/0/DisplayUnlockCaptcha

const EMAIL_ADDRESS = functions.config().credentials.email
const PASSWORD = functions.config().credentials.password
const SHEET_ID = '1yKrWB7x5TaIxN4b0pOpwZSOo_IYg8IuWYilGWgL3Dic'
const COUPONS_RANGE = 'Coupons!A2:B'


var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: EMAIL_ADDRESS,
        pass: PASSWORD
    }
});

exports.sendMailOverHTTP = functions.https.onCall((data, context) => {
    return new Promise((resolve, reject) => {
        console.log("Sending mail details: ", EMAIL_ADDRESS, PASSWORD);

        const mailOptions = {
            from: data.fromEmail,
            to: data.toEmail,
            subject: data.subject,
            html: data.body
        };

        console.log("Sending mail details: ");
        transporter.sendMail(mailOptions, (error, data) => {
            if (error) {
                console.log("Error sending email: ", error);
                reject(null);

            }
            console.log("Sent mail: ");

            var data = JSON.stringify(data)
            resolve(data);
        });
    });
});

exports.getDataFromSheetsApi = functions.https.onCall((data, context) => {
    return new Promise((resolve, reject) => {
        google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        }).then(async (auth) => {
            const api = google.sheets({ version: 'v4', auth });
            let response = await api.spreadsheets.values.get({
                spreadsheetId: data.sheetId,
                range: data.range,
            });
            console.log("Response in function:", response)

            return response.data
        })
            .then((data) => {
                resolve(data)
            })
            .catch(err => {
                reject(err)
            })
    });
});

exports.addDataToSheetsApi = functions.https.onCall((data, context) => {
    return new Promise((resolve, reject) => {
        google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        }).then(async (auth) => {
            const api = google.sheets({ version: 'v4', auth });
            let response = await api.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: data.range,
                resource: data.body,
                valueInputOption: data.valueInputOption,
                includeValuesInResponse: true
            })
            console.log("Response in function:", response)

            return response
        })
            .then((data) => {
                resolve(data)
            })
            .catch(err => {
                reject(err)
            })
    });
});

exports.appendDataToSheetsApi = functions.https.onCall((data, context) => {
    return new Promise((resolve, reject) => {
        google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        }).then(async (auth) => {
            const api = google.sheets({ version: 'v4', auth });
            let response = await api.spreadsheets.values.append({
                spreadsheetId: data.sheetId,
                range: data.range,
                resource: data.body,
                valueInputOption: data.valueInputOption,
                insertDataOption: data.insertDataOption
            })
            console.log("Response in function:", response)

            return response
        })
            // This just prints out all Worksheet names as an example
            .then((data) => {
                resolve(data)
            })
            .catch(err => {
                reject(err)
            })
    });
});

/* exports.getCoupons = functions.https.onCall((data, context) => {
    return new Promise((resolve, reject) => {
        google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        }).then(async (auth) => {
            const api = google.sheets({ version: 'v4', auth });
            let response = await api.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: COUPONS_RANGE,
            });
            console.log("Response in function:", response)

            return response
        })
            // This just prints out all Worksheet names as an example
            .then((data) => {
                resolve(data)
            })
            .catch(err => {
                reject(err)
            })
    });
});



exports.writeNewCellAppend = functions.https.onCall((data, context) => {
    return new Promise((resolve, reject) => {
        google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        }).then(async (auth) => {
            const api = google.sheets({ version: 'v4', auth });
            let response = await api.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: data.range,
                resource: data.body,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'OVERWRITE'
            })
            console.log("Response in function:", response)

            return response
        })
            // This just prints out all Worksheet names as an example
            .then((data) => {
                resolve(data)
            })
            .catch(err => {
                reject(err)
            })
    });
}); */
