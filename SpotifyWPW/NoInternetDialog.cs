using System;
using Windows.ApplicationModel.Core;
using Windows.UI.Xaml.Controls;

namespace SpotifyWPW
{
	public class NoInternetDialog
	{
		/// <summary>
		/// Notify user that the application couldn't establish connection to the
		/// Spotify servers and close the app.
		/// </summary>
		public static async void Show()
		{
			var dialog = new ContentDialog
			{
				Title = "Connection issues",
				Content = "Could not connect to the Spotify servers. Check your connection and try again later.",
				PrimaryButtonText = "Close app"
			};

			// Exit the application when the dialog is closed
			dialog.Closed += (sender, args) => CoreApplication.Exit();

			await dialog.ShowAsync();
		}
	}

	
}
