import { Component, HostListener } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { ApiResponse } from 'dav-npm';
import { DataService } from 'src/app/services/data-service';
import { ApiService } from 'src/app/services/api-service';
import { enUS } from 'src/locales/locales';

const navbarHeight: number = 64;

@Component({
	selector: "pocketlib-author-page",
   templateUrl: "./author-page.component.html",
   styleUrls: [
      './author-page.component.scss'
   ]
})
export class AuthorPageComponent{
	locale = enUS.authorPage;
   header1Height: number = 600;
	header1TextMarginTop: number = 200;
	uuid: string;
	createAuthorDialogVisible: boolean = false;
	createAuthorDialogFirstName: string = "";
	createAuthorDialogLastName: string = "";
	createAuthorDialogFirstNameError: string = "";
	createAuthorDialogLastNameError: string = "";
	booksInReview: {
		uuid: string,
		title: string
	}[] = [];

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createAuthorDialogContentProps: IDialogContentProps = {
		title: this.locale.createAuthorDialog.title
	}

   constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router,
		private activatedRoute: ActivatedRoute
   ){
		this.locale = this.dataService.GetLocale().authorPage;

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
   }
   
   async ngOnInit(){
		this.setSize();

		await this.dataService.userPromise;
		if(this.dataService.userIsAdmin && !this.uuid){
			// Get the books in review
			let response: ApiResponse<any> = await this.apiService.GetStoreBooksInReview({jwt: this.dataService.user.JWT});

			if(response.status == 200){
				this.booksInReview = [];

				for(let book of response.data.books){
					this.booksInReview.push({
						uuid: book.uuid,
						title: book.title
					});
				}
			}
		}
	}

   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
		this.header1Height = window.innerHeight - navbarHeight;
		this.header1TextMarginTop = this.header1Height * 0.36;
	}

   createProfileButtonClick(){
		if(this.dataService.user.IsLoggedIn){
			// Redirect to the Author setup page
			this.router.navigate(['author', 'setup']);
      }else{
			// Redirect to the Account page
			this.router.navigate(["account"], {
				queryParams: {
					redirect: "author"
				}
			});
		}
	}

	ShowAuthor(uuid: string){
		this.router.navigate(['author', uuid]);
	}

	ShowCreateAuthorDialog(){
		this.createAuthorDialogFirstName = "";
		this.createAuthorDialogFirstNameError = "";
		this.createAuthorDialogLastName = "";
		this.createAuthorDialogLastNameError = "";

		this.createAuthorDialogContentProps.title = this.locale.createAuthorDialog.title;
		this.createAuthorDialogVisible = true;
	}

	ShowBook(uuid: string){
		this.router.navigate(["store", "book", uuid]);
	}

	async CreateAuthor(){
		this.createAuthorDialogFirstNameError = "";
		this.createAuthorDialogLastNameError = "";

		let response: ApiResponse<any> = await this.apiService.CreateAuthor({
			jwt: this.dataService.user.JWT,
			firstName: this.createAuthorDialogFirstName,
			lastName: this.createAuthorDialogLastName
		})

		if(response.status == 201){
			// Add the author to the admin authors in DataService
			this.dataService.adminAuthors.push({
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				bios: response.data.bios,
				collections: response.data.collections,
				profileImage: response.data.profile_image
			});

			this.createAuthorDialogVisible = false;

			// Redirect to the author page of the new author
			this.router.navigate(['author', response.data.uuid]);
		}else{
			for(let error of response.data.errors){
				switch(error.code){
					case 2102:	// Missing field: first_name
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameMissing;
						break;
					case 2103:	// Missing field: last_name
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameMissing;
						break;
					case 2301:	// Field too short: first_name
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameTooShort;
						break;
					case 2302:	// Field too short: last_name
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameTooShort;
						break;
					case 2401:	// Field too long: first_name
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameTooLong;
						break;
					case 2402:	// Field too long: last_name
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameTooLong;
						break;
					default:		// Unexpected error
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.unexpectedError;
						break;
				}
			}
		}
	}
}