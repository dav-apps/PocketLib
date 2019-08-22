var websocket = require('../websocket');
var axios = require('axios');

const loginKey = "login";
exports.loginKey = loginKey;

exports.login = async function(message){
	// Create a session on the PocketLib API
	var responseMessage;
   try{
      var response = await axios({
         method: 'post',
         url: `${process.env.POCKETLIB_API_URL}/session`,
         headers: {
            'Authorization': process.env.DAV_AUTH,
            'Content-Type': "application/json"
         },
         data: {
            email: message.email,
            password: message.password,
            app_id: process.env.POCKETLIB_APP_ID,
            device_name: "Device name",
            device_type: "Device type",
            device_os: "Device os"
         }
		});
		
		responseMessage = response.data;
		responseMessage.status = response.status;
   }catch(e){
		responseMessage = e.response.data;
		responseMessage.status = e.response.status;
	}
	
	websocket.emit(loginKey, responseMessage);
}