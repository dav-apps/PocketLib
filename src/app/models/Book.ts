import { TableObject, GetTableObject } from 'dav-npm';
import { environment } from 'src/environments/environment';

export class Book{
	public uuid: string;

	constructor(
		public file: Blob
	){}

	protected async Save(fileExt: string, properties: Property[]){
		let tableObject = await GetTableObject(this.uuid);
		let fileTableObject: TableObject = null;

		if(!tableObject){
			// Create a new table object
			tableObject = new TableObject();
			tableObject.TableId = environment.bookTableId;
			this.uuid = tableObject.Uuid;

			// Set the properties of the new table object
			await tableObject.SetPropertyValues(properties);
		}else{
			// Check if the table object has a file table object
			let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);
			if(fileUuid) fileTableObject = await GetTableObject(fileUuid);

			// Update the existing table object with the properties
			await tableObject.SetPropertyValues(properties);
		}

		if(!fileTableObject){
			// Create a table object for the file
			fileTableObject = new TableObject();
			fileTableObject.TableId = environment.bookFileTableId;
			fileTableObject.IsFile = true;
			await fileTableObject.SetFile(this.file, fileExt);

			// Save the uuid of the file table object in the table object
			await tableObject.SetPropertyValue(environment.bookTableFileUuidKey, fileTableObject.Uuid);
		}
	}

	public async Delete(){
		let tableObject = await GetTableObject(this.uuid);
		if(!tableObject) return;

		let fileUuid = tableObject.GetPropertyValue(environment.bookTableFileUuidKey);
		let fileTableObject = await GetTableObject(fileUuid);

		// Delete the file table object
		if(fileTableObject){
			await fileTableObject.Delete();
		}

		// Delete the book table object
		await tableObject.Delete();
	}
}

export interface Property{
	name: string;
	value: string;
}