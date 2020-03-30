import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	getAuthorOfUser,
	getAuthor,
	getLatestAuthors
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

	websocket.emit(getAuthorOfUser.name, result);
}

export async function getAuthor(message: {
	uuid: string,
	books?: boolean,
	language?: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		let options: axios.AxiosRequestConfig = {
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/author/${message.uuid}`
		}

		if(message.books){
			options.params = {
				books: true,
				language: message.language ? message.language : "en"
			}
		}

		var response = await axios.default(options);

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

	websocket.emit(getAuthor.name, result);
}

export async function getLatestAuthors(){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/authors/latest`
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

	websocket.emit(getLatestAuthors.name, result);
}