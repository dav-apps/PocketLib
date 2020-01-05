import * as websocket from '../websocket';
import * as axios from 'axios';

export const createAuthorKey = "createAuthor";
export const getAuthorOfUserKey = "getAuthorOfUser";

export async function createAuthor(message: {
	jwt: string,
	firstName: string,
	lastName: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'post',
			url: `${process.env.POCKETLIB_API_URL}/author`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
				first_name: message.firstName,
				last_name: message.lastName
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
		}else{
			// Javascript error
			result.status = -1;
			result.data = {};
		}
	}
	
	websocket.emit(createAuthorKey, result);
}

export async function getAuthorOfUser(message: {jwt: string}){
	var result: {status: number, data: any} = {status: -1, data: {}};
	try{
		var response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/author`,
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

	websocket.emit(getAuthorOfUserKey, result);
}