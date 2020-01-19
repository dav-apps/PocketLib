import * as websocket from '../websocket';
import * as axios from 'axios';

export const getStoreBookCollectionKey = "getStoreBookCollection";

export async function getStoreBookCollection(message: {jwt: string, uuid: string}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/store/collection/${message.uuid}`,
			headers: {
				Authorization: message.jwt
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

	websocket.emit(getStoreBookCollectionKey, result);
}