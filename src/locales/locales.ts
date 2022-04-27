//#region en
const enDefaults = {
   libraryPage: {
		title: "Your Library",
		libraryEmpty: "Your library is currently empty...",
		allBooks: "All books",
		noBooks: "No books found",
		search: "Search for books",
		bookContextMenuExport: "Export",
		bookContextMenuRename: "Rename",
		bookContextMenuRemove: "Remove",
		renameBookDialog: {
			header: "Rename book",
			titleTextfieldLabel: "Title",
			titleTextfieldPlaceholder: "The Littlest Elf",
			errors: {
				titleMissing: "Please enter a title",
				titleTooShort: "The title is too short",
				titleTooLong: "The title is too long"
			}
		},
		removeBookDialog: {
			header: "Remove book",
			description: "Are you sure you want to remove this book from your library?"
		},
		loginToAccessBookDialog: {
			header: "Login required",
			description: "Please log in to access this book.",
			login: "Login"
		},
		addBookErrorDialog: {
			header: "Invalid file",
			description: "The selected file could not be read."
		},
		back: "Back",
		save: "Save",
		remove: "Remove",
		close: "Close",
		cancel: "Cancel"
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
		upgradeTitle: "Change your plan to make PocketLib even better",
		logoutDialog: {
			header: "Log out",
			description: "Are you sure you want to log out?"
		},
		cancel: "Cancel"
   },
	settingsPage: {
      title: "Settings",
      theme: "Theme",
      lightTheme: "Light",
      darkTheme: "Dark",
      systemTheme: "Use system setting",
		openLastReadBook: "Open the last read book at startup",
		news: "News and updates",
		github: "PocketLib on GitHub",
		privacy: "Privacy Policy",
		updateSearch: "Searching for updates...",
		installingUpdate: "Installing the update...",
		updateError: "Error while installing the update",
		noUpdateAvailable: "The app is up-to-date",
		activateUpdate: "Activate update"
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
      landingSection1Header: "Publish on PocketLib",
		landingSection1Subheader: "Put your book into the PocketLib Store",
		landingSection2Header: "Create your profile",
		landingSection2Description: "Customize your profile with your profile picture and a description. You can link to your website and your social media pages.<br><br>All your published books are listed here.",
		landingSection3Header: "Earn money",
		landingSection3Description: "80 percent of the revenue from your books go directly to you.<br>For users with a subscription, the monthly amount is divided equally between the authors of the books they read.",
		landingSection4Header: "Join a growing number of authors",
      createProfile: "Create your profile",
		login: "Log in to create your profile",
		yourAuthors: "Your authors",
		booksInReview: "Books in review",
		createAuthorDialog: {
			header: "Create author",
			firstNameTextfieldLabel: "First name",
			lastNameTextfieldLabel: "Last name",
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
		cancel: "Cancel",
		create: "Create"
	},
	authorSetupPage: {
		title: "Create your author profile",
		create: "Create",
		firstNameTextfieldLabel: "First name",
		lastNameTextfieldLabel: "Last name",
		terms: `With the creation you accept our <a href="{0}/pocketlib/terms" target="blank" {1}>Terms of Service</a>.`,
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
	authorBookDashboardPage: {
		published: "Your book is published!",
		inReview: "You book is being reviewed...",
		inReviewDescription: "We will notify you as soon as your book is published.",
		hidden: "Your book is not listed",
		showDetails: "Show details",
		showReleases: "Show releases",
		cancelPublishing: "Cancel publishing",
		publish: "Publish",
		unpublish: "Unpublish"
	},
	authorBookPage: {
		editTitleDialog: {
			header: "Edit title",
			titleTextfieldLabel: "Title",
			titleTextfieldPlaceholder: "The Littlest Elf"
		},
		categoriesSelectionDialog: {
			header: "Select categories"
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
		bookFileUploading: "Uploading file...",
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
			isbnInvalid: "The ISBN is invalid",
			unexpectedError: "An unexpected error occured",
			unexpectedErrorLong: "An unexpected error occured. Please try it again."
		}
	},
	authorCollectionPage: {
		namesDialog: {
			header: "Collection name"
		},
		noBooks: "This collection contains no books",
		close: "Close"
	},
	authorSeriesPage: {
		editNameDialog: {
			header: "Edit name",
			nameTextfieldLabel: "Name",
			nameTextfieldPlaceholder: "Name of the book series"
		},
		addBookDialog: {
			header: "Choose a book to add"
		},
		errors: {
			nameTooShort: "The name is too short",
			nameTooLong: "The name is too long",
			unexpectedError: "An unexpected error occured"
		},
		bookContextMenuRemove: "Remove",
		save: "Save",
		cancel: "Cancel"
	},
	newBookPage: {
		title: "Create book",
		titleSection: {
			description: "Enter the title of your book.",
			titleTextfieldPlaceholder: "The Littlest Elf"
		},
		collectionSection: {
			description: "Is this book a different version, a new edition or a translation of another book you have already published on PocketLib?",
			newPublication: "New publication"
		},
		descriptionSection: {
			description: "Enter a description.",
			descriptionTextfieldPlaceholder: "This book tells the story of a teensy-weensy little man who scurries around Fairyland having all sorts of adorable adventures."
		},
		categoriesSection: {
			description: "Choose the appropriate categories for your book (maximum 3)."
		},
		priceSection: {
			description: "Specify the price for your book."
		},
		isbnSection: {
			description: "If your book has an ISBN, you can enter it here."
		},
		coverSection: {
			description: "Upload a cover for your book.",
			uploadButtonText: "Upload cover"
		},
		bookFileSection: {
			description: "Upload the book file.",
			uploadButtonText: "Upload book file"
		},
		loadingScreen: {
			creatingBook: "Creating the book...",
			uploadingCover: "Uploading the cover...",
			uploadingBookFile: "Uploading the book file...",
			updatingLocalData: "Updating local data..."
		},
		leavePageDialog: {
			header: "Leave page",
			description: "Are you sure? The data you have entered will not be saved.",
			cancel: "Cancel",
			leave: "Leave"
		},
		errorMessage: "An unexpected error occured. Please try it again later.",
		previous: "Previous",
		next: "Next",
		finish: "Finish"
	},
	newSeriesPage: {
		title: "Create book series",
		description: "Choose the language and the name for the book series.<br>Then you can select the books that belong to the series.",
		nameTextfieldLabel: "Name",
		nameTextfieldPlaceholder: "Name of the book series",
		noBooksMessage: "There are no available books in the selected language.",
		errorMessage: "An unexpected error occured. Please try it again later.",
		create: "Create"
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
		startPage: "Start",
		categories: "Categories",
		selectLanguagesDialog: {
			header: "Select languages",
			description: "Select the languages for which books should be displayed.",
			close: "Close"
		}
	},
	storeBookPage: {
		readNow: "Read now",
		continueReading: "Continue reading",
		unpublished: "Unpublished",
		review: "In review",
		hidden: "Hidden",
		publish: "Publish",
		free: "Free",
		loginRequiredDialog: {
			header: "Login required",
			description: "Log in to get access to this book and to automatically save your books and your progress."
		},
		noAccessDialog: {
			header: "No access",
			description: "Purchase this book or upgrade to dav Pro to read this book."
		},
		buyBookDialog: {
			header: "Buy book",
			description: "When you buy this book, you can access it regardless of your plan. You can also download the book file and read it in another app or on an Ebook reader.<br><br>80 % of the price goes directly to the author.",
			descriptionNotLoggedIn: "When you buy this book, you always have access to it and you can download the book file. Furthermore, 80 % of the price goes directly to the author.<br><br>Log in to be able to buy books.",
			continue: "Continue"
		},
		errorDialog: {
			header: "Error",
			description: "An error occured. Please check your internet connection or try it again later."
		},
		learnMore: "Learn more",
		cancel: "Cancel",
		close: "Close"
	},
	storeBooksPage: {
		allBooksTitle: "All books"
	},
	editNames: {
		collectionNameTextfieldPlaceholder: "Name of your collection",
		errors: {
			nameMissing: "Please enter a name",
			nameTooShort: "The name is too short",
			nameTooLong: "The name is too long",
			unexpectedError: "An unexpected error occured. Please try it again later."
		}
	},
   epubViewer: {
      toc: "Table of contents",
      bookmarks: "Bookmarks",
      noBookmarks: "You have no bookmarks",
      untitledBookmark: "Untitled bookmark"
   },
   pdfViewer: {
      bookmarks: "Bookmarks",
      noBookmarks: "You have no bookmarks",
		page: "Page"
	},
	authorProfile: {
		yourBooks: "Your books",
		yourBookSeries: "Your book series",
		uploadProfileImage: "Upload profile image",
		addYourBio: "Add your biography",
		bioTextfieldPlaceholder: "Your biography",
		noBio: "No biography provided",
		profileImageDialog: {
			header: "Crop your profile image"
		},
		editProfileDialog: {
			header: "Edit your profile",
			firstNameTextfieldLabel: "First name",
			lastNameTextfieldLabel: "Last name",
			websiteUrlTextfieldLabel: "Website",
			websiteUrlTextfieldPlaceholder: "Link to your website",
			facebookUsernameTextfieldLabel: "Facebook",
			facebookUsernameTextfieldPlaceholder: "Your username on Facebook",
			instagramUsernameTextfieldLabel: "Instagram",
			instagramUsernameTextfieldPlaceholder: "Your username on Instagram",
			twitterUsernameTextfieldLabel: "Twitter",
			twitterUsernameTextfieldPlaceholder: "Your username on Twitter",
			errors: {
				firstNameMissing: "Please enter your first name",
				lastNameMissing: "Please enter your last name",
				firstNameTooShort: "The first name is too short",
				lastNameTooShort: "The last name is too short",
				firstNameTooLong: "The first name is too long",
				lastNameTooLong: "The last name is too long",
				websiteUrlInvalid: "The link is invalid",
				usernameInvalid: "The username is invalid",
				unexpectedError: "An unexpected error occured. Please try again later."
			}
		},
		errors: {
			profileImageFileTooLarge: "The image file is too large",
			bioTooShort: "Your biography is too short",
			bioTooLong: "Your biography is too long",
			unexpectedError: "An unexpected error occured. Please try again."
		},
		messages: {
			providerMessage: "<a href='{0}' target='blank'>Register as a provider</a> so that your earnings can be transferred."
		},
		edit: "Edit",
		cancel: "Cancel",
		save: "Save",
		create: "Create"
	},
	horizontalBookList: {
		recentlyPublished: "Recently published books",
		moreBooksInCategory: "More books in this category",
		moreBooksInCategories: "More books in these categories",
		moreOfSeries: "More from the series \"{0}\""
	},
	horizontalAuthorList: {
		newAuthors: "New authors"
	},
	horizontalSeriesList: {
		newSeries: "New book series"
	},
	priceInput: {
		priceTextfieldLabel: "Cent in €",
		priceTextfieldPlaceholder: "Price of your book in Euro",
		free: "Free",
		errors: {
			priceInvalid: "The price is invalid"
		}
	},
	isbnInput: {
		noIsbn: "No ISBN provided",
		errors: {
			isbnInvalid: "The ISBN is invalid"
		}
	},
	userProfile: {
		planFree: "Free",
		planPlus: "Plus",
		planPro: "Pro",
		storageUsed: "{0} GB of {1} GB used",
		logout: "Log out"
	},
	davProCard: {
		plan: "dav Pro",
		price: "10 € per month",
		feature1: "Get access to all books in the PocketLib Store",
		feature2: "Support the authors of the books you read",
		feature3: "Help us with the development of new apps and features",
		selectPlan: "Select"
	},
	libraryPageCards: {
		discoverBooks: "Discover books in the PocketLib Store",
		addBook: "Open a local file",
		goToAuthorPage: "Go to your author profile"
	},
	misc: {
		languages: {
			en: "English",
			de: "German"
		},
		bookCoverAlt: "The cover of the ebook {0}",
		authorProfileImageAlt: "The profile image of the author {0}"
	}
}

export var enUS = enDefaults

export var enGB = enDefaults
//#endregion

//#region de
const deDefaults = {
   libraryPage: {
		title: "Deine Bibliothek",
		libraryEmpty: "Deine Bibliothek ist zurzeit leer...",
		allBooks: "Alle Bücher",
		noBooks: "Keine Bücher gefunden",
		search: "Suche nach Büchern",
		bookContextMenuExport: "Exportieren",
		bookContextMenuRename: "Umbenennen",
		bookContextMenuRemove: "Entfernen",
		renameBookDialog: {
			header: "Buch umbenennen",
			titleTextfieldLabel: "Titel",
			titleTextfieldPlaceholder: "Das winzigste Elflein",
			errors: {
				titleMissing: "Bitte gib einen Titel ein",
				titleTooShort: "Der Titel ist zu kurz",
				titleTooLong: "Der Titel ist zu lang"
			}
		},
		removeBookDialog: {
			header: "Buch entfernen",
			description: "Bist du dir sicher, dass du dieses Buch aus deiner Bibliothek entfernen möchtest?"
		},
		loginToAccessBookDialog: {
			header: "Anmeldung erforderlich",
			description: "Bitte melde dich an, um auf dieses Buch zuzugreifen.",
			login: "Anmelden"
		},
		addBookErrorDialog: {
			header: "Ungültige Datei",
			description: "Die ausgewählte Datei konnte nicht gelesen werden."
		},
		back: "Zurück",
		save: "Speichern",
		remove: "Entfernen",
		close: "Schließen",
		cancel: "Abbrechen"
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
		upgradeTitle: "Wähle ein Abo, um PocketLib noch besser zu machen",
		logoutDialog: {
			header: "Abmelden",
			description: "Bist du dir sicher, dass du dich abmelden möchtest?"
		},
		cancel: "Abbrechen"
   },
   settingsPage: {
      title: "Einstellungen",
      theme: "Thema",
      lightTheme: "Hell",
      darkTheme: "Dunkel",
      systemTheme: "Systemeinstellung verwenden",
		openLastReadBook: "Öffne das zuletzt gelesene Buch beim Starten",
		news: "Neuigkeiten und Updates",
		github: "PocketLib auf GitHub",
		privacy: "Datenschutzerklärung",
		updateSearch: "Suche nach Updates...",
		installingUpdate: "Update wird installiert...",
		updateError: "Fehler beim Installieren des Updates",
		noUpdateAvailable: "Die App ist aktuell",
		activateUpdate: "Update aktivieren"
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
      landingSection1Header: "Veröffentliche auf PocketLib",
		landingSection1Subheader: "Setze dein Buch in den PocketLib Store",
		landingSection2Header: "Erstelle dein Profil",
		landingSection2Description: "Gestalte dein Profil mit deinem Profilbild und einer Beschreibung. Du kannst auf deine Webseite und deine Seiten in sozialen Medien verlinken.<br><br>Hier werden alle deine veröffentlichten Bücher aufgelistet.",
		landingSection3Header: "Verdiene Geld",
		landingSection3Description: "80 Prozent der Einnahmen deiner Bücher gehen direkt an dich.<br>Bei Nutzern mit Abo wird der monatliche Betrag gleichmäßig zwischen den Autoren der gelesenen Bücher aufgeteilt.",
		landingSection4Header: "Trete einer wachsenden Anzahl an Autoren bei",
      createProfile: "Erstelle dein Profil",
		login: "Melde dich an, um dein Profil zu erstellen",
		yourAuthors: "Deine Autoren",
		booksInReview: "Bücher in Überprüfung",
		createAuthorDialog: {
			header: "Autor erstellen",
			firstNameTextfieldLabel: "Vorname",
			lastNameTextfieldLabel: "Nachname",
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
		cancel: "Abbrechen",
		create: "Erstellen"
	},
	authorSetupPage: {
		title: "Erstelle dein Autoren-Profil",
		create: "Erstellen",
		firstNameTextfieldLabel: "Vorname",
		lastNameTextfieldLabel: "Nachname",
		terms: `Mit dem Erstellen akzeptierst du unsere <a href="{0}/pocketlib/terms" target="blank" {1}>Allgemeinen Geschäftsbedingungen</a>.`,
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
	authorBookDashboardPage: {
		published: "Dein Buch ist veröffentlicht!",
		inReview: "Dein Buch wird überprüft...",
		inReviewDescription: "Wir benachrichtigen dich, sobald dein Buch veröffentlicht wurde.",
		hidden: "Dein Buch ist nicht gelistet.",
		showDetails: "Details anzeigen",
		showReleases: "Änderungsverlauf anzeigen",
		cancelPublishing: "Veröffentlichung abbrechen",
		publish: "Veröffentlichen",
		unpublish: "Veröffentlichung aufheben"
	},
	authorBookPage: {
		editTitleDialog: {
			header: "Titel bearbeiten",
			titleTextfieldLabel: "Titel",
			titleTextfieldPlaceholder: "Das winzigste Elflein"
		},
		categoriesSelectionDialog: {
			header: "Kategorien auswählen"
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
		bookFileUploading: "Datei wird hochgeladen...",
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
			isbnInvalid: "Die ISBN ist ungültig",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten",
			unexpectedErrorLong: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es nochmal."
		}
	},
	authorCollectionPage: {
		namesDialog: {
			header: "Name der Sammlung"
		},
		noBooks: "Diese Sammlung enthält keine Bücher",
		close: "Schließen"
	},
	authorSeriesPage: {
		editNameDialog: {
			header: "Name der Buch-Reihe",
			nameTextfieldLabel: "Name",
			nameTextfieldPlaceholder: "Name der Buch-Reihe"
		},
		addBookDialog: {
			header: "Wähle ein Buch zum Hinzufügen"
		},
		errors: {
			nameTooShort: "Der Name ist zu kurz",
			nameTooLong: "Der Name ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten"
		},
		bookContextMenuRemove: "Entfernen",
		save: "Speichern",
		cancel: "Abbrechen"
	},
	newBookPage: {
		title: "Buch erstellen",
		titleSection: {
			description: "Gib den Titel deines Buches ein.",
			titleTextfieldPlaceholder: "Das winzigste Elflein"
		},
		collectionSection: {
			description: "Handelt es sich bei diesem Buch um eine andere Version, eine neue Auflage oder eine Übersetzung eines anderen Buches, das du bereits auf PocketLib veröffentlicht hast?",
			newPublication: "Neue Veröffentlichung"
		},
		descriptionSection: {
			description: "Gib eine Beschreibung an.",
			descriptionTextfieldPlaceholder: "Dieses Buch beschreibt die Geschichte von einem klitzekleinen Männchen, das im Märchenwald herumläuft und allerlei entzückende Abenteuer erlebt."
		},
		categoriesSection: {
			description: "Wähle die passenden Kategorien für dein Buch (maximal 3)."
		},
		priceSection: {
			description: "Gib den Preis für dein Buch an."
		},
		isbnSection: {
			description: "Falls dein Buch eine ISBN hat, kannst du sie hier eintragen."
		},
		coverSection: {
			description: "Lade ein Cover für dein Buch hoch.",
			uploadButtonText: "Cover hochladen"
		},
		bookFileSection: {
			description: "Lade die Buch-Datei hoch.",
			uploadButtonText: "Buch-Datei hochladen"
		},
		loadingScreen: {
			creatingBook: "Buch wird erstellt...",
			uploadingCover: "Cover wird hochgeladen...",
			uploadingBookFile: "Buch-Datei wird hochgeladen...",
			updatingLocalData: "Lokale Daten werden aktualisiert..."
		},
		leavePageDialog: {
			header: "Seite verlassen",
			description: "Bist du dir sicher? Die bisher eingegebenen Daten gehen verloren.",
			cancel: "Abbrechen",
			leave: "Verlassen"
		},
		errorMessage: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später nochmal.",
		previous: "Zurück",
		next: "Weiter",
		finish: "Fertigstellen"
	},
	newSeriesPage: {
		title: "Buch-Reihe erstellen",
		description: "Wähle die Sprache und den Namen für die Buch-Reihe.<br>Anschließend kannst du die Bücher auswählen, die zu der Reihe gehören.",
		nameTextfieldLabel: "Name",
		nameTextfieldPlaceholder: "Name der Buch-Reihe",
		noBooksMessage: "In der ausgewählten Sprache gibt es keine verfügbaren Bücher.",
		errorMessage: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später nochmal.",
		create: "Erstellen"
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
		categories: "Kategorien",
		selectLanguagesDialog: {
			header: "Sprachen auswählen",
			description: "Wähle die Sprachen, für die Bücher angezeigt werden sollen.",
			close: "Schließen"
		}
	},
	storeBookPage: {
		readNow: "Jetzt lesen",
		continueReading: "Weiterlesen",
		unpublished: "Nicht veröffentlicht",
		review: "In Überprüfung",
		hidden: "Versteckt",
		publish: "Veröffentlichen",
		free: "Kostenlos",
		loginRequiredDialog: {
			header: "Anmeldung erforderlich",
			description: "Melde dich an, um auf dieses Buch zuzugreifen und deine gelesenen Bücher und deinen Fortschritt automatisch zu speichern."
		},
		noAccessDialog: {
			header: "Kein Zugriff",
			description: "Kaufe dieses Buch oder ändere dein Abo auf dav Pro, um dieses Buch zu lesen."
		},
		buyBookDialog: {
			header: "Buch kaufen",
			description: "Wenn du dieses Buch kaufst, kannst du unabhängig von deinem Abo darauf zugreifen. Außerdem kannst du die Buch-Datei herunterladen und in einer anderen App oder auf einem Ebook-Reader lesen.<br><br>80 % des Preises geht direkt an den Autor.",
			descriptionNotLoggedIn: "Wenn du dieses Buch kaufst, hast du immer Zugriff darauf und kannst die Buch-Datei herunterladen. Außerdem geht 80 % des Preises direkt an den Autor.<br><br>Melde dich an, um Bücher kaufen zu können.",
			continue: "Weiter"
		},
		errorDialog: {
			header: "Fehler",
			description: "Ein Fehler ist aufgetreten. Bitte überprüfe deine Internetverbindung oder versuche es später nochmal."
		},
		learnMore: "Mehr erfahren",
		cancel: "Abbrechen",
		close: "Schließen"
	},
	storeBooksPage: {
		allBooksTitle: "Alle Bücher"
	},
	editNames: {
		collectionNameTextfieldPlaceholder: "Name deiner Sammlung",
		errors: {
			nameMissing: "Bitte gib einen Namen ein",
			nameTooShort: "Der Name ist zu kurz",
			nameTooLong: "Der Name ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später nochmal."
		}
	},
   epubViewer: {
      toc: "Inhaltsverzeichnis",
      bookmarks: "Lesezeichen",
      noBookmarks: "Du hast keine Lesezeichen",
      untitledBookmark: "Unbenanntes Lesezeichen"
	},
	pdfViewer: {
      bookmarks: "Lesezeichen",
      noBookmarks: "Du hast keine Lesezeichen",
		page: "Seite"
	},
	authorProfile: {
		yourBooks: "Deine Bücher",
		yourBookSeries: "Deine Buch-Reihen",
		uploadProfileImage: "Profilbild hochladen",
		addYourBio: "Biographie angeben",
		bioTextfieldPlaceholder: "Deine Biographie",
		noBio: "Keine Biographie angegeben",
		profileImageDialog: {
			header: "Profilbild zuschneiden"
		},
		editProfileDialog: {
			header: "Profil bearbeiten",
			firstNameTextfieldLabel: "Vorname",
			lastNameTextfieldLabel: "Nachname",
			websiteUrlTextfieldLabel: "Webseite",
			websiteUrlTextfieldPlaceholder: "Link zu deiner Webseite",
			facebookUsernameTextfieldLabel: "Facebook",
			facebookUsernameTextfieldPlaceholder: "Dein Nutzername auf Facebook",
			instagramUsernameTextfieldLabel: "Instagram",
			instagramUsernameTextfieldPlaceholder: "Dein Nutzername auf Instagram",
			twitterUsernameTextfieldLabel: "Twitter",
			twitterUsernameTextfieldPlaceholder: "Dein Nutzername auf Twitter",
			errors: {
				firstNameMissing: "Bitte gib deinen Vornamen ein",
				lastNameMissing: "Bitte gib deinen Nachnamen ein",
				firstNameTooShort: "Der Vorname ist zu kurz",
				lastNameTooShort: "Der Nachname ist zu kurz",
				firstNameTooLong: "Der Vorname ist zu lang",
				lastNameTooLong: "Der Nachname ist zu lang",
				websiteUrlInvalid: "Der Link ist ungültig",
				usernameInvalid: "Der Nutzername ist ungültig",
				unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später nochmal."
			}
		},
		errors: {
			profileImageFileTooLarge: "Die Bilddatei ist zu groß",
			bioTooShort: "Deine Biographie ist zu kurz",
			bioTooLong: "Deine Biographie ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es nochmal."
		},
		messages: {
			providerMessage: "<a href='{0}' target='blank'>Registriere dich als Anbieter</a>, damit deine Einnahmen überwiesen werden können."
		},
		edit: "Bearbeiten",
		cancel: "Abbrechen",
		save: "Speichern",
		create: "Erstellen"
	},
	horizontalBookList: {
		recentlyPublished: "Kürzlich veröffentlichte Bücher",
		moreBooksInCategory: "Weitere Bücher in dieser Kategorie",
		moreBooksInCategories: "Weitere Bücher in diesen Kategorien",
		moreOfSeries: "Mehr aus der Reihe \"{0}\""
	},
	horizontalAuthorList: {
		newAuthors: "Neue Autoren"
	},
	horizontalSeriesList: {
		newSeries: "Neue Buch-Reihen"
	},
	priceInput: {
		priceTextfieldLabel: "Cent in €",
		priceTextfieldPlaceholder: "Preis deines Buches in Euro",
		free: "Kostenlos",
		errors: {
			priceInvalid: "Der Preis ist ungültig"
		}
	},
	isbnInput: {
		noIsbn: "Keine ISBN angegeben",
		errors: {
			isbnInvalid: "Die ISBN ist ungültig"
		}
	},
	userProfile: {
		planFree: "Free",
		planPlus: "Plus",
		planPro: "Pro",
		storageUsed: "{0} GB von {1} GB verwendet",
		logout: "Abmelden"
	},
	davProCard: {
		plan: "dav Pro",
		price: "10 € pro Monat",
		feature1: "Greife auf alle Bücher im PocketLib Store zu",
		feature2: "Unterstütze die Autoren der Bücher, die du liest",
		feature3: "Hilf uns bei der Entwicklung von neuen Apps und Funktionen",
		selectPlan: "Auswählen"
	},
	libraryPageCards: {
		discoverBooks: "Entdecke Bücher im PocketLib Store",
		addBook: "Öffne eine lokale Datei",
		goToAuthorPage: "Gehe zu deinem Autor-Profil",
	},
	misc: {
		languages: {
			en: "Englisch",
			de: "Deutsch"
		},
		bookCoverAlt: "Das Cover des Ebooks {0}",
		authorProfileImageAlt: "Das Profilbild des Autors {0}"
	}
}

export var deDE = deDefaults

export var deAT = deDefaults

export var deCH = deDefaults
//#endregion