import { Injectable } from "@angular/core";
import * as axios from 'axios';
import { ApiResponse } from 'dav-npm';
import { environment } from 'src/environments/environment';

@Injectable()
export class ApiService{
	//#region Author functions
	async CreateAuthor(
		jwt: string,
		firstName: string,
		lastName: string
	) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let data = {};
			if(firstName) data["first_name"]	= firstName;
			if(lastName) data["last_name"] = lastName;

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: jwt,
					'Content-Type': 'application/json'
				},
				data
			});
	
			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}

	async GetAuthorOfUser(jwt: string) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: jwt
				}
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}

	async GetAuthor(
		uuid: string,
		books?: boolean,
		language?: string
	) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let params = {};
			if(books){
				params["books"] = true;
				params["language"] = language || "en";
			}

			let response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/author/${uuid}`,
				params
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}

	async GetLatestAuthors() : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			var response = await axios.default({
				method: 'get',
				url: `${environment.pocketlibApiBaseUrl}/authors/latest`
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}
	//#endregion

	//#region AuthorBio
	async SetBioOfAuthorOfUser(
		jwt: string,
		language: string,
		bio: string
	) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let data = {};
			if(bio) data["bio"] = bio;

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/bio/${language}`,
				headers: {
					Authorization: jwt,
					'Content-Type': 'application/json'
				},
				data
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}

	async SetBioOfAuthor(
		jwt: string,
		uuid: string,
		language: string,
		bio: string
	) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let data = {};
			if(bio) data["bio"] = bio;

			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/${uuid}/bio/${language}`,
				headers: {
					Authorization: jwt,
					'Content-Type': 'application/json'
				},
				data
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}
	//#endregion

	//#region AuthorProfileImage
	async SetProfileImageOfAuthorOfUser(
		jwt: string,
		type: string,
		file: any
	) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/profile_image`,
				headers: {
					Authorization: jwt,
					'Content-Type': type
				},
				data: file
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}

	async SetProfileImageOfAuthor(
		jwt: string,
		uuid: string,
		type: string,
		file: any
	) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let response = await axios.default({
				method: 'put',
				url: `${environment.pocketlibApiBaseUrl}/author/${uuid}/profile_image`,
				headers: {
					Authorization: jwt,
					'Content-Type': type
				},
				data: file
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}
	//#endregion

	//#region StoreBookCollection
	async CreateStoreBookCollection(
		jwt: string,
		name: string,
		language: string,
		author?: string
	){
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let data = {};
			if(name) data["name"] = name;
			if(language) data["language"] = language;
			if(author) data["author"] = author;

			let response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/store/collection`,
				headers: {
					Authorization: jwt,
					'Content-Type': 'application/json'
				},
				data
			});

			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}
	//#endregion
}