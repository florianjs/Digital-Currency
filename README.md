
![Twitter Follow](https://img.shields.io/twitter/follow/icesofty?label=Follow&style=social)     ![GitHub stars](https://img.shields.io/github/stars/Icesofty/Digital-Currency?style=social)

---
# PLEASE NOTE

This is an early version of the final Web App. 
**DEMO WEBSITE :** http://tonken.mooo.com/

## Digital-Currency

Create your own private Self-Hosted Digital Currency. This Web App require MongoDB

# 1 - Clone the repo 

```
git clone https://github.com/Icesofty/Digital-Currency.git
```

# 2 - Install it 
```
npm i 
```

You need to create a .env file into the root folder and put SECRET=YOUR_SUPER_SECRET_PHRASE_HERE in it


# 3 - Launch it 
```
node app.js
Server started at port 3000
```

Access it on http://localhost:3000/

# 4 - Customize it 

You can change the demo-1.ejs and the demo-2.ejs file if you want to. If you do so, don't forget to change the content on home.ejs (Lines 130 to 145). 

You can also customize your app.js : 
Color theme 
```
const colorTheme = 'purple';
```

Default amount of Currency when a new user register (recommend 0) 
```
const defaultTokens = 50;
```
Name and symbol of your Currency
```
const nameOfYourToken = 'Tonken';
const tokenSymbol = 'TKN';
```
Public or private currency 
```
const publicRegister = true;
```
Name of your MongoDB
```
const nameDB = 'tonkenDB';
```


## Creating Admin user
You need to create an Admin user. Change the value of admin: false to true on the users collection in MongoDB 
```
{
    "_id" : ObjectId("5e2d57b1a0c1870e6c736d16"),
    "username" : "Icesofty",
    "email" : "example@example.com",
    "tokens" : 50,
    "admin" : true,
    "salt" : "...",
    "hash" : "...",
    "__v" : 0
}
```
You can then access your admin panel here : http://localhost:3000/admin
