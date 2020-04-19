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
		text3: "Get books from the PocketLib Store",
		text4: "Make sure your books don't get lost",
		login: "Log in",
		logout: "Log out",
		signup: "Sign up",
		storageUsed: "{0} GB of {1} GB used",
		planFree: "Free",
		planPlus: "Plus",
		planPro: "Pro",
		upgradeTitle: "Change your plan to make PocketLib even better",
		selectPlan: "Select",
		upgradeProCard: {
			plan: "dav Pro",
			price: "10 € per month",
			feature1: "Get access to all books in the PocketLib Store",
			feature2: "Support the authors of the books you read",
			feature3: "Help us with the development of new apps and features"
		}
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
      landingSubheader1: "Put your book into the PocketLib Store",
      createProfile: "Create your profile",
		login: "Log in to create your profile",
		yourAuthors: "Your authors",
		booksInReview: "Books in review",
		createAuthorDialog: {
			title: "Create author",
			firstNameTextfieldLabel: "First name",
			firstNameTextfieldPlaceholder: "The first name of the author",
			lastNameTextfieldLabel: "Last name",
			lastNameTextfieldPlaceholder: "The last name of the author",
			errors: {
				firstNameMissing: "Please enter the first name",
				lastNameMissing: "Please enter the last name",
				firstNameTooShort: "The first name is too short",
				lastNameTooShort: "The last name is too short",
				firstNameTooLong: "The first name is too long",
				lastNameTooLong: "The last name is too long",
				unexpectedError: "An unexpected error occured. Please try again later."
			}
		},
		cancel: "Cancel",
		create: "Create"
	},
	authorSetupPage: {
		title: "Create your author profile",
		create: "create",
		firstNameTextfieldLabel: "First name",
		firstNameTextfieldPlaceholder: "Your first name",
		lastNameTextfieldLabel: "Last name",
		lastNameTextfieldPlaceholder: "Your last name",
		errors: {
			firstNameMissing: "Please enter your first name",
			lastNameMissing: "Please enter your last name",
			firstNameTooShort: "The first name is too short",
			lastNameTooShort: "The last name is too short",
			firstNameTooLong: "The first name is too long",
			lastNameTooLong: "The last name is too long",
			unexpectedError: "An unexpected error occured. Please try again later."
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
		categoriesSelectionDialog: {
			title: "Select categories"
		},
		cover: "Cover",
		noCover: "No cover uploaded",
		uploadCover: "Upload cover",
		description: "Description",
		descriptionTextfieldPlaceholder: "A short description of your book",
		noDescription: "No description provided",
		language: "Language",
		categories: "Categories",
		price: "Price",
		free: "Free",
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
			priceInvalid: "The price is invalid",
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
	storePage: {
		startPage: "Start page",
		categories: "Categories"
	},
	storeBookPage: {
		addToLibrary: "Add to your library",
		snackbarMessageAdded: "The book was added to your library",
		unpublished: "Unpublished",
		review: "In review",
		hidden: "Hidden",
		publish: "Publish",
		free: "Free",
		davProRequiredDialog: {
			title: "dav Pro required",
			description: "Access all books in the Store and support the authors with dav Pro for 10 € per month.",
			learnMore: "Learn more"
		},
		buyBookDialog: {
			title: "Buy book",
			description: "When you buy this book, you can access it regardless of you plan. You can also download the book file and read it in another app or on an Ebook reader.<br><br>70 % of the price goes directly to the author.",
			continue: "Continue"
		},
		back: "Back"
	},
	editCollectionNames: {
		nameTextfieldPlaceholder: "The name of your collection in {0}",
		addLanguageDropdownLabel: "Add language",
		selectLanguage: "Select a language",
		errors: {
			nameMissing: "Please enter a name",
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
		yourBooks: "Your books",
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
				nameMissing: "Please enter a name",
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
		collectionNamesDialog: {
			title: "Collection name"
		},
		noBooks: "This collection contains no books",
		close: "Close"
	},
	horizontalBookList: {
		recentlyPublished: "Recently published books"
	},
	horizontalAuthorList: {
		newAuthors: "New authors"
	},
	editPrice: {
		priceTextfieldLabel: "Cent in €",
		priceTextfieldPlaceholder: "Price of your book in Euro",
		free: "Free"
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
		text3: "Greife auf Bücher im PocketLib Store zu",
		text4: "Stelle sicher, dass deine Bücher nicht verloren gehen",
		login: "Anmelden",
		logout: "Abmelden",
		signup: "Registrieren",
		storageUsed: "{0} GB von {1} GB verwendet",
		planFree: "Free",
		planPlus: "Plus",
		planPro: "Pro",
		upgradeTitle: "Wähle ein Abo, um PocketLib noch besser zu machen",
		selectPlan: "Auswählen",
		upgradeProCard: {
			plan: "dav Pro",
			price: "10 € pro Monat",
			feature1: "Greife auf alle Bücher im PocketLib Store zu",
			feature2: "Unterstütze die Autoren der Bücher, die du liest",
			feature3: "Hilf uns bei der Entwicklung von neuen Apps und Funktionen"
		}
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
      landingSubheader1: "Setze dein Buch in den PocketLib Store",
      createProfile: "Erstelle dein Profil",
		login: "Melde dich an, um dein Profil zu erstellen",
		yourAuthors: "Deine Autoren",
		booksInReview: "Bücher in Überprüfung",
		createAuthorDialog: {
			title: "Autor erstellen",
			firstNameTextfieldLabel: "Vorname",
			firstNameTextfieldPlaceholder: "Der Vorname des Autors",
			lastNameTextfieldLabel: "Nachname",
			lastNameTextfieldPlaceholder: "Der Nachname des Autors",
			errors: {
				firstNameMissing: "Bitte gib einen Vornamen ein",
				lastNameMissing: "Bitte gib einen Nachnamen ein",
				firstNameTooShort: "Der Vorname ist zu kurz",
				lastNameTooShort: "Der Nachname ist zu kurz",
				firstNameTooLong: "Der Vorname ist zu lang",
				lastNameTooLong: "Der Nachname ist zu lang",
				unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später nochmal."
			}
		},
		cancel: "Abbrechen",
		create: "Erstellen"
	},
	authorSetupPage: {
		title: "Erstelle dein Autoren-Profil",
		create: "Erstellen",
		firstNameTextfieldLabel: "Vorname",
		firstNameTextfieldPlaceholder: "Dein Vorname",
		lastNameTextfieldLabel: "Nachname",
		lastNameTextfieldPlaceholder: "Dein Nachname",
		errors: {
			firstNameMissing: "Bitte gib deinen Vornamen ein",
			lastNameMissing: "Bitte gib deinen Nachnamen ein",
			firstNameTooShort: "Der Vorname ist zu kurz",
			lastNameTooShort: "Der Nachname ist zu kurz",
			firstNameTooLong: "Der Vorname ist zu lang",
			lastNameTooLong: "Der Nachname ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später nochmal."
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
		categoriesSelectionDialog: {
			title: "Kategorien auswählen"
		},
		cover: "Cover",
		noCover: "Kein Cover hochgeladen",
		uploadCover: "Cover hochladen",
		description: "Beschreibung",
		descriptionTextfieldPlaceholder: "Eine kurze Beschreibung deines Buches",
		noDescription: "Keine Beschreibung angegeben",
		language: "Sprache",
		categories: "Kategorien",
		price: "Preis",
		free: "Kostenlos",
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
			priceInvalid: "Der Preis ist ungültig",
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
	storePage: {
		startPage: "Startseite",
		categories: "Kategorien"
	},
	storeBookPage: {
		addToLibrary: "Zur Bibliothek hinzufügen",
		snackbarMessageAdded: "Das Buch wurde zu deiner Bibliothek hinzugefügt",
		unpublished: "Nicht veröffentlicht",
		review: "In Überprüfung",
		hidden: "Versteckt",
		publish: "Veröffentlichen",
		free: "Kostenlos",
		davProRequiredDialog: {
			title: "dav Pro benötigt",
			description: "Mit dav Pro kannst du für 10 € pro Monat auf alle Bücher im Store zugreifen und gleichzeitig die Autoren unterstützen.",
			learnMore: "Mehr erfahren"
		},
		buyBookDialog: {
			title: "Buch kaufen",
			description: "Wenn du dieses Buch kaufst, kannst du unabhängig von deinem Abo darauf zugreifen. Außerdem kannst du die Buch-Datei herunterladen und in einer anderen App oder auf einem Ebook-Reader lesen.<br><br>70 % des Preises geht direkt an den Autor.",
			continue: "Weiter"
		},
		back: "Zurück"
	},
	editCollectionNames: {
		nameTextfieldPlaceholder: "Der Name deiner Sammlung auf {0}",
		addLanguageDropdownLabel: "Sprache hinzufügen",
		selectLanguage: "Wähle eine Sprache",
		errors: {
			nameMissing: "Bitte gib einen Namen ein",
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
		yourBooks: "Deine Bücher",
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
				nameMissing: "Bitte gib einen Namen ein",
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
		collectionNamesDialog: {
			title: "Name der Sammlung"
		},
		noBooks: "Diese Sammlung enthält keine Bücher",
		close: "Schließen"
	},
	horizontalBookList: {
		recentlyPublished: "Kürzlich veröffentlichte Bücher"
	},
	horizontalAuthorList: {
		newAuthors: "Neue Autoren"
	},
	editPrice: {
		priceTextfieldLabel: "Cent in €",
		priceTextfieldPlaceholder: "Preis deines Buches in Euro",
		free: "Kostenlos"
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