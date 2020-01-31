import * as websocket from '../websocket';
import * as axios from 'axios';

export const getStoreBookCollectionKey = "getStoreBookCollection";
export const setStoreBookCollectionNameKey = "setStoreBookCollectionName";
export const createStoreBookKey = "createStoreBook";

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

	websocket.emit(setStoreBookCollectionNameKey, result);
}

export async function createStoreBook(message: {
	jwt: string,
	collection: string,
	title: string,
	language: string
}){
	var result: {status: number, data: any} = {status: -1, data: {}};

	try{
		var response = await axios.default({
			method: 'post',
			url: `${process.env.POCKETLIB_API_URL}/store/book`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
				collection: message.collection,
				title: message.title,
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

	websocket.emit(createStoreBookKey, result);
}