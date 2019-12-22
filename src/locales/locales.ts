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
		cancel: "Cancel",
		save: "Save"
	},
	authorSetupPage: {
		title: "Create your author profile",
		save: "Save",
		firstNameTextfieldLabel: "First name",
		firstNameTextfieldPlaceholder: "Your first name",
		lastNameTextfieldLabel: "Last name",
		lastNameTextfieldPlaceholder: "Your last name",
		bioTextfieldLabel: "Bio",
		bioTextfieldPlaceholder: "A short description of your person",
		errors: {
			firstNameMissing: "Please provide your first name",
			lastNameMissing: "Please provide your last name",
			bioMissing: "Please provide a bio",
			firstNameTooShort: "The first name is too short",
			lastNameTooShort: "The last name is too short",
			bioTooShort: "The bio is too short",
			firstNameTooLong: "The first name is too long",
			lastNameTooLong: "The last name is too long",
			bioTooLong: "The bio is too long",
			unexpectedError: "An unexpected error occured. Please try again."
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
		login: "Melde dich an und erstelle dein Profil",
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
		cancel: "Abbrechen",
		save: "Speichern"
	},
	authorSetupPage: {
		title: "Erstelle dein Autoren-Profil",
		save: "Speichern",
		firstNameTextfieldLabel: "Vorname",
		firstNameTextfieldPlaceholder: "Dein Vorname",
		lastNameTextfieldLabel: "Nachname",
		lastNameTextfieldPlaceholder: "Dein Nachname",
		bioTextfieldLabel: "Bio",
		bioTextfieldPlaceholder: "Eine kurze Beschreibung deiner Person",
		errors: {
			firstNameMissing: "Bitte gib deinen Vornamen an",
			lastNameMissing: "Bitte gib deinen Nachnamen an",
			bioMissing: "Bitte gib eine Bio an",
			firstNameTooShort: "Der Vorname ist zu kurz",
			lastNameTooShort: "Der Nachname ist zu kurz",
			bioTooShort: "Die Bio ist zu kurz",
			firstNameTooLong: "Der Vorname ist zu lang",
			lastNameTooLong: "Der Nachname ist zu lang",
			bioTooLong: "Die Bio ist zu lang",
			unexpectedError: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es nochmal."
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
   }
}

export var deDE = deDefaults;

export var deAT = deDefaults;

export var deCH = deDefaults;
//#endregion