const inquirer = require('inquirer');
const fs = require('fs');
const axios = require('axios');
const htmlPDF =require('html-pdf');
const genHTML = require('./generateHTML.js');


let userData = {};
const questions = [
   "Please selects background color for your card from the list?",
   "Please enter Github User name that you would like?"
];
const colorsList = ['green', 'blue', 'pink', 'red'];

//question constructor
function QuestionConstructor(question, inputType, name, choices) {
   this.message = question;
   this.type = inputType;
   this.name = name;
   this.choices = choices;
};

//create respective objects from constructor
const colorQuestion = new QuestionConstructor(questions[0], 'list', 'color', colorsList);
const userNameQuestion = new QuestionConstructor(questions[1], 'input', 'name');

//test output from constructor
console.log(colorQuestion);
console.log(userNameQuestion);

inquireUser();
//prompt user 
async function inquireUser() {
   inquirer.prompt([
      colorQuestion,
      userNameQuestion
   ]).then(function (response) {
      const colorChoice = response.color;
      //save user color preference to userdata object
      userData.color =  response.color;
      const gitUserName = response.name;

      // generateHTML.generateHTML(colorChoice);
      let usersEndpoint = `https://api.github.com/users/${gitUserName}`;
      let reposEndpoint = `https://api.github.com/users/${gitUserName}/repos`;

      const userInfoRequest = axios.get(usersEndpoint);
      const reposRequest = axios.get(reposEndpoint);
      gitAPICaller([userInfoRequest, reposRequest]);
   })
}



async function gitAPICaller(requests) {
   axios.all(requests).then(axios.spread(function (userInfo, repoInfo) {
      //save data needed to user data object
      userData.userName = userInfo.data.name;
      userData.profileImage = userInfo.data.avatar_url;
      userData.location = userInfo.data.location;
      userData.gitProfileURL = userInfo.data.html_url;
      userData.userBlog = userInfo.data.blog;
      userData.bio = userInfo.data.bio;
      userData.numberOfPublicRepos = userInfo.data.public_repos;
      userData.followers = userInfo.data.followers;
      userData.following = userInfo.data.following;
      //save repo info

      //calculate stargazers
      let totalStar = 0;
      for (let i = 0; i < repoInfo.data.length; i++) {
         totalStar += repoInfo.data[i].stargazers_count;
      }
      userData.totalStar = totalStar;

  
      return userData;
   })).then(async userData => {
      console.log("userdata 1 = " + JSON.stringify(userData));
       let newhtmlData =   genHTML.generateHTML(userData)
      //  console.log(newhtmlData)
      await  fs.writeFile('index.html',newhtmlData,'utf-8',function(error){
          if(error){
             console.log('failed to write to file')
          }
       });
      await  htmlPDF.create(newhtmlData, {format:'Letter'}).toFile('gitProfile.pdf', function(err, res) {
         if (err) return console.log(err);
         console.log(res); 
       })
  
   }).catch(function (error) {
      console.log(error)
   })

};
