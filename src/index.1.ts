import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

// Services
import { httpService } from "./services/http.service";

// Render Engine
import { renderEngine } from "./engine/render.engine";

// Models
import { ProjectConfig } from "./models/project-config.model";
import { IEnigma } from "./models/enigma.model";
import { IUser } from "./models/user.model";

class Enigma {
  app: firebase.app.App;
  db: firebase.firestore.Firestore;

  // data
  currentEnigma: IEnigma;

  constructor(private cfg: ProjectConfig) {
    this.app = firebase.initializeApp(this.cfg);
    this.db = this.app.firestore();
    this.db.settings({ timestampsInSnapshots: true });

    // Enigma ref
    const enigmaRef: firebase.firestore.Query = this.db
      .collection("enigma")
      .where("isOpen", "==", true)
      .limit(1);

    // User commande history ref
    const userHistoryRef: firebase.firestore.Query = this.db
      .collection("enigma_cmd")
      .where("userId", "==", true)
      .where("enigmaId", "==", "test");

    this.initFirebaseAuth();
    this.initUI();
    this.main(enigmaRef);
  }

  initUI() {
    renderEngine.enigmaSubmit.addEventListener("click", () =>
      this.onSubmitAnswer(renderEngine.enigmaInput)
    );
    renderEngine.enigmaLogin.addEventListener("click", () => this.signIn());
    renderEngine.enigmaLogout.addEventListener("click", () => this.signOut());
  }

  async main(enigmaRef: firebase.firestore.Query) {
    await enigmaRef.onSnapshot(snapshot => {
      snapshot.docChanges().map(changes => {
        const data = changes.doc.data();
        const { id } = changes.doc;
        this.currentEnigma = { id, ...data };
        renderEngine.render(this.currentEnigma);
      });
    });
  }

  async onSubmitAnswer({ value: userAnswer }: HTMLInputElement) {
    const { uid: userId, displayName }: IUser = this.currentUser;

    const { id: enigmaId } = this.currentEnigma;

    const payload = {
      enigmaId,
      userId,
      userAnswer
    };

    console.log("Loading...");

    await this.db.collection("enigma_cmd").add(payload);

    console.log("Loaded...");
  }

  signIn(): Promise<firebase.auth.UserCredential> {
    return this.app.auth().signInAnonymously();
  }

  signOut(): Promise<void> {
    return this.app.auth().signOut();
  }

  initFirebaseAuth(): void {
    this.app.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  }

  onAuthStateChanged(user: firebase.User): void {
    if (user) {
      renderEngine.renderUser(user);
    } else {
      renderEngine.renderUser({ uid: undefined, displayName: undefined });
      renderEngine.resetDefaultUI();
    }
  }

  get currentUser() {
    return this.app.auth().currentUser;
  }
}

new Enigma({
  apiKey: "AIzaSyAJCNeREdEEE6WLxvFNpNavv6NTXOmdpGk",
  authDomain: "toto-e2e69.firebaseapp.com",
  databaseURL: "https://toto-e2e69.firebaseio.com",
  projectId: "toto-e2e69",
  storageBucket: "toto-e2e69.appspot.com",
  messagingSenderId: "666341637840"
});
