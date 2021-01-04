
const fs = require('fs');
const path = require('path');

exports.updateBuildNumber = (rootDir, filePath) => {

  let absolutePath = path.join(rootDir, filePath);

  let contents = fs.readFileSync(absolutePath, 'utf8');

  let str = '%__deploy-start';
  let index0 = contents.indexOf(str);
  let index1 = contents.indexOf('{', index0);
  let index2 = contents.indexOf('}', index1);

  let left = contents.substring(0, index1);
  let middle = contents.substring(index1, index2 + 1);
  let right = contents.substr(index2 + 1);

  // console.log("|" + right + "|");
  // process.exit();

  let object = JSON.parse(middle);

  let foundNumber = object.build;
  console.log("PREVIOUS BUILD NUMBER", foundNumber);

  let newNumber = parseInt(String(foundNumber)) + 1;
  console.log("NEW BUILD NUMBER", newNumber);

  object.build = newNumber;
  object.datetimeStamp = (new Date).getTime();

  let modifiedContents = left + JSON.stringify(object) + right;

  fs.writeFileSync(absolutePath, modifiedContents);
}