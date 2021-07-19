# B-category exams watcher

This application watches available exam slots list in eksamiajad.ee webpage every 5 seconds, finds the difference, filters the results and sends out emails to clients. Every client has their own filter.

Currently available filters:

- City

## How to install

Prerequisites:

- Needs Chrome installed
- Internet connection
- Node 10+

Copy example-metadata.json and name it metadata.json. Add path to chrome executable, clients, debug email etc.

```
npm i
```

### How to run

Check that you have necessary and correct data in metadata.json file.

```
npm start
```
