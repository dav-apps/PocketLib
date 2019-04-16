import { TableObject, GetTableObject, GetAllTableObjects } from 'dav-npm';
import { environment } from 'src/environments/environment';

export class Book{
	uuid: string;

   constructor(
		public file: File
	){}
	
	public static async Create(file: File) : Promise<string>{
		let book = new Book(file);
		await book.Save();
		return book.uuid;
	}

	private async Save(){
		let tableObject = await GetTableObject(this.uuid);
		let fileTableObject: TableObject = null;

		if(tableObject){
			// Check if the table object has a file table object
			let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);

			if(fileUuid){
				fileTableObject = await GetTableObject(fileUuid);
			}
			
			// Update the existing table object
			// TODO Save future properties
		}else{
			// Create a new table object
			tableObject = new TableObject();
			tableObject.TableId = environment.bookTableId;
			this.uuid = tableObject.Uuid;
		}

		if(!fileTableObject){
			// Create a table object for the file
			fileTableObject = new TableObject();
			fileTableObject.TableId = environment.bookFileTableId;
			fileTableObject.IsFile = true;
			await fileTableObject.SetFile(this.file);

			// Save the uuid of the file table object in the table object
			await tableObject.SetPropertyValue(environment.bookTableFileUuidKey, fileTableObject.Uuid);
		}
	}
}

export async function GetAllBooks() : Promise<Book[]>{
	let tableObjects = await GetAllTableObjects(environment.bookTableId, false);
	let books: Book[] = [];

	for(let tableObject of tableObjects){
		let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);
		if(!fileUuid) continue;

		let fileTableObject = await GetTableObject(fileUuid);
		if(!fileTableObject) continue;

		books.push(ConvertTableObjectsToBook(tableObject, fileTableObject));
	}

	return books;
}

function ConvertTableObjectsToBook(bookTableObject: TableObject, bookFileTableObject: TableObject) : Book{
	if(bookTableObject.TableId != environment.bookTableId || bookFileTableObject.TableId != environment.bookFileTableId) return null;
	if(!bookFileTableObject.IsFile || !bookFileTableObject.File) return null;

	// Get the file from the book file table object
	return new Book(bookFileTableObject.File);
}