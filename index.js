const AWS = require('aws-sdk')
const b64 = require('base64-js')
const encryptionSdk = require('@aws-crypto/client-node')

const { decrypt } = encryptionSdk.buildClient(encryptionSdk.CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT)
const keyIds = [process.env.KEY_ID];
const keyring = new encryptionSdk.KmsKeyringNode({ keyIds })

exports.handler = async(event) => {
  let plainTextCode
  if (event.request.code) {
    const { plaintext, messageHeader } = await decrypt(keyring, b64.toByteArray(event.request.code))
    plainTextCode = plaintext
  }
  console.log("Plain text code =>", plainTextCode)
  
  let client_phone = event.request.userAttributes.phone_number;
  console.log("phone_number => ", client_phone)
}