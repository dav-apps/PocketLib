import * as websocket from '../websocket';
import * as axios from 'axios';

export const loginKey = "login";
export const getAppKey = "getApp";

export async function login(message: {email: string, password: string}){
	// Create a session on the PocketLib API
	var responseMessage;
   try{
      var response = await axios.default({
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

export async function getApp(message: {uuid: string}){
   // Get the app from the PocketLib API
   var responseMessage;
   try{
      var response = await axios.default({
         method: 'get',
         url: `${process.env.POCKETLIB_API_URL}/apps/${message.uuid}`,
         headers: {
            'Authorization': process.env.DAV_AUTH
         }
      });

      responseMessage = response.data;
		responseMessage.status = response.status;
   }catch(e){
      responseMessage = e.response.data;
		responseMessage.status = e.response.status;
   }

   websocket.emit(getAppKey, responseMessage);
}