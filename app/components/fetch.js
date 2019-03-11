

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const web = require('./web');
const Fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const uuidv1 = require('uuid/v1');
const { remote : { app } } = require('electron')


export const PATH = Path.join(app.getAppPath(), '..');

export async function run(auth, link) {
  try {
    const { images, desc} = await web(link);
    const folderId = await createDirectory(auth);
    await Promise.all(
      images.map(
        (image, index) => uploadFile(auth, folderId, index, image)
      )
    );
    const imagesLink = 'https://drive.google.com/drive/u/0/folders/' + folderId;
    await writeRow(auth, desc, imagesLink)
  } catch (e) {
    console.log(e)
    return Promise.reject()
  }
}
async function createDirectory(auth) {
  const drive = google.drive({version: 'v3', auth});
  const fileMetadata = {
    'name': uuidv1(),
    'mimeType': 'application/vnd.google-apps.folder'
  };
  return new Promise((res, rej) => {
    drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }, (err, file) => {
      if (err) {
       rej(err)
      } else {
        res(file.data.id);
      }
    });
  })
}
async function uploadFile(auth, folderId, index, image) {
  const drive = google.drive({version: 'v3', auth});
  const fileMetadata = {
    'name': `${index}.jpg`,
    parents: [folderId]
  };

  const response = await Axios({
    url: image,
    method: 'GET',
    responseType: 'stream'
  });

  const media = {
    mimeType: 'image/jpeg',
    body: response.data
  };

  return new Promise((res, rej) => {
    setTimeout(() => {
      drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          console.log(err)
          rej(err);
        } else {
          res(file.data.id)
        }
      });
    }, Math.floor(index/10)*1000);
  })

}
async function writeRow(auth, desc, imagesLink) {
  let values = [
    [
      desc,
      imagesLink
    ],
  ];
  const resource = {
    values,
  };

  const sheets = google.sheets({version: 'v4', auth});

  return new Promise((res, rej) => {
    sheets.spreadsheets.values.append({
      spreadsheetId: '13vUGwITQGm3Sgi4RtO1UxsK1d4ZvD4ltePl41LaTRyE',
      range: "A:B",
      valueInputOption: "RAW",
      resource,
    }, (err, result) => {
      if (err) {
        return rej(err);
      } else {
        return res();
      }
    });
  })
}
