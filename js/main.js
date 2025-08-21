var getDataFromSheetsApi = null;
var appendDataToSheetsApi = null;
var addDataToSheetsApi = null;



const SHEET_ID = window.APP_CONFIG && window.APP_CONFIG.SHEET_ID ? window.APP_CONFIG.SHEET_ID : 'REPLACE_WITH_SHEET_ID'

const CRACKERS_RANGE = 'Cracker List!A2:G'
const CATEGORIES_RANGE = 'Categories!A2:A'
const COUPONS_RANGE = 'Coupons!A2:B'
const DEFAULT_DISCOUNT_RANGE = 'Coupons!D2'
const LAST_BILL_NUMBER_RANGE = 'WebsiteData!A2'
const ORDERS_RANGE = 'Orders!A2:Q'
const VENDOR_EMAIL_RANGE = 'WebsiteData!C2'
const MINIMUM_ORDER_RANGE = 'WebsiteData!E2'

const VENDOR_EMAIL = window.APP_CONFIG && window.APP_CONFIG.MAILTO_EMAIL ? window.APP_CONFIG.MAILTO_EMAIL : ''
const MINIMUM_ORDER_AMOUNT = window.APP_CONFIG && window.APP_CONFIG.MINIMUM_ORDER_AMOUNT ? window.APP_CONFIG.MINIMUM_ORDER_AMOUNT : 3000

function reInitWebflow() {
    //RE-INIT WF as Vue.js init breaks WF interactions
    console.log("Webflow window:", Webflow);

    window.Webflow && window.Webflow.destroy();
    window.Webflow && window.Webflow.ready();
    window.Webflow && window.Webflow.require('ix2').init();

    document.dispatchEvent(new Event('readystatechange'));
    console.log("Initializing:", Webflow);
    // IX 2 Fix for if you have different interactions at different breakpoints
    var resizeTimer;
    $(window).on('resize', function (e) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            //When the page is resized re-start animations
            document.dispatchEvent(new Event('readystatechange'));
        }, 500);
    });
}


function initFirebase() {
    console.log("Init firebase:",);

    var firebaseConfig = (window.APP_CONFIG && window.APP_CONFIG.FIREBASE_CONFIG) ? window.APP_CONFIG.FIREBASE_CONFIG : {};
    firebase.initializeApp(firebaseConfig);
    getDataFromSheetsApi = firebase.app().functions('us-central1').httpsCallable('getDataFromSheetsApi')
    addDataToSheetsApi = firebase.app().functions('us-central1').httpsCallable('addDataToSheetsApi')
    appendDataToSheetsApi = firebase.app().functions('us-central1').httpsCallable('appendDataToSheetsApi')

    /* cSpell:enable */

}

function validateEmail(email) {
    console.log("Email:", email);

    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    console.log("Email validation result:", re.test(String(email).toLowerCase()));

    return re.test(String(email).toLowerCase());
}

