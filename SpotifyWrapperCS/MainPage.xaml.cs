using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.ApplicationModel.Core;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.Media;
using Windows.Media.Playback;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using Windows.Web.Http;
using Windows.UI.StartScreen;
using Windows.UI;
using Windows.Web;

// Dokumentaci k šabloně položky Prázdná stránka najdete na adrese https://go.microsoft.com/fwlink/?LinkId=402352&clcid=0x405

namespace SpotifyWrapperCS
{
	/// <summary>
    /// Prázdná stránka, která se dá použít samostatně nebo v rámci objektu Frame
    /// </summary>
    public sealed partial class MainPage : Page
    {
		SystemMediaTransportControls MediaControls;
		SystemMediaTransportControlsDisplayUpdater MediaDisplayUpdater;

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

			LoadWebPlayer();
		}

		private void Page_Loaded(object sender, RoutedEventArgs e)
		{
			
		}

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

		private void SystemNavigationManager_BackRequested(object sender, BackRequestedEventArgs e)
		{
			if (WebPlayer.CanGoBack)
			{
				e.Handled = true;

				if (WebPlayer.CanGoBack)
				{
					_isBackEvent = true;
					WebPlayer.GoBack();
				}
			}
		}

		private void LoadWebPlayer()
		{
			LoadAsDesktop(new Uri("https://open.spotify.com/browse/featured"));
		}

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
			//Debug.WriteLine(args.Uri);
			if (args.Uri.Host == "www.spotify.com" && !args.Uri.AbsolutePath.Contains("signup") && sender.Source.Host != "www.facebook.com")
			{
				args.Cancel = true;

				if(sender.Source.Host != "open.spotify.com")
				{
					LoadWebPlayer();
				}
			}
			else if (!_desktopFlag && !_isBackEvent)
			{
				args.Cancel = true;
				LoadAsDesktop(args.Uri);
			}
			else
			{
				_desktopFlag = false;
			}
		}

		bool _isBackEvent = false;
		private async void WebPlayer_NavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs args)
		{
			Debug.WriteLine("Attempt: " + args.Uri.ToString());
			if (!args.IsSuccess && args.WebErrorStatus == WebErrorStatus.NotFound)
			{
				ContentDialog noWifiDialog = new ContentDialog
				{
					Title = "Failed to load",
					Content = "Check your connection and try again.",
					CloseButtonText = "Close app"
				};

				noWifiDialog.Closed += NoWifiDialog_Closed;
				ContentDialogResult result = await noWifiDialog.ShowAsync();
			}
			else
			{
				ExtendedSplashScreen.Visibility = Visibility.Collapsed;
				try
				{
					if (!_isBackEvent && sender.Source.Host == "open.spotify.com")
						await sender.InvokeScriptAsync("eval", new string[] { File.ReadAllText("Player/script.js") });
					_isBackEvent = false;
				}
				catch (Exception)
				{
					// TODO catch
				}
			}

			GC.Collect();
		}

		private void NoWifiDialog_Closed(ContentDialog sender, ContentDialogClosedEventArgs args)
		{
			CoreApplication.Exit();
		}

		private async void WebPlayer_ScriptNotify(object sender, NotifyEventArgs e)
		{
			string[] data = e.Value.Split('\n');
			if(data[0] == "SMCI")
			{ // Informace o songu
				MediaDisplayUpdater.MusicProperties.Title = data[1];
				MediaDisplayUpdater.MusicProperties.Artist = data[2];
				MediaDisplayUpdater.Update();
			}
			else if(data[0] == "SMCB")
			{ // Infomace o ovládacích prvcích
				MediaControls.IsPreviousEnabled = data[1][0] == '1';
				MediaControls.IsNextEnabled = data[1][1] == '1';
				MediaControls.IsPlayEnabled = MediaControls.IsPauseEnabled = data[1][2] == '1';
				MediaControls.PlaybackStatus = data[1][3] == '1' ? MediaPlaybackStatus.Paused : MediaPlaybackStatus.Playing;
			}
			else if(data[0] == "RPTT")
			{ // Požadavek na připnutí průhledné dlaždice
				Debug.WriteLine("Request pin");
				if (!SecondaryTile.Exists("transparentTile")){
					SecondaryTile transparentTile = new SecondaryTile("transparentTile");
					transparentTile.VisualElements.Square71x71Logo = new Uri("ms-appx:///Assets/TileSmall.png");
					transparentTile.VisualElements.Square150x150Logo = new Uri("ms-appx:///Assets/TileMedium.png");
					transparentTile.DisplayName = "Spotify";
					transparentTile.VisualElements.ShowNameOnSquare150x150Logo = true;
					transparentTile.VisualElements.BackgroundColor = Colors.Transparent;
					transparentTile.Arguments = "/MainPage.xaml";
					await transparentTile.RequestCreateAsync();
				}
				else
				{
					ContentDialog alreadyPinned = new ContentDialog
					{
						Title = "Already pinned",
						Content = "Transparent tile is already pinned.",
						CloseButtonText = "Ok"
					};

					await alreadyPinned.ShowAsync();
				}
			}
		}
	}
}
