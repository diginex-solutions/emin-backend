var axios = require('axios');


export class SalesforceService {

  static INSTANCE: SalesforceService;
  static getInstance(): SalesforceService {
    if (!SalesforceService.INSTANCE) {
      SalesforceService.INSTANCE = new SalesforceService();
    }
    return SalesforceService.INSTANCE;
  }

  async login(): Promise<string> {
    return new Promise((res, rej) => {
      var FormData = require('form-data');
      var data = new FormData();
      data.append('grant_type', 'password');
      data.append('client_id', '-');
      data.append('client_secret', '-');
      data.append('username', '-');
      data.append('password', '-');

      var config = {
        method: 'post',
        url: 'https://login.salesforce.com/services/oauth2/token',
        headers: {
          ...data.getHeaders()
        },
        data: data
      };

      axios(config)
        .then((response) => {
          if (response && response.data && response.data.access_token) {
            console.log(response.data.access_token);
            res(response.data.access_token);
          } else {
            rej('Invalid response:' + JSON.stringify(response))
          }
        })
        .catch((error) => {
          rej(error)
        });
    })

  }

  async add(
    Email: string,
    FirstName: string,
    LastName: string,
    contractApprovedDate__c: string,
    isPassportBeingHeld__c: string,
    wereYouChargedAnyFees__c: string
  ): Promise<boolean> {
    return new Promise(async (res, rej) => {
      try {
        const token = await this.login();
        var data = JSON.stringify({ Email, FirstName, LastName, contractApprovedDate__c, isPassportBeingHeld__c, wereYouChargedAnyFees__c });
        var config = {
          method: 'post',
          url: 'https://ap16.salesforce.com/services/data/v20.0/sobjects/Contact/',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          data: data
        };
        axios(config)
          .then(function (response) {
            res(true)
          })
          .catch(function (error) {
            res(false)
          });

      } catch (error) {
        res(false)
      }
    });
  }

}

