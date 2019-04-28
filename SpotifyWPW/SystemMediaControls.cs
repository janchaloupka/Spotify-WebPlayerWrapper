using System;
using Windows.Media;
using Windows.UI.Core;
using Windows.UI.Xaml.Controls;

namespace SpotifyWPW
{
	public class SystemMediaControls
	{
		private readonly WebView WebPlayer;
		private readonly SystemMediaTransportControls MediaControls;
		private readonly CoreDispatcher Dispatcher;

		/// <summary>
		/// Write-only - sets whether the play/pause button is enabled
		/// </summary>
		public bool PlayButtonEnabled {
			set
			{
				MediaControls.IsPauseEnabled = value;
				MediaControls.IsPlayEnabled = value;
			}
		}

		/// <summary>
		/// Write-only - sets whether the previous song button is enabled
		/// </summary>
		public bool PrevButtonEnabled
		{
			set => MediaControls.IsPreviousEnabled = value;
		}

		/// <summary>
		/// Write-only - sets whether the next song button is enabled
		/// </summary>
		public bool NextButtonEnabled
		{
			set => MediaControls.IsNextEnabled = value;
		}

		/// <summary>
		/// Write-only - sets if the song is currently playing
		/// </summary>
		public bool IsPlaying
		{
			set => MediaControls.PlaybackStatus = value ? MediaPlaybackStatus.Playing : MediaPlaybackStatus.Paused;
		}

		public SystemMediaControls(WebView webPlayerContainer, CoreDispatcher dispatcher)
		{
			WebPlayer = webPlayerContainer;

			// Enable and register the application to the system media controls
			MediaControls = SystemMediaTransportControls.GetForCurrentView();
			MediaControls.IsEnabled = true;
			MediaControls.ButtonPressed += MediaControlsButtonPressed;
			MediaControls.DisplayUpdater.Type = MediaPlaybackType.Music;
			MediaControls.DisplayUpdater.Update();
			Dispatcher = dispatcher;
		}

		/// <summary>
		/// Send media button input to the web player
		/// Valid button names: play, prev, next
		/// </summary>
		public async void SendMediaControlsButtonPress(string button)
		{
			await WebPlayer.InvokeScriptAsync("SystemMediaControlsOnClick", new[] { button });
		}

		/// <summary>
		/// Update system media UI with new song name and artist name
		/// </summary>
		/// <param name="songName">Name of the current song</param>
		/// <param name="artistName">Current song artist name(s)</param>
		public void UpdateSongInfo(string songName, string artistName)
		{
			MediaControls.DisplayUpdater.MusicProperties.Title = songName;
			MediaControls.DisplayUpdater.MusicProperties.Artist = artistName;
			MediaControls.DisplayUpdater.Update();
		}

		/// <summary>
		/// Listen for the system media button press
		/// </summary>
		private async void MediaControlsButtonPressed(SystemMediaTransportControls sender, SystemMediaTransportControlsButtonPressedEventArgs args)
		{
			// ReSharper disable once SwitchStatementMissingSomeCases
			switch (args.Button)
			{
				case SystemMediaTransportControlsButton.Pause:
				case SystemMediaTransportControlsButton.Play:
					await Dispatcher.RunAsync(CoreDispatcherPriority.Normal,
						() => SendMediaControlsButtonPress("play"));
					break;
				case SystemMediaTransportControlsButton.Previous:
					await Dispatcher.RunAsync(CoreDispatcherPriority.Normal,
						() => SendMediaControlsButtonPress("prev"));
					break;
				case SystemMediaTransportControlsButton.Next:
					await Dispatcher.RunAsync(CoreDispatcherPriority.Normal,
						() => SendMediaControlsButtonPress("next"));
					break;
			}
		}
	}
}
