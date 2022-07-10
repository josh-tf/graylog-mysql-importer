# graylog-mysql-importer

## What is this?

On a project I am working on, recently switched from MySQL based logging to [Graylog](http://https://www.graylog.org/ 'Graylog') for our logging and analytics platfom and had a need to import our existing ~21mil log entries in to the platform.

<br />

#### Getting Started

To get started, you will need `node` + `npm` installed, for this example I am using `node 16.16.0`.

Clone the repository and follow the below instructions

```
git clone https://github.com/josh-tf/graylog-mysql-importer
```

Edit the .env file and then run with `node index.js`

<br />

## Editing the .env file

**Sample .env file**

```
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
DB_TABLE=

GRAYLOG_PORT=
GRAYLOG_HOST=

MESSAGE_VERSION=
MESSAGE_HOST=

USE_SHORT_MSG_FIELD=
SHORT_MSG_FIELD=
SHORT_MSG_VALUE=

USE_FULL_MSG_FIELD=
FULL_MSG_FIELD=
LONG_MSG_VALUE=

USE_TIMESTAMP_FIELD=
TIMESTAMP_FIELD=

INCLUDED_FIELDS=
```

All configuration for the script is done via the `.env` file, the sections are detailed below:
<br /><br />
**MySQL Details**

Enter the details for your MySQL server where the current data is stored

```
DB_HOST = 127.0.0.1
DB_USER = user
DB_PASS = password
DB_NAME = log_history
DB_TABLE = logs
```

<br />

**Graylog Details**

Enter the details for your TCP GELF input on the Graylog instance, for info on setting up inputs have a look [here](https://docs.graylog.org/docs/sending-data 'here')

```
GRAYLOG_PORT = 127.0.0.1
GRAYLOG_HOST = 12201
```

<br />

**Log Format and Fields**

There are multiple paramaters you can configure for your log entries, in the below sections:"

The message version and host (required for GELF format), you can include anything in here, for this example I will include a reference to where the data is coming from.

```
MESSAGE_VERSION = v1.0
MESSAGE_HOST =  "Legacy Import"
```

<br />

**GELF message fields**

GELF messages require a short message and a long message, you can specify a database field to use or you can specify a fixed value (seen in the full message)

```
USE_SHORT_MSG_FIELD = true
SHORT_MSG_FIELD = action
SHORT_MSG_VALUE =

USE_FULL_MSG_FIELD = false
FULL_MSG_FIELD =
LONG_MSG_VALUE = "Historical log entry imported from MySQL database"
```

<br />

**Timestamp Field**

You can include an existing timestamp field from your database, if one is not provided then the messages will default to the current timestamp when they are sent to Graylog.

**NOTE:** Depending on how your timestamp is stored in the database, you may need to convert it to unix time and include this in the MySQL query in `index.js`

For example, if my timestamp field is `timestamp` then I may include in my query `unix_timestamp(timestamp) as unix_time` then include `unix_time` in the `TIMESTAMP_FIELD` in the `.env` file.

```
USE_TIMESTAMP_FIELD= true
TIMESTAMP_FIELD= unix_time
```

<br />

**Data Fields**

Finally, a list of fields to include in your Graylog entry, in the format of `newfield:existingfield` for example if we have an `id` column in MySQL and I want this stored in Graylog as `legacy_id` then I will use the pair `legacy_id:id`

All fields you wish to include should be added to the `.env` entry in the below example format:

```
INCLUDED_FIELDS= "legacy_id:id data1:data1 action:action source:source"
```

<br />

## Example data structure and `.env` config

Lets look at an example source database in the current structure:
<br /><br />

| id  | timestamp           | action     | data1            | source      |
| --- | ------------------- | ---------- | ---------------- | ----------- |
| 1   | 11/01/2022 11:11:03 | ran_search | { query: "test"} | some_system |
| 2   | 11/01/2022 11:11:02 | logged_in  | 123.123.123.123  | some_system |

Lets import this in to Graylog with a GELF format like this:

```
{
  "version": "1.0",
  "host": "legacy_import",
  "short_message": "logged_in",
  "full_message": "Legacy log entry imported via MySQL",
  "timestamp": 1385053862.3072,
  "source": 1,
  "system": "some_system"
  "data": "123.123.123.123",
}
```

Our `.env` file will look like this:

```
DB_HOST = 127.0.0.1
DB_USER = user
DB_PASS = password
DB_NAME = log_history
DB_TABLE = logs

GRAYLOG_PORT = 127.0.0.1
GRAYLOG_HOST = 12201

MESSAGE_VERSION = "1.0"
MESSAGE_HOST =  "legacy_import"

USE_SHORT_MSG_FIELD = true
SHORT_MSG_FIELD = action
SHORT_MSG_VALUE =

USE_FULL_MSG_FIELD = false
FULL_MSG_FIELD =
LONG_MSG_VALUE = "Legacy log entry imported via MySQL"

USE_TIMESTAMP_FIELD= true
TIMESTAMP_FIELD= unix_time
```

## Some notes

- This script is provided as-is but I am happy to help if you run in to trouble, just open a new issue on Github
- You may need to adjust the delay or run the process in batches (using ranges in the query) depending on the size of your dataset and other conditions
- If a field has a blank or null value, GELF won't include it on the log entry however some fields are required (short_message, long_message, etc), if these are not provided then a fallback value is used
- If you are importing a large amount of data and getting memory errors with node, you can try increase the heap size using `node --max-old-space-size=8192 index.js`
