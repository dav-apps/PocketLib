import {
	TableObject,
	Property,
	GetTableObject,
	GetAllTableObjects
} from "dav-js"
import { Book } from "./Book"
import { environment } from "src/environments/environment"

export class BookOrder {
	public uuid: string
	public bookUuids: string[] = []

	constructor(uuid: string = null, bookUuids: string[] = []) {
		this.uuid = uuid
		this.bookUuids = bookUuids
	}

	public async SetBookUuids(uuids: string[]) {
		this.bookUuids = uuids
		await this.Save()
	}

	private async Save() {
		let tableObject = await GetTableObject(
			this.uuid,
			environment.bookOrderTableId
		)

		if (tableObject == null) {
			// Create the table object
			tableObject = new TableObject({
				TableId: environment.bookOrderTableId
			})
			this.uuid = tableObject.Uuid
		}

		// Create the list of properties with the book uuids as values
		let properties: Property[] = []
		let i = 0

		for (; i < this.bookUuids.length; i++) {
			properties.push({
				name: i.toString(),
				value: this.bookUuids[i]
			})
		}

		// Remove old uuids
		while (tableObject.Properties[i.toString()] != null) {
			tableObject.RemoveProperty(i.toString())
			i++
		}

		await tableObject.SetPropertyValues(properties)
	}

	public async Delete() {
		let tableObject = await GetTableObject(
			this.uuid,
			environment.bookOrderTableId
		)
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
	let tableObjects = await GetAllTableObjects(
		environment.bookOrderTableId,
		false
	)
	let bookOrders: BookOrder[] = []

	for (let tableObject of tableObjects) {
		let order = ConvertTableObjectToBookOrder(tableObject)
		if (order != null) bookOrders.push(order)
	}

	return bookOrders
}

function ConvertTableObjectToBookOrder(tableObject: TableObject): BookOrder {
	if (
		tableObject == null ||
		tableObject.TableId != environment.bookOrderTableId
	) {
		return null
	}

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

	return new BookOrder(tableObject.Uuid, uuids)
}

export async function UpdateBookOrder(bookOrder: BookOrder, books: Book[]) {
	let uuids: string[] = []

	for (let b of books) {
		uuids.push(b.uuid)
	}

	await bookOrder.SetBookUuids(uuids)
}
