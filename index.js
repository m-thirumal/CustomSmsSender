const AWS = require('aws-sdk')
const b64 = require('base64-js')
const springedge = require('springedge')
const encryptionSdk = require('@aws-crypto/client-node')


const { decrypt } = encryptionSdk.buildClient(encryptionSdk.CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT)
const keyIds = [process.env.KEY_ID];
const sender = process.env.sender;
const apikey = process.env.apikey;
const keyring = new encryptionSdk.KmsKeyringNode({ keyIds })

exports.handler = async(event) => {
    console.log(event)
    let plainTextCode
    if (event.request.code) {
        const { plaintext, messageHeader } = await decrypt(keyring, b64.toByteArray(event.request.code))
        plainTextCode = plaintext
    }
    console.log("Plain text code =>", plainTextCode)
    let buff = Buffer.from(plainTextCode, "base64")
    let code = buff.toString("ascii")
    console.log("Code ==> ", code)
    let user = event.request.userAttributes.name
    message = 'Dear ' + user + ', Your OTP '
    emailTemplate = ""
    if (event.triggerSource == 'CustomSMSSender_SignUp') {
        message += 'to SignUp is ' + code + ' and valid for 5 minutes. Do not disclose it to anyone for security reasons.'
        emailTemplate = process.env.email_signup_template
    } else if (event.triggerSource == 'CustomSMSSender_ResendCode') {
        message += code + ' to verify/confirm the account'
        emailTemplate = process.env.email_verify_template
    } else if (event.triggerSource == 'CustomSMSSender_ForgotPassword') {
        message += 'to reset the password is ' + code + '.'
        emailTemplate = process.env.email_forgot_password_template
    } else if (event.triggerSource == 'CustomSMSSender_VerifyUserAttribute') {
        message += 'to verify/confirm the account ' + code + '.'
        emailTemplate = process.env.email_verify_template
    } else {
        console.log("SMS message is not implemented.....for the trriger source", event.triggerSource)
        return
    }
    let client_phone = event.request.userAttributes.phone_number;
    console.log("phone_number => ", client_phone)
    // Send SMS
    const params = {
        'sender': sender,
        'apikey': apikey,
        'to': [
            client_phone  //Moblie Numbers 
        ],
        'message':  message,
        'format': 'json'
      };
    console.log("params ", params)
    await new Promise((resolve) => {
        springedge.messages.send(params, 5000, function (err, response) {
            if (err) {
                console.log("err: ", err);
            }
            resolve(response);
            console.log("response: ", response);
        });
    });
    console.log("Ending the SMS service.....")
    //Send Email
    if (emailTemplate =="") {
        return;
    }
    // Set the region 
    AWS.config.update({region: process.env.region});
    let clientEmail = event.request.userAttributes.email;
    template_data = "{ \"otp\": \"" + code + "\", \"user\": \"" + user +"\"}"
    // Create sendTemplatedEmail params 
    var emailParams = {
        Destination: {
            CcAddresses: [
                clientEmail
            ],
            ToAddresses: [
                clientEmail
            ]
        },
        Source: process.env.sender_email,
        Template: emailTemplate,
        TemplateData: template_data, 
        ReplyToAddresses: [
            process.env.reply_email
        ],
    };
    console.log("Email param  => ", emailParams)
    // Create the promise and SES service object
    var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendTemplatedEmail(emailParams).promise();

    // Handle promise's fulfilled/rejected states
    await sendPromise.then(
    function(data) {
        console.log(data);
    }).catch(
        function(err) {
        console.error(err, err.stack);
    });
    console.log("The E-mail is sent")
}