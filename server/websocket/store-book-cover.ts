import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	setStoreBookCover,
	getStoreBookCover
}

export async function setStoreBookCover(message: {
	jwt: string,
	uuid: string,
	type: string,
	file: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/store/book/${message.uuid}/cover`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': message.type
			},
			data: message.file
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

	websocket.emit(setStoreBookCover.name, result);
}

export async function getStoreBookCover(message: {
	jwt?: string,
	uuid: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		let options: axios.AxiosRequestConfig = {
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/store/book/${message.uuid}/cover`
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

	websocket.emit(getStoreBookCover.name, result);
}