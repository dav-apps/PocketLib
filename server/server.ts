import * as path from "path"
import express from "express"
import { createServer } from "http"
import dotenv from "dotenv"
import {
	generateSitemap,
	prepareStoreBookPage,
	prepareStoreAuthorPage,
	prepareStorePublisherPage
} from "./index.js"

dotenv.config()

const app = express()
const http = createServer(app)

app.get("/sitemap.txt", async (req, res) => {
	res.setHeader("Content-Type", "text/plain")
	res.send(await generateSitemap())
})

app.get("/store/book/:uuid", async (req, res) => {
	let result = await prepareStoreBookPage(req.params.uuid)
	res.status(result.status).send(result.html)
})

app.get("/store/author/:uuid", async (req, res) => {
	let result = await prepareStoreAuthorPage(req.params.uuid)
	res.status(result.status).send(result.html)
})

app.get("/store/publisher/:uuid", async (req, res) => {
	let result = await prepareStorePublisherPage(req.params.uuid)
	res.status(result.status).send(result.html)
})

function getRoot(request, response) {
	response.sendFile(path.resolve("./PocketLib/index.html"))
}

function getUndefined(request, response) {
	response.sendFile(path.resolve("./PocketLib/index.html"))
}

app.use(express.static("./PocketLib"))

app.get("/", getRoot)
app.get("/*", getUndefined)

http.listen(process.env.PORT || 3001)
