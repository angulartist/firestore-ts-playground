import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import * as Faker from "faker";
import { ProjectConfig } from "./models/project-config.model";
import { Message } from "./models/message.model";

class Chat {
  app: firebase.app.App;
  db: firebase.firestore.Firestore;
  msgRef: firebase.firestore.Query;

  // DATA
  dataArray: any[] = [];

  // UI
  msgBox: HTMLDivElement;
  addItemButton: HTMLButtonElement;
  loginButton: HTMLButtonElement;
  logoutButton: HTMLButtonElement;

  constructor(config: ProjectConfig) {
    this.app = firebase.initializeApp(config);
    this.db = this.app.firestore();
    this.db.settings({ timestampsInSnapshots: true });

    // REF
    this.msgRef = this.db.collection("slack").orderBy("postedAt", "asc");
  }

  onLoad(): void {
    this._initUI();
    // Get the data inside the firestore collection at time T.
    const retrieveData$ = new Promise((resolve, reject) => {
      this.msgRef
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => this.updateData("init", doc));
          resolve();
        })
        .catch(error => reject(error));
    });

    // Bind a listener and do sumffin whenever thing happens.
    retrieveData$
      .then(() => {
        this.render();
        this.msgRef.onSnapshot(snapshot => {
          snapshot.docChanges().map(changes => {
            return {
              added: () => this.updateData("add", changes.doc),
              removed: () => this.updateData("remove", changes.doc)
            }[changes.type]();
          });
        });
      })
      .catch(error => console.log("Error happn.", "=>", error));

    // Check if user logged in
    this.checkAuthState();
  }

  /**
   * INIT UI
   */
  _initUI() {
    this.msgBox = document.querySelector("#chat-container");
    // Add item button
    this.addItemButton = document.querySelector("#add-item");
    this.addItemButton.addEventListener("click", () => this.addMsg());
    // Login button
    this.loginButton = document.querySelector("#login-button");
    this.loginButton.addEventListener("click", () => this.login());
    // Logout button
    this.logoutButton = document.querySelector("#logout-button");
    this.logoutButton.addEventListener("click", () => this.logout());
  }

  // Initial UI Render

  render(): DocumentFragment {
    const docFragment = document.createDocumentFragment();

    this.dataArray.map(doc => {
      const msgText = document.createElement("div");
      msgText.id = doc.id;
      msgText.textContent = doc.msg;
      msgText.addEventListener("click", () => this.removeMsg(doc));

      docFragment.appendChild(msgText);
    });

    return this.msgBox.appendChild(docFragment);
  }

  // DOM Manipulation

  updateRender(type: string, doc: Message) {
    return {
      add: (): DocumentFragment => {
        const docFragment = document.createDocumentFragment();

        // Message content
        const msgText = document.createElement("div");
        msgText.id = doc.id;
        msgText.textContent = doc.msg;
        msgText.addEventListener("click", () => this.removeMsg(doc));

        docFragment.appendChild(msgText);

        return this.msgBox.appendChild(docFragment);
      },
      remove: (): void => {
        document.getElementById(doc.id).remove();
      }
    }[type]();
  }

  // DATA Manipulation

  updateData(type: string, doc: firebase.firestore.QueryDocumentSnapshot) {
    const data = doc.data();
    const { id } = doc;
    const fireDoc = { id, ...data };

    return {
      init: () => {
        return (this.dataArray = [fireDoc, ...this.dataArray]);
      },
      add: () => {
        if (!this.dataArray.some(el => el.id === doc.id)) {
          this.dataArray = [fireDoc, ...this.dataArray];
          // update the UI
          return this.updateRender("add", fireDoc);
        } else {
          console.log("error doc exists", "=>", doc.id);
        }
      },
      remove: () => {
        if (this.dataArray.some(el => el.id === doc.id)) {
          this.dataArray = this.dataArray.filter(el => el.id !== fireDoc.id);
          // update the UI
          return this.updateRender("remove", fireDoc);
        } else {
          console.log("error doc not in array", "=>", doc.id);
        }
      }
    }[type]();
  }

  /**
   * FIRESTORE CRUD
   */

  addMsg(): Promise<firebase.firestore.DocumentReference> {
    let randomName = Faker.random.words();
    return this.db
      .collection("slack")
      .add({ msg: randomName, postedAt: new Date() });
  }

  editMsg({ id: documentId }: Message): Promise<void> {
    let randomName = Faker.hacker.phrase;
    return this.db.doc(`slack/${documentId}`).update({ msg: randomName });
  }

  removeMsg({ id: documentId }: Message): Promise<void> {
    return this.db.doc(`slack/${documentId}`).delete();
  }

  /**
   * GETTERS
   */

  get timestamp(): firebase.firestore.FieldValue {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  /**
   * AUTH
   */

  login(): Promise<void> {
    return this.app
      .auth()
      .signInAnonymously()
      .then(user => console.log(user));
  }

  logout(): Promise<void> {
    return this.app.auth().signOut();
  }

  checkAuthState() {
    this.app.auth().onAuthStateChanged(user => {
      if (user) {
        console.log(user);
        this.loginButton.style.display = "none";
        this.logoutButton.style.display = "block";
      } else {
        this.loginButton.style.display = "block";
        this.logoutButton.style.display = "none";
      }
    });
  }
}

const chatApp = new Chat({
  apiKey: "AIzaSyAJCNeREdEEE6WLxvFNpNavv6NTXOmdpGk",
  authDomain: "toto-e2e69.firebaseapp.com",
  databaseURL: "https://toto-e2e69.firebaseio.com",
  projectId: "toto-e2e69",
  storageBucket: "toto-e2e69.appspot.com",
  messagingSenderId: "666341637840"
});

window.addEventListener("load", chatApp.onLoad.bind(chatApp));
