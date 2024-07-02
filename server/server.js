import * as path from 'path'
import express from 'express'
import { createServer } from 'http'
import dotenv from 'dotenv'
import {
	generateSitemap,
	PrepareStoreBookPage,
	PrepareStoreAuthorPage,
	PrepareStorePublisherPage
} from "./index.js"

dotenv.config()

const app = express()
const http = createServer(app)

app.get("/sitemap.txt", async (req, res) => {
	res.setHeader("Content-Type", "text/plain")
	res.send(await generateSitemap())
})

app.get('/store/book/:uuid', (req, res) => {
	let uuid = req.params.uuid
	PrepareStoreBookPage(uuid).then(result => res.send(result))
})

app.get('/store/author/:uuid', (req, res) => {
	let uuid = req.params.uuid
	PrepareStoreAuthorPage(uuid).then(result => res.send(result))
})

app.get('/store/publisher/:uuid', (req, res) => {
	let uuid = req.params.uuid
	PrepareStorePublisherPage(uuid).then(result => res.send(result))
})

function getRoot(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'))
}

function getUndefined(request, response) {
	response.sendFile(path.resolve('./PocketLib/index.html'))
}

app.use(express.static('./PocketLib'))

app.get('/', getRoot)
app.get('/*', getUndefined)

http.listen(process.env.PORT || 3001)