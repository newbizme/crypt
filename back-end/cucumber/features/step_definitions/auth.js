const { Given, When, Then } = require('cucumber');
const chai = require('chai');
const { expect } = chai;

const chaiHttp = require("chai-http");
chai.use(chaiHttp);

Given('I am logged into the system', function(done){

    if(this.token) return done();
    
    chai
        .request(this.app)
        .post("/v1/users/login")
        .send(this.defaultCredentials)
        .then(result => {   

            expect(result).to.have.status(200);
            expect(result.body.token).to.be.not.undefined;
            expect(result.body.user).to.an('object');

            this.token = result.body.token;
            this.user = result.body.user;

            done();

        });

});

When(/^I log onto CryptX as (.*)$/, function(role_name){
    const user = this.users[_.snakeCase(role_name)];

    return chai
        .request(this.app)
        .post("/v1/users/login")
        .send({ username: user.email, password: user.unhashed_password })
        .then(result => {   

            expect(result).to.have.status(200);
            expect(result.body.token).to.be.not.undefined;
            expect(result.body.user).to.an('object');

            user.token = result.body.token;

        });
});