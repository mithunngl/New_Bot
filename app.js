var builder = require('botbuilder');
var restify = require('restify');


var botConnectorOptions = {
    appId: process.env.MICROSOFT_APP_ID || "",
    appPassword: process.env.MICROSOFT_APP_PASSWORD || ""
};

// Setup Restify Server
// Handle Bot Framework messages with a restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   //When testing on a local machine, 3978 indicates the port to test on
   console.log('%s listening to %s', server.name, server.url); 
});

// Instatiate the chat connector to route messages and create chat bot
var connector = new builder.ChatConnector(botConnectorOptions);
server.post('/api/messages', connector.listen());

var intents = new builder.IntentDialog();
var bot = new builder.UniversalBot(connector);

bot.dialog('/', intents);

//============================================================
// Set up the intents
//============================================================

// Just-say-hi intent logic
intents.matches(/^hi|^Hi|^hello|^Hello/i, function(session) {
    session.send("Hi there!");
});

// Repeat-back utterence intent logic
intents.matches(/echo|Echo/i, [
    // We have a two-part waterfall here
    function (session) {
        // Let's use a built-in prompt to easily collect input
        builder.Prompts.text(session, "What would you like me to say?");
    },
    function (session, results) {
        session.send("Ok... %s", results.response);
    }
]);

// A calculator-type intent logic
intents.matches(/add|Add/i, [
    // We have a three-part waterfall here
    function (session) {
        // Let's use a built-in prompt to easily collect input
        builder.Prompts.number(session, "first number: ");
    },
    function (session, results) {
        // dialogData, as you'll see, is a nice temp place to store things
        session.dialogData.firstnum = results.response;
        builder.Prompts.number(session, "second number: ");
    },
    function (session, results) {
        total = results.response + session.dialogData.firstnum;
        session.send("Your grand total is = %d", total);
    }
]);

intents.matches(/game|Game/i, [
    function (session) {
        // Create a random number between 1 and 10 and store in dialog data
        session.dialogData.botsnum = getRandomInt(1, 10);

        // Prompt the user for the first guess
        builder.Prompts.number(session, "Guess a number from 1 to 10:  (You get three tries)");
    },
    function (session, results) {
        if (results.response > session.dialogData.botsnum) {
            // Prompt the user for the second guess
            builder.Prompts.number(session, "Your number was too big.  Second guess: ");
        }
        else if (results.response < session.dialogData.botsnum) {
            // Prompt the user for the second guess
            builder.Prompts.number(session, "Your number was too small.  Second guess: ");
        }
        else {
            session.endDialog("You won!  The number was %d", session.dialogData.botsnum);
        }
    },
    function (session, results) {
        if (results.response > session.dialogData.botsnum) {
            // Prompt the user for the first guess
            builder.Prompts.number(session, "Your number was too big.  Third guess: ");
        }
        else if (results.response < session.dialogData.botsnum) {
            // Prompt the user for the first guess
            builder.Prompts.number(session, "Your number was too small.  Third guess: ");
        }
        else {
            session.endDialog("You won!  The number was %d", session.dialogData.botsnum);
        }
    },
    function (session, results) {
        if (results.response != session.dialogData.botsnum) {
            session.endDialog("You lost this one.  Please try again.  By the way, the number was %d", 
                session.dialogData.botsnum);
        }
        else {
            session.endDialog("You won!  The number was %d", session.dialogData.botsnum);
        }
    }
]);

// from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) { // inclusive of min and max
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Default intent when what user typed is not matched
intents.onDefault(builder.DialogAction.send("One more time, please?"));

//============================================================
// Set up some trigger actions
//============================================================

// Example of a triggered action - when user types something matched by
// the trigger, this dialog begins, clearing the stack and interrupting
// the current dialog (so be cognizant of this).
// What if we had put 'send' instead of 'endDialog' here - try this.
bot.dialog('/bye', function (session) {
    // end dialog with a cleared stack.  we may want to add an 'onInterrupted'
    // handler to this dialog to keep the state of the current
    // conversation by doing something with the dialog stack
    session.endDialog("Ok... See you later.");
}).triggerAction({matches: /^bye|Bye/i});

//============================================================
// Add-ons
//============================================================

// intents.onBegin(function (session, args, next) {
//     session.dialogData.name = args.name;
//     session.send("Hi %s...", args.name);
//     next();
// });


// Serve a static web page - for testing deployment (note: this is optional)
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));


