import * as plaid from "plaid";
import * as ynab from "ynab";
import * as express from "express";
import * as bodyParser from "body-parser";
import { Account } from "ynab";

const plaidClient = new plaid.Client(
    process.env.PLAID_CLIENT_ID,
    process.env.PLAID_SECRET,
    process.env.PLAID_PUBLIC_KEY,
    plaid.environments.development,
);

const ynabAPI = new ynab.API(process.env.YNAB_KEY);

// (async function() {
//     let response = await ynabAPI.budgets.getBudgets();
//     let budgets = response.data.budgets;
//     for(let budget of budgets){
//         console.log("Budget "+budget.name+" id : "+budget.id);
//     }
// })();

plaidClient.getBalance(process.env.PLAID_ACCESS_TOKEN, (err, response) => {
    console.log(response.accounts.forEach((account) => {
        console.log(account.name+" : "+account.balances.current);
    }));
});

let app = express();

app.use(bodyParser.json());

app.set("view engine","ejs");

app.post("/triggerupdate", (request, response) => {
    
});

app.post("/get_access_token", (request, response) => {
    let public_token = request.body.public_token;

    console.log("Public token : "+public_token);

    plaidClient.exchangePublicToken(public_token, (err, tokenResponse) => {

        if(err){
            console.log("Error while exchanging token : "+err);
            return response.json({'error': err});
        }

        let access_token = tokenResponse.access_token;
        let item_id = tokenResponse.item_id;
        console.log("access token : "+access_token);
        console.log("item id : "+item_id);
        response.json({'error': false});
    });

});

app.get("/triche", (req, res) => {
    let public_token = "public-development-7fad3bdd-3739-42b5-9e52-97992dba4b72";
    plaidClient.exchangePublicToken(public_token, (err, tokenResponse) => {

        if(err){
            console.log("Error while exchanging token : "+err);
            return res.json({'error': err});
        }

        let access_token = tokenResponse.access_token;
        let item_id = tokenResponse.item_id;
        console.log("access token : "+access_token);
        console.log("item id : "+item_id);
        res.json({'error': false});
    });
})

app.get("/index", (request, response) => {
    response.render("index", {PLAID_ENV: "development", PLAID_PUBLIC_KEY: "30699f6bf0d8cd4339aef3b6ef38ff"});
});


app.listen(process.env.PORT||8000);