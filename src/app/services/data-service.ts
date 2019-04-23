import { Injectable } from "@angular/core";
import { DavUser } from 'dav-npm';
import { Book } from '../models/Book';

@Injectable()
export class DataService{
   user: DavUser
   books: Book[] = [];
   currentBook: Book = null;
   currentChapter: number = 0;
}