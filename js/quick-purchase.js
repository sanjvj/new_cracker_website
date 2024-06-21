// Upload image in google drive and paste image id in the format:
// https://drive.google.com/uc?export=view&id=file's ID

// import productCategory from '../components/ProductCategory.vue'

new Vue({
  el: "#q-quick-purchase",
  components: {
    ProductCategory: () => import("../components/ProductCategory.vue"),
  },
  data: function () {
    return {
      displayImageUrl: null,
      showImageDialog: false,
      isTermsAccepted: false,
      defaultDiscount: "50",
      vendorEmail: "cloudcerebro.dev.09.2020@gmail.com",
      minimumOrderAmount: 3000,
      items: [],
      categories: [],
      categorizedItems: [],
      coupons: [],
      isCouponApplied: false,
      isCouponInvalid: false,
      lastBillNumber: "",
      orderDetails: {
        id: null,
        fullName: "",
        address: "",
        pincode: "",
        mobileNumber: "",
        email: "",
        defaultDiscount: "",
        coupon: "",
        couponApplied: null,
        billNumber: null,
        giftClaimed: false,
        items: [],
        subTotalA: null,
        discountAmount: null,
        subTotalB: null,
        nonDiscountTotal: null,
        grandTotal: null,
      },
      productsLoading: false,
    };
  },
  computed: {
    selectedItems() {
      let selectedItems = [];
      this.items?.forEach((item) => {
        if (item.quantity > 0 && item.availability === "Available") {
          selectedItems.push(item);
        }
      });
      return selectedItems;
    },
    // SubTotalA - Discounted Items Total
    subTotalA() {
      let subTotal = 0;
      this.selectedItems?.forEach((item) => {
        if (item.isDiscounted) {
          subTotal += item.price * item.quantity;
        }
      });
      return parseFloat(subTotal).toFixed(2);
    },
    discountAmount() {
      let total = 0;
      let discountPercent = parseFloat(this.defaultDiscount) / 100;
      if (this.isCouponApplied) {
        discountPercent =
          parseFloat(this.orderDetails.couponApplied.discountPercent) / 100;
      }
      this.selectedItems.forEach((item) => {
        if (item.isDiscounted) {
          total += item.price * item.quantity * discountPercent;
        }
      });
      return parseFloat(total).toFixed(2);
    },
    // SubTotalB - Discounted Items Less Total
    subTotalB() {
      return (
        parseFloat(this.subTotalA) - parseFloat(this.discountAmount)
      ).toFixed(2);
    },
    nonDiscountTotal() {
      let subTotal = 0;
      this.selectedItems?.forEach((item) => {
        if (!item.isDiscounted) {
          subTotal += item.price * item.quantity;
        }
      });
      return parseFloat(subTotal).toFixed(2);
    },
    grandTotal() {
      return (
        parseFloat(this.subTotalB) + parseFloat(this.nonDiscountTotal)
      ).toFixed(2);
    },
  },
  mounted() {
    // reInitWebflow()
    initFirebase();
    this.listData();
    // this.scrollToTop()

    /* this.$nextTick(() => {
            window.scrollTo(0, 500);

        }) */
    // this.loadGapiClient()
  },
  methods: {
    openImage(imageUrl) {
      this.displayImageUrl = imageUrl;
      this.showImageDialog = true;
    },
    async listData() {
      try {
        this.productsLoading = true;
        this.getCoupons();
        this.getVendorEmail();
        this.getMinimumOrderAmount();
        this.getDefaultDiscount();
        if (this.isTermsAccepted) {
          this.$q.loading.show({
            spinnerColor: "#ffda6a",
          });
        }
        await this.getCategories();
        await this.getItems();
        this.categorizedItems = await this.getItemsCategorized();
        console.log("Cat items:", this.categorizedItems);
        this.scrollToTop();

        this.productsLoading = false;
      } catch (error) {
        console.log("Error:", error);
        this.productsLoading = false;
      }

      this.$q.loading.hide();
    },
    getItemsCategorized() {
      let categorizedItems = [];
      return new Promise((resolve, reject) => {
        this.categories.forEach((category) => {
          if (!categorizedItems[category]) {
            categorizedItems[category] = [];
          }
          this.items.forEach((item) => {
            if (item.category === category) {
              categorizedItems[category].push(item);
            }
          });
        });
        resolve(categorizedItems);
      });
    },
    async scrollToTop() {
      setTimeout(() => {
        console.log("Scrolling:");
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 1000);
    },
    async placeEnquiry() {
      // this.scrollToTop()
      if (!this.validateForm()) return;
      try {
        this.$q.loading.show({
          spinnerColor: "amber-12",
          backgroundColor: "grey-4",
          message:
            '<span class=" text-black text-weight-bold">Sending enquiry...</span>',
        });
        await this.getItemsForVerification();
        await this.setOrderDetails();
        await this.saveOrderToSheets(this.orderDetails);
        await this.saveLastBillNumberToSheets(this.orderDetails);

        this.$q.loading.hide();

        this.$q
          .dialog({
            title: "Enquiry placed",
            message: `Bill number: ${this.orderDetails.billNumber}`,
          })
          .onDismiss(() => {
            this.scrollToTop();
          });
        await this.sendEnquiryPlacedMails();
        await this.resetAll();
      } catch (error) {
        console.log("Place enquiry error:", error);
        this.$q.dialog({
          title: "Enquiry failed",
          message: `Please try again`,
        });
        this.$q.loading.hide();
      }
    },
    acceptTerms() {
      this.isTermsAccepted = true;
      if (!this.isItemsLoaded) {
        this.$q.loading.show({
          spinnerColor: "#ffda6a",
        });
      }
    },
    sendEnquiryPlacedMails() {
      return new Promise((resolve, reject) => {
        let iterationContent = "";
        this.orderDetails.items.forEach((item) => {
          if (item.imageUrl) {
            iterationContent += `<table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%; border-width: 1px; border-style: solid; border-color: #e8e8e8; border-top: none; border-left: none; border-right: none;">
                        <tr>
                           <td align="left" valign="middle" width="17%" style="width: 17%; max-width: 17%; min-width: 20px">
                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                             
                                 <img src="${item.imageUrl}" alt="img" width="99" border="0" style="display: block; width: 99px; max-width: 100%;" />
                             
                             <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                           </td>
                           <td width="10" style="width: 10px; max-width: 10px; min-width: 10px;">&nbsp;</td>
                           <td align="left" valign="top" width="67%" style="width: 50%; max-width: 67%; min-width: 90px">
                              <div style="height: 15px; line-height: 15px; font-size: 13px;">&nbsp;</div>
                              
                              <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 16px; line-height: 22px; font-weight: 600;">${item.name}</span>
                              
                                 <div style="height: 2px; line-height: 2px; font-size: 1px;">&nbsp;</div>
                             
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 13px; line-height: 20px;">${item.category}</span>
                                 <div style="height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</div>
                             
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 13px; line-height: 20px;">PER ${item.pricePer}</span>
                             
                              <div style="height: 15px; line-height: 15px; font-size: 13px;">&nbsp;</div>
                           </td>
                           <td width="7" style="width: 7px; max-width: 7px; min-width: 7px;">&nbsp;</td>
                           <td align="right" valign="top" width="12%" style="width: 12%; max-width: 12%; min-width: 70px">
                              <div style="height: 22px; line-height: 22px; font-size: 20px;">&nbsp;</div>
                              <font class="mob_name" face="'Source Sans Pro', sans-serif" color="#333333" style="font-size: 24px; line-height: 27px;">
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;"></span></font><font class="mob_name" style="font-size: 24px; line-height: 27px;"><span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">${item.quantity}</span></font>
                              
                                 <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                           </td>
                           <td align="right" valign="top" width="12%" style="width: 15%; max-width: 15%; min-width: 84px">
                              <div style="height: 22px; line-height: 22px; font-size: 20px;">&nbsp;</div>
                              <font class="mob_name" face="'Source Sans Pro', sans-serif" color="#333333" style="font-size: 24px; line-height: 27px;">
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">₹</span></font><font class="mob_name" style="font-size: 24px; line-height: 27px;"><span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">${item.price}</span></font>
                              
                                 <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                           </td>
                        </tr>
                     </table>`;
          } else {
            iterationContent += `<table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%; border-width: 1px; border-style: solid; border-color: #e8e8e8; border-top: none; border-left: none; border-right: none;">
                        <tr>
                           <td align="left" valign="top" width="67%" style="width: 50%; max-width: 67%; min-width: 90px">
                              <div style="height: 15px; line-height: 15px; font-size: 13px;">&nbsp;</div>
                              
                              <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 16px; line-height: 22px; font-weight: 600;">${item.name}</span>
                              
                                 <div style="height: 2px; line-height: 2px; font-size: 1px;">&nbsp;</div>
                             
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 13px; line-height: 20px;">${item.category}</span>
                                 <div style="height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</div>
                             
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 13px; line-height: 20px;">PER ${item.pricePer}</span>
                             
                              <div style="height: 15px; line-height: 15px; font-size: 13px;">&nbsp;</div>
                           </td>
                           <td width="7" style="width: 7px; max-width: 7px; min-width: 7px;">&nbsp;</td>
                           <td align="right" valign="top" width="12%" style="width: 12%; max-width: 12%; min-width: 70px">
                              <div style="height: 22px; line-height: 22px; font-size: 20px;">&nbsp;</div>
                              <font class="mob_name" face="'Source Sans Pro', sans-serif" color="#333333" style="font-size: 24px; line-height: 27px;">
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;"></span></font><font class="mob_name" style="font-size: 24px; line-height: 27px;"><span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">${item.quantity}</span></font>
                              
                                 <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                           </td>
                           <td align="right" valign="top" width="12%" style="width: 15%; max-width: 15%; min-width: 84px">
                              <div style="height: 22px; line-height: 22px; font-size: 20px;">&nbsp;</div>
                              <font class="mob_name" face="'Source Sans Pro', sans-serif" color="#333333" style="font-size: 24px; line-height: 27px;">
                                 <span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">₹</span></font><font class="mob_name" style="font-size: 24px; line-height: 27px;"><span class="mob_name" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 27px;">${item.price}</span></font>
                              
                                 <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                           </td>
                        </tr>
                     </table>`;
          }
        });
        let couponContent = "";
        let discountPercent = this.orderDetails.defaultDiscount;
        if (this.orderDetails.couponApplied) {
          discountPercent = this.orderDetails.couponApplied.discountPercent;
          couponContent = `<table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;">
                    <tr>
                       <td align="center" valign="top">
                          <div style="height: 28px; line-height: 28px; font-size: 26px;">&nbsp;</div>
                          <table class="mob_btn" cellpadding="0" cellspacing="0" border="0" style="width: 100% !important; max-width: 100%; min-width: 180px; background: #fce6a3; border-radius: 4px; padding: 12px;">
                             <tr><td align="center" valign="middle">
                             <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: black; font-size: 16px; line-height: 22px;">Coupon (${this.orderDetails.couponApplied.name}) applied successfully!</span>
                          </td>
                          </tr>
                          </table>
                       </td>
                    </tr>
                 </table>`;
        }
        let mailBody = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
                <html>
                <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8" >
                <title></title>
                <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
                <style type="text/css">
                html { -webkit-text-size-adjust: none; -ms-text-size-adjust: none; background: #f3f3f3;}
                
                    @media only screen and (min-device-width: 650px) {
                        .table650 {width: 650px !important;}
                    }
                    @media only screen and (max-device-width: 650px), only screen and (max-width: 650px){
                      table[class="table650"] {width: 100% !important;}
                      .mob_b {width: 93% !important; max-width: 93% !important; min-width: 93% !important;}
                      .mob_b1 {width: 100% !important; max-width: 100% !important; min-width: 100% !important;}
                      .mob_left {text-align: left !important;}
                      .mob_soc {width: 50% !important; max-width: 50% !important; min-width: 50% !important;}
                      .mob_menu {width: 50% !important; max-width: 50% !important; min-width: 50% !important; box-shadow: inset -1px -1px 0 0 rgba(255, 255, 255, 0.2); }
                      .top_pad {height: 15px !important; max-height: 15px !important; min-height: 15px !important;}
                      .mob_pad {width: 15px !important; max-width: 15px !important; min-width: 15px !important;}
                      .top_pad2 {height: 40px !important; max-height: 40px !important; min-height: 40px !important;}
                      .min_pad {height: 16px !important; max-height: 16px !important; min-height: 16px !important;}
                      .min_pad2 {height: 28px !important; max-height: 28px !important; min-height: 26px !important;}
                      .mob_title1 {font-size: 36px !important; line-height: 40px !important;}
                      .mob_title2 {font-size: 26px !important; line-height: 33px !important;}
                      .mob_name {font-size: 17px !important; line-height: 20px !important;}
                     
                     }
                   @media only screen and (max-device-width: 600px), only screen and (max-width: 600px){
                      .mob_div {width: 100% !important; max-width: 100% !important; min-width: 100% !important;}
                      .mob_tab {width: 88% !important; max-width: 88% !important; min-width: 88% !important;}
                   }
                   @media only screen and (max-device-width: 550px), only screen and (max-width: 550px){
                      .mod_div {display: block !important;}
                        .mob_btn {width: 100% !important; max-width: 100% !important; min-width: 100% !important;}
                   }
                    .table650 {width: 650px;}
                </style>
                </head>
                <body style="margin: 0; padding: 0;">
                
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f3f3f3; min-width: 350px; font-size: 1px; line-height: normal;">
                     <tr>
                       <td align="center" valign="top">   			
                           
                           <table cellpadding="0" cellspacing="0" border="0" width="650" class="table650" style="width: 100%; max-width: 650px; min-width: 350px; background: #f3f3f3;">
                               <tr>
                               <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                                   <td align="center" valign="top" style="background: #ffffff;">
                
                                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                                     <tr>
                                        <td align="right" valign="top">
                                           <div class="top_pad" style="height: 25px; line-height: 25px; font-size: 23px;">&nbsp;</div>
                                        </td>
                                     </tr>
                                  </table>
                
                                  <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;">
                                     <tr>
                                        <td align="center" valign="top">
                                           <div style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
                                           
                                              <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif;font-size:32px; color:#ff0000; text-decoration-line: none;font-weight: 700;">AJ Crackers</span>
                                           <div class="top_pad2" style="height: 50px; line-height: 50px; font-size: 50px;">&nbsp;</div>
                                        </td>
                                     </tr>
                                  </table>
                
                                  <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 90%;">
                                     <tr>
                                       <td align="left" valign="top" class="mob_title1" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 24px; font-weight: normal; letter-spacing: -1.5px;">Bill No. : ${
                                         this.orderDetails.billNumber
                                       }
                                       <div style="height: 12px; line-height: 12px; font-size: 12px;">&nbsp;</div></td>
                              </tr>
                                     <tr>
                                       <td align="left" valign="top" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #666666; font-size: 16px;">
                                       <span style="font-size: 20px;">${
                                         this.orderDetails.fullName
                                       }</span><br></strong>
                                       <div style="height: 10px; line-height: 10px; font-size: 38px;">&nbsp;</div>
                                       <span style="font-size: 14px;">
                                       ${this.orderDetails.address.replace(
                                         "\n",
                                         "<br>"
                                       )} <br>
                                       ${this.orderDetails.pincode} <br>
                                       ${this.orderDetails.mobileNumber} <br>
                                       ${this.orderDetails.email} <br>
                                     </span>
                <div style="height: 30px; line-height: 30px; font-size: 38px;">&nbsp;</div>
                                       </td>
                                     </tr>
                            </table>
                
                                  <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%; border-width: 1px; border-style: solid; border-color: #e8e8e8; border-top: none; border-left: none; border-right: none;">
                                     <tr>
                                        <td align="left" valign="top" width="17%" style="width: 17%; max-width: 17%; min-width: 20px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                           <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                        
                                              Product
                                        
                                           <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                        </td>
                                        <td width="10" style="width: 10px; max-width: 10px; min-width: 10px;">&nbsp;</td>
                                        <td align="left" valign="top" width="67%" style="width: 67%; max-width: 67%; min-width: 90px">&nbsp;</td>
                                        <td width="7" style="width: 7px; max-width: 7px; min-width: 7px;">&nbsp;</td>
                                        <td align="right" valign="top" width="12%" style="width: 12%; max-width: 12%; min-width: 70px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                           <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                        Qty
                                           <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                        </td>
                                        <td align="right" valign="top" width="12%" style="width: 15%; max-width: 15%; min-width: 84px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                           <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                        Price
                                           <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                        </td>
                                     </tr>
                                  </table>
                
                                  ${iterationContent}
                                  
                
                                         
                <!-- Coupon Block START -->
                ${couponContent}
                <!-- Coupon Block ENDS -->
                                  <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;">
                                     <tr>
                                        <td align="left" valign="top">
                                           <div style="height: 28px; line-height: 28px; font-size: 26px;">&nbsp;</div>
                                           <table class="mob_btn" cellpadding="0" cellspacing="0" border="0" width="180" style="width: 100% !important; max-width: 100%; min-width: 180px; background: #000000; border-radius: 4px; padding: 12px;">
                                              <tr>
                                                 <td align="right" valign="middle" height="32">
                                                    <span style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                      Sub Total (A) : ₹ ${
                                                        this.orderDetails
                                                          .subTotalA
                                                      }
                                                    </span>
                                                 </td>
                                              </tr>
                                              <tr>
                                                 <td align="right" valign="middle" height="32">
                                                    <span style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                      Discount (${discountPercent}% OFF) : ₹ ${
          this.orderDetails.discountAmount
        }
                                                    </span>
                                                 </td>
                                              </tr>
                                              <tr>
                                                 <td align="justify" valign="middle" height="1" bgcolor="white"></td>
                                              </tr>
                                              <tr>
                                                 <td align="right" valign="middle" height="32">
                                                    <span style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                      Sub Total (B) : ₹ ${
                                                        this.orderDetails
                                                          .subTotalB
                                                      }
                                                    </span>
                                                 </td>
                                              </tr>
                                              <tr>
                                                 <td align="right" valign="middle" height="32">
                                                    <span style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                      Non Discounted Items : ₹ ${
                                                        this.orderDetails
                                                          .nonDiscountTotal
                                                      }
                                                    </span>
                                                 </td>
                                              </tr>
                                              <tr>
                                                 <td align="justify" valign="middle" height="1" bgcolor="white"></td>
                                              </tr>
                                              <tr>
                                                 <td align="right" valign="bottom" height="36" >
                                                    <span style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffda6a; font-size: 20px; line-height: 24px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                      Grand Total : ₹ ${
                                                        this.orderDetails
                                                          .grandTotal
                                                      }
                                                    </span>
                                                 </td>
                                              </tr>
                                           </table>
                                           <div class="min_pad2" style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
                                        </td>
                                     </tr>
                                  </table>                  
                
                                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100% !important; min-width: 100%; max-width: 100%; background: #999999;">
                              <tr>
                                <td align="center" valign="top"> <div style="height: 34px;">&nbsp;</div>
                                  
                                        <div style="height: 15px;">&nbsp;</div>
                                        <font face="'Source Sans Pro', sans-serif" color="#ffffff" style="font-size: 14px;line-height: 22px; "> Thank you for ordering from AJ Crackers!<br> Wishing you a Happy Diwali! </font>
                                       
                                      
                                        <div style="height: 34px;">&nbsp;</div>
                                       
                                        <div style="height: 34px;">&nbsp;</div>
                                    </tr>
                                </table></td>
                              </tr>
                            </table>  
                
                               </td>
                               <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                            </tr>
                         </table>
                        
                      </td>
                   </tr>
                </table>
                </body>
                </html>`;

        let mailBody2 = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
                <html>
                
                <head>
                   <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                   <title></title>
                   <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
                   <style type="text/css">
                      html {
                         -webkit-text-size-adjust: none;
                         -ms-text-size-adjust: none;
                         background: #f3f3f3;
                      }
                
                      @media only screen and (min-device-width: 650px) {
                         .table650 {
                            width: 650px !important;
                         }
                      }
                
                      @media only screen and (max-device-width: 650px),
                      only screen and (max-width: 650px) {
                         table[class="table650"] {
                            width: 100% !important;
                         }
                
                         .mob_b {
                            width: 93% !important;
                            max-width: 93% !important;
                            min-width: 93% !important;
                         }
                
                         .mob_b1 {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-width: 100% !important;
                         }
                
                         .mob_left {
                            text-align: left !important;
                         }
                
                         .mob_soc {
                            width: 50% !important;
                            max-width: 50% !important;
                            min-width: 50% !important;
                         }
                
                         .mob_menu {
                            width: 50% !important;
                            max-width: 50% !important;
                            min-width: 50% !important;
                            box-shadow: inset -1px -1px 0 0 rgba(255, 255, 255, 0.2);
                         }
                
                         .top_pad {
                            height: 15px !important;
                            max-height: 15px !important;
                            min-height: 15px !important;
                         }
                
                         .mob_pad {
                            width: 15px !important;
                            max-width: 15px !important;
                            min-width: 15px !important;
                         }
                
                         .top_pad2 {
                            height: 40px !important;
                            max-height: 40px !important;
                            min-height: 40px !important;
                         }
                
                         .min_pad {
                            height: 16px !important;
                            max-height: 16px !important;
                            min-height: 16px !important;
                         }
                
                         .min_pad2 {
                            height: 28px !important;
                            max-height: 28px !important;
                            min-height: 26px !important;
                         }
                
                         .mob_title1 {
                            font-size: 36px !important;
                            line-height: 40px !important;
                         }
                
                         .mob_title2 {
                            font-size: 26px !important;
                            line-height: 33px !important;
                         }
                
                         .mob_name {
                            font-size: 17px !important;
                            line-height: 20px !important;
                         }
                
                      }
                
                      @media only screen and (max-device-width: 600px),
                      only screen and (max-width: 600px) {
                         .mob_div {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-width: 100% !important;
                         }
                
                         .mob_tab {
                            width: 88% !important;
                            max-width: 88% !important;
                            min-width: 88% !important;
                         }
                      }
                
                      @media only screen and (max-device-width: 550px),
                      only screen and (max-width: 550px) {
                         .mod_div {
                            display: block !important;
                         }
                
                         .mob_btn {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-width: 100% !important;
                         }
                      }
                
                      .table650 {
                         width: 650px;
                      }
                   </style>
                </head>
                
                <body style="margin: 0; padding: 0;">
                
                   <table cellpadding="0" cellspacing="0" border="0" width="100%"
                      style="background: #f3f3f3; min-width: 350px; font-size: 1px; line-height: normal;">
                      <tr>
                         <td align="center" valign="top">
                
                            <table cellpadding="0" cellspacing="0" border="0" width="650" class="table650"
                               style="width: 100%; max-width: 650px; min-width: 350px; background: #f3f3f3;">
                               <tr>
                                  <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                                  <td align="center" valign="top" style="background: #ffffff;">
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="100%"
                                        style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                                        <tr>
                                           <td align="right" valign="top">
                                              <div class="top_pad" style="height: 25px; line-height: 25px; font-size: 23px;">&nbsp;
                                              </div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 88%;">
                                        <tr>
                                           <td align="left" valign="top">
                                              <div style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
                
                                              <span
                                                 style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif;font-size:32px; color:#31018a; text-decoration-line: none;font-weight: 700;">AJ
                                                 Crackers</span>
                                              <div class="top_pad2" style="height: 50px; line-height: 50px; font-size: 50px;">&nbsp;
                                              </div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 90%;">
                                        <tr>
                                           <td align="left" valign="top" class="mob_title1"
                                              style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 24px; font-weight: normal; letter-spacing: -1.5px;">
                                              Bill No. : ${this.orderDetails.billNumber}
                                              <div style="height: 12px; line-height: 12px; font-size: 12px;">&nbsp;</div>
                                           </td>
                                        </tr>
                                        <tr>
                                           <td align="left" valign="top"
                                              style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #666666; font-size: 16px;">
                                              <span style="font-size: 20px;">${this.orderDetails.fullName}</span><br></strong>
                                              <div style="height: 10px; line-height: 10px; font-size: 38px;">&nbsp;</div>
                                              <span style="font-size: 14px;">
                                                 <pre>${this.orderDetails.address}</pre> <br>
                                                 ${this.orderDetails.pincode} <br>
                                                 ${this.orderDetails.mobileNumber} <br>
                                                 ${this.orderDetails.email} <br>
                                              </span>
                                              <div style="height: 30px; line-height: 30px; font-size: 38px;">&nbsp;</div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 88%; border-width: 1px; border-style: solid; border-color: #e8e8e8; border-top: none; border-left: none; border-right: none;">
                                        <tr>
                                           <td align="left" valign="top" width="17%"
                                              style="width: 17%; max-width: 17%; min-width: 20px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                
                                              Product
                
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                           </td>
                                           <td width="10" style="width: 10px; max-width: 10px; min-width: 10px;">&nbsp;</td>
                                           <td align="left" valign="top" width="67%"
                                              style="width: 67%; max-width: 67%; min-width: 90px">&nbsp;</td>
                                           <td width="7" style="width: 7px; max-width: 7px; min-width: 7px;">&nbsp;</td>
                                           <td align="right" valign="top" width="12%"
                                              style="width: 12%; max-width: 12%; min-width: 70px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                              Qty
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                           </td>
                                           <td align="right" valign="top" width="12%"
                                              style="width: 15%; max-width: 15%; min-width: 84px; font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 18px; line-height: 28px; font-weight: 600;">
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                              Price
                                              <div style="height: 10px; line-height: 10px; font-size: 10px;">&nbsp;</div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <!-- Items -->
                                     ${iterationContent}
                
                                     <!-- Coupon Block START -->
                                     ${couponContent}
                                     <!-- Coupon Block ENDS -->
                                     <table cellpadding="0" cellspacing="0" border="0" width="88%"
                                        style="width: 88% !important; min-width: 88%; max-width: 88%;">
                                        <tr>
                                           <td align="left" valign="top">
                                              <div style="height: 28px; line-height: 28px; font-size: 26px;">&nbsp;</div>
                                              <table class="mob_btn" cellpadding="0" cellspacing="0" border="0" width="180"
                                                 style="width: 100% !important; max-width: 100%; min-width: 180px; background: #31018a; border-radius: 4px; padding: 12px;">
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Sub Total (A) : ₹ ${this.orderDetails.subTotalA}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Discount (${discountPercent}% OFF) : ₹ ${this.orderDetails.discountAmount}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="justify" valign="middle" height="1" bgcolor="white"></td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Sub Total (B) : ₹ ${this.orderDetails.subTotalB}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="middle" height="32">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 16px; line-height: 18px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Non Discounted Items : ₹ ${this.orderDetails.nonDiscountTotal}
                                                       </span>
                                                    </td>
                                                 </tr>
                                                 <tr>
                                                    <td align="justify" valign="middle" height="1" bgcolor="white"></td>
                                                 </tr>
                                                 <tr>
                                                    <td align="right" valign="bottom" height="36">
                                                       <span
                                                          style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffda6a; font-size: 20px; line-height: 24px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                                          Grand Total : ₹ ${this.orderDetails.grandTotal}
                                                       </span>
                                                    </td>
                                                 </tr>
                                              </table>
                                              <div class="min_pad2" style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;
                                              </div>
                                           </td>
                                        </tr>
                                     </table>
                
                                     <table cellpadding="0" cellspacing="0" border="0" width="100%"
                                        style="width: 100% !important; min-width: 100%; max-width: 100%; background: #999999;">
                                        <tr>
                                           <td align="center" valign="top">
                                              <div style="height: 34px;">&nbsp;</div>
                
                                              <div style="height: 15px;">&nbsp;</div>
                                              <font face="'Source Sans Pro', sans-serif" color="#ffffff"
                                                 style="font-size: 14px;line-height: 22px; "> Thank you for ordering from AJ
                                                 Crackers!<br> "Your Joy is Our Pride" </font>
                
                
                                              <div style="height: 34px;">&nbsp;</div>
                
                                              <div style="height: 34px;">&nbsp;</div>
                                        </tr>
                                     </table>
                                  </td>
                               </tr>
                            </table>
                
                         </td>
                         <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                      </tr>
                   </table>
                
                   </td>
                   </tr>
                   </table>
                </body>
                
                </html>`;

        const sendMailOverHTTP = firebase
          .app()
          .functions("us-central1")
          .httpsCallable("sendMailOverHTTP");

        var vendorSubject = `Enquiry from ${this.orderDetails.email}`;
        let vendorEmail = this.vendorEmail;
        let fromEmail = `Cloud Cerebro <cloudcerebro.dev.09.2020@gmail.com>`;

        let vendorMail = {
          fromEmail: fromEmail,
          toEmail: vendorEmail,
          subject: vendorSubject,
          body: mailBody,
        };

        var userSubject = `Enquiry placed in AJ Crackers`;
        let userEmail = this.orderDetails.email;

        let userMail = {
          fromEmail: fromEmail,
          toEmail: userEmail,
          subject: userSubject,
          body: mailBody,
        };

        sendMailOverHTTP(vendorMail)
          .then((vendorResult) => {
            console.log("Sent vendor mail:");

            sendMailOverHTTP(userMail)
              .then((userResult) => {
                resolve();
              })
              .catch((userError) => {
                this.$q.dialog({
                  title: "Server busy",
                  message: "Please try again later",
                });
                reject();
              });
          })
          .catch((vendorErr) => {
            this.$q.dialog({
              title: "Server busy",
              message: "Please try again later",
            });
            reject();
          });
      });
    },

    async getCategories() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: CATEGORIES_RANGE,
          });

          let range = response.data;
          if (range.values.length > 0) {
            for (i = 0; i < range.values.length; i++) {
              let row = range.values[i];
              this.categories.push(row[0]);
            }
          }
          console.log("Categories from sheet:", this.categories);
          resolve();
        } catch (error) {
          console.log("Error getting categories:", error);
          reject(error);
        }
      });
    },
    async getVendorEmail() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: VENDOR_EMAIL_RANGE,
          });

          let range = response.data;

          if (range.values.length > 0) {
            this.vendorEmail = range.values[0][0];
          }
          console.log("Vendor email:", this.vendorEmail);
          resolve();
        } catch (error) {
          console.log("Error getting vendor email:", error);
          reject(error);
        }
      });
    },
    async getMinimumOrderAmount() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: MINIMUM_ORDER_RANGE,
          });

          let range = response.data;

          if (range.values.length > 0) {
            this.minimumOrderAmount = parseInt(range.values[0][0]);
          }
          console.log("Minimum order value:", this.minimumOrderAmount);
          resolve();
        } catch (error) {
          console.log("Error getting Minimum order value:", error);
          reject(error);
        }
      });
    },
    async getDefaultDiscount() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: DEFAULT_DISCOUNT_RANGE,
          });

          let range = response.data;

          if (range.values.length > 0) {
            this.defaultDiscount = range.values[0][0];
          }
          console.log("Default discount:", this.defaultDiscount);
          resolve();
        } catch (error) {
          console.log("Error getting coupons:", error);
          reject(error);
        }
      });
    },
    async getCoupons() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: COUPONS_RANGE,
          });

          let range = response.data;

          if (range.values.length > 0) {
            for (i = 0; i < range.values.length; i++) {
              let row = range.values[i];
              let coupon = {};
              coupon.name = row[0];
              coupon.discountPercent = row[1];
              this.coupons.push(coupon);
            }
          }
          console.log("Coupons:", this.coupons);
          resolve();
        } catch (error) {
          console.log("Error getting coupons:", error);
          reject(error);
        }
      });
    },
    async getItems() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: CRACKERS_RANGE,
          });
          console.log("data:", response.data);

          let range = response.data;
          console.log("Range values: ", range.values);

          if (range.values.length > 0) {
            console.log("Range values: ", range.values);
            for (i = 0; i < range.values.length; i++) {
              let item = {};
              var row = range.values[i];
              // Print columns A and E, which correspond to indices 0 and 4.
              item.id = uuidv4();

              item.category = row[0];
              item.name = row[1];
              item.price = row[2];
              item.pricePer = row[3];
              item.imageUrl = row[4];
              item.isDiscounted = row[5] === "Discount" ? true : false;
              item.availability = row[6];
              item.quantity = 0;

              if (
                item.category &&
                item.name &&
                item.price &&
                item.pricePer &&
                item.availability
              ) {
                this.items.push(item);
              }
            }
            console.log("Items:", this.items);
            console.log("Categories:", this.categories);
          } else {
            console.log("No data found:");
          }
          resolve();
        } catch (error) {
          console.log("Error getting items:", error);
          reject(error);
        }
      });
    },

    saveOrderToSheets(orderDetails) {
      return new Promise(async (resolve, reject) => {
        let itemList = ``;
        orderDetails.items.forEach((item) => {
          itemList = itemList + `${item.name} x ${item.quantity}\n`;
        });

        let data = {
          sheetId: SHEET_ID,
          range: ORDERS_RANGE,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "OVERWRITE",
          body: {
            values: [
              [
                orderDetails.billNumber,
                orderDetails.fullName,
                orderDetails.email,
                orderDetails.mobileNumber,
                orderDetails.address,
                orderDetails.pincode,
                itemList,
                `${orderDetails.defaultDiscount}%`,
                orderDetails.coupon,
                orderDetails.coupon
                  ? `${orderDetails.couponApplied?.discountPercent}%`
                  : "",
                orderDetails.subTotalA,
                orderDetails.discountAmount,
                orderDetails.subTotalB,
                orderDetails.nonDiscountTotal,
                orderDetails.grandTotal,
                orderDetails.giftClaimed,
                orderDetails.id,
              ],
            ],
          },
        };
        appendDataToSheetsApi(data)
          .then((result) => {
            console.log("Write success:", result);
            resolve();
          })
          .catch((error) => {
            console.log("Write error:", error);
            reject(error);
          });
      });
    },
    saveLastBillNumberToSheets(orderDetails) {
      return new Promise(async (resolve, reject) => {
        console.log("Order details billNumber:", orderDetails.billNumber);

        let data = {
          sheetId: SHEET_ID,
          range: LAST_BILL_NUMBER_RANGE,
          valueInputOption: "USER_ENTERED",
          body: {
            values: [[`${orderDetails.billNumber}`]],
          },
        };
        console.log("Data body:", data.body);
        addDataToSheetsApi(data)
          .then((result) => {
            console.log("Added last bill number success:", result);
            resolve();
          })
          .catch((error) => {
            console.log("Write error:", error);
            reject(error);
          });
      });
    },
    validateForm() {
      if (this.orderDetails.fullName.length < 2) {
        this.$q.dialog({
          title: "Full Name",
          message: "Enter a valid full name",
        });
        return false;
      }
      if (this.orderDetails.address.length < 10) {
        this.$q.dialog({
          title: "Address",
          message: "Enter a valid address",
        });
        return false;
      }
      if (this.orderDetails.pincode.length != 6) {
        this.$q.dialog({
          title: "Pincode",
          message: "Enter a valid pincode",
        });
        return false;
      }
      if (this.orderDetails.mobileNumber.length != 10) {
        this.$q.dialog({
          title: "Mobile Number",
          message: "Enter a valid mobile number without 0 or +91 at the start",
        });
        return false;
      }
      if (!validateEmail(this.orderDetails.email)) {
        this.$q.dialog({
          title: "Email",
          message: "Enter a valid email",
        });
        return false;
      }
      if (this.selectedItems.length === 0) {
        this.$q.dialog({
          title: "Add items",
          message: "Please add items before submitting",
        });
        return false;
      }
      if (this.grandTotal < this.minimumOrderAmount) {
        this.$q.dialog({
          title: "Add more items",
          message: `Minimum order should be above ${this.minimumOrderAmount}`,
        });
        return false;
      }
      return true;
    },
    setOrderDetails() {
      return new Promise(async (resolve, reject) => {
        let lastBillNumber = await this.getLastBillNumber();
        console.log("Last bill number:", lastBillNumber);

        let nextBillNumber = this.generateNextBillNumber(lastBillNumber);
        console.log("Next bill number:", nextBillNumber);
        this.applyCoupon();
        if (!this.isCouponApplied) {
          this.orderDetails.coupon = "";
        } else {
          this.orderDetails.coupon = this.orderDetails.coupon?.toUpperCase();
        }
        this.orderDetails.defaultDiscount = this.defaultDiscount;
        this.orderDetails.billNumber = nextBillNumber;
        this.orderDetails.id = uuidv4();
        this.orderDetails.items = this.selectedItems;
        this.orderDetails.subTotalA = this.subTotalA;
        this.orderDetails.discountAmount = this.discountAmount;
        this.orderDetails.subTotalB = this.subTotalB;
        this.orderDetails.nonDiscountTotal = this.nonDiscountTotal;
        this.orderDetails.grandTotal = this.grandTotal;
        resolve();
      });
    },
    async getLastBillNumber() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: LAST_BILL_NUMBER_RANGE,
          });

          let range = response.data;
          let lastBillNumber = null;
          if (range.values.length > 0) {
            lastBillNumber = range.values[0][0];
          }

          console.log("Last bill number:", lastBillNumber);
          resolve(lastBillNumber);
        } catch (error) {
          console.log("Error getting last bill number:", error);
          reject(error);
        }
      });
    },
    generateNextBillNumber(lastBillNumber) {
      let letterPart = lastBillNumber.slice(0, 1);
      let numberPart = parseInt(lastBillNumber.slice(1, lastBillNumber.length));
      let newNumberPart = (numberPart + 1).toString().padStart(4, "0");
      let newLetterPart = letterPart;
      if (numberPart === 9999) {
        newNumberPart = (1).toString().padStart(4, "0");
        newLetterPart =
          letterPart.substring(0, letterPart.length - 1) +
          String.fromCharCode(letterPart.charCodeAt(letterPart.length - 1) + 1);
      }
      let newBillNumber = newLetterPart + newNumberPart;

      console.log("New bill number:", newBillNumber);
      return newBillNumber;
    },

    async resetAll() {
      return new Promise((resolve, reject) => {
        this.items.forEach((item) => {
          item.quantity = 0;
        });
        this.isCouponApplied = false;
        this.isCouponInvalid = false;

        this.orderDetails = {
          id: null,
          fullName: "",
          address: "",
          pincode: "",
          mobileNumber: "",
          email: "",
          defaultDiscount: "",
          coupon: "",
          couponApplied: null,
          giftClaimed: false,
          billNumber: null,
          items: [],
          subTotalA: null,
          discountAmount: null,
          subTotalB: null,
          nonDiscountTotal: null,
          grandTotal: null,
        };
      });
    },
    async getItemsForVerification() {
      return new Promise(async (resolve, reject) => {
        try {
          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: CRACKERS_RANGE,
          });

          let range = response.data;
          let newItems = [];
          if (range.values.length > 0) {
            console.log("Range values: ", range.values);
            for (i = 0; i < range.values.length; i++) {
              let item = {};
              var row = range.values[i];
              // Print columns A and E, which correspond to indices 0 and 4.
              console.log("Row %d:", i, row);
              item.category = row[0];
              item.name = row[1];
              item.price = row[2];
              item.pricePer = row[3];
              item.imageUrl = row[4];
              item.isDiscounted = row[5] === "Discount" ? true : false;
              item.availability = row[6];
              item.quantity = 0;

              if (
                item.category &&
                item.name &&
                item.price &&
                item.pricePer &&
                item.availability
              ) {
                newItems.push(item);
                this.updateItem(item);
              }
            }
            console.log("Items:", this.items);
            console.log("New Items:", newItems);
            console.log("Categories:", this.categories);
          } else {
            console.log("No data found:");
          }
          resolve();
        } catch (error) {
          console.log("Error getting items:", error);
          reject(error);
        }
      });
    },
    updateItem(newItem) {
      this.items.forEach((item) => {
        if (item.category === newItem.category && item.name === newItem.name) {
          item.price = newItem.price;
          item.pricePer = newItem.pricePer;
          item.imageUrl = newItem.imageUrl;
          item.isDiscounted = newItem.isDiscounted;
          if (item.availability != newItem.availability) {
            item.availability = newItem.availability;
            item.quantity = 0;
          }
        }
      });
    },

    addItem(itemIndex) {
      this.items[itemIndex].quantity++;
    },
    addItemId(itemId) {
      var foundIndex = this.items.findIndex((x) => x.id == itemId);
      this.items[foundIndex].quantity++;
    },
    removeItemId(itemId) {
      var foundIndex = this.items.findIndex((x) => x.id == itemId);
      this.items[foundIndex].quantity--;
    },
    removeItem(itemIndex) {
      this.items[itemIndex].quantity--;
    },
    applyCoupon() {
      if (!this.orderDetails.coupon || this.orderDetails.coupon.length === 0) {
        this.isCouponApplied = false;
        this.isCouponInvalid = false;
        return;
      }
      let couponFound = false;
      this.coupons.forEach((coupon) => {
        if (
          coupon.name?.toUpperCase() == this.orderDetails.coupon?.toUpperCase()
        ) {
          couponFound = coupon;
        }
      });

      if (couponFound) {
        this.isCouponApplied = true;
        this.isCouponInvalid = false;
        this.orderDetails.couponApplied = couponFound;
      } else {
        this.isCouponInvalid = true;
        this.isCouponApplied = false;
      }
    },
  },
  // ...etc
});
