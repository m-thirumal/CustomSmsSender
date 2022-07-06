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
    message = 'Dear ' + event.request.userAttributes.name + ', Your OTP '
    if (event.triggerSource == 'CustomSMSSender_SignUp') {
        message += 'to SignUp is ' + code + ' and valid for 5 minutes. Do not disclose it to anyone for security reasons.'
    } else if (event.triggerSource == 'CustomSMSSender_ResendCode') {
        message += code + ' to verify/confirm the account'
    } else if (event.triggerSource == 'CustomSMSSender_ForgotPassword') {
        message = 'to reset the password is ' + code + '.'
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
    let value = await new Promise((resolve) => {
        springedge.messages.send(params, 5000, function (err, response) {
            if (err) {
                return console.log("err: ", err);
            }
            console.log("response: ", response);
        });
    });
    console.log("Ending the service.....")
}