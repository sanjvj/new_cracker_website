### Login to firebase

```bash
firebase login
```

### Deploy Firebase functions

```
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Configure environment for a new company

1) Update `js/config.js` with your brand and integrations:

```
COMPANY_NAME, MAIL_FROM_NAME, MAIL_FROM_EMAIL, MAILTO_EMAIL,
WHATSAPP_NUMBER, PHONE_NUMBER, SHEET_ID, MINIMUM_ORDER_AMOUNT,
FIREBASE_CONFIG
```

2) Set Firebase Functions runtime config for mail and Sheets:

```bash
firebase functions:config:set credentials.email="your.sender@gmail.com" \
  credentials.password="your_app_password" \
  sheets.id="YOUR_SHEET_ID"

firebase deploy --only functions
```

3) Create/update your Google Sheet tabs and ranges used in `js/main.js`:

```
Cracker List!A2:G
Categories!A2:A
Coupons!A2:B
Coupons!D2 (default discount)
WebsiteData!A2 (Last Bill Number)
WebsiteData!C2 (Vendor email)
WebsiteData!E2 (Minimum order amount)
Orders!A2:Q
```

4) If sending emails with Gmail, enable 2FA and create an App Password.

5) Update phone/WhatsApp numbers in `js/config.js` so header links work.

### Deploy Firebase hosting

```
firebase deploy --only hosting
```
