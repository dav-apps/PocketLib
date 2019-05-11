import { Injectable } from "@angular/core";
import { DavUser, GetAllTableObjects } from 'dav-npm';
import { Book, GetAllBooks, GetBook } from '../models/Book';
import { environment } from 'src/environments/environment';

@Injectable()
export class DataService{
   user: DavUser;
   navbarVisible: boolean = true;
   books: Book[] = [];
   currentBook: Book = null;

   constructor(){
      this.user = new DavUser();
   }

   async LoadAllBooks(){
      this.books = await GetAllBooks();
   }

   async ReloadBook(uuid: string){
      // The book was updated in the database. Get it and replace the old book in the list with the new one
      let book = await GetBook(uuid);
      if(!book) return;

      // Replace or add the book
      let i = this.books.findIndex(b => b.uuid == book.uuid);
      
      if(i !== -1){
         this.books[i] = book;
      }else{
         this.books.push(book);
      }
   }

   async ReloadBookByFile(uuid: string){
      // Find the book with the file uuid
      let tableObjects = await GetAllTableObjects(environment.bookTableId, false);
      let bookObject = tableObjects.find(obj => obj.GetPropertyValue(environment.bookTableFileUuidKey) == uuid);
      if(!bookObject) return;

		await this.ReloadBook(bookObject.Uuid);
   }
}