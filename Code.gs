function trigger() {
  try {
    // Specify Google Sheet ID & Range of Cells
    const sheet = Sheets.Spreadsheets.Values.get(<GOOGLE_SHEET_ID>, 'A1:B80');
    var values = sheet.getValues();
    
    // Iteratively look for in the Range of Cells, for Today's Birthdays
    for (var i = 0; i < values.length; i++) {
      var cell = values[i][1];
      // Check the cell is empty or not
      if (cell === "") {
        continue;
      } else {
        var today = new Date();
        var cellDate = new Date(cell);

        // Ignore the Year, when validating Today is someone's Birthday
        if (today.getDate() === cellDate.getDate() && today.getMonth() === cellDate.getMonth()) {
          var name = values[i][0].replace(/<[^>]*>/g, '').trim();
          // Log the Birthday and the person celebrating it for audit
          Logger.log(`${name}'s Birthday is today - ${today.getDate()}/${today.getMonth()}.`);

          // Enter the Google Drive Folder ID wehere Card images are stored
          var imageId = findFileId(name, <DRIVE_FOLDER_ID>);
          if (imageId !== null) {
            // Send the message to Chat space as new Thread
            postMessage(name, imageId)
          }
        }
      }
    }
  } catch (err) {
    Logger.log('Failed with error %s', err.message);
  }
};

// Get the Google Drive File ID of the Card
function findFileId(fileName, folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFiles();

  // Iterate over all the images in the folder
  // TODO: MVP 2 optimization
  while (files.hasNext()) {
    var file = files.next();
    // Excluede the pictures used in card and cards of Ex-employees in the team
    if (file.getName().indexOf(fileName) !== -1 
        && file.getName().indexOf("EX") == -1 
        && file.getName().indexOf("PIC") == -1) {
      // Log the File Image ID for Audit
      Logger.log('File Image ID: ' + file.getId());
      return file.getId();
    }
  }
  return null;
}

// Send the message to Chat space as new Thread
function postMessage(displayName, fileId) {
  // Webhook URL of Chat Space
  const url = "https://chat.googleapis.com/v1/spaces/<SPACE_ID>/messages?key=<KEY>token=<TOKEN>";
  // Construct the payload and note that currently attachments are not supported but links are fine.
  const options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json; charset=UTF-8"
    },
    "payload": JSON.stringify({
      "text": `Happy Birthday to ${displayName} 🎉🎉🥳 \n(https://drive.google.com/file/d/${fileId}/preview)`,
    })
  };
  const response = UrlFetchApp.fetch(url, options);
  // Log the response code for Audit
  Logger.log(response.getResponseCode());
}
