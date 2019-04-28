using System;
using Windows.UI;
using Windows.UI.StartScreen;
using Windows.UI.Xaml.Controls;

namespace SpotifyWPW
{
	public class TransparentTile
	{
		/// <summary>
		/// Transparent tile identification string
		/// </summary>
		public const string TileName = "TransparentTile";

		/// <summary>
		/// Read-only value returns whether the tile is already pinned 
		/// </summary>
		public static bool IsPinned => SecondaryTile.Exists(TileName);

		/// <summary>
		/// Try to pin secondary transparent tile on the start menu  
		/// </summary>
		public static async void PinRequest()
		{
			if (IsPinned)
			{
				ShowAlreadyPinnedDialog();
				return;
			}

			var tile = new SecondaryTile(TileName);
			tile.VisualElements.Square71x71Logo = new Uri("ms-appx:///Assets/TileSmall.png");
			tile.VisualElements.Square150x150Logo = new Uri("ms-appx:///Assets/TileMedium.png");
			tile.DisplayName = "";
			tile.VisualElements.ShowNameOnSquare150x150Logo = false;
			tile.VisualElements.BackgroundColor = Colors.Transparent;
			tile.Arguments = "/MainPage.xaml";
			await tile.RequestCreateAsync();
		}

		/// <summary>
		/// Inform user that the transparent tile is already pinned on the start screen
		/// </summary>
		private static async void ShowAlreadyPinnedDialog()
		{
			var alreadyPinned = new ContentDialog
			{
				Title = "Already pinned",
				Content = "Transparent tile is already pinned.",
				PrimaryButtonText = "Ok"
			};

			await alreadyPinned.ShowAsync();
		}
	}
}
