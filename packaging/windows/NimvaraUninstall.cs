using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyTitle("Nimvara Uninstall")]
[assembly: System.Reflection.AssemblyVersion("0.7.0.0")]

internal static class NimvaraUninstall
{
    [STAThread]
    private static void Main(string[] args)
    {
        bool quiet = Array.Exists(args, delegate(string value) { return value.Equals("/quiet", StringComparison.OrdinalIgnoreCase); });
        if (!quiet && MessageBox.Show(
            "Remove the Nimvara application?\n\nYour workspaces, backups, and Nimvara user settings will not be deleted.",
            "Uninstall Nimvara", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        try
        {
            string installRoot = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
            foreach (Process process in Process.GetProcessesByName("Nimvara"))
            {
                try
                {
                    process.CloseMainWindow();
                    if (!process.WaitForExit(3000)) process.Kill();
                }
                catch { }
            }
            string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            string startMenu = Path.Combine(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Nimvara");
            string desktop = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Nimvara.lnk");
            if (Directory.Exists(startMenu)) Directory.Delete(startMenu, true);
            if (File.Exists(desktop)) File.Delete(desktop);
            Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Nimvara", false);
            string command = "Start-Sleep -Seconds 2; Remove-Item -LiteralPath '" + installRoot.Replace("'", "''") + "' -Recurse -Force";
            ProcessStartInfo cleanup = new ProcessStartInfo("powershell.exe", "-NoProfile -WindowStyle Hidden -Command \"" + command.Replace("\"", "\\\"") + "\"");
            cleanup.UseShellExecute = false;
            cleanup.CreateNoWindow = true;
            Process.Start(cleanup);
            if (!quiet) MessageBox.Show("Nimvara was removed. Your workspaces and backups were preserved.", "Nimvara", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        catch (Exception error)
        {
            if (!quiet) MessageBox.Show(error.Message, "Uninstall failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.ExitCode = 1;
        }
    }
}
