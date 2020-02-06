//#region en
const enDefaults = {
   libraryPage: {
      title: "Your Library",
      bookContextMenuDelete: "Delete",
      bookContextMenuRename: "Rename"
   },
   accountPage: {
		title: "Your Account",
		text1: "Save your library and access it from anywhere",
		text2: "Access the same library on all your devices",
		text3: "Make sure your books don't get lost when you lose or reset your device",
		login: "Log in",
		logout: "Log out",
		signup: "Sign up",
		storageUsed: "{0} GB of {1} GB used",
		planFree: "Free",
		planPlus: "Plus",
		planPro: "Pro"
   },
	settingsPage: {
      title: "Settings",
      theme: "Theme",
      lightTheme: "Light",
      darkTheme: "Dark",
      systemTheme: "Use system setting",
      openLastReadBook: "Open the last read book at startup",
      privacy: "Privacy Policy",
      github: "PocketLib on GitHub"
   },
   developerPage: {
      landingHeader1: "Build on PocketLib",
      landingSubheader1: "Integrate PocketLib into your app or Ebook-Reader",
      viewDocs: "View documentation",
      createApp: "Create your first app",
      login: "Log in to create your first app",
      header: "Your Apps"
   },
   newAppPage: {
		title: "New app",
		create: "Create",
		name: "Name",
		redirectUrl: "Redirect url"
   },
   authorPage: {
      landingHeader1: "Publish on PocketLib",
      landingSubheader1: "Put your book into the PocketLib BookStore",
      createProfile: "Create your profile",
		login: "Log in to create your profile",
		yourAuthors: "Your authors",
		createAuthorDialog: {
			title: "Create author",
			firstNameTextfieldLabel: "First name",
			firstNameTextfieldPlaceholder: "The first name of the author",
			lastNameTextfieldLabel: "Last name",
			lastNameTextfieldPlaceholder: "The last name of the author",
			errors: {
				firstNameTooShort: "The first name is too short",
				lastNameTooShort: "The last name is too short",
				firstNameTooLong: "The first name is too long",
				lastNameTooLong: "The last name is too long",
				unexpectedError: "An unexpected error occured"
			}
		},
		cancel: "Cancel",
		create: "Create"
	},
	authorSetupPage: {
		title: "Create your author profile",
		save: "Save",
		firstNameTextfieldLabel: "First name",
		firstNameTextfieldPlaceholder: "Your first name",
		lastNameTextfieldLabel: "Last name",
		lastNameTextfieldPlaceholder: "Your last name",
		errors: {
			firstNameMissing: "Please provide your first name",
			lastNameMissing: "Please provide your last name",
			firstNameTooShort: "The first name is too short",
			lastNameTooShort: "The last name is too short",
			firstNameTooLong: "The first name is too long",
			lastNameTooLong: "The last name is too long",
			unexpectedError: "An unexpected error occured. Please try again."
		}
	},
	authorCollectionPage: {
		
	},
	authorBookPage: {
		editTitleDialog: {
			title: "Edit title",
			titleTextfieldLabel: "Title",
			titleTextfieldPlaceholder: "The title of your book"
		},
		description: "Description",
		descriptionTextfieldPlaceholder: "A short description of your book",
		noDescription: "No description provided",
		language: "Language",
		languages: {
			en: "English",
			de: "German"
		},
		cover: "Cover",
		noCover: "No cover uploaded",
		uploadCover: "Upload cover",
		bookFile: "Book file",
		noBookFile: "No book file uploaded",
		uploadBookFile: "Upload book file",
		bookFileUploaded: "Book file was uploaded",
		status: "Status",
		published: "Published",
		unpublished: "Not published",
		inReview: "In review",
		publish: "Publish",
		unpublish: "Unpublish",
		edit: "Edit",
		cancel: "Cancel",
		save: "Save",
		errors: {
			titleTooShort: "The title is too short",
			titleTooLong: "The title is too long",
			descriptionTooShort: "The description is too short",
			descriptionTooLong: "The description is too long",
			unexpectedError: "An unexpected error occured"
		}
	},
	loginPage: {
		title: "Log in to dav",
		emailTextfieldLabel: "Email",
		emailTextfieldPlaceholder: "Your email address",
		passwordTextfieldLabel: "Password",
		passwordTextfieldPlaceholder: "Your password",
		login: "Log in",
		deviceInfoUnknown: "Unknown",
		errors: {
			loginFailed: "Login failed",
			emailMissing: "Please enter your email",
			passwordMissing: "Please enter your password",
			unexpectedErrorShort: "Unexpected error ({0})",
			unexpectedErrorLong: "An unexpected error occured. Please try it again."
		}
	},
	editCollectionNames: {
		nameTextfieldPlaceholder: "The name of your collection in {0}",
		addLanguageDropdownLabel: "Add language",
		selectLanguage: "Select a language",
		errors: {
			nameTooShort: "The name is too short",
			nameTooLong: "The name is too long",
			unexpectedError: "An unexpected error occured. Please try it again later."
		}
	},
   renameBookModal: {
      title: "Rename book",
      bookTitle: "Title",
      save: "Save",
      cancel: "Cancel"
	},
	deleteBookModal: {
		title: "Delete book",
		description: "Are you sure you want to delete this book?",
		delete: "Delete",
		cancel: "Cancel"
	},
	logoutModal: {
		title: "Log out",
		description: "Are you sure you want to log out?",
		logout: "Log out",
		cancel: "Cancel"
   },
   epubContent: {
      toc: "Table of contents",
      bookmarks: "Bookmarks",
      noBookmarks: "You have no bookmarks",
      untitledBookmark: "Untitled bookmark"
   },
   pdfContent: {
      bookmarks: "Bookmarks",
      noBookmarks: "You have no bookmarks",
		page: "Page"
	},
	authorProfile: {
		yourCollections: "Your collections",
		uploadProfileImage: "Upload profile image",
		addYourBio: "Add your biography",
		bioTextfieldPlaceholder: "Your biography",
		noBio: "No biography provided",
		additionalLanguages: "Additional languages",
		createCollectionDialog: {
			title: "Create collection",
			nameTextfieldLabel: "Name",
			nameTextfieldPlaceholder: "The name of the collection",
			errors: {
				nameTooShort: "The name is too short",
				nameTooLong: "The name is too long",
				unexpectedError: "An unexpected error occured"
			}
		},
		errors: {
			bioTooShort: "Your biography is too short",
			bioTooLong: "Your biography is too long",
			unexpectedError: "An unexpected error occured. Please try again."
		},
		edit: "Edit",
		cancel: "Cancel",
		save: "Save",
		create: "Create"
	},
	collectionView: {
		createBookDialog: {
			title: "Create book",
			titleTextfieldLabel: "Title",
			titleTextfieldPlaceholder: "The title of your book",
			errors: {
				titleMissing: "Please provide a title",
				titleTooShort: "The title is too short",
				titleTooLong: "The title is too long",
				unexpectedError: "An unexpected error occured"
			}
		},
		collectionNamesDialog: {
			title: "Collection name"
		},
		noBooks: "This collection contains no books",
		add: "Add",
		close: "Close",
		cancel: "Cancel",
		save: "Save"
	},
	misc: {
		languages: {
			en: "English",
			de: "German"
		}
	}
}

export var enUS = enDefaults;

export var enGB = enDefaults;
//#endregion

//#region de
const deDefaults = {
   libraryPage: {
      title: "Deine Bibliothek",
      bookContextMenuDelete: "Löschen",
      bookContextMenuRename: "Umbenennen"
   },
   accountPage: {
		title: "Dein Account",
		text1: "Sichere deine Bibliothek und greife von überall darauf zu",
		text2: "Nutze die gleiche Bibliothek auf all deinen Geräten",
		text3: "Stelle sicher, dass deine Bücher nicht verloren gehen, wenn du dein Gerät verlierst oder zurücksetzt",
		login: "Anmelden",
		logout: "Abmelden",
		signup: "Registrieren",
		storageUsed: "{0} GB von {1} GB verwendet",
		planFree: "Free",
		planPlus: "Plus",
		planPro: "Pro"
   },
   settingsPage: {
      title: "Einstellungen",
      theme: "Thema",
      lightTheme: "Hell",
      darkTheme: "Dunkel",
      systemTheme: "Systemeinstellung verwenden",
      openLastReadBook: "Öffne das zuletzt gelesene Buch beim Starten",
      privacy: "Datenschutzerklärung",
      github: "PocketLib auf GitHub"
	},
	developerPage: {
      landingHeader1: "Baue auf PocketLib",
      landingSubheader1: "Integriere PocketLib in deine App oder deinen Ebook-Reader",
      viewDocs: "Dokumentation ansehen",
      createApp: "Erstelle deine erste App",
		login: "Melde dich an und erstelle deine erste App",
		header: "Deine Apps"
   },
   newAppPage: {
		title: "Neue App",
		create: "Erstellen",
		name: "Name",
		redirectUrl: "Weiterleitungs-URL"
   },
   authorPage: {
      landingHeader1: "Veröffentliche auf PocketLib",
      landingSubheader1: "Setze dein Buch in den PocketLib Bücherladen",
      createProfile: "Erstelle dein Profil",
		login: "Melde dich an, um dein Profil zu erstellen",
		yourAuthors: "Deine Autoren",
		createAuthorDialog: {
			title: "Autor erstellen",
			firstNameTextfieldLabel: "Vorname",
			firstNameTextfieldPlaceholder: "Der Vorname des Autors",
			lastNameTextfieldLabel: "Nachname",
			lastNameTextfieldPlaceholder: "Der Nachname des Autors",
			errors: {
				firstNameTooShort: "Der Vorname ist zu kurz",
				lastNameTooShort: "Der Nachname ist zu kurz",
				firstNameTooLong: "Der Vorname ist zu lang",
				lastNameTooLong: "Der Nachname ist zu lang",
				unexpectedError: "Ein unerwarteter Fehler ist aufgetreten"
			}
		},
		cancel: "Abbrechen",
		create: "Erstellen"
	},
	authorSetupPage: {
		title: "Erstelle dein Autoren-Profil",
		save: "Speichern",
		firstNameTextfieldLabel: "Vorname",
		firstNameTextfieldPlaceholder: "Dein Vorname",
		lastNameTextfieldLabel: "Nachname",
		lastNameTextfieldPlaceholder: "Dein Nachname",
		errors: {
			firstNameMissing: "Bitte gib deinen Vornamen an",
			lastNameMissing: "Bitte gib deinen Nachnamen an",
			firstNameTooShort: "Der Vorname ist zu kurz",
			lastNameTooShort: "Der Nachname ist zu kurz",
			firstNameTooLong: "Der Vorname ist zu lang",
			lastNameTooLong: "Der Nachname ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es nochmal."
		}
	},
	authorCollectionPage: {
		
	},
	authorBookPage: {
		editTitleDialog: {
			title: "Titel bearbeiten",
			titleTextfieldLabel: "Titel",
			titleTextfieldPlaceholder: "Der Titel deines Buches"
		},
		description: "Beschreibung",
		descriptionTextfieldPlaceholder: "Eine kurze Beschreibung deines Buches",
		noDescription: "Keine Beschreibung angegeben",
		language: "Sprache",
		languages: {
			en: "Englisch",
			de: "Deutsch"
		},
		cover: "Cover",
		noCover: "Kein Cover hochgeladen",
		uploadCover: "Cover hochladen",
		bookFile: "Buch-Datei",
		noBookFile: "Keine Buch-Datei hochgeladen",
		uploadBookFile: "Buch-Datei hochladen",
		bookFileUploaded: "Buch-Datei wurde hochgeladen",
		status: "Status",
		published: "Veröffentlicht",
		unpublished: "Nicht veröffentlicht",
		inReview: "In Überprüfung",
		publish: "Veröffentlichen",
		unpublish: "Veröffentlichung aufheben",
		edit: "Bearbeiten",
		cancel: "Abbrechen",
		save: "Speichern",
		errors: {
			titleTooShort: "Der Titel ist zu kurz",
			titleTooLong: "Der Titel ist zu lang",
			descriptionTooShort: "Die Beschreibung ist zu kurz",
			descriptionTooLong: "Die Beschreibung ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten"
		}
	},
	loginPage: {
		title: "Mit dav anmelden",
		emailTextfieldLabel: "Email",
		emailTextfieldPlaceholder: "Deine Email-Adresse",
		passwordTextfieldLabel: "Passwort",
		passwordTextfieldPlaceholder: "Dein Passwort",
		login: "Anmelden",
		deviceInfoUnknown: "Unbekannt",
      errors: {
			loginFailed: "Anmeldung fehlgeschlagen",
			emailMissing: "Bitte gib deine Email-Adresse ein",
			passwordMissing: "Bitte gib dein Passwort ein",
			unexpectedErrorShort: "Unerwarteter Fehler ({0})",
			unexpectedErrorLong: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es nochmal."
		}
	},
	editCollectionNames: {
		nameTextfieldPlaceholder: "Der Name deiner Sammlung auf {0}",
		addLanguageDropdownLabel: "Sprache hinzufügen",
		selectLanguage: "Wähle eine Sprache",
		errors: {
			nameTooShort: "Der Name ist zu kurz",
			nameTooLong: "Der Name ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später nochmal."
		}
	},
   renameBookModal: {
      title: "Buch umbenennen",
      bookTitle: "Titel",
      save: "Speichern",
      cancel: "Abbrechen"
	},
	deleteBookModal: {
		title: "Buch löschen",
		description: "Bist du dir sicher, dass du dieses Buch löschen willst?",
		delete: "Löschen",
		cancel: "Abbrechen"
	},
	logoutModal: {
		title: "Abmelden",
		description: "Bist du dir sicher, dass du dich abmelden möchtest?",
		logout: "Abmelden",
		cancel: "Abbrechen"
	},
   epubContent: {
      toc: "Inhaltsverzeichnis",
      bookmarks: "Lesezeichen",
      noBookmarks: "Du hast keine Lesezeichen",
      untitledBookmark: "Unbenanntes Lesezeichen"
	},
	pdfContent: {
      bookmarks: "Lesezeichen",
      noBookmarks: "Du hast keine Lesezeichen",
		page: "Seite"
	},
	authorProfile: {
		yourCollections: "Deine Sammlungen",
		uploadProfileImage: "Profilbild hochladen",
		addYourBio: "Biographie angeben",
		bioTextfieldPlaceholder: "Deine Biographie",
		noBio: "Keine Biographie angegeben",
		additionalLanguages: "Weitere Sprachen",
		createCollectionDialog: {
			title: "Sammlung erstellen",
			nameTextfieldLabel: "Name",
			nameTextfieldPlaceholder: "Der Name der Sammlung",
			errors: {
				nameTooShort: "Der Name ist zu kurz",
				nameTooLong: "Der Name ist zu lang",
				unexpectedError: "Ein unerwarteter Fehler ist aufgetreten"
			}
		},
		errors: {
			bioTooShort: "Deine Biographie ist zu kurz",
			bioTooLong: "Deine Biographie ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es nochmal."
		},
		edit: "Bearbeiten",
		cancel: "Abbrechen",
		save: "Speichern",
		create: "Erstellen"
	},
	collectionView: {
		createBookDialog: {
			title: "Buch erstellen",
			titleTextfieldLabel: "Titel",
			titleTextfieldPlaceholder: "Der Titel deines Buches",
			errors: {
				titleMissing: "Bitte gib einen Titel an",
				titleTooShort: "Der Titel ist zu kurz",
				titleTooLong: "Der Titel ist zu lang",
				unexpectedError: "Ein unerwarteter Fehler ist aufgetreten"
			}
		},
		collectionNamesDialog: {
			title: "Name der Sammlung"
		},
		noBooks: "Diese Sammlung enthält keine Bücher",
		add: "Hinzufügen",
		close: "Schließen",
		cancel: "Abbrechen",
		save: "Speichern"
	},
	misc: {
		languages: {
			en: "Englisch",
			de: "Deutsch"
		}
	}
}

export var deDE = deDefaults;

export var deAT = deDefaults;

export var deCH = deDefaults;
//#endregion