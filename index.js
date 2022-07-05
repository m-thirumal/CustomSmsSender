const AWS = require('aws-sdk')
const b64 = require('base64-js')
const encryptionSdk = require('@aws-crypto/client-node')
const springedge = require('springedge');

const { decrypt } = encryptionSdk.buildClient(encryptionSdk.CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT)
const keyIds = [process.env.KEY_ID];
const sender = [process.env.sender];
const apikey = [process.env.apikey];
const keyring = new encryptionSdk.KmsKeyringNode({ keyIds })

exports.handler = async(event) => {
    console.log(event)
    let plainTextCode
    if (event.request.code) {
        const { plaintext, messageHeader } = await decrypt(keyring, b64.toByteArray(event.request.code))
        plainTextCode = plaintext
    }
    console.log("Plain text code =>", plainTextCode)
    
    let client_phone = event.request.userAttributes.phone_number;
    console.log("phone_number => ", client_phone)
    // Send SMS
    const params = {
        'sender': sender,
        'apikey': apikey,
        'to': [
            client_phone  //Moblie Numbers 
        ],
        'message': 'Dear User, Your OTP to SignUp for eVoting is {#var#} and valid for 5 minutes. Do not disclose it to anyone for security reasons.',
        'format': 'json'
      };
    console.log("params ", params)
    springedge.messages.send(params, 5000, function (err, response) {
        if (err) {
          return console.log(err);
        }
        console.log(response);
    });
    console.log("Ending the service.....")
}