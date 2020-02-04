import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	setStoreBookCollectionName
}

export async function setStoreBookCollectionName(message: {
	jwt: string,
	uuid: string,
	language: string,
	name: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/store/collection/${message.uuid}/name/${message.language}`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
				name: message.name
			}
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

	websocket.emit(setStoreBookCollectionName.name, result);
}