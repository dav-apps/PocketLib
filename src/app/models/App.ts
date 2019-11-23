import { GetTableObject, TableObject, GetAllTableObjects, Property } from 'dav-npm';
import { environment } from 'src/environments/environment';
import { keys } from 'src/environments/keys';

export class App{
	public uuid: string;
	public name: string;
	public url: string;

	constructor(
		name: string = "",
		url: string = ""
	){
		this.name = name;
		this.url = url;
	}

	public static async Create(name: string, url: string){
		let app = new App(name, url);
		await app.Save();
		return app.uuid;
	}

	private async Save(){
		let tableObject = await GetTableObject(this.uuid);

		if(!tableObject){
			// Create the table object
			tableObject = new TableObject();
			tableObject.TableId = environment.appTableId;
			this.uuid = tableObject.Uuid;
		}

		let properties: Property[] = [
			{ name: keys.appTableNameKey, value: this.name },
			{ name: keys.appTableUrlKey, value: this.url }
		];

		await tableObject.SetPropertyValues(properties);
	}
}

export async function GetApp(uuid: string) : Promise<App>{
	let tableObject = await GetTableObject(uuid);
	return ConvertTableObjectToApp(tableObject);
}

export async function GetAllApps() : Promise<App[]>{
	let tableObjects = await GetAllTableObjects(environment.appTableId, false);
	let apps: App[] = [];

	for(let tableObject of tableObjects){
		let app = ConvertTableObjectToApp(tableObject);

		if(app){
			apps.push(app);
		}
	}

	return apps;
}

export function ConvertTableObjectToApp(tableObject: TableObject) : App{
	if(!tableObject || tableObject.TableId != environment.appTableId) return null;

	// name
	let name: string = tableObject.GetPropertyValue(keys.appTableNameKey);

	// url
	let url: string = tableObject.GetPropertyValue(keys.appTableUrlKey);

	let app = new App(name, url);
	app.uuid = tableObject.Uuid;
	return app;
}