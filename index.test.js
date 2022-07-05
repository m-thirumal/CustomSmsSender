const springedge = require('springedge')


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
let response = springedge.messages.send(params, 5000, function (err, response) {
    if (err) {
      return console.log("err: ", err);
    }
    console.log("response: ", response);
});