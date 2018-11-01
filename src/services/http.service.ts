import axios from "axios";

class HttpService {
  async pingCloudFunction(
    enigmaId: string,
    userId: string,
    userAnswer: string
  ) {
    return await axios
      .get(
        `https://us-central1-toto-e2e69.cloudfunctions.net/verifyAnswerEnigma?enigmaId=${enigmaId}&userId=${userId}&userAnswer=${userAnswer}`
      )
      .then(res => {
        console.log(res.data);
      })
      .catch(error => console.log(error));
  }
}

export const httpService = new HttpService();
