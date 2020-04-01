import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	getStoreBooksInReview,
	updateStoreBook
}

export async function getStoreBooksInReview(message: {jwt: string}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		let response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/store/books/review`,
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

	websocket.emit(getStoreBooksInReview.name, result);
}

export async function updateStoreBook(message: {
	jwt: string, 
	uuid: string,
	title?: string,
	description?: string,
	language?: string,
	price?: number,
	published?: boolean,
	status?: string
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
				published: message.published,
				status: message.status
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