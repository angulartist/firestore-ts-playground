import * as firebase from "firebase/app";
import "firebase/firestore";
import * as Faker from "faker";
import { ProjectConfig } from "./models/project-config.model";
import { Message } from "./models/message.model";

class Chat {
  app: firebase.app.App;
  db: firebase.firestore.Firestore;

  // DATA
  dataArray: any[] = [];

  // UI
  msgBox: HTMLDivElement;
  button: HTMLButtonElement;

  constructor(config: ProjectConfig) {
    this.app = firebase.initializeApp(config);
    this.db = this.app.firestore();
    this.db.settings({ timestampsInSnapshots: true });

    // INIT UI
    this.msgBox = document.querySelector("#message");
    this.button = document.querySelector("#send");
    this.button.addEventListener("click", () => this.addMsg());
  }

  onLoad(): void {
    const msgRef = this.db.collection("slack").orderBy("postedAt", "asc");

    const retrieveData$ = new Promise((resolve, reject) => {
      msgRef
        .get()
        .then(snapshot => {
          snapshot.docs.map(doc => {
            const data = doc.data();
            const { id } = doc;
            const document = { id, ...data };
            this.dataArray = [document, ...this.dataArray];
          });
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });

    retrieveData$
      .then(() => {
        this.render();
        msgRef.onSnapshot(changes => {
          changes.docChanges().map(changes => {
            const changesEvents = {
              added: () => {
                if (!this.dataArray.some(e => e.id === changes.doc.id)) {
                  const data = changes.doc.data();
                  const { id } = changes.doc;
                  const fireDoc = { id, ...data };
                  this.dataArray = [fireDoc, ...this.dataArray];
                  // update the UI
                  return this.updateAddDoc(fireDoc);
                }
              },
              removed: () => {
                if (this.dataArray.some(e => e.id === changes.doc.id)) {
                  const data = changes.doc.data();
                  const { id } = changes.doc;
                  const fireDoc = { id, ...data };
                  this.dataArray = this.dataArray.filter(
                    doc => doc.id !== fireDoc.id
                  );
                  // update the UI
                  return this.updateRemoveDoc(fireDoc);
                }
              }
            };

            changesEvents[changes.type]();
          });
        });
      })
      .catch(error => {
        console.log("Error happn.", "=>", error);
      });
  }

  updateAddDoc(doc: Message): DocumentFragment {
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
  }

  updateRemoveDoc(doc: Message): void {
    const docToRemove = document.getElementById(doc.id);
    docToRemove.querySelector("div").className = "remove";
    setTimeout(() => {
      docToRemove.remove();
    }, 300);
  }

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

  addMsg(): Promise<firebase.firestore.DocumentReference> {
    let randomName = Faker.random.words();
    return this.db
      .collection("slack")
      .add({ msg: randomName, postedAt: new Date() });
  }

  editMsg({ id: documentId }: Message) {
    let randomName = Faker.hacker.phrase;
    return this.db.doc(`slack/${documentId}`).update({ msg: randomName });
  }

  removeMsg({ id: documentId }: Message): Promise<void> {
    return this.db.doc(`slack/${documentId}`).delete();
  }

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
