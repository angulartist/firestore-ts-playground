import * as firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import { collectionData } from 'rxfire/firestore'
import { Observable } from 'rxjs'
import { tap, map } from 'rxjs/operators'

// Models
import { ProjectConfig } from './models/project-config.model'
import { IEnigma } from './models/enigma.model'
import { IWinner } from './models/enigma.model'
import { IHistory } from './models/history.model'

export class EnigmaInstance {
	db: firebase.firestore.Firestore

	// data
	currentEnigma: IEnigma
	currentUser: firebase.User
	userHistory: any[]

	constructor(private configuration: ProjectConfig) {
		firebase.initializeApp(this.configuration)
		this.db = firebase.firestore()
		this.db.settings({ timestampsInSnapshots: true })

		this.initFirebaseAuth()
	}

	signIn() {
		return firebase
			.auth()
			.signInWithPopup(new firebase.auth.GoogleAuthProvider())
	}

	signOut(): Promise<void> {
		return firebase.auth().signOut()
	}

	initFirebaseAuth(): void {
		firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this))
	}

	onAuthStateChanged(user: firebase.User) {
		if (user) {
			console.log('welcome back...' + user.displayName)
			this.currentUser = user
			this.retrieveEnigma()
			render._authUI(user)
		} else {
			render._authUI(null)
		}
	}

	retrieveEnigma() {
		const currentEnigmaRef = this.db
			.collection('enigma')
			.where('isOpen', '==', true)
			.limit(1)

		collectionData(currentEnigmaRef, 'id').subscribe(items => {
			// get the first one
			const { 0: firstNode } = items

			this.currentEnigma = firstNode

			if (this.currentEnigma) {
				console.log('found question')
				this.retrieveHistory()
			} else {
				render._buildUI()
			}
		})
	}

	retrieveHistory() {
		const { id: enigmaId }: IEnigma = this.currentEnigma

		const userHistoryRef = this.db
			.collection('enigma_cmd')
			.where('enigmaId', '==', enigmaId)

		collectionData(userHistoryRef, 'id').subscribe(items => {
			this.userHistory = [...items]
			console.log(this.userHistory)
			render._buildUI()
		})
	}

	sendCommand() {
		const payload = {
			enigmaId: this.currentEnigma.id,
			userId: this.currentUser.uid,
			userAnswer: 'XD',
			status: 'Analyze...'
		}

		return this.db.collection('enigma_cmd').add(payload)
	}
}

export const enigma = new EnigmaInstance({
	apiKey: 'AIzaSyAJCNeREdEEE6WLxvFNpNavv6NTXOmdpGk',
	authDomain: 'toto-e2e69.firebaseapp.com',
	databaseURL: 'https://toto-e2e69.firebaseio.com',
	projectId: 'toto-e2e69',
	storageBucket: 'toto-e2e69.appspot.com',
	messagingSenderId: '666341637840'
})

export class RenderInstance {
	loaderElement: HTMLDivElement
	questionElement: HTMLDivElement
	historyElement: HTMLDivElement
	winnersElement: HTMLDivElement
	inputElement: HTMLInputElement
	submitButton: HTMLButtonElement
	signInButton: HTMLButtonElement
	signOutButton: HTMLButtonElement

	constructor() {
		this._queryElements()
		this._appendEvents()
	}

	_buildUI() {
		this._dismissLoader()

		// check if current enigma exist
		if (enigma.currentEnigma && enigma.userHistory) {
			if (this._isUserWinner()) {
				console.log('Winner')
			}
			this._showUI()
			this._buildEnigma(enigma.currentEnigma)
			this._buildHistory(enigma.userHistory)
			this._buildWinners(enigma.currentEnigma.winners)
		} else {
			this._hideUI()
		}
	}

	_isUserWinner(): boolean {
		return enigma.currentEnigma.winners.some(
			winner => winner.userName === enigma.currentUser.uid
		)
	}

	_hideEnigmaForm() {
		this.enigmaForm.map(el => (el.style.display = 'none'))
	}

	_buildEnigma({ question, id, winners }: IEnigma) {
		this.questionElement.textContent = question
	}

	_cleanhistory() {
		while (this.historyElement.lastChild) {
			this.historyElement.removeChild(this.historyElement.lastChild)
		}
	}

	_buildHistory(userHistory: IHistory[]) {
		this._cleanhistory()

		const fragment = document.createDocumentFragment()
		userHistory.map(({ userAnswer, status }: IHistory) => {
			const historyCard = document.createElement('p')
			historyCard.textContent = userAnswer + ' => ' + status
			fragment.appendChild(historyCard)
		})
		this.historyElement.appendChild(fragment)
	}

	_cleanWinners() {
		while (this.winnersElement.lastChild) {
			this.winnersElement.removeChild(this.winnersElement.lastChild)
		}
	}

	_buildWinners(winners: IWinner[]) {
		this._cleanWinners()

		const fragment = document.createDocumentFragment()
		winners.map(({ userName, points }: IWinner) => {
			const winnerCard = document.createElement('p')
			winnerCard.textContent = userName
			fragment.appendChild(winnerCard)
		})
		this.winnersElement.appendChild(fragment)
	}

	_dismissLoader() {
		this.loaderElement.style.display = 'none'
	}

	_showUI() {
		this.gameElements.map(el => (el.style.display = 'block'))
	}

	_hideUI() {
		this.gameElements.map(el => (el.style.display = 'none'))
	}

	_authUI(user: firebase.User) {
		if (user) {
			this.signInButton.style.display = 'none'
			this.signOutButton.style.display = 'block'
		} else {
			this._hideUI()
			this.signInButton.style.display = 'block'
			this.signOutButton.style.display = 'none'
		}
	}

	get enigmaForm() {
		return [this.questionElement, this.inputElement, this.submitButton]
	}

	get gameElements() {
		return [
			this.questionElement,
			this.inputElement,
			this.submitButton,
			this.historyElement,
			this.winnersElement
		]
	}

	_queryElements() {
		this.loaderElement = document.querySelector('#loader')
		this.questionElement = document.querySelector('#app_question')
		this.historyElement = document.querySelector('#app_history')
		this.winnersElement = document.querySelector('#app_winners')
		this.inputElement = document.querySelector('#app_input')
		this.submitButton = document.querySelector('#app_submit')
		this.signInButton = document.querySelector('#app_login')
		this.signOutButton = document.querySelector('#app_logout')
	}

	_appendEvents() {
		this.signInButton.addEventListener('click', () => enigma.signIn())
		this.signOutButton.addEventListener('click', () => enigma.signOut())
		this.submitButton.addEventListener('click', () => enigma.sendCommand())
	}
}

export const render = new RenderInstance()
