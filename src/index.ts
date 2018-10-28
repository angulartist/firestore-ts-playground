import * as firebase from "firebase/app";
import "firebase/firestore";
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
  button: HTMLButtonElement;

  constructor(config: ProjectConfig) {
    this.app = firebase.initializeApp(config);
    this.db = this.app.firestore();
    this.db.settings({ timestampsInSnapshots: true });

    this.msgRef = this.db.collection("slack").orderBy("postedAt", "asc");

    // INIT UI
    this.msgBox = document.querySelector("#message");
    this.button = document.querySelector("#send");
    this.button.addEventListener("click", () => this.addMsg());
  }

  onLoad(): void {
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
  }

  // Initial UI Render

  render(): DocumentFragment {
    const docFragment = document.createDocumentFragment();

    this.dataArray.map(doc => {
      // Message Wrapper
      const messageWrapper = document.createElement("div");
      messageWrapper.id = doc.id;
      // Message Div
      const messageDiv = document.createElement("div");
      messageDiv.textContent = doc.msg;
      messageDiv.addEventListener("click", () => {
        this.removeMsg(doc);
      });
      // Append
      messageWrapper.appendChild(messageDiv);
      messageWrapper.querySelector("div").className = "update";
      docFragment.appendChild(messageWrapper);
    });

    return this.msgBox.appendChild(docFragment);
  }

  // DOM Manipulation

  updateRender(type: string, doc: Message) {
    return {
      add: (): DocumentFragment => {
        const docFragment = document.createDocumentFragment();
        // Message Wrapper
        const messageWrapper = document.createElement("div");
        messageWrapper.id = `${doc.id}`;
        // Message Div
        const messageDiv = document.createElement("div");
        messageDiv.textContent = doc.msg;
        messageDiv.addEventListener("click", () => {
          this.removeMsg(doc);
        });
        // Append
        messageWrapper.appendChild(messageDiv);
        messageWrapper.querySelector("div").className = "show";
        docFragment.appendChild(messageWrapper);

        return this.msgBox.appendChild(docFragment);
      },
      remove: (): void => {
        const docToRemove = document.getElementById(doc.id);
        docToRemove.querySelector("div").className = "remove";
        setTimeout(() => {
          docToRemove.remove();
        }, 300);
      }
    }[type]();
  }

  // DATA Manipulation

  updateData(type: string, doc: firebase.firestore.QueryDocumentSnapshot) {
    return {
      init: () => {
        const data = doc.data();
        const { id } = doc;
        const document = { id, ...data };
        return (this.dataArray = [document, ...this.dataArray]);
      },
      add: () => {
        if (!this.dataArray.some(el => el.id === doc.id)) {
          const data = doc.data();
          const { id } = doc;
          const fireDoc = { id, ...data };
          this.dataArray = [fireDoc, ...this.dataArray];
          // update the UI
          return this.updateRender("add", fireDoc);
        }
      },
      remove: () => {
        if (this.dataArray.some(el => el.id === doc.id)) {
          const data = doc.data();
          const { id } = doc;
          const fireDoc = { id, ...data };
          this.dataArray = this.dataArray.filter(el => el.id !== fireDoc.id);
          // update the UI
          return this.updateRender("remove", fireDoc);
        }
      }
    }[type]();
  }

  // Firestore CRUD

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

  // GETTERS

  get timestamp(): firebase.firestore.FieldValue {
    return firebase.firestore.FieldValue.serverTimestamp();
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
