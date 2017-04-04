var tmi = require('tmi.js');
var net = require('net');
const spawn = require('child_process').spawn;
const channelName = "skiilaa";
var tClient = new net.Socket();

var options = require("./config.json");

var client = new tmi.client(options);

const debug = false; //Change to true to enable verbose mode

var novote = false; //Change to true to disable voting on script start

var voted = [];

var dirvotes = [0, 0, 0, 0];
var rotvotes = [0, 0, 0, 0];

var emptyDirVotes = dirvotes;
var emptyRotVotes = rotvotes;

var dirlett = ["W", "A" , "S", "D"];
var rotlett = ["U", "H", "J", "K"];

setInterval(function(){
    if (!novote){
        if (debug){
            console.log("Cleared votes.");
            dirvotes.forEach(function(item, index){
                console.log(dirlett[index] + ": " + item);
            });
            rotvotes.forEach(function(item, index){
                console.log(rotlett[index] + ": " + item);
            });
            var voters = "Voters: ";
            voted.forEach(function(item){
                voters += item + ", ";
            });
            if (voters != "Voters: "){
                voters = voters.substring(0, voters.length - ", ".length);
                console.log(voters);
            }
        }
        voted = [];
        var tcpMessage = "";
        var xdirvotes = false;
        dirvotes.forEach(function(element) {
            if (element != 0){
                xdirvotes = true;
            }
        });
        if (!xdirvotes){
            tcpMessage += "X";
        } else {
            var highest = "";
            var highestNum = 0;
            dirvotes.forEach(function(item, index){
                if (item > highestNum){
                    highestNum = item;
                    highest = dirlett[index];
                }
            });
            tcpMessage += highest;
        }
        console.log(rotvotes);
        var xrotvotes = false;
        rotvotes.forEach(function(element) {
            if (element != 0){
                xrotvotes = true;
            }
        });
        if (!xrotvotes){
            tcpMessage += "X";
        } else {
            var highest = "";
            var highestNum = 0;
            rotvotes.forEach(function(item, index){
                if (item > highestNum){
                    highestNum = item;
                    highest = rotlett[index];
                }
            });
            tcpMessage += highest;
        }
        dirvotes = [0, 0, 0, 0];
        rotvotes = [0, 0, 0, 0];
        tClient.write(tcpMessage);
        console.log("Winner: " + tcpMessage);
    }
}, 2*1000);

tClient.connect(1337, '127.0.0.1', function(){
    console.log("Connected");
});

client.connect();

client.on('connected', function(address, port){
    console.log('Logged in! ' + address + ":" + port);
});

client.on('message', function(channel, userstate, message, self) {
    if (message.toLowerCase().startsWith('!move')) {
        if (novote){
            client.say(channelName, "Voting is currently disabled.");
        } else {
            if (message == "!move" || message == "!move " || message.length < "!move W U".length){
                client.say(channelName, "Usage:\n`!move <direction> <rotation>`\n`<direction>`: `W`, `A`, `S` or `D`\n`<rotation>`: `U`, `H`, `J` or `K`");
            } else {
                var dir = message.charAt(6).toUpperCase();
                var rot = message.charAt(8).toUpperCase();
                var valid = true;
                var nopr = false;
                var vdir = true;
                var vrot = true;
                if (dir != "W" && dir != "A" && dir != "S" && dir != "D" && dir != "X"){
                    if (debug){
                        console.log(userstate["display-name"] + ": Direction format invalid.");
                    }
                    valid = false;
                }
                if (rot != "U" && rot != "H" && rot != "J" && rot != "K" && rot != "X"){
                    if (debug){
                        console.log(userstate["display-name"] + ": Rotation format invalid.");
                    }
                    valid = false;
                }
                if (dir == "X"){
                    vdir = false;
                }
                if (rot == "X"){
                    vrot = false;
                }
                voted.forEach(function(item){
                    if (userstate["display-name"]){
                        if (debug){
                            console.log(userstate["display-name"] + " already voted.");
                        }
                        valid = false;
                        nopr = true;
                    }
                });
                if (valid){
                    voted.push(userstate["display-name"]);
                    console.log(userstate["display-name"] + " voted " + dir + rot);
                    if (vdir){
                        dirlett.forEach(function(item, index){
                            if (dir == item){
                                dirvotes[index]++;
                            }
                        });
                    }
                    if (vrot){
                        rotlett.forEach(function(item,index){
                            if (rot == item){
                                rotvotes[index]++;
                            }
                        });
                    }
                } else {
                    if (!nopr){
                        client.say(channelName, "Usage:\n`!move <direction> <rotation>`\n`<direction>`: `W`, `A`, `S` or `D`\n`<rotation>`: `U`, `H`, `J` or `K`");
                    }
                }
            }
        }
    } else if (message == "!togglevote"){
        if (userstate["display-name"] == "skiilaa"){
            novote = !novote;
            client.say(channelName, "Voting has been set to " + !novote + ".");
        } else {
            client.say(channelName, "You have no permission to do that.");
        }
    }
});
