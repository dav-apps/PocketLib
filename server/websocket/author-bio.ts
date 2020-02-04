import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	setBioOfAuthorOfUser,
	setBioOfAuthor
}

export async function setBioOfAuthorOfUser(message: {
	jwt: string,
	language: string,
	bio: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/author/bio/${message.language}`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
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

	websocket.emit(setBioOfAuthorOfUser.name, result);
}

export async function setBioOfAuthor(message: {
	jwt: string, 
	uuid: string, 
	language: string, 
	bio: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/author/${message.uuid}/bio/${message.language}`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
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

	websocket.emit(setBioOfAuthor.name, result);
}