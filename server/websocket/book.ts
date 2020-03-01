import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	createBook
}

export async function createBook(message: {
	jwt: string,
	storeBook: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		let response = await axios.default({
			method: 'post',
			url: `${process.env.POCKETLIB_API_URL}/book`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
				store_book: message.storeBook
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

	websocket.emit(createBook.name, result);
}