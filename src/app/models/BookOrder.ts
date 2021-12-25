import { TableObject, Property, GetTableObject, GetAllTableObjects } from 'dav-js'
import { environment } from 'src/environments/environment'

export class BookOrder {
	public uuid: string
	public bookUuids: string[] = []

	constructor(
		uuid: string = null,
		bookUuids: string[] = []
	) {
		this.uuid = uuid
		this.bookUuids = bookUuids
	}

	public async SetBookUuids(uuids: string[]) {
		this.bookUuids = uuids
		await this.Save()
	}

	private async Save() {
		let tableObject = await GetTableObject(this.uuid, environment.bookOrderTableId)

		if (tableObject == null) {
			// Create the table object
			tableObject = new TableObject({
				TableId: environment.bookOrderTableId
			})
			this.uuid = tableObject.Uuid
		}

		// Create the list of properties with the book uuids as values
		let properties: Property[] = []

		for (let i = 0; i < this.bookUuids.length; i++) {
			properties.push({
				name: i.toString(),
				value: this.bookUuids[i]
			})
		}

		await tableObject.SetPropertyValues(properties)
	}

	public async Delete() {
		let tableObject = await GetTableObject(this.uuid, environment.bookOrderTableId)
		if (tableObject == null) return

		await tableObject.Delete()
	}
}

export async function GetBookOrder(): Promise<BookOrder> {
	// Check if there already is a BookOrder object
	let allBookOrders = await GetAllBookOrders()

	if (allBookOrders.length == 0) {
		// Create a new book order
		return new BookOrder()
	} else {
		// Return the first order and delete all other book orders
		while (allBookOrders.length > 1) {
			await allBookOrders.pop().Delete()
		}

		return allBookOrders[0]
	}
}

async function GetAllBookOrders(): Promise<BookOrder[]> {
	let tableObjects = await GetAllTableObjects(environment.bookOrderTableId, false)
	let bookOrders: BookOrder[] = []

	for (let tableObject of tableObjects) {
		let order = ConvertTableObjectToBookOrder(tableObject)
		if (order != null) bookOrders.push(order)
	}

	return bookOrders
}

function ConvertTableObjectToBookOrder(tableObject: TableObject): BookOrder {
	if (
		tableObject == null
		|| tableObject.TableId != environment.bookOrderTableId
	) return null

	// Get all book uuids
	let lastProperty = false
	let uuids: string[] = []
	let i = 0

	while (!lastProperty) {
		let property = tableObject.GetPropertyValue(i.toString()) as string

		if (property == null) {
			lastProperty = true
		} else {
			uuids.push(property)
		}

		i++
	}

	return new BookOrder(
		tableObject.Uuid,
		uuids
	)
}