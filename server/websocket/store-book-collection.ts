import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	getStoreBookCollection
}

export async function getStoreBookCollection(message: {
	jwt?: string,
	uuid: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		let requestConfig: axios.AxiosRequestConfig = {
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/store/collection/${message.uuid}`
		}

		if(message.jwt){
			requestConfig.headers = {
				Authorization: message.jwt
			}
		}

		var response = await axios.default(requestConfig);

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

	websocket.emit(getStoreBookCollection.name, result);
}