import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	getProfileImageOfAuthorOfUser,
	getProfileImageOfAuthor
}

export async function getProfileImageOfAuthorOfUser(message: {jwt?: string}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		let options: axios.AxiosRequestConfig = {
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/author/profile_image`
		}

		if(message.jwt){
			options.headers = {
				Authorization: message.jwt
			}
		}

		var response = await axios.default(options);

		result.status = response.status;
		result.headers = response.headers;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.headers = error.response.headers;
			result.data = error.response.data;
		}
	}

	websocket.emit(getProfileImageOfAuthorOfUser.name, result);
}

export async function getProfileImageOfAuthor(message: {
	uuid: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/author/${message.uuid}/profile_image`
		});

		result.status = response.status;
		result.headers = response.headers;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.headers = error.response.headers;
			result.data = error.response.data;
		}
	}

	websocket.emit(getProfileImageOfAuthor.name, result);
}