using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.ApplicationModel;
using Windows.ApplicationModel.Activation;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

namespace SpotifyWrapperCS
{
    /// <summary>
    /// Poskytuje chování specifické pro aplikaci, které doplňuje výchozí třídu Application.
    /// </summary>
    sealed partial class App : Application
    {
        /// <summary>
        /// Inicializuje objekt aplikace typu singleton. Jedná se o první řádek spuštěného vytvořeného kódu,
        /// který je proto logickým ekvivalentem metod main() nebo WinMain().
        /// </summary>
        public App()
        {
            this.InitializeComponent();
            this.Suspending += OnSuspending;
        }

        /// <summary>
        /// Vyvolá se při normálním spuštění aplikace koncovým uživatelem. Ostatní vstupní body
        /// se použijí například při spuštění aplikace za účelem otevření konkrétního souboru.
        /// </summary>
        /// <param name="e">Podrobnosti o žádosti o spuštění a procesu</param>
        protected override void OnLaunched(LaunchActivatedEventArgs e)
        {
            Frame rootFrame = Window.Current.Content as Frame;

            // Neopakovat inicializaci aplikace, pokud už má okno obsah,
            // jenom ověřit, jestli je toto okno aktivní
            if (rootFrame == null)
            {
                // Vytvořit objekt Frame, který bude fungovat jako kontext navigace, a spustit procházení první stránky
                rootFrame = new Frame();

                rootFrame.NavigationFailed += OnNavigationFailed;

                if (e.PreviousExecutionState == ApplicationExecutionState.Terminated)
                {
                    //TODO: Načíst stav z dříve pozastavené aplikace
                }

                // Umístit rámec do aktuálního objektu Window
                Window.Current.Content = rootFrame;
            }

            if (e.PrelaunchActivated == false)
            {
                if (rootFrame.Content == null)
                {
                    // Pokud není navigační zásobník obnovený, přejít na první stránku
                    // a nakonfigurovat novou stránku předáním požadovaných informací ve formě
                    // parametru navigace
                    rootFrame.Navigate(typeof(MainPage), e.Arguments);
                }
                // Zkontrolovat, jestli je aktuální okno aktivní
                Window.Current.Activate();
            }
        }

        /// <summary>
        /// Vyvolá se, když selže přechod na určitou stránku.
        /// </summary>
        /// <param name="sender">Objekt Frame, u kterého selhala navigace</param>
        /// <param name="e">Podrobnosti o chybě navigace</param>
        void OnNavigationFailed(object sender, NavigationFailedEventArgs e)
        {
            throw new Exception("Failed to load Page " + e.SourcePageType.FullName);
        }

        /// <summary>
        /// Vyvolá se při pozastavení běhu aplikace. Stav aplikace se uloží
        /// bez informace, jestli se aplikace ukončí nebo obnoví s obsahem
        /// stále neporušené paměti.
        /// </summary>
        /// <param name="sender">Zdroj žádosti o pozastavení</param>
        /// <param name="e">Podrobnosti žádosti o pozastavení</param>
        private void OnSuspending(object sender, SuspendingEventArgs e)
        {
            var deferral = e.SuspendingOperation.GetDeferral();
            //TODO: Uložit stav aplikace a zastavit jakoukoliv aktivitu na pozadí
            deferral.Complete();
        }
    }
}
