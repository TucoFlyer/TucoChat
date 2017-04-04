// Module requirements
var Gitter = require("node-gitter");
var net = require('net');

// Channel to join
const channelName = "TucoFlyer/dev";

// Parse config file
var options = require("./config.json");

// Initialize TCP client
var tClient = new net.Socket();

// Initialize Gitter API
var gitter = new Gitter(options.token);

const debug = false; // Change to true to enable verbose mode

var novote = false; // Change to true to disable voting on script start

var voted = []; // This is where the users who voted are stored

// Vote letters
var dirlett = ["W", "A" , "S", "D"];
var rotlett = ["U", "H", "J", "K"];

// Vote scores
var dirvotes = [0, 0, 0, 0];
var rotvotes = [0, 0, 0, 0];

// Store empty vote objects
var emptyDirVotes = dirvotes;
var emptyRotVotes = rotvotes;

// Connect to TCP server
tClient.connect(1337, '127.0.0.1', function(){
	console.log("Connected to TCP server.");
});

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

gitter.rooms.join(channelName).then(function(room) {
	console.log("Connected to " + channelName + "!");
	var events = room.streaming().chatMessages();

	events.on('chatMessages', function(message){
		if (message.model.text.toLowerCase().startsWith('!move')) {
	        if (novote){
    	        room.send("Voting is currently disabled.");
        	} else {
            	if (message.model.text == "!move" || message.model.text == "!move " || message.model.text.length < "!move W U".length){
                	room.send("Usage:\n`!move <direction> <rotation>`\n`<direction>`: `W`, `A`, `S` or `D`\n`<rotation>`: `U`, `H`, `J` or `K`");
	            } else {
    	            var dir = message.model.text.charAt(6).toUpperCase();
        	        var rot = message.model.text.charAt(8).toUpperCase();
            	    var valid = true;
                	var nopr = false;
	                var vdir = true;
    	            var vrot = true;
        	        if (dir != "W" && dir != "A" && dir != "S" && dir != "D" && dir != "X"){
             	       if (debug){
                	        console.log(message.model.fromUser.id + ": Direction format invalid.");
                    	}
	                    valid = false;
    	            }
        	        if (rot != "U" && rot != "H" && rot != "J" && rot != "K" && rot != "X"){
            	        if (debug){
                	        console.log(message.model.fromUser.id + ": Rotation format invalid.");
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
                	    if (message.model.fromUser.id){
                    	    if (debug){
                        	    console.log(message.model.fromUser.id + " already voted.");
	                        }
    	                    valid = false;
        	                nopr = true;
            	        }
                	});
	                if (valid){
    	                voted.push(message.model.fromUser.id);
        	            console.log(message.model.fromUser.id + " voted " + dir + rot);
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
            	            room.send("Usage:\n`!move <direction> <rotation>`\n`<direction>`: `W`, `A`, `S` or `D`\n`<rotation>`: `U`, `H`, `J` or `K`");
                	    }
                	}
	            }
    	    }
	    } else if (message.model.text == "!togglevote"){
    	    if (message.model.fromUser.id == options.adminId){
        	    novote = !novote;
            	room.send("Voting has been set to " + !novote + ".");
	        } else {
    	        room.send("You have no permission to do that.");
        	}
    	}
	});
});