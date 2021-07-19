# Estonian B-category exams watcher

This application watches available exam slots list in eksamiajad.ee webpage every 5 seconds, finds the difference, filters the results and sends out emails to clients. Every client has their own filter.

Currently available filters:

- City (Possible cities: Tallinn, Tartu, Rapla, Jõgeva, Võru, Põlva, Valga, Pärnu, Haapsalu, Kärdla, Viljandi, Kuressaare, Jõhvi, Rakvere, Paide, Narva)

## How to install

Prerequisites:

- Needs Chrome installed
- Internet connection
- Node 10+

Copy example-metadata.json and name it metadata.json.

- Add path to chrome executable
- Add clients
- Add debug email etc.
- Add gmail account to send out emails (or create new account if needed)
- Make sure that this gmail account allows less secure apps: https://www.google.com/settings/security/lesssecureapps

```
npm i
```

### How to run

Check that you have necessary and correct data in metadata.json file.

```
npm start
```
