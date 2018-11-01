import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()

const db = admin.firestore()

const checkUserAnswer = (userAnswer: string, correctAnswer: string) =>
	userAnswer === correctAnswer

const updateStatus = (enigmaId: string, status: string) => {
	return db.doc(`enigma_cmd/${enigmaId}`).update({ status: status })
}

export const command = functions.firestore
	.document('enigma_cmd/{cmdId}')
	.onCreate(async (snapshot, context) => {
		const data = snapshot.data()
		const cmdId = context.params.cmdId

		const { enigmaId, userId, userAnswer } = data

		const enigmaRef = db.doc(`enigma/${enigmaId}`)
		// get the current data snapshot
		const enigmaSnap = await enigmaRef.get()
		// retrive the data
		const enigmaData = enigmaSnap.data()

		const { answer } = enigmaData

		// Check answer logic
		if (checkUserAnswer(userAnswer, answer)) {
			db.runTransaction(t => {
				return t.get(enigmaRef).then(doc => {
					// Add one person to the city population
					const newWinner = [
						{ userName: userId, points: 30 },
						...doc.data().winners
					]
					t.update(enigmaRef, { winners: newWinner })
				})
			})
				.then(() => {
					return updateStatus(cmdId, 'Bonne réponse')
				})
				.catch(err => {
					console.log('Error', err)
				})
		} else {
			return updateStatus(cmdId, 'Mauvaise réponse')
		}

		return true
	})
