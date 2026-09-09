import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"
import { execFileSync } from "node:child_process"

const source = readFileSync(new URL("../src/app/misc/seo.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { canonicalUrl } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`)

test("paginated pages keep their identity, without tracking or fragments", () => {
	for (const kind of ["publisher", "author", "category", "series"]) {
		const path = `/store/${kind}/example`
		assert.equal(canonicalUrl(path, `${path}?page=2&utm_source=test#books`), `https://pocketlib.app${path}?page=2`)
		for (const page of ["1", "0", "-1", "invalid", "Infinity", "2.5"]) {
			assert.equal(canonicalUrl(path, `${path}?page=${page}`), `https://pocketlib.app${path}`)
		}
	}
})

test("canonical normalization preserves publisher filters and ignores book query parameters", () => {
	assert.equal(canonicalUrl("/store/publisher/example/", "/store/publisher/example?page=2&query=Jane&utm_source=test"), "https://pocketlib.app/store/publisher/example?page=2&query=Jane")
	assert.equal(canonicalUrl("store/book/example/", "/store/book/example?page=2&accessToken=secret"), "https://pocketlib.app/store/book/example")
	assert.equal(canonicalUrl("/", "/?utm_source=test"), "https://pocketlib.app/")
})

test("SSR renders a real image and alt text without Canvas or IntersectionObserver", () => {
	const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
		import "@dav-apps/ssr-angular/enable-lit-ssr.js";
		import { html } from "lit";
		import { render } from "@lit-labs/ssr";
		import "dav-ui-components";
		const template = html\`<dav-blurhash-image src="https://example.com/cover.jpg" alt="Book cover" blurhash="LQFP7}s.i_a|~UWB%2ofxaNGt7of" width="100"></dav-blurhash-image>\`;
		process.stdout.write([...render(template)].join(""));
	`], { encoding: "utf8" })
	assert.match(output, /<img\b/)
	assert.match(output, /src="https:\/\/example.com\/cover.jpg"/)
	assert.match(output, /alt="Book cover"/)
})
