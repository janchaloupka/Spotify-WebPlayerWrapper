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
			location.href = "https://www.spotify.com/cz/signup/?forward_url=https%3A%2F%2Fopen.spotify.com%2Fbrowse%2Ffeatured";
		});
	} catch (e) {}
}
InjectBasicLayout();

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
		history.pushState(null, null, "#largecontrol");
	});
	document.getElementsByClassName("now-playing-bar")[0].appendChild(expandPlayingBar);

	window.addEventListener("click", ReactToURLChange);
	window.addEventListener("popstate", ReactToURLChange);

	//document.getElementsByClassName("user-link")[0].innerHTML = "User";
}

function ReactToURLChange() {
	if (document.location.hash.indexOf("largecontrol") < 0) {
		document.getElementById("main").className = "compactPlayingBar";
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
