const csvParser = require("csv-parser");
const fs = require("fs");

function CSVtoJson(CsvUrl, JsonUrl) {
  let result = [];
  fs.createReadStream(CsvUrl)
    .pipe(csvParser({ separator: "," }))
    .on("data", (data) => result.push(data))
    .on(
      "end",
      () => fs.writeFileSync(JsonUrl, JSON.stringify(result)),
      console.log(`${CsvUrl} completely transfered to ${JsonUrl}`)
    );
  return;
}

module.exports = CSVtoJson;
