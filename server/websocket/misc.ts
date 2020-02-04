import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	login,
	getApp
}

export async function login(message: {email: string, password: string}){
	// Create a session on the PocketLib API
	var result: {status: number, data: any} = {status: -1, data: {}};
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
		
		result.status = response.status;
		result.data = response.data;
   }catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.data = error.response.data;
		}else{
			// Javascript error
			result.status = -1;
			result.data = {};
		}
	}
	
	websocket.emit(login.name, result);
}

export async function getApp(message: {uuid: string}){
   // Get the app from the PocketLib API
   var result: {status: number, data: any} = {status: -1, data: {}};
   try{
      var response = await axios.default({
         method: 'get',
         url: `${process.env.POCKETLIB_API_URL}/apps/${message.uuid}`,
         headers: {
            'Authorization': process.env.DAV_AUTH
         }
      });

		result.status = response.status;
		result.data = response.data;
   }catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.data = error.response.data;
		}else{
			// Javascript error
			result.status = -1;
			result.data = {};
		}
   }

   websocket.emit(getApp.name, result);
}