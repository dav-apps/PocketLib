import * as websocket from '../websocket';
import * as axios from 'axios';

export const createStoreBookKey = "createStoreBook";
export const updateAuthorOfUserKey = "updateAuthorOfUser";

export async function createStoreBook(message: {
	jwt: string,
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

export async function updateAuthorOfUser(message: {
	jwt: string,
	firstName?: string,
	lastName?: string,
	bio?: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/author`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
				first_name: message.firstName,
				last_name: message.lastName,
				bio: message.bio
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

	websocket.emit(updateAuthorOfUserKey, result);
}