import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()

export const db = admin.firestore()

export const checkUserAnswer = (
	userAnswer: string,
	correctAnswer: string
): boolean => userAnswer === correctAnswer

export const updateStatus = (
	enigmaId: string,
	status: string
): Promise<FirebaseFirestore.WriteResult> => {
	return db.doc(`enigma_cmd/${enigmaId}`).update({ status: status })
}

export const isUserWinner = (userId: string, winners: any[]): boolean => {
	return winners.some(winner => winner.userName === userId)
}

export const command = functions.firestore
	.document('enigma_cmd/{cmdId}')
	.onCreate(async (snapshot, context) => {
		// get document id
		const cmdId = context.params.cmdId
		// get document data
		const data = snapshot.data()
		// retrieve keys
		const { enigmaId, userId, userAnswer } = data

		// set a ref to the current enigma
		const enigmaRef = db.doc(`enigma/${enigmaId}`)
		// get the current enigma data snapshot
		const enigmaSnap = await enigmaRef.get()
		// retrive the data
		const enigmaData = enigmaSnap.data()
		// retrieve keys
		const { answer, winners } = enigmaData

		// Check if already winner logic
		if (isUserWinner(userId, winners)) {
			await updateStatus(cmdId, 'Nice try kid...')
			throw new Error('User is already a winner for the current enigma')
		}

		// Check answer logic
		if (!checkUserAnswer(userAnswer, answer)) {
			return await updateStatus(cmdId, 'Mauvaise réponse')
		}

		// Add user to winners array
		db.runTransaction(transaction => {
			return transaction.get(enigmaRef).then(doc => {
				const newWinner = [
					{ userName: userId, points: 30 },
					...doc.data().winners
				]
				transaction.update(enigmaRef, { winners: newWinner })
			})
		})
			.then(() => {
				console.log('User saved to winners array.')
			})
			.catch(() => {
				throw new Error('Transaction leads to an error.')
			})

		return await updateStatus(cmdId, 'Bonne réponse')
	})
