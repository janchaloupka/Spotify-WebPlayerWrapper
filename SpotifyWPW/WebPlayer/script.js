const HIDE_NOW_PLAYING_VIEW = "nowPlayingViewHidden";
const SHOW_SETTINGS_BUTTON = "sessionInfoShow";
const DARK_MODE = "amoledDarkMode";
// ReSharper disable RedundantLocalFunctionName

/**
 * Check if the webplayer is loaded correctly
 */
(function isLoadedCorrectly() {
	if (window.location.hostname !== "open.spotify.com") return;

	const playerFeatures = document.getElementById("features");

	// PlayerFeatures element does not exist, something is definitely wrong
	if (!playerFeatures) {
		sendReloadRequest();
		return;
	}

	const jsonFeatures = JSON.parse(playerFeatures.innerText);

	// User is not logged in
	if (!jsonFeatures || jsonFeatures["isAnonymous"]) sendReloadRequest();

	function sendReloadRequest() {
		// ReSharper disable once PossiblyUnassignedProperty
		external.notify("RequestReloadWebPlayer");
	}
})();

/**
 * Append and apply CSS content
 * 
 * @param {string} cssContent
 *	String of CSS rules to be applied
 */
function AppendCustomStyle(cssContent) {
	const styleElement = document.createElement("style");
	styleElement.appendChild(document.createTextNode(cssContent));
	document.head.appendChild(styleElement);
}

/**
 * Request custom styles load and enable mobile mode
 */
(function customStyles() {
	// Enable mobile mode
	const metaViewport = document.createElement("meta");
	metaViewport.name = "viewport";
	metaViewport.content = "width=device-width;initial-scale=1";
	document.head.appendChild(metaViewport);

	// Request CSS load
	external.notify("LoadCustomStyles");
})();


/**
 * Handle view change
 */
(function reactToViewChange() {
	var lastUrl = location.pathname;

	// Navigation event
	function viewChangeEvent() {
		// URL changed, hide now playing view
		if (location.pathname !== lastUrl) {
			lastUrl = location.pathname;
			document.body.classList.add(HIDE_NOW_PLAYING_VIEW);
		}

		// Show settings button on the library view
		if (document.location.pathname.indexOf("/collection/") >= 0 || document.location.pathname.indexOf("/made-for-you") >= 0) {
			document.body.classList.add(SHOW_SETTINGS_BUTTON);
		} else {
			document.body.classList.remove(SHOW_SETTINGS_BUTTON);
		}

		// Modify settings view
		if (document.location.pathname.indexOf("/settings/account") >= 0) {
			SettingsPageModify();
		}
	}

	// Modify the native back function so that it works with fullscreen playing view
	history.back = function () {
		// Connect device list is opened
		if (document.getElementsByClassName("connect-device-list-container--is-visible").length > 0) {
			document.body.click();
			return;
		}

		// Context menu is opened
		if (document.getElementsByClassName("react-contextmenu--visible").length > 0) {
			// Close by sending custom fake mouse click to the html body
			const clickEvent = document.createEvent("MouseEvents");
			clickEvent.initEvent("mousedown", true, true);
			document.body.dispatchEvent(clickEvent);
			return;
		}

		if (document.body.classList.contains(HIDE_NOW_PLAYING_VIEW)) {
			history.go(-1);
		} else {
			document.body.classList.add(HIDE_NOW_PLAYING_VIEW);
		}
	};

	// Fallback checks every 10s if url has changed
	function checkUrlChange() {
		if (location.pathname !== lastUrl) {
			lastUrl = location.pathname;
			document.body.classList.add(HIDE_NOW_PLAYING_VIEW);
		}
	}
	setInterval(checkUrlChange, 10000);

	// Listen for URL change
	function bindEvent() {
		if (document.getElementsByClassName("sessionInfo").length === 0) {
			requestAnimationFrame(bindEvent);
			return;
		}

		window.addEventListener("click", viewChangeEvent);
		window.addEventListener("popstate", viewChangeEvent);
		document.querySelector(".sessionInfo a").addEventListener("click", viewChangeEvent);
		document.querySelector(".Root").appendChild(document.querySelector(".sessionInfo"));
	}
	bindEvent();
})();


/**
 * Custom script and events for "now playing bar" and "fullscreen now playing view"
 */
(function nowPlayingView() {
	function applyCustomLayout() {
		const volumeBarElement = document.querySelector(".Root__now-playing-view .volume-bar");
		const connectListElement = document.querySelector(".Root__now-playing-view .connect-device-picker");
		const nowPlayingBarElement = document.querySelector(".Root__now-playing-bar");
		const rootElement = document.querySelector(".Root");

		// Wait until all required elements are loaded
		if (!connectListElement || !volumeBarElement || !nowPlayingBarElement || !rootElement) {
			requestAnimationFrame(applyCustomLayout);
			return;
		}

		// Move volume bar to the connect device section
		connectListElement.appendChild(volumeBarElement);

		setInterval(() => {
			if (!rootElement.classList.contains("is-connectBarVisible")) {
				// TODO Set volume to max when music is playing on this device
			}
		}, 10000);

		// Ugly hack - prevents application closing when user click on the back button when the now playing view is maximized
		history.pushState(null, "", "/browse/featured");

		// Start with now playing view hidden
		document.body.classList.add(HIDE_NOW_PLAYING_VIEW);

		// Button for maximizing the now playing view
		const maximizePlayingBar = document.createElement("div");
		maximizePlayingBar.className = "now-playing-bar-maximize control-button spoticon-x-16";
		maximizePlayingBar.addEventListener("click", function () {
			if (document.getElementsByClassName("connect-device-list-container--is-visible").length > 0) return;

			document.body.classList.toggle(HIDE_NOW_PLAYING_VIEW);
		});
		nowPlayingBarElement.appendChild(maximizePlayingBar);
	}
	applyCustomLayout();
})();


/**
 * Modify the settings page
 */
var SettingsPageModify;
(function settingsPage() {
	// Pin transparent tile button
	var pinTileButton = document.createElement("div");
	pinTileButton.className = "button-group__item";
	pinTileButton.innerHTML = '<button class="btn btn-black btn-small pin-tile-button" style="min-width: 240px;">PIN TRANSPARENT TILE</button>';
	pinTileButton.addEventListener("click", function () {
		// ReSharper disable once PossiblyUnassignedProperty
		external.notify("RequestPinTransparentTile");
	});

	// Dark mode button
	const darkModeButton = document.createElement("div");
	darkModeButton.className = "button-group__item";
	darkModeButton.innerHTML = '<button class="btn btn-black btn-small dark-mode-button" style="min-width: 240px;">TOGGLE DARK MODE</button>';
	darkModeButton.addEventListener("click", function () {
		if (localStorage.getItem(DARK_MODE))
			localStorage.removeItem(DARK_MODE);
		else
			localStorage.setItem(DARK_MODE, "true");

		applyDarkMode();
	});

	const darkModeInformation = document.createElement("p");
	darkModeInformation.innerText = "Change background to true black color. This saves battery on phones equipped with AMOLED screen.";

	const openSourceButton = document.createElement("div");
	openSourceButton.className = "button-group__item";
	openSourceButton.innerHTML = '<a class="btn btn-black btn-small" style="min-width: 240px;" href="https://github.com/janch32/Spotify-WebPlayerWrapper" target="_blank">GITHUB REPOSITORY</a>';

	const openSourceInformation = document.createElement("p");
	openSourceInformation.innerText = "Link where you can view source code, report bugs, make suggestions or contribute with your code to make this app even better.";

	// Enable dark mode if it's enabled
	function applyDarkMode() {
		if (localStorage.getItem(DARK_MODE)) {
			document.body.classList.add(DARK_MODE);
		} else {
			document.body.classList.remove(DARK_MODE);
		}
	}
	applyDarkMode();

	// Modify user (settings) page
	SettingsPageModify = function() {
		const buttonContainer = document.querySelector(".main-view-container__scroll-node .button-group--vertical");

		if (!buttonContainer || pinTileButton.parentNode === buttonContainer) return;

		if (buttonContainer.children.length > 2) {
			buttonContainer.removeChild(buttonContainer.children[1]);
			buttonContainer.removeChild(buttonContainer.children[1]);
		}

		// Register custom options
		buttonContainer.appendChild(pinTileButton);
		buttonContainer.appendChild(darkModeButton);
		buttonContainer.appendChild(darkModeInformation);
		buttonContainer.appendChild(openSourceButton);
		buttonContainer.appendChild(openSourceInformation);
	}
})();

/**
 * Modify context menu so it's mobile friendly
 */
(function contextMenu() {
	const closeContextMenu = document.createElement("div");
	closeContextMenu.className = "closeContextMenu";

	function appendCloseContextMenuElement() {
		const rootEl = document.getElementsByClassName("Root");

		if (rootEl.length > 0)
			rootEl[0].appendChild(closeContextMenu);
		else
			requestAnimationFrame(appendCloseContextMenuElement);
	}

	appendCloseContextMenuElement();

})();

/**
 * Interact with system media controls
 */
var SystemMediaControlsOnClick;
(function systemMediaControls() {
	// Receive media button event
	SystemMediaControlsOnClick = function(type) {
		switch (type) {
			case "play":
				document.querySelector(".player-controls .control-button--circled").click();
				break;
			case "prev":
				document.querySelector(".player-controls .spoticon-skip-back-16").click();
				break;
			case "next":
				document.querySelector(".player-controls .spoticon-skip-forward-16").click();
				break;
			default: return;
		}

		setTimeout(updateInfo, 500);
	}

	// Send information about button state and current song
	var previousTrack = "";
	var previousArtist = "";
	function updateInfo() {
		var buttonStatus = "SystemMediaControlsButtons\n";

		// Can skip back
		if (!document.querySelector(".player-controls .spoticon-skip-back-16.control-button--disabled"))
			buttonStatus += "true\n";
		else buttonStatus += "false\n";

		// Can skip forward
		if (!document.querySelector(".player-controls .spoticon-skip-forward-16.control-button--disabled"))
			buttonStatus += "true\n";
		else buttonStatus += "false\n";

		// Can play/pause
		if (!document.querySelector(".player-controls .control-button--circled.control-button--disabled"))
			buttonStatus += "true\n";
		else buttonStatus += "false\n";
			
		// Is playing
		if (!document.querySelector(".player-controls .spoticon-play-16"))
			buttonStatus += "true\n";
		else buttonStatus += "false\n";

		// Send button status
		// ReSharper disable once PossiblyUnassignedProperty
		external.notify(buttonStatus);


		// Send current song name and artist
		try {
			const track = document.querySelector(".now-playing .track-info__name").innerText;
			const artist = document.querySelector(".now-playing .track-info__artists").innerText;
			if (previousArtist !== artist || previousTrack !== artist) {
				// ReSharper disable once PossiblyUnassignedProperty
				external.notify(`SystemMediaControlsSong\n${track}\n${artist}`);
				previousTrack = track;
				previousArtist = artist;
			}
		} catch (e) {
			console.log("Failed to load song info");
		}
	}

	function inject() {
		// Wait until media controls are loaded
		if (document.getElementsByClassName("now-playing").length === 0) {
			requestAnimationFrame(inject);
			return;
		}

		// Refresh media info every two seconds
		setInterval(updateInfo, 2000);
	}
	inject();
})();


// Swipe down gesture on fullscreen now playing view
// Disabled because it's not smooth on lower-end devices
// TODO: Maybe later create option in settings to enable this feature
/*var NowPlayingView;
var MouseStart = -1;
var LastPos;

function StartMoveNowPlayingView(e) {
	var touch = e.touches[0];
	NowPlayingView.style.transition = "none";
	MouseStart = touch.screenY;
	LastPos = 0;
}

function MoveNowPlayingView(e) {
	var touch = e.touches[0];

	if (MouseStart >= 0) {
		if (touch.screenY > MouseStart) {
			LastPos = (touch.screenY - MouseStart) / devicePixelRatio;
		}

		NowPlayingView.style.transform = "translateY(" + LastPos + "px)";
		e.preventDefault();
	}
}

function EndMoveNowPlayingView(e) {
	NowPlayingView.style.transform = null;
	NowPlayingView.style.transition = null;
	MouseStart = -1;

	if (LastPos / window.innerHeight > 0.15) {
		document.body.classList.add(HIDE_NOW_PLAYING_VIEW);
	}
}

function RegisterNowPlayingView() {
	NowPlayingView = document.getElementsByClassName("NowPlayingView");

	if (NowPlayingView.length == 0) {
		window.requestAnimationFrame(RegisterNowPlayingView);
		return;
	} else NowPlayingView = NowPlayingView[0];

	NowPlayingView.addEventListener("touchstart", StartMoveNowPlayingView);
	document.addEventListener("touchmove", MoveNowPlayingView);
	document.addEventListener("touchend", EndMoveNowPlayingView);
}
RegisterNowPlayingView();*/