import * as websocket from '../websocket';
import * as axios from 'axios';

export const getStoreBookKey = "getStoreBook";
export const updateStoreBookKey = "updateStoreBook";

export async function getStoreBook(message: {jwt: string, uuid: string}){
	var result: {status: number, data: any} = {status: -1, data: {}};

	try{
		var response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/store/book/${message.uuid}`,
			headers: {
				Authorization: message.jwt
			}
		});

		result.status = response.status;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.data = error.response.data;
		}
	}

	websocket.emit(getStoreBookKey, result);
}

export async function updateStoreBook(message: {
	jwt: string, 
	uuid: string,
	title?: string,
	description?: string,
	language?: string
}){
	var result: {status: number, data: any} = {status: -1, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/store/book/${message.uuid}`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
				title: message.title,
				description: message.description,
				language: message.language
			}
		});

		result.status = response.status;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.data = error.response.data;
		}
	}

	websocket.emit(updateStoreBookKey, result);
}