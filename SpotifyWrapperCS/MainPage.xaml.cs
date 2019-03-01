using System;
using System.Diagnostics;
using System.IO;
using Windows.ApplicationModel.Core;
using Windows.Media;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.Web.Http;
using Windows.UI.StartScreen;
using Windows.UI;
using Windows.Web;
using Windows.Foundation.Metadata;
using Windows.UI.ViewManagement;

namespace SpotifyWrapperCS
{
	 public sealed partial class MainPage : Page
    {
		SystemMediaTransportControls MediaControls;
		SystemMediaTransportControlsDisplayUpdater MediaDisplayUpdater;
		ContentDialog noWifiDialog;

		public MainPage()
		{
			this.InitializeComponent();
			SystemNavigationManager.GetForCurrentView().BackRequested += SystemNavigationManager_BackRequested;

			MediaControls = SystemMediaTransportControls.GetForCurrentView();
			MediaDisplayUpdater = MediaControls.DisplayUpdater;

			MediaControls.IsEnabled = true;
			MediaControls.ButtonPressed += MediaControls_ButtonPressed;
			MediaDisplayUpdater.Type = MediaPlaybackType.Music;
			MediaDisplayUpdater.Update();

			// Main function to load web player
			LoadWebPlayer();

			noWifiDialog = new ContentDialog
			{
				Title = "Failed to load",
				Content = "Check your connection and try again.",
				PrimaryButtonText = "Close app"
			};

			noWifiDialog.Closed += NoWifiDialog_Closed;

			// Make StatusBar transparent 
			if (ApiInformation.IsTypePresent("Windows.UI.ViewManagement.StatusBar"))
			{
				StatusBar.GetForCurrentView().BackgroundOpacity = 0;
				ApplicationView.GetForCurrentView().SetDesiredBoundsMode(ApplicationViewBoundsMode.UseCoreWindow);

				TopPage.Height = ApplicationView.GetForCurrentView().VisibleBounds.Bottom;
				TopPage.VerticalAlignment = VerticalAlignment.Top;
				ApplicationView.GetForCurrentView().VisibleBoundsChanged += MainPage_VisibleBoundsChanged;
			}
		}

		// Resize app on screen size change
		private void MainPage_VisibleBoundsChanged(ApplicationView sender, object args)
		{
			TopPage.Height = ApplicationView.GetForCurrentView().VisibleBounds.Bottom;
		}

		// Send media buttons input to the web player
		private async void MediaControls_ButtonPressed(SystemMediaTransportControls sender, SystemMediaTransportControlsButtonPressedEventArgs args)
		{
			switch (args.Button)
			{
				case SystemMediaTransportControlsButton.Pause:
				case SystemMediaTransportControlsButton.Play:
					await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () => { WebPlayer.InvokeScriptAsync("SystemMediaControlEvent", new string[] { "play" }); });
					break;
				case SystemMediaTransportControlsButton.Previous:
					await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () => { WebPlayer.InvokeScriptAsync("SystemMediaControlEvent", new string[] { "prev" }); });
					break;
				case SystemMediaTransportControlsButton.Next:
					await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () => { WebPlayer.InvokeScriptAsync("SystemMediaControlEvent", new string[] { "next" }); });
					break;
			}

			}

		// Back button event
		private async void SystemNavigationManager_BackRequested(object sender, BackRequestedEventArgs e)
		{
			if (WebPlayer.CanGoBack)
			{
				e.Handled = true;

				if (WebPlayer.CanGoBack)
				{
					_isBackEvent = true;
					//WebPlayer.GoBack();
					await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () => { WebPlayer.InvokeScriptAsync("eval", new string[] { "history.back();" }); });
				}
			}
		}

		private void LoadWebPlayer()
		{
			// Load signup page, if user is already logged the page will automatically redirect to the player
			LoadAsDesktop(new Uri("https://accounts.spotify.com/en/login/?continue=https:%2F%2Fopen.spotify.com"));
		}

		// Changes user-agent to desktop msedge
		private bool _desktopFlag = false;
		private void LoadAsDesktop(Uri original)
		{
			HttpRequestMessage httpRequest = new HttpRequestMessage(HttpMethod.Get, original);
			var add = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134";
			httpRequest.Headers.Add("User-Agent", add);
			//httpRequest.Headers.Add("Accept-Language", "en-US");
			_desktopFlag = true;
			WebPlayer.NavigateWithHttpRequestMessage(httpRequest);
		}

		private void WebPlayer_NavigationStarting(WebView sender, WebViewNavigationStartingEventArgs args)
		{
			Debug.WriteLine(args.Uri);

			if (args.Uri.Host == "www.spotify.com" && args.Uri.AbsolutePath == "/"){
				args.Cancel = true;
			}

			// If webview is trying to load open.spotify.com change user agent to desktop browser
			if (args.Uri.Host == "open.spotify.com" && !_desktopFlag && !_isBackEvent)
			{
				args.Cancel = true;
				LoadAsDesktop(args.Uri);
				return;
			}

			_desktopFlag = false;
			
		}

		bool _isBackEvent = false;
		private async void WebPlayer_NavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs args)
		{
			if (!args.IsSuccess && args.WebErrorStatus == WebErrorStatus.NotFound)
			{ 
				ContentDialogResult result = await noWifiDialog.ShowAsync();
			}
			else
			{
				// Hide splash screen
				ExtendedSplashScreen.Visibility = Visibility.Collapsed;
				try
				{
					if (!_isBackEvent && sender.Source.Host == "open.spotify.com")
						// Inject custon script file
						await sender.InvokeScriptAsync("eval", new string[] { File.ReadAllText("Player/script.js") });
					_isBackEvent = false;
				}
				catch (Exception)
				{
					// TO-never-DO catch
				}
			}

			GC.Collect();
		}

		private void NoWifiDialog_Closed(ContentDialog sender, ContentDialogClosedEventArgs args)
		{
			CoreApplication.Exit();
		}

		// Receive control messages from web player
		private async void WebPlayer_ScriptNotify(object sender, NotifyEventArgs e)
		{
			string[] data = e.Value.Split('\n');
			if(data[0] == "SMCI")
			{ // Song info
				MediaDisplayUpdater.MusicProperties.Title = data[1];
				MediaDisplayUpdater.MusicProperties.Artist = data[2];
				MediaDisplayUpdater.Update();
			}
			else if(data[0] == "SMCB")
			{ // Media control buttons change
				MediaControls.IsPreviousEnabled = data[1][0] == '1';
				MediaControls.IsNextEnabled = data[1][1] == '1';
				MediaControls.IsPlayEnabled = MediaControls.IsPauseEnabled = data[1][2] == '1';
				MediaControls.PlaybackStatus = data[1][3] == '1' ? MediaPlaybackStatus.Paused : MediaPlaybackStatus.Playing;
			}
			else if(data[0] == "RPTT")
			{ // Transparent tile pin request
				Debug.WriteLine("Request pin");
				if (!SecondaryTile.Exists("transparentTile")){
					SecondaryTile transparentTile = new SecondaryTile("transparentTile");
					transparentTile.VisualElements.Square71x71Logo = new Uri("ms-appx:///Assets/TileSmall.png");
					transparentTile.VisualElements.Square150x150Logo = new Uri("ms-appx:///Assets/TileMedium.png");
					transparentTile.DisplayName = "";
					transparentTile.VisualElements.ShowNameOnSquare150x150Logo = false;
					transparentTile.VisualElements.BackgroundColor = Colors.Transparent;
					transparentTile.Arguments = "/MainPage.xaml";
					await transparentTile.RequestCreateAsync();
				}
				else
				{ // Tranpsarent tile is already pinned
					ContentDialog alreadyPinned = new ContentDialog
					{
						Title = "Already pinned",
						Content = "Transparent tile is already pinned.",
						PrimaryButtonText = "Ok"
					};

					await alreadyPinned.ShowAsync();
				}
			}
		}
	}
}
