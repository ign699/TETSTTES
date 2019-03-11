const fs = require('fs');
const {google} = require('googleapis');
const Path = require('path')
const someObject = require('./credentials.json');
const { remote : { app } } = require('electron');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

export const PATH = Path.join(app.getAppPath(), '..');

export default () => new Promise((res, rej) => {
  console.log(PATH)
  return res(authorize(someObject))
});

function authorize(credentials) {
  return new Promise((res, rej) => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

    fs.readFile(Path.join(app.getAppPath(), '..', TOKEN_PATH), async (err, token) => {
      if (err) return rej(err);
      oAuth2Client.setCredentials(JSON.parse(token));

      try{
        await oAuth2Client.getTokenInfo(
          oAuth2Client.credentials.access_token
        );
      } catch (e) {
        rej()
      }


      return res(oAuth2Client);
    });
  })
}



export function getLink() {
  const {client_secret, client_id, redirect_uris} = someObject.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log(authUrl)
  return authUrl;
}



export function properLogin(code) {
  return new Promise((res, rej) => {
    const { client_secret, client_id, redirect_uris } = someObject.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

    oAuth2Client.getToken(code, (err, token) => {
      if (err) return rej(err)
      oAuth2Client.setCredentials(token);
      fs.writeFile(Path.join(app.getAppPath(), '..', TOKEN_PATH), JSON.stringify(token), (err) => {
        if (err) return rej(err);
        res(oAuth2Client)
      });
    })
  })
};
