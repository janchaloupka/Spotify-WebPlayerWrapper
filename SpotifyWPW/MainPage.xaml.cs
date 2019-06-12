using System;
using System.Diagnostics;
using System.IO;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.Web.Http;
using Windows.Web;
using Windows.Foundation.Metadata;
using Windows.UI.ViewManagement;

namespace SpotifyWPW
{
	public sealed partial class MainPage
	{
		private const string DesktopUserAgent =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134";

		private const string InitialWebPlayerUrl =
			"https://accounts.spotify.com/login/?continue=https:%2F%2Fopen.spotify.com";

		private readonly SystemMediaControls SystemMediaControls;

		public MainPage()
		{
			InitializeComponent();

			// Enable back button and react to navigation request
			var navManager = SystemNavigationManager.GetForCurrentView();
			navManager.AppViewBackButtonVisibility = AppViewBackButtonVisibility.Visible;
			navManager.BackRequested += NavigationBackRequested;

			// Enable system media controls
			SystemMediaControls = new SystemMediaControls(WebPlayer, Dispatcher);

			// Main function to load the web player
			LoadWebPlayer();

			// Make top status bar transparent if the OS supports it
			if (!ApiInformation.IsTypePresent("Windows.UI.ViewManagement.StatusBar")) return;

			StatusBar.GetForCurrentView().BackgroundOpacity = 0;
			var currentAppView = ApplicationView.GetForCurrentView();
			Height = currentAppView.VisibleBounds.Bottom;
			VerticalAlignment = VerticalAlignment.Top;
			currentAppView.SetDesiredBoundsMode(ApplicationViewBoundsMode.UseCoreWindow);
			currentAppView.VisibleBoundsChanged += (sender, args) =>
			{
				Height = sender.VisibleBounds.Bottom;
			};
		}

		#region WebViewNavigation

		/// <summary>
		/// Is WebView page loaded using the desktop user-agent
		/// </summary>
		private bool DesktopVersionRequested;

		/// <summary>
		/// Is WebView navigation invoked by navigation back event
		/// </summary>
		private bool InvokedByBackEvent;

		/// <summary>
		/// Back button event raised.
		/// UWP WebView native back function doesn't respect history.pushState so this
		/// event is sent to the WebView as JS command using the InvokeScript method
		/// </summary>
		private async void NavigationBackRequested(object sender, BackRequestedEventArgs e)
		{
			if (!WebPlayer.CanGoBack) return;
			e.Handled = true;

			InvokedByBackEvent = true;
			await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, async () =>
				await WebPlayer.InvokeScriptAsync("eval", new [] { "history.back();" }));
		}

		private void LoadWebPlayer()
		{
			// Load sign up page, if user is already logged the page will automatically redirect to the player
			LoadAsDesktop(new Uri(InitialWebPlayerUrl));
		}

		private void LoadAsDesktop(Uri original)
		{
			var httpRequest = new HttpRequestMessage(HttpMethod.Get, original);
			httpRequest.Headers.Add("User-Agent", DesktopUserAgent);
#if DEBUG
			// Force english UI language
			httpRequest.Headers.Add("Accept-Language", "en-US");
#endif
			DesktopVersionRequested = true;
			WebPlayer.NavigateWithHttpRequestMessage(httpRequest);
		}

		public void NavigationStarting(WebView sender, WebViewNavigationStartingEventArgs args)
		{
			// ReSharper disable once SwitchStatementMissingSomeCases
			switch (args.Uri.Host)
			{
				case "www.spotify.com" when args.Uri.AbsolutePath == "/":
					args.Cancel = true;
					break;
				// If WebView is trying to load open.spotify.com change user agent to desktop browser
				case "open.spotify.com" when !DesktopVersionRequested && !InvokedByBackEvent:
					args.Cancel = true;
					LoadAsDesktop(args.Uri);
					return;
			}

			DesktopVersionRequested = false;
		}

		public async void NavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs args)
		{
			if (!args.IsSuccess && args.WebErrorStatus == WebErrorStatus.NotFound)
			{
				// No internet connection, inform user and close the app
				NoInternetDialog.Show();
				return;
			}
			
			// Hide the splash screen
			ExtendedSplashScreen.Visibility = Visibility.Collapsed;

			try
			{
				if (!InvokedByBackEvent && sender.Source.Host == "open.spotify.com")
				{
					// Inject custom script file

					await sender.InvokeScriptAsync("eval", new[] { File.ReadAllText("WebPlayer/script.js") });
				}
				InvokedByBackEvent = false;
			}
			catch (Exception)
			{
				// TO-never-DO catch
			}

			GC.Collect();
		}

		#endregion

		/// <summary>
		/// Receive control messages from the web player
		/// </summary>
		public async void ScriptNotify(object sender, NotifyEventArgs e)
		{
			var data = e.Value.Split('\n');

			switch (data[0])
			{
				// Custom styles are ready to be loaded
				case "LoadCustomStyles":
					await WebPlayer.InvokeScriptAsync("AppendCustomStyle", new[] { File.ReadAllText("WebPlayer/Style/Player.min.css")});
					break;
				// Song info change
				case "SystemMediaControlsSong":
					if (data.Length < 3) return;
					SystemMediaControls.UpdateSongInfo(data[1], data[2]);
					break;
				// Media control buttons change
				case "SystemMediaControlsButtons":
					if (data.Length < 5) return;
					SystemMediaControls.PrevButtonEnabled = data[1] == "true";
					SystemMediaControls.NextButtonEnabled = data[2] == "true";
					SystemMediaControls.PlayButtonEnabled = data[3] == "true";
					SystemMediaControls.IsPlaying = data[4] == "true";
					break;
				// Transparent tile pin request
				case "RequestPinTransparentTile":
					TransparentTile.PinRequest();
					break;
				// Load default web player page
				case "RequestReloadWebPlayer":
					LoadWebPlayer();
					break;
				default:
					Debug.WriteLine($"Unknown web player message: {e.Value}");
					break;
			}
		}
	}
}
