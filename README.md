# graylog-mysql-importer

A one-off Node.js script that imported historical log rows from a MySQL table into [Graylog](https://graylog.org/) as GELF messages.

This project is archived and no longer maintained.

It was written to move about 21 million existing log entries into Graylog when a project switched from MySQL-based logging. The script selects rows by `id` range from one table, builds a GELF message for each row and sends it to a Graylog GELF input. All mapping is set in `.env` (see `sample.env`):

- `DB_*` for the MySQL connection and table, and `GRAYLOG_HOST`/`GRAYLOG_PORT` for the GELF input
- `MESSAGE_VERSION` and `MESSAGE_HOST` for the GELF version and host fields
- `short_message`, `full_message` and `timestamp` can each come from a column (`USE_*_FIELD=true` plus the column name) or fall back to a fixed value or the current time. The timestamp column has to hold Unix time already; the query is a plain `SELECT *`, so converting a date column means editing it in `index.js`
- `INCLUDED_FIELDS` maps extra columns onto the message as `graylog_field:column` pairs separated by a comma and a space

The id range is set in the `processBatch(1, 1000000)` call at the bottom of `index.js`. Run it with `npm install` then `node index.js`.

## Stack

- Node.js
- `mysql2-async` for MySQL
- `gelf` for sending to Graylog
- dotenv for configuration

## License

[MIT](LICENSE)
