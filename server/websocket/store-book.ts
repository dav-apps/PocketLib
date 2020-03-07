import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	createStoreBook,
	getStoreBook,
	updateStoreBook
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

	websocket.emit(createStoreBook.name, result);
}

export async function getStoreBook(message: {jwt?: string, uuid: string}){
	var result: {status: number, data: any} = {status: -1, data: {}};

	try{
		let options: axios.AxiosRequestConfig = {
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/store/book/${message.uuid}`
		}

		if(message.jwt){
			options.headers = {
				Authorization: message.jwt
			}
		}

		var response = await axios.default(options);

		result.status = response.status;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.data = error.response.data;
		}
	}

	websocket.emit(getStoreBook.name, result);
}

export async function updateStoreBook(message: {
	jwt: string, 
	uuid: string,
	title?: string,
	description?: string,
	language?: string,
	price?: number,
	published?: boolean
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
				language: message.language,
				price: message.price,
				published: message.published
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

	websocket.emit(updateStoreBook.name, result);
}