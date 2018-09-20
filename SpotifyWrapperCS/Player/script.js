function SystemMediaControlEvent(type) {
	//console.log("MediaEvent: " + type);
	if (type == "play") {
		document.querySelector(".player-controls .control-button--circled").click();
	} else if (type == "prev") {
		document.querySelector(".player-controls .spoticon-skip-back-16").click();
	} else if (type == "next") {
		document.querySelector(".player-controls .spoticon-skip-forward-16").click();
	} else return;

	setTimeout(UpdateSystemMediaControl, 500);
}


var UpdateSystemMediaControl;
function InjectSystemMediaControl() {
	var previousTrackName = "";
	var previousArtistName = "";
	var firstTime = true;

	UpdateSystemMediaControl = function () {
		try {
			var trackName = document.querySelector(".now-playing .track-info__name").innerText;
			var artistName = document.querySelector(".now-playing .track-info__artists").innerText;
			var canSkipBack = document.querySelector(".player-controls .spoticon-skip-back-16").className.indexOf("disabled") < 0 ? 1 : 0;
			var canSkipForward = document.querySelector(".player-controls .spoticon-skip-forward-16").className.indexOf("disabled") < 0 ? 1 : 0;
			var canPlayPause = document.querySelector(".player-controls .control-button--circled").className.indexOf("disabled") < 0 ? 1 : 0;
			var isPaused = document.querySelector(".player-controls .control-button--circled").className.indexOf("play") > 0 ? 1 : 0;

			if (previousArtistName != artistName || previousTrackName != trackName) {
				external.notify("SMCI\n" + trackName + "\n" + artistName);
				previousTrackName = trackName;
				previousArtistName = artistName;
			}
			external.notify("SMCB\n" + canSkipBack + canSkipForward + canPlayPause + isPaused);

			if (firstTime) {
				/*var audio = new Audio("ms-appx-web:///Player/silence.mp3");
				audio.play();*/
				firstTime = false;
			}
		} catch (e) {
			console.log("Failed to load control info");
		}
	};

	setInterval(UpdateSystemMediaControl, 2000);
}

function InjectBasicLayout() {
	try {
		var metaViewport = document.createElement("meta");
		metaViewport.name = "viewport";
		metaViewport.content = "initial-scale=1";
		document.head.appendChild(metaViewport);

		var customStyle = document.createElement("link");
		customStyle.rel = "stylesheet";
		customStyle.href = "ms-appx-web:///Player/style.css";
		document.head.appendChild(customStyle);

		document.getElementById("signup-spotify").addEventListener("click", function () {
			location.href = "https://www.spotify.com/signup/?forward_url=https%3A%2F%2Fopen.spotify.com%2Fbrowse%2Ffeatured";
		});
	} catch (e) {}
}
InjectBasicLayout();

var originalHistoryBack = history.back;

history.back = function () {
	if (document.getElementById("main").className == "") {
		document.getElementById("main").className = "compactPlayingBar";
	} else {
		history.go(-1);
	}
}

function InjectCustomLayout() {

	var menuItemUser = document.createElement("li");
	menuItemUser.className = "navBar-group";
	menuItemUser.appendChild(document.getElementsByClassName("sessionInfo")[0]);
	document.querySelector(".navBar ul").appendChild(menuItemUser);

	document.querySelector("#main > .root").appendChild(document.getElementsByClassName("nav-bar-container")[0]);

	document.getElementById("main").className = "compactPlayingBar";

	var expandPlayingBar = document.createElement("div");
	expandPlayingBar.className = "expand-playing-bar";
	expandPlayingBar.addEventListener("click", function () {
		document.getElementById("main").className = "";
		//history.pushState(null, null, "#largecontrol");
	});
	document.getElementsByClassName("now-playing-bar")[0].appendChild(expandPlayingBar);

	window.addEventListener("click", ReactToURLChange);
	window.addEventListener("popstate", ReactToURLChange);

	document.querySelector(".sessionInfo a").addEventListener("click", ReactToURLChange);

	document.querySelector(".user-widget .user-link").innerHTML = "More";
	document.querySelector(".user-widget .user-avatar").innerHTML = '<div class="icon">\
		<svg class="normal-icon" viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="m 256,184 c -39.8,0 -72,32.2 -72,72 0,39.8 32.2,72 72,72 39.8,0 72,-32.2 72,-72 0,-39.8 -32.2,-72 -72,-72 z m 0,122.66667 c -22.1,0 -50.66667,-28.56667 -50.66667,-50.66667 0,-22.1 28.56667,-50.66667 50.66667,-50.66667 22.1,0 50.66667,28.56667 50.66667,50.66667 0,22.1 -28.56667,50.66667 -50.66667,50.66667 z M 432,184 c -39.8,0 -72,32.2 -72,72 0,39.8 32.2,72 72,72 39.8,0 72,-32.2 72,-72 0,-39.8 -32.2,-72 -72,-72 z m 0,122.66667 c -22.1,0 -50.66667,-28.56667 -50.66667,-50.66667 0,-22.1 28.56667,-50.66667 50.66667,-50.66667 22.1,0 50.66667,28.56667 50.66667,50.66667 0,22.1 -28.56667,50.66667 -50.66667,50.66667 z M 80,184 c -39.8,0 -72,32.2 -72,72 0,39.8 32.2,72 72,72 39.8,0 72,-32.2 72,-72 0,-39.8 -32.2,-72 -72,-72 z m 0,122.66667 C 57.9,306.66667 29.333333,278.1 29.333333,256 29.333333,233.9 57.9,205.33333 80,205.33333 c 22.1,0 50.66667,28.56667 50.66667,50.66667 0,22.1 -28.56667,50.66667 -50.66667,50.66667 z"></path></svg>\
		<svg class="active-icon" viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z"></path></svg>\
		</div>';

	function checkUrlChange() {
		if (location.pathname != lasturl) {
			lasturl = location.pathname;
			document.getElementById("main").className = "compactPlayingBar";
		}
	}

	setInterval(checkUrlChange, 10000);
}

var pinTileButton = document.createElement("div");
pinTileButton.className = "button-group__item";
pinTileButton.innerHTML = '<button class="btn btn-black btn-small pintile-button" style="min-width: 240px;">PIN TRANSPARENT TILE</button>';
pinTileButton.addEventListener("click", function () {
	external.notify("RPTT");
});

function PopulateSettingsPage() {
	if (document.getElementsByClassName(".pintile-button").length == 0) {
		var menuItem = document.querySelectorAll(".main-view-container .button-group--vertical .button-group__item");
		menuItem[1].remove();
		menuItem[2].remove();
		document.querySelector(".main-view-container .button-group--vertical").appendChild(pinTileButton);
	}
}

var lasturl = location.pathname;
function ReactToURLChange() {
	if (location.pathname != lasturl) {
		lasturl = location.pathname;
		document.getElementById("main").className = "compactPlayingBar";
	}

	if (document.location.pathname.indexOf("/settings/account") >= 0) {
		PopulateSettingsPage();
	}
}

function WaitForLoad() {
	if (document.getElementsByClassName("sessionInfo").length == 0)
		window.requestAnimationFrame(WaitForLoad);
	else
		InjectCustomLayout();
}
WaitForLoad();

function WaitForMediaBar() {
	if (document.getElementsByClassName("now-playing").legnth == 0)
		window.requestAnimationFrame(WaitForMediaBar);
	else
		InjectSystemMediaControl();
}
WaitForMediaBar();
