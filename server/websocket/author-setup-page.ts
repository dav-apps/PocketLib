import * as websocket from '../websocket';
import * as axios from 'axios';

export const createAuthorKey = "createAuthor";
export const getAuthorOfUserKey = "getAuthorOfUser";

export async function createAuthor(message: {
	jwt: string,
	firstName: string,
	lastName: string,
	bio: string
}){
	var responseMessage;
	try{
		var response = await axios.default({
			method: 'post',
			url: `${process.env.POCKETLIB_API_URL}/author`,
			headers: {
				Authorization: message.jwt,
				ContentType: 'application/json'
			},
			data: {
				first_name: message.firstName,
				last_name: message.lastName,
				bio: message.bio
			}
		});

		responseMessage = response.data;
		responseMessage.status = response.status;
	}catch(error){
		responseMessage = error.response.data;
		responseMessage.status = error.response.status;
	}

	websocket.emit(createAuthorKey, responseMessage);
}

export async function getAuthorOfUser(message: {jwt: string}){
	var responseMessage;
	try{
		var response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/author`,
			headers: {
				Authorization: message.jwt
			}
		});

		responseMessage = response.data;
		responseMessage.status = response.status;
	}catch(error){
		responseMessage = error.response.data;
		responseMessage.status = error.response.status;
	}

	websocket.emit(getAuthorOfUserKey, responseMessage);
}