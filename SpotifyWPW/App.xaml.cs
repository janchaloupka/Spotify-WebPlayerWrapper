using Windows.ApplicationModel.Activation;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace SpotifyWPW
{
	// ReSharper disable once UnusedMember.Global
	public sealed partial class App
	{
		public App()
		{
			InitializeComponent();
		}

		protected override void OnLaunched(LaunchActivatedEventArgs e)
		{
			if (!(Window.Current.Content is Frame rootFrame))
			{
				rootFrame = new Frame();
				Window.Current.Content = rootFrame;
			}

			if (e.PrelaunchActivated) return;

			if (rootFrame.Content == null)
				rootFrame.Navigate(typeof(MainPage), e.Arguments);

			Window.Current.Activate();
		}
	}
}
