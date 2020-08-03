import * as plaid from "plaid";
import * as ynab from "ynab";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as moment from "moment";

const plaidClient = new plaid.Client(
    process.env.PLAID_CLIENT_ID,
    process.env.PLAID_SECRET,
    process.env.PLAID_PUBLIC_KEY,
    plaid.environments.development,
);

const ynabAPI = new ynab.API(process.env.YNAB_KEY);


async function getLastDayTransactions(): Promise<plaid.TransactionsResponse>{
    let startDate = moment().subtract(1, "days").format("YYYY-MM-DD");
    let endDate = moment().format("YYYY-MM-DD");

    console.log("Transactions from "+startDate+" to "+endDate);
    return await plaidClient.getTransactions(process.env.PLAID_ACCESS_TOKEN, startDate, endDate);
}

function formatPlaidToYnab(original: plaid.Transaction): ynab.SaveTransaction {
    let result = {
        amount: original.amount*-1000, //Convert to milliunits amount, and reverse sign from plaid to ynab
        account_id: process.env.YNAB_CHECKING_ACCOUNT_ID,
        date: original.date,
        payee_name: original.name,
        cleared: ynab.SaveTransaction.ClearedEnum.Cleared
    };

    return result;
}

export function fetchAndUpdateTransactions(): Promise<plaid.TransactionsResponse> {
    let transactionResponse = getLastDayTransactions();

    let transactionsToCreate = new Array<ynab.SaveTransaction>();

    transactionResponse.then(response => {
        let transactions = response.transactions;

        if(transactions.length == 0){
            console.log("No transactions found");
            return;
        }

        console.log("Transactions : ",transactions);

        transactions.forEach(transaction => {
            let saveTransaction = formatPlaidToYnab(transaction);
            transactionsToCreate.push(saveTransaction);
        });

        ynabAPI.transactions.createTransactions(process.env.YNAB_BUDGET_ID, {transactions: transactionsToCreate});

    }, err => console.log("Error while retrieving transactions : "+err));

    return transactionResponse;
}

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set("view engine","ejs");

app.get("/test", (req, res) => {
    let transactionsResponse = getLastDayTransactions();
    
    transactionsResponse.then(response => res.status(200).json({'data': response}), err => res.status(500).json({'error': err}));
});

app.get("/trigger", (req, res) => {
    let transactionResponse = fetchAndUpdateTransactions();

    transactionResponse.then(response => res.status(200).json({'data': response}), err => res.status(500).json({'error': err}));
});

app.get("/dashboard", (req, res) => res.render("dashboard"));

app.post("/transactionfromdates", (req, res) => {

});

/*
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
*/
app.get("/index", (request, response) => {
    response.render("index", {PLAID_ENV: "development", PLAID_PUBLIC_KEY: "30699f6bf0d8cd4339aef3b6ef38ff"});
});


app.listen(process.env.PORT||8000);
