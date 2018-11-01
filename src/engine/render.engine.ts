import { IEnigma } from "../models/enigma.model";
import { IUser } from "../models/user.model";

class RenderEngine {
  // ui
  loadingScreen: HTMLDivElement;
  enigmaLogin: HTMLButtonElement;
  enigmaLogout: HTMLButtonElement;
  enigmaUser: HTMLDivElement;
  enigmaQuestion: HTMLHeadingElement;
  enigmaInput: HTMLInputElement;
  enigmaSubmit: HTMLButtonElement;
  enigmaSuccess: HTMLDivElement;
  enigmaWinners: HTMLDivElement;
  user: IUser;

  constructor() {
    this.initUI();
  }

  initUI() {
    this.loadingScreen = document.querySelector("#loader");
    this.enigmaUser = document.querySelector("#enigma__user");
    this.enigmaLogin = document.querySelector("#enigma__login");
    this.enigmaLogout = document.querySelector("#enigma__logout");
    this.enigmaQuestion = document.querySelector("#enigma__question");
    this.enigmaInput = document.querySelector("#enigma__input");
    this.enigmaSubmit = document.querySelector("#enigma__submit");
    this.enigmaSuccess = document.querySelector("#enigma__success");
    this.enigmaWinners = document.querySelector("#enigma__winners");
  }

  render({
    id: currentId,
    question: currentQuestion,
    winners: currentWinners
  }: IEnigma) {
    const winnersCount = currentWinners.length;

    this.resetDefaultUI();

    if (currentWinners.some(winner => winner.userName === this.user.uid)) {
      this.updateSuccessUI();
    }

    this.enigmaQuestion.textContent =
      currentId.slice(1, 5) + ":" + currentQuestion + " " + winnersCount;

    this.loadingScreen.remove();
  }

  renderUser(user: IUser) {
    this.user = user;
    this.enigmaUser.innerHTML = user.uid;
  }

  updateSuccessUI() {
    // hide inputs
    this.enigmaInput.style.display = "none";
    this.enigmaSubmit.style.display = "none";
    this.enigmaSuccess.style.display = "block";

    // show success message
    this.enigmaSuccess.innerHTML = "Bravo, vous avez eu la bonne réponse !";
  }

  resetDefaultUI() {
    this.enigmaSuccess.style.display = "none";
    this.enigmaInput.style.display = "block";
    this.enigmaSubmit.style.display = "block";
  }
}

export const renderEngine = new RenderEngine();
