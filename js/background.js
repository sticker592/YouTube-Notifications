var wyn = {};
$(document).ready(function(){
	$.ajaxSetup({async:false});
	
	var logger = window.console.log;
	//window.console.log = function(){};
	
	var manifest = chrome.runtime.getManifest();
	var ns = new Audio("sound/notification.mp3");
	
	chrome.notifications.onClicked.addListener(ntClicked);
	chrome.notifications.onButtonClicked.addListener(ntBClicked);
	chrome.notifications.onClosed.addListener(ntCClicked);
	
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
		switch (request.browsing) {
			case "setSettings":
				sendResponse(setSettings());
				break;
			case "removeSettings":
				sendResponse(removeSettings(request.setting));
				break;
			case "updateSettings":
				sendResponse(updateSettings(request.setting, request.var1));
				break;
			case "checkAllYoutube":
				sendResponse(checkAllYoutubeUsers(0));
				break;
			case "checkYoutube":
				sendResponse(checkYoutube(request.var1));
				break;
			case "editChannels":
				sendResponse(editChannels(request.setting));
				break;
			case "editSettings2":
				sendResponse(editSettings2(request.name, request.setting, false));
				break;
			case "testNotify":
				sendResponse(wyn.testNotify());
				break;
		}
	});

	var temp = [];
	
	var settings = {
		"cName": "Main",
		"refreshInterval": 10,
		"animations": true,
		"tts": false
	};
	
	if(localStorage.getItem("channels") == null)
		localStorage.setItem("channels", JSON.stringify(temp));
	if(localStorage.getItem("ytImg") == null)
		localStorage.setItem("ytImg", JSON.stringify(temp));
	if(localStorage.getItem("ytReleases") == null)
		localStorage.setItem("ytReleases", JSON.stringify(temp));
	if(localStorage.getItem("ytLinks") == null)
		localStorage.setItem("ytLinks", JSON.stringify(temp));
	if(localStorage.getItem("ytLogos") == null)
		localStorage.setItem("ytLogos", JSON.stringify(temp));
	if(localStorage.getItem("ytNames") == null)
		localStorage.setItem("ytNames", JSON.stringify(temp));
	if(localStorage.getItem("ytViews") == null)
		localStorage.setItem("ytViews", JSON.stringify(temp));
	if(localStorage.getItem("ytChannelUrls") == null)
		localStorage.setItem("ytChannelUrls", JSON.stringify(temp));
	if(localStorage.getItem("ytTitles") == null)
		localStorage.setItem("ytTitles", JSON.stringify(temp));
	if(localStorage.getItem("ytStatus") == null)
		localStorage.setItem("ytStatus", JSON.stringify(temp));
	if(localStorage.getItem("ytId") == null)
		localStorage.setItem("ytId", JSON.stringify(temp));
	if(localStorage.getItem("serverStatus") == null)
		localStorage.setItem("serverStatus", true);
	if(localStorage.getItem("badgeCount") == null)
		localStorage.setItem("badgeCount", 0);
	if(localStorage.getItem("settings") == null)
		localStorage.setItem("settings", JSON.stringify(settings));
	
	var settingsa = JSON.parse(localStorage.getItem("settings"));
	
	if(settingsa["cName"] == null)
		setVariable("settings", "cName", "Main", false);
	if(settingsa["refreshInterval"] == null)
		setVariable("settings", "refreshInterval", 2, false);
	if(settingsa["animations"] == null)
		setVariable("settings", "animations", true, false);
	if(settingsa["tts"] == null)
		setVariable("settings", "tts", false, false);
	if(settingsa["ttsVoice"] == null)
		setVariable("settings", "ttsVoice", 0, false);
	if(settingsa["notifications"] == null)
		setVariable("settings", "notifications", true, false);
	if(settingsa["nVol"] == null)
		setVariable("settings", "nVol", 1, false);
	
	function setSettings(){
		return({
			badgeCount : localStorage.getItem("badgeCount"),
			channels : localStorage.getItem("channels"),
			ytImg : localStorage.getItem("ytImg"),
			ytReleases : localStorage.getItem("ytReleases"),
			ytLinks : localStorage.getItem("ytLinks"),
			ytLogos : localStorage.getItem("ytLogos"),
			ytNames : localStorage.getItem("ytNames"),
			ytViews : localStorage.getItem("ytViews"),
			ytChannelUrls : localStorage.getItem("ytChannelUrls"),
			ytTitles : localStorage.getItem("ytTitles"),
			ytStatus : localStorage.getItem("ytStatus"),
			ytId : localStorage.getItem("ytId"),
			serverStatus : localStorage.getItem("serverStatus"),
			settings : localStorage.getItem("settings"),
			version : manifest.version
		});
	}

	function refresh(){
		wyn.log(0, "Initializing YouTube channel check");
		checkAllYoutubeUsers(0);
		wyn.log(0, "Ended YouTube channel check");
		//MS*S*M
		var rI = JSON.parse(localStorage.getItem("settings"));
		setTimeout(function(){refresh();},1000*60*rI["refreshInterval"]);
	}

	function checkAllYoutubeUsers(check){
		var ytCheck = "https://data.wassup789.ml/youtubenotifications/testserver.php";
		var ytStatus = false;
		
		if(JSON.parse(localStorage.getItem("channels")).length >= 30 && JSON.parse(localStorage.getItem("settings"))["refreshInterval"] < 5)
			setVariable("settings", "refreshInterval", 5, false);
		
		$.ajax({
			type: "GET",
			dataType: "json",
			url: ytCheck,
			success: function(data) {
				if(data.status == "success")
					ytStatus = true;
				else
					ytStatus = false;
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if(XMLHttpRequest.status == 400)
					ytStatus = true;
				else
					ytStatus = false;
			}
		});
		if(!ytStatus){
			wyn.log(1, "Could not connect to YouTube API Servers");
			localStorage.setItem("serverStatus", false);
			if(check == 1)
				chrome.extension.sendMessage({browsing: "refreshPage"}, function(callback){});
			return;
		}else{
			wyn.log(0, "Connection success");
			localStorage.setItem("serverStatus", true);
			chrome.extension.sendMessage({browsing: "refreshStart"}, function(callback){});
			var channelsa = JSON.parse(localStorage.getItem("channels"));
			/*for(var i = 0; i < Object.keys(channelsa).length; i++){
				if(channelsa[i] != null)
					checkYoutube(i, channelsa[i]);
			}*/
			checkYoutubeBatch(channelsa);
			chrome.extension.sendMessage({browsing: "refreshEnd"}, function(callback){});
			if(check == 1)
				chrome.extension.sendMessage({browsing: "refreshPage"}, function(callback){});
		}
	}
	
	function addCommas(num) {
		var str = num.toString().split('.');
		if (str[0].length >= 5) {
			str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
		}
		if (str[1] && str[1].length >= 5) {
			str[1] = str[1].replace(/(\d{3})/g, '$1 ');
		}
		return str.join('.');
	}
	
	function checkYoutubeBatch(channelList){
		var sendArr = [];
		for(var i = 0; i < channelList.length; i++){
			var channelID,
				channelName;
			
			var channelId = JSON.parse(localStorage.getItem("ytId"))[i];
			if(typeof channelId === "undefined"){
			
				var channel = "https://data.wassup789.ml/youtubenotifications/getchannel.php?query=" + encodeURIComponent(channelList[i]);
				$.ajax({
					type: "GET",
					dataType: "json",
					url: channel,
					success: function(data){
						var lurl = data.data.thumbnail;
						var curl = "https://www.youtube.com/channel/" + data.data.id;
						channelID = data.data.id;
						channelName = data.data.name;
						setVariable("ytLogos", i, lurl);
						setVariable("ytChannelUrls", i, curl);
						setVariable("ytNames", i, data.data.name);
						setVariable("ytId", i, data.data.id);
					}
				});
			}else
				channelID = channelId
			sendArr[i] = {id: channelID};
		}
			
		var channel2 = "https://data.wassup789.ml/youtubenotifications/getlist.php?query=" + encodeURIComponent(btoa(JSON.stringify(sendArr)));
		
		$.ajax({
			type: "GET",
			dataType: "json",
			url: channel2,
			success: function(data) {
				for(var i = 0; i < data.data.length; i++){
					var channelId = JSON.parse(localStorage.getItem("ytId"))[i],
						channelName = JSON.parse(localStorage.getItem("ytNames"))[i];
					var video = ({
						url:			"https://www.youtube.com/watch?v=" + data.data[i].videoId,
						description:	data.data[i].description.substring(0,100).replace(/(\r\n|\n|\r)/gm," "),
						timestamp:		data.data[i].timestamp,
						title:			data.data[i].title,
						image:			data.data[i].thumbnail.replace("https://", "http://"),
						views:			data.data[i].views,
						duration:		data.data[i].duration,
						likes:			data.data[i].likes,
						dislikes:		data.data[i].dislikes
					});

					var ytReleasea = JSON.parse(localStorage.getItem("ytReleases"));
					
					setVariable("ytImg", i, video.image);
					setVariable("ytReleases", i, video.timestamp);
					setVariable("ytLinks", i, video.url);
					setVariable("ytViews", i, video.views);
					setVariable("ytTitles", i, video.title);
					
					wyn.log(0, "Checking YouTube User: " + channelName);
					
					if(video.timestamp > ytReleasea[i]) {					
						if(video.views == "301")
							video.views = "301+";
						video.likes = parseInt(video.likes);
						video.dislikes = parseInt(video.dislikes);
						var likesa = Math.round((video.likes / (video.likes + video.dislikes)) * 100);
						var dislikesa = Math.round((video.dislikes / (video.likes + video.dislikes)) * 100);
						if((likesa + dislikesa) > 100)
							dislikesa--;
						
						var options = {
							type: "image",
							priority: 0,
							title: video.title + " by " + channelName,
							message: video.description,
							imageUrl: video.image,
							iconUrl: "img/icon_yt.png",
							contextMessage: video.duration + " | "+ addCommas(video.views) + " views | " + likesa + "% likes | " + dislikesa + "% dislikes",
							buttons: [{
								title: "Watch Video",
								iconUrl: "img/icon_play2.png"
							}, {
								title: "Dismiss"
							}]
						};
						var ntID = rndStr(10) + "-" + rndStr(5) + "-" + rndStr(5) + "-" + rndStr(5) + "-" + i;
						wyn.log(0, "Found new YouTube video for " + channelName, "green");
						notify(ntID, options);
					}
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				wyn.log(2, textStatus + " ; " + errorThrown.message);
			}
		});
	}
	
	function checkYoutube(cnum, cname){
		if (typeof cname === 'undefined') {
			var channelsa = JSON.parse(localStorage.getItem("channels"));
			cname = channelsa[cnum];
		}
		
		if(cname.indexOf(".com/") > -1){
			if(cname.split(".com/")[1].split("/").length < 1){
				setVariable("ytStatus", cnum, false);
				wyn.log(1, "Channel: \"" + cname + "\" does not exist or connection cannot be made");
				return;
			}else{
				cname = cname.split(".com/")[1];
				if(cname.indexOf("channel/") > -1)
					cname = cname.split("channel/")[1].split("/")[0];
				else if(cname.indexOf("user/") > -1)
					cname = cname.split("user/")[1].split("/")[0];
				setVariable("channels", cnum, cname);
			}
		}
		
		String.prototype.toHHMMSS = function () {
			var sec_num = parseInt(this, 10);
			var hours = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);
			if (hours < 10) {hours = "0"+hours;}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}
			if (hours == 0){
				var time = minutes+':'+seconds;
			}else{
				var time = hours+':'+minutes+':'+seconds;
			}
			return time;
		}
		
		var channelStatus,
			channelID,
			channelName;
		
		var channelId = localStorage.getItem("ytId")[cnum];
		if(typeof channelId === "undefined"){
		
			var channel = "https://data.wassup789.ml/youtubenotifications/getchannel.php?query=" + encodeURIComponent(cname);
			$.ajax({
				type: "GET",
				dataType: "json",
				url: channel,
				success: function(data){
					var lurl = data.data.thumbnail;
					var curl = "https://www.youtube.com/channel/" + data.data.id;
					channelID = data.data.id;
					channelName = data.data.name;
					setVariable("ytLogos", cnum, lurl);
					setVariable("ytChannelUrls", cnum, curl);
					setVariable("ytNames", cnum, data.data.name);
					channelStatus = true;
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					channelStatus = false;
				}
			});
		}else{
			channelID = channelId
			channelName = localStorage.getItem("ytNames")[cnum]
		}
		
		if(!channelStatus){
			if(JSON.parse(localStorage.getItem("ytReleases"))[cnum] > 0)
				setVariable("ytStatus", cnum, false);
			wyn.log(1, "Channel: \"" + cname + "\" does not exist or connection cannot be made");
			return;
		}else
			setVariable("ytStatus", cnum, true);
		
		var channel2 = "https://data.wassup789.ml/youtubenotifications/getlist.php?query=" + encodeURIComponent(btoa(JSON.stringify([{id: channelID, videoId: 0}])));
		
		$.ajax({
			type: "GET",
			dataType: "json",
			url: channel2,
			success: function(data) {
				data.data = data.data[0];
				var video = ({
					url:			"https://www.youtube.com/watch?v=" + data.data.videoId,
					description:	data.data.description.substring(0,100).replace(/(\r\n|\n|\r)/gm," "),
					timestamp:		data.data.timestamp,
					title:			data.data.title,
					image:			data.data.thumbnail.replace("https://", "http://"),
					views:			data.data.views,
					duration:		data.data.duration,
					likes:			data.data.likes,
					dislikes:		data.data.dislikes
				});

				var ytReleasea = JSON.parse(localStorage.getItem("ytReleases"));
				
				setVariable("ytImg", cnum, video.image);
				setVariable("ytReleases", cnum, video.timestamp);
				setVariable("ytLinks", cnum, video.url);
				setVariable("ytViews", cnum, video.views);
				setVariable("ytTitles", cnum, video.title);
				
				wyn.log(0, "Checking YouTube User: " + channelName);
				
				if(video.timestamp > ytReleasea[cnum]) {					
					if(video.views == "301")
						video.views = "301+";
					video.likes = parseInt(video.likes);
					video.dislikes = parseInt(video.dislikes);
					console.log("Likes: " + video.likes); 
					console.log("Dislikes: " + video.dislikes); 
					var likesa = Math.round((video.likes / (video.likes + video.dislikes)) * 100);
					var dislikesa = Math.round((video.dislikes / (video.likes + video.dislikes)) * 100);
					if((likesa + dislikesa) > 100)
						dislikesa--;
					
					var options = {
						type: "image",
						priority: 0,
						title: video.title + " by " + channelName,
						message: video.description,
						imageUrl: video.image,
						iconUrl: "img/icon_yt.png",
						contextMessage: video.duration + " | "+ addCommas(video.views) + " views | " + likesa + "% likes | " + dislikesa + "% dislikes",
						buttons: [{
							title: "Watch Video",
							iconUrl: "img/icon_play2.png"
						}, {
							title: "Dismiss"
						}]
					};
 					var ntID = rndStr(10) + "-" + rndStr(5) + "-" + rndStr(5) + "-" + rndStr(5) + "-" + cnum;
					wyn.log(0, "Found new YouTube video for " + channelName, "green");
					notify(ntID, options);
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				wyn.log(2, textStatus + " ; " + errorThrown.message);
			}
		});
	}

	function notify(ntID, options){
		if(JSON.parse(localStorage.getItem("settings"))["notifications"]){
			chrome.notifications.create(ntID, options, function(){
				var bc = localStorage.getItem("badgeCount");
				localStorage.setItem("badgeCount", ++bc);
				bc = localStorage.getItem("badgeCount");
				updateBadge({colour:'#e12a27', text:"" + bc});
				
				ns.volume = JSON.parse(localStorage.getItem("settings"))["nVol"];
				ns.play();
				if(JSON.parse(localStorage.getItem("settings"))["tts"]){
					var voice = JSON.parse(localStorage.getItem("settings"))["ttsVoice"];
					var message = new SpeechSynthesisUtterance();
					message.voice = speechSynthesis.getVoices()[voice];
					var sList =  ["\\bEp\\b", "\\bEp.\\b", "\\bPt\\b", "\\bPt.\\b"];
					var sList2 = ["Episode", "Episode", "Part", "Part"];
					for(var i = 0; i < sList.length; i++)
						options.title = options.title.replace(new RegExp(sList[i], "g"), sList2[i]);
					message.text = options.title;
					speechSynthesis.speak(message);
				}
			});
		}else
			wyn.log(0, "Could not notify user, notifications disabled", "green");
	}

	function ntClicked(ntID){
		var ytLinka = JSON.parse(localStorage.getItem("ytLinks"));
		createTab(ytLinka[ntID.split("-")[4]]);
		var bc = localStorage.getItem("badgeCount");
		if(bc > 1){
			bc--;
			localStorage.setItem("badgeCou3nt", bc);
			bc = localStorage.getItem("badgeCount");
			updateBadge({colour:'#e12a27', text:"" + bc});
		}else{
			localStorage.setItem("badgeCount", 0);
			updateBadge({colour:'#e12a27', text:""});
		}
		wyn.log(0, "User clicked on notification; NTID: " + ntID);
		wyn.log(0, "Sending user to " + ytLinka[ntID.split("-")[4]]);
		chrome.notifications.clear(ntID);
	}
	
	function ntBClicked(ntID, btnID){
		if(btnID == 0){
			var ytLinka = JSON.parse(localStorage.getItem("ytLinks"));
			createTab(ytLinka[ntID.split("-")[4]]);
			remBadge();
			wyn.log(0, "User clicked on \"Watch Video\" button; NTID: " + ntID);
			wyn.log(0, "Sending user to " + ytLinka[ntID.split("-")[4]]);
		}else if (btnID == 1){
			remBadge();
			wyn.log(0, "User clicked on \"Close\" button; NTID: " + ntID);
		}
	}
	
	function ntCClicked(ntID, byUsr){
		if(byUsr){
			remBadge();
			wyn.log(0, "User clicked on \"X\" button; NTID: " + ntID);
		}else{}
	}

	function updateSettings(setting, var1){
		var state;
		setVariable("channels", setting, var1);
		setVariable("ytReleases", setting, "0");
		
		chrome.extension.sendMessage({browsing: "refreshPage"});
		
		state = "Variable channels has changed.";
		return({response: state});
	}
	
	function editSettings2(name, setting, refresh){
		if (typeof refresh === 'undefined') { refresh = true; }
		var state;
		setVariable("settings", name, setting, false);
		state = "Variable " + settings + " has changed.";
		if(refresh)
			chrome.extension.sendMessage({browsing: "refreshPage"});
		return({response: state});
	}
	
	function editChannels(name){
		var state;
		name = JSON.parse(name);
		var cName = name[name.length-2];
		name[name.length-1] = null
		name[name.length-2] = null;
		name.clean();
		name = JSON.stringify(name);
		localStorage.setItem("channels", name);
		state = "Variable channels has changed.";
		setVariable("settings", "cName", cName, false);
		state = "Variable settings has changed.";
		checkAllYoutubeUsers(1);
		return({response: state});
	}
	
	Array.prototype.clean = function(deleteValue) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] == deleteValue) {
			this.splice(i, 1);
			i--;
			}
		}
		return this;
	};
	
	function removeSettings(setting){
		var state;
		
		setVariable("channels", setting, null);
		setVariable("ytLogos", setting, null);
		setVariable("ytNames", setting, null);
		setVariable("ytImg", setting, null);
		setVariable("ytReleases", setting, null);
		setVariable("ytLinks", setting, null);
		setVariable("ytViews", setting, null);
		setVariable("ytChannelUrls", setting, null);
		setVariable("ytTitles", setting, null);
		
		chrome.extension.sendMessage({browsing: "refreshPage"});
		
		state = "Variable channels has changed.";
		return({response: state});
	}
	
	function setVariable(item, num, var1, clean){
		if (typeof clean === 'undefined')
			clean = true;
		var a = JSON.parse(localStorage.getItem(item));
		a[num] = var1;
		if(clean) {
			a.clean();
		}
		localStorage.setItem(item, JSON.stringify(a));
	}
	
	wyn.testNotify = function(){
		var ntID = rndStr(10) + "-" + rndStr(5) + "-" + rndStr(5) + "-" + rndStr(5);
		var options = {
			type: "image",
			priority: 0,
			title: "Video by Youtube Creator",
			message: "Insert Description Here",
			imageUrl: "img/null.gif",
			iconUrl: "img/icon_yt.png",
			contextMessage: "12:34 | 5,678 views | 90% likes | 10% dislikes",
			buttons: [{
				title: "Watch Video",
				iconUrl: "img/icon_play2.png"
			}, {
				title: "Close"
			}]
		};
		
		chrome.notifications.create(ntID, options, function(){			
			ns.volume = JSON.parse(localStorage.getItem("settings"))["nVol"];
			ns.play();
			
			if(JSON.parse(localStorage.getItem("settings"))["tts"]){
				var voice = JSON.parse(localStorage.getItem("settings"))["ttsVoice"];
				var message = new SpeechSynthesisUtterance();
				message.voice = speechSynthesis.getVoices()[voice];
				var sList =  ["\\bEp\\b", "\\bEp.\\b", "\\bPt\\b", "\\bPt.\\b"];
				var sList2 = ["Episode", "Episode", "Part", "Part"];
				for(var i = 0; i < sList.length; i++)
					options.title = options.title.replace(new RegExp(sList[i], "g"), sList2[i]);
				message.text = options.title;
				speechSynthesis.speak(message);
			}
		});
	}
	
	wyn.changeVariable = function(settings, cnum, cont){
		if(localStorage.getItem(settings)){
			var yt = JSON.parse(localStorage.getItem(settings));
			yt[cnum] = cont;
			localStorage.setItem(settings, JSON.stringify(yt));
			return("Changed variable: \"" + settings + "\" for User #" + cnum + " to: \"" + cont + "\".");
		}else{
			return("Usage: changeVariable(setting, user#, content);.");
		}
	}
	
	wyn.log = function(type, var1, var2){
		var date = new Date();
		var hour, minute, info, color;
		if(date.getHours().toString().length == 1){
			hour = "0" + date.getHours();
		}else{
			hour = date.getHours();
		}
		if(date.getMinutes().toString().length == 1){
			minute = "0" + date.getMinutes();
		}else{
			minute = date.getMinutes();
		}
		var prefix = hour + ":" + minute + " ";
		if(type == 0){
			info = "[INFO]";
		}else if(type == 1){
			info = "[WARNING]";
			color = "#FF8F00";
		}else if(type == 2){
			info = "[ERROR]";
			color = "#FF0000";
		}else{
			info = color = "";
		}
		if(var2){
			color = var2;
		}
		if(type == 0){
			console.log("%c" + prefix + info + " " + var1, "color: " + color + ";");
		}else if(type == 1){
			console.warn("%c" + prefix + info + " " + var1, "color: " + color + ";");
		}else if(type == 2){
			console.error(prefix + info + " " + var1);
		}
	}
	
	function updateBadge(options) {
		var t = options.text,
			c = options.color||options.colour;
		if(t !== undefined)
			chrome.browserAction.setBadgeText({text: (t||'')});
		if(c !== undefined)
			chrome.browserAction.setBadgeBackgroundColor({color: c});
	}
	
	function remBadge() {
		var bc = localStorage.getItem("badgeCount");
		if(bc > 1){
			bc--;
			localStorage.setItem("badgeCount", bc);
			bc = localStorage.getItem("badgeCount");
			updateBadge({colour:'#e12a27', text:"" + bc});
		}else{
			localStorage.setItem("badgeCount", 0);
			updateBadge({colour:'#e12a27', text:""});
		}
	}
	
	function rndStr(len){
		var text = "";
		var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		for(var i = 0; i < len; i++)
			text += charset.charAt(Math.floor(Math.random() * charset.length));
		return text;
	}
	
	function createTab(urL) {
		var numTabs = 0;
		chrome.windows.getAll(function(data){
			numTabs = data.length;
			if(numTabs > 0)
				chrome.tabs.create({url: urL});
			else
				chrome.windows.create({url: urL});
		});
	}
	refresh();
});
