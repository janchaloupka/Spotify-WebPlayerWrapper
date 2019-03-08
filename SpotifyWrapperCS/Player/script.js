// Receive media button event
function SystemMediaControlEvent(type) {
	if (type == "play") {
		document.querySelector(".player-controls .control-button--circled").click();
	} else if (type == "prev") {
		document.querySelector(".player-controls .spoticon-skip-back-16").click();
	} else if (type == "next") {
		document.querySelector(".player-controls .spoticon-skip-forward-16").click();
	} else return;

	setTimeout(UpdateSystemMediaControl, 500);
}

// Send information about buttons state and current song to the main control
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
				// Workaround to play silence if song is playing over spotify connect on different device
				// Didn't work reliably, so I disabpled this code
				/*var audio = new Audio("ms-appx-web:///Player/silence.mp3");
				audio.play();*/
				firstTime = false;
			}
		} catch (e) {
			console.log("Failed to load control info");
		}
	};

	// Refresh info every two seconds
	setInterval(UpdateSystemMediaControl, 2000);
}

// Apply custom css
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

		// I don't know why is this line of code here
		document.getElementById("signup-spotify").addEventListener("click", function () {
			location.href = "https://www.spotify.com/signup/?forward_url=https%3A%2F%2Fopen.spotify.com";
		});
	} catch (e) {
		// TODO - handle layout injection error
	}
}
InjectBasicLayout();

// Modify back function so it works with expanding player bar
var originalHistoryBack = history.back;
history.back = function () {
	if (document.getElementById("main").className == "") {
		document.getElementById("main").className = "compactPlayingBar";
	} else {
		history.go(-1);
	}
}

function InjectCustomLayout() {
	applyDarkMode();

	// Ugly hack - prevents application closing when user click on the back button when player is expanded
	history.pushState(null, "", "/browse/featured");

	// Add user section to the menu
	var menuItemUser = document.createElement("li");
	menuItemUser.className = "navBar";
	menuItemUser.appendChild(document.getElementsByClassName("sessionInfo")[0]);
	document.querySelector(".navBar ul").appendChild(menuItemUser);

    document.querySelector("#main > .Root").appendChild(document.getElementsByClassName("Root__nav-bar")[0]);

	// Start with compactPlayBar
	document.getElementById("main").className = "compactPlayingBar";

	var expandPlayingBar = document.createElement("div");
	expandPlayingBar.className = "expand-playing-bar";
	expandPlayingBar.addEventListener("click", function () {
		document.getElementById("main").className = "";
		//history.pushState(null, null, "#largecontrol");
	});
    document.getElementsByClassName("Root__now-playing-bar")[0].appendChild(expandPlayingBar);

	window.addEventListener("click", ReactToURLChange);
	window.addEventListener("popstate", ReactToURLChange);
	document.querySelector(".sessionInfo a").addEventListener("click", ReactToURLChange);


	document.querySelector(".user-widget .user-link").innerHTML = "More";
	document.querySelector(".user-widget .user-avatar").innerHTML = '<div class="icon">\
		<svg class="normal-icon" viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="m 256,184 c -39.8,0 -72,32.2 -72,72 0,39.8 32.2,72 72,72 39.8,0 72,-32.2 72,-72 0,-39.8 -32.2,-72 -72,-72 z m 0,122.66667 c -22.1,0 -50.66667,-28.56667 -50.66667,-50.66667 0,-22.1 28.56667,-50.66667 50.66667,-50.66667 22.1,0 50.66667,28.56667 50.66667,50.66667 0,22.1 -28.56667,50.66667 -50.66667,50.66667 z M 432,184 c -39.8,0 -72,32.2 -72,72 0,39.8 32.2,72 72,72 39.8,0 72,-32.2 72,-72 0,-39.8 -32.2,-72 -72,-72 z m 0,122.66667 c -22.1,0 -50.66667,-28.56667 -50.66667,-50.66667 0,-22.1 28.56667,-50.66667 50.66667,-50.66667 22.1,0 50.66667,28.56667 50.66667,50.66667 0,22.1 -28.56667,50.66667 -50.66667,50.66667 z M 80,184 c -39.8,0 -72,32.2 -72,72 0,39.8 32.2,72 72,72 39.8,0 72,-32.2 72,-72 0,-39.8 -32.2,-72 -72,-72 z m 0,122.66667 C 57.9,306.66667 29.333333,278.1 29.333333,256 29.333333,233.9 57.9,205.33333 80,205.33333 c 22.1,0 50.66667,28.56667 50.66667,50.66667 0,22.1 -28.56667,50.66667 -50.66667,50.66667 z"></path></svg>\
		<svg class="active-icon" viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z"></path></svg>\
		</div>';

	// Fallback checks every 10s if url has changed
	function checkUrlChange() {
		if (location.pathname != lasturl) {
			lasturl = location.pathname;
			document.getElementById("main").className = "compactPlayingBar";
		}
	}
	setInterval(checkUrlChange, 10000);
}

// Pin tile button used on the user page
var pinTileButton = document.createElement("div");
pinTileButton.className = "button-group__item";
pinTileButton.innerHTML = '<button class="btn btn-black btn-small pintile-button" style="min-width: 240px;">PIN TRANSPARENT TILE</button>';
pinTileButton.addEventListener("click", function () {
	external.notify("RPTT");
});

// Toggle dark AMOLED mode button
var darkModeButton = document.createElement("div");
darkModeButton.className = "button-group__item";
darkModeButton.innerHTML = '<button class="btn btn-black btn-small darkmode-button" style="min-width: 240px;">TOGGLE AMOLED DARK MODE</button>';
darkModeButton.addEventListener("click", function () {
	if (localStorage.getItem("amoledDarkMode"))
		localStorage.removeItem("amoledDarkMode");
	else
		localStorage.setItem("amoledDarkMode", "true");

	applyDarkMode();
});

function applyDarkMode() {
	if (localStorage.getItem("amoledDarkMode")) {
		document.body.className += " amoledDarkMode";
	} else {
		document.body.className = document.body.className.replace("amoledDarkMode", "");
	}
}

// Modify user (settings) page
function PopulateSettingsPage() {
    var menuItem = document.querySelectorAll(".main-view-container__content .button-group--vertical .button-group__item");
	if (menuItem.length >= 4) {
		menuItem[0].remove();
		menuItem[1].remove();
		menuItem[2].remove();
	}

	if (document.getElementsByClassName(".pintile-button").length == 0) {
        document.querySelector(".main-view-container__content .button-group--vertical").appendChild(pinTileButton);
        document.querySelector(".main-view-container__content .button-group--vertical").appendChild(darkModeButton);
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

// Wait for the page to fully load ( check for user info - it's the last element, that is loaded )
function WaitForLoad() {
    if (document.getElementsByClassName("sessionInfo").length == 0) {
        // Use compact player when not signed in
        document.getElementById("main").className = "compactPlayingBar";
        window.requestAnimationFrame(WaitForLoad);
    }
	else
		InjectCustomLayout();
}
WaitForLoad();

// Wait until media controls are loaded
function WaitForMediaBar() {
	if (document.getElementsByClassName("now-playing").legnth == 0)
		window.requestAnimationFrame(WaitForMediaBar);
	else
		InjectSystemMediaControl();
}
WaitForMediaBar();
