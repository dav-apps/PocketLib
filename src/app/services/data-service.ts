import { Injectable } from "@angular/core";
import { DavUser } from 'dav-npm';
declare var zip: any;

@Injectable()
export class DataService{
   user: DavUser

   async ReadEpubFile(zipFile: File){
		zip.workerScriptsPath = "/assets/libraries/";
		
		// Create a reader
		var readZipPromise: Promise<any> = new Promise((resolve) => {
			zip.createReader(new zip.BlobReader(zipFile), resolve);
		});
		var reader = await readZipPromise;

		// Get the entries with the reader
		var getEntriesPromise: Promise<any[]> = new Promise((resolve) => {
			reader.getEntries(resolve);
		});
		var entries = await getEntriesPromise;

		// Get the container file
		let index = entries.findIndex(entry => entry.filename == "META-INF/container.xml");

		if(index !== -1){
			var containerEntry = entries[index];

			// Get the content of the container
			var containerContentPromise: Promise<string> = new Promise((resolve) => {
				containerEntry.getData(new zip.TextWriter(), resolve);
			});
			let containerContent = await containerContentPromise;

			let parser = new DOMParser();
			let containerDoc = parser.parseFromString(containerContent, "text/xml");
			let container = containerDoc.getElementsByTagName("container")[0];
			let rootFiles = container.getElementsByTagName("rootfiles")[0]
			let rootFile = rootFiles.getElementsByTagName("rootfile")[0];
			let opfFilePath = rootFile.getAttribute("full-path");
			
			// Get the opf file from the entries
			index = entries.findIndex(entry => entry.filename == opfFilePath);
			if(index !== -1){
				let opfFileEntry = entries[index];

				// Get the content of the container
				var opfContentPromise: Promise<string> = new Promise((resolve) => {
					opfFileEntry.getData(new zip.TextWriter(), resolve);
				});
				let opfContent = await opfContentPromise;

				// Read the OPF file content
				parser = new DOMParser();
				let opfDoc = parser.parseFromString(opfContent, "text/xml");

				/*
				// Get the metadata content
				let metadataTag = opfDoc.getElementsByTagName("metadata")[0];
				*/

				// Get the manifest content
				let manifestTag = opfDoc.getElementsByTagName("manifest")[0];
				let manifestItemTags = manifestTag.getElementsByTagName("item");

				let manifestItems: Map<string, string> = new Map();

				for(let i = 0; i < manifestItemTags.length; i++){
					manifestItems.set(manifestItemTags[i].getAttribute("id"), manifestItemTags[i].getAttribute("href"));
				}
				console.log(manifestItems)

				// Get the spine content
				let spineTag = opfDoc.getElementsByTagName("spine")[0];
				let chapters: {id: string, path: string}[] = [];

				let spineItemTags = spineTag.getElementsByTagName("itemref");
				for(let i = 0; i < spineItemTags.length; i++){
					let idref = spineItemTags[i].getAttribute("idref");

					// Get the item with the id from the manifest items
					let itemValue = manifestItems.get(idref);
					if(itemValue != null){
						chapters.push({
							id: idref,
							path: itemValue
						});
					}
				}
				console.log(chapters)
			}else{
				// The epub file is not valid
				// TODO Show some error
			}
		}else{
			// The epub file is not valid
			// TODO Show some error
		}
   }
}