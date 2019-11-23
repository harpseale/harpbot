const client = new Discord.Client();
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/firestore");
require("firebase/messaging");
require("firebase/functions");
var portscanner = require('portscanner');
var trm
var testChannel;
var generalChannel;
var refDate = 1572641333000; //Nov 1 2019 2048 UTC
var master;
var announcementsChannel;

var config = {
    apiKey: "AIzaSyAGEocA--QwvzGX2zdy5j_iX6xRvpV9irg",
    authDomain: "harpbot.firebaseapp.com",
    databaseURL: "https://harpbot.firebaseio.com/",
    storageBucket: "harpbot.appspot.com"
  };
 firebase.initializeApp(config);

 var database = firebase.database();

function writeUserData(userId, name, jointime) {
  	firebase.database().ref('users/' + userId).set({
    	username: name,
    	joinTime: jointime,
    	totalTime: 0,
    	lastActive: jointime
  	});
  	testChannel.send("writeUserData: Data for new user " + name + " set. Details: " + name + " / " + jointime);
}

function parseTime(msTime) {
	var timeArr = [];
	timeArr.push(Math.floor(msTime / 3600000));
  	timeArr.push(Math.floor((msTime - timeArr[0] * 3600000)/60000));
  	timeArr.push((msTime % 60000)/1000);
  	return timeArr;
}

function startTimeCount (userID) {
	var currentTime = new Date();
	firebase.database().ref('/users/' + userID).once('value').then(function(snapshot) {
  		var username = (snapshot.val() && snapshot.val().username) || 'nonexist';
  		if (username == "nonexist") {
  			writeUserData(userID, trm.members.get(userID).user.username, Date.parse(currentTime));
  		} else {
  			var userRef = firebase.database().ref('users/' + userID);
			userRef.update({ joinTime: Date.parse(currentTime)} );
			testChannel.send("startTimeCount: Updated jointime for user " + trm.members.get(userID).nickname + " at " + currentTime + " (" + Date.parse(currentTime) + ").");
		}
	});
	
};

function endTimeCount (userID) {
	var currentTime = new Date();
	firebase.database().ref('/users/' + userID).once('value').then(function(snapshot) {
  		var username = (snapshot.val() && snapshot.val().username) || 'nonexist';
  		var joinTime = (snapshot.val() && snapshot.val().joinTime) || 0;
  		var totalTime = (snapshot.val() && snapshot.val().totalTime) || 0;
  		if (username == "nonexist") {
  			writeUserData(userID, trm.members.get(userID).user.username, Date.parse(currentTime));
  		}
  		if (joinTime != 0) {
  			var currentTime = new Date();
			var timeToAdd = Date.parse(currentTime) - joinTime;
			var newTotalTime = timeToAdd + totalTime;
			var userRef = firebase.database().ref('users/' + userID);
			userRef.update({ totalTime: newTotalTime, joinTime: 0, lastActive: Date.parse(currentTime) });
			testChannel.send("endTimeCount: Updated total time for user " + trm.members.get(userID).nickname + " adding " + timeToAdd + ". Now " + newTotalTime + ".");
  		} else {
  			testChannel.send("endTimeCount: Total time for user " + trm.members.get(userID).nickname + " not updated as jointime was 0.");
  		}
	});
};

client.on('ready', () => {
  	console.log(`Logged in as ${client.user.tag}!`);
  	trm = client.guilds.get("330334624687325185")
  	testChannel = trm.channels.get("386041022800723969");
  	generalChannel = trm.channels.get("517536108658032691");
  	announcementsChannel = trm.channels.get("363669029652791296");
  	master = "348733105802182660";
  	firebase.database().ref('/users').once('value').then(function(snapshot) {
  		var currentTime = new Date()
  		snapshot.forEach(function(userSnapshot) {
  			var userRef = firebase.database().ref('users/' + userSnapshot.key);
  			if (trm.members.get(userSnapshot.key).voiceChannel && !trm.members.get(userSnapshot.key).deaf && trm.members.get(userSnapshot.key).voiceChannelID != "347376453459116032") {
  				userRef.update({ joinTime: Date.parse(currentTime), lastActive: Date.parse(currentTime) });
  				testChannel.send("Bot init: Jointime for user " + trm.members.get(userSnapshot.key).nickname + " set to " + currentTime + " (" + Date.parse(currentTime) + ").");
  			} else {
  				userRef.update({ joinTime: 0 });
  				testChannel.send("Bot init: Jointime for user " + trm.members.get(userSnapshot.key).nickname + " set to 0");
  			}
  		});
	});
  });

client.on('message', msg => {
  if (msg.content.startsWith("!")) {
    var params = msg.content.substring(1).split(" ");
    var cmd = params[0];
    switch (cmd) {
    	case "info":
    		const embed = new RichEmbed()
    		.setAuthor("harpbot", "https://i.imgur.com/s2TGDT7g.jpg")
    		.setColor('RED')
    		.setTitle("Bot Information")
    		.setDescription("i am a HARPBOT noobs. Here are the commands you may use")
    		.addField("!info", "this command u autists")
    		.addField("!game [ow/mc]", "use to announce immediate sessions (CABINET ONLY)")
    		.addField("!time [@member]", "check the time that a certain user has spent in channels. must @ ping the user")
    		.addField("!rank", "check ur RANKING and ACTIVITY%")
    		.addField("!schedule [type] [24h time] [notes]", "schedule events at a later time at the current date. (CABINET ONLY)")
    		.addField("Additional Notes", "time is only gained by being undeafened in a channel other than AFK.");
    		msg.channel.send(embed);
    		break;
    	case 'game':
    		if (!msg.member.roles.has("453205099725062144")) {
  				msg.channel.send("not cabinet la noob nice try");
  				return;
  			}
  			else {
  				if (!msg.member.voiceChannel) {
  					msg.channel.send("can u get in channel first autistic kid");
  				} else {
  					var channelUsersCount = msg.member.voiceChannel.members.array().length;
  					if (params[1] == null) {
  						msg.channel.send("hi " + msg.member.nickname + " can u actually specify a game u fuck"); 	
  					} else if (params[1] == "ow") {
  						msg.channel.send("<@&453191462918684672> " + msg.member.nickname + " wants to play OVERWATCH now autism got " + channelUsersCount + " person(s) inside come now"); 
  					} else if (params[1] == "mc") {
  						msg.channel.send("<@&502508844690178058> " + msg.member.nickname + " wants to play BLOCKGAME now autism got " + channelUsersCount + " person(s) inside come now");  
  					}
  				}		
  			}
  			break;
  		case 'schedule':
  			if (!msg.member.roles.has("453205099725062144")) {
  				msg.channel.send("not cabinet la noob nice try");
  				return;
  			}
  			if (!params[1] || !params[2]) {
  				msg.channel.send("hello do u know how to read u didnt specify what ur supposed to noob");
  			} 
  			var type = params[1];
  			var time = params[2];
  			if (time.length != 4 || parseFloat(time, 10) < 1 || parseFloat(time, 10) > 2359 || !Number(time)) {
  				msg.channel.send("appropriate time pls");
  				return;
  			}
  			var adminNotes;
  			if (!params[3]) {
  				adminNotes = "None";
  			} else {
  				adminNotes = params;
  				adminNotes.shift();
  				adminNotes.shift();
  				adminNotes.shift();
  				adminNotes.join(' ');
  			}
  			if (type == "ow") {
  				type = "Overwatch";
  			} else if (type == "mc") {
  				type = "Minecraft";
  			}
  			const schedEmbed = new RichEmbed()
  			.setAuthor(msg.member.nickname, "https://i.imgur.com/s2TGDT7g.jpg")
  			.setColor('WHITE')
  			.setTitle(type + " Session")
  			.setDescription("Today @ " + time + " hrs GMT+8")
  			.addField("Admin Notes", adminNotes);
  			announcementsChannel.send("<@&453191462918684672>");
  			announcementsChannel.send(schedEmbed);
  			break;
  		case 'time':
  			var target;
  			if (!params[1]) {
  					target = msg.author.id;
  			} else {
  					target = params[1].slice(3,21);
  				}
  			firebase.database().ref('/users/' + target).once('value').then(function(snapshot) {
  				var totalTime = (snapshot.val() && snapshot.val().totalTime) || 0;
  				var lastActive = (snapshot.val() && snapshot.val().lastActive) || 0;
  				var parsedTime = parseTime(totalTime);
  				var lastSeen = new Date(lastActive);
  				msg.channel.send("The total time " + trm.members.get(target).nickname + " has spent in voice channels is " + parsedTime[0] + " hours, " + parsedTime[1] + " minutes and " + parsedTime[2] + " seconds.");
  				if (trm.members.get(target).voiceChannelID != "347376453459116032" && trm.members.get(target).voiceChannel != null && trm.members.get(target).deaf == false) {
  					msg.channel.send("User " + trm.members.get(target).nickname + " is currently active.");
  				} else if (lastActive != 0) {
  					msg.channel.send("User " + trm.members.get(target).nickname + " was last active at " + lastSeen + ".");
  				} else {
  					msg.channel.send("User " + trm.members.get(target).nickname + " is actually nonexistent.");
  				}
  			});
  			break;
  		case 'rank':
  			var hoursRank = [];
  			var count = 0;
  			var currentTime = new Date();
  			const rankEmbed = new RichEmbed()
  			.setAuthor("harpbot", "https://i.imgur.com/s2TGDT7g.jpg")
  			.setColor('white')
  			.setTitle("Time Ranks")
  			.setDescription("As of " + currentTime);
  			var hoursRef = firebase.database().ref('users').orderByChild('totalTime');
  			hoursRef.once("value").then(function(snapshot) {
  				snapshot.forEach(function(data) {
  					hoursRank.push([data.key,data.val().totalTime]);
  				});
  				hoursRank.slice().reverse().forEach(function(slave) {
  					count++;
  					var parsedTime = parseTime(slave[1]);
  					var activity = 300*(slave[1]/(Date.parse(currentTime) - refDate));
  					//msg.channel.send(count + ". " + trm.members.get(slave[0]).nickname + " - " + parsedTime[0] + " hours, " + parsedTime[1] + " minutes, " + parsedTime[2] + " seconds. (" + activity.toFixed(1) + "% activity)");
  					rankEmbed.addField(count + ". " + trm.members.get(slave[0]).nickname, parsedTime[0] + " hours, " + parsedTime[1] + " minutes, " + parsedTime[2] + " seconds. (" + activity.toFixed(1) + "% activity)");
  				});
  				msg.channel.send(rankEmbed);
  			});
			break;
  		//beyond here are admin/legacy commands
  		case 'countTime':
  			if (!msg.member.roles.has(master)) return
  			testChannel.send("pls reset bot, time has been logged.");
  			firebase.database().ref('/users').once('value').then(function(snapshot) {
  				snapshot.forEach(function(userSnapshot) {
  					var userRef = firebase.database().ref('users/' + userSnapshot.key);
  					if (trm.members.get(userSnapshot.key).voiceChannel && !trm.members.get(userSnapshot.key).deaf && trm.members.get(userSnapshot.key).voiceChannelID != "347376453459116032") {
  						endTimeCount(userSnapshot.key);
  						testChannel.send("!countTime : endTimeCount executed on user " + trm.members.get(userSnapshot.key).nickname);
  					} else {
  						testChannel.send("!countTime: stats for user " + trm.members.get(userSnapshot.key).nickname + " not updated.");
  					}
  				});
			});
			break;
  		case 'setupdb':
  			if (!msg.member.roles.has(master)) return
			writeUserData(msg.author.id, msg.author.username);
			break;
		case 'readdb':
			if (!msg.member.roles.has(master)) return
			firebase.database().ref('/users/' + params[1]).once('value').then(function(snapshot) {
  				var username = (snapshot.val() && snapshot.val().username) || 'nonexist';
  				console.log(username);
			});
			break;
		case 'whatsthedate':
			if (!msg.member.roles.has(master)) return
			var dateee = new Date();
			msg.channel.send(Date.parse(dateee));
			break;
    }
  }
});

client.on("voiceStateUpdate", function (oldMember, newMember) {
	var vcid = newMember.voiceChannelID;
	var vcidOld = oldMember.voiceChannelID;
	if (!vcidOld || oldMember.deaf == true && newMember.deaf == false || vcidOld == "347376453459116032" && vcid != "347376453459116032") {
		if (newMember.deaf == true || vcid == "347376453459116032" || !vcid) return;
		startTimeCount(newMember.id);
		generalChannel.send(newMember.nickname + " has joined the voice channel.", {tts: true});
	}
	if (!vcid || oldMember.deaf == false && newMember.deaf == true || vcidOld != "347376453459116032" && vcid == "347376453459116032") {	
		if (vcidOld == "347376453459116032") return;
		endTimeCount(newMember.id);
		generalChannel.send(newMember.nickname + " has ragequit the voice channel.", {tts: true});
	}
});

client.login('Mzg2MDM5NDU0Mjk4NTM3OTg0.DisJXQ.A9J-jAESLo16K3Zs1uDhGdjM2sE');

