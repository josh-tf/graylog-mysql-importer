const mysql = require('mysql2');
const Gelf = require('gelf');

require('dotenv').config();

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

// create the connection to database
let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// create the gelf connection
const gelf = new Gelf({
  graylogPort: process.env.GRAYLOG_PORT,
  graylogHostname: process.env.GRAYLOG_HOST,
  connection: 'wan',
  maxChunkSizeWan: 1420,
  maxChunkSizeLan: 8154,
});

// function to build the gelf message based on env config
function MessageBuilder(data) {
  // base message
  const message = {
    version: process.env.MESSAGE_VERSION,
    host: process.env.MESSAGE_HOST,
    short_message:
      process.env.USE_SHORT_MSG_FIELD == 'true'
        ? data[process.env.SHORT_MSG_FIELD]
        : process.env.SHORT_MSG_VALUE || 'None Provided',
    full_message:
      process.env.USE_FULL_MSG_FIELD == 'true'
        ? data[process.env.FULL_MSG_FIELD]
        : process.env.LONG_MSG_VALUE || 'None Provided',
    timestamp:
      process.env.USE_TIMESTAMP_FIELD == 'true' ? data[process.env.TIMESTAMP_FIELD] : new Date(),
  };

  // join in field values (from .env)
  var includedFields = process.env.INCLUDED_FIELDS.split(', ');
  includedFields.forEach((field) => {
    let map = field.split(':');
    if (data[map[1]]) message[map[0]] = data[map[1]];
  });

  return message;
}

function main() {
  // get the client
  connection.query(
    `SELECT * from ${process.env.DB_NAME}.${process.env.DB_TABLE} LIMIT 100;`,
    async function (err, results, fields) {
      // for each log entry, send to Graylog
      for (const [i, row] of results.entries()) {
        let message = MessageBuilder(row);
        gelf.emit('gelf.log', message);
        console.log(`Processed log entry ${i + 1} of ${results.length}`);
        await delay(25);
      }
    }
  );
}

main();
