

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
    try{
      await fs.promises.mkdir(Path.join(PATH, 'images'))
    } catch (e) {

    }
    const { images, desc} = await web(link);
    const folderId = await createDirectory(auth);
    await Promise.all(
      images.map(
        (image, index) => downloadImage(image, index)
      )
    );

    await Promise.all(
      images.map(
        (image, index) => uploadFile(auth, folderId, index)
      )
    );
    await deleteImages();
    const imagesLink = 'https://drive.google.com/drive/u/0/folders/' + folderId;
    await writeRow(auth, desc, imagesLink)
  } catch (e) {
    return Promise.reject()
  }
}
async function deleteImages() {
  const fs = require('fs');
  const path = require('path');

  const directory = Path.join(PATH, 'images');

  const readDir = () => new Promise((res, rej) => {
    fs.readdir(directory, (err, files) => {
      if (err) return rej(err);
      res(files);
    });
  });

  const unlinkFile = (file) => new Promise((res, rej) => {
    fs.unlink(file, err => {
      if (err) return rej(err);
      res();
    });
  });

  return new Promise(async (res, rej) => {
    const files = await readDir();
    for (const file of files) {
      await unlinkFile(path.join(directory, file));
    }
    res()
  });
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
async function uploadFile(auth, folderId, index) {
  const drive = google.drive({version: 'v3', auth});
  const fileMetadata = {
    'name': `${index}.jpg`,
    parents: [folderId]
  };

  const path = Path.join(PATH, `${index}.jpg`);
  const media = {
    mimeType: 'image/jpeg',
    body: fs.createReadStream(path)
  };
  return new Promise((res, rej) => {
    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    }, function (err, file) {
      if (err) {
        rej(err);
      } else {
        res(file.data.id)
      }
    });
  })

}
async function downloadImage (link, index) {
  const url = link;
  const path = Path.join(PATH, `${index}.jpg`);
  const writer = Fs.createWriteStream(path);

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
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
