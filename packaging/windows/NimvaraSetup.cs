using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Nimvara Setup")]
[assembly: AssemblyDescription("Per-user installer for Nimvara")]
[assembly: AssemblyCompany("Nimvara Development")]
[assembly: AssemblyProduct("Nimvara")]
[assembly: AssemblyVersion("0.7.0.0")]
[assembly: AssemblyFileVersion("0.7.0.0")]

internal static class NimvaraSetup
{
    private const string Version = "0.7.0-dev";

    [STAThread]
    private static void Main(string[] args)
    {
        bool quiet = Array.Exists(args, delegate(string value) { return value.Equals("/quiet", StringComparison.OrdinalIgnoreCase); });
        bool desktop = false;
        if (!quiet)
        {
            DialogResult result = MessageBox.Show(
                "Install Nimvara " + Version + " for this Windows user?\n\nNo administrator rights or separate Node installation are required.\n\nSelect Yes to also create a desktop shortcut. Select No to install with a Start Menu shortcut only.",
                "Nimvara Setup", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Information);
            if (result == DialogResult.Cancel) return;
            desktop = result == DialogResult.Yes;
        }
        try
        {
            Install(desktop);
            if (!quiet) MessageBox.Show(
                "Nimvara was installed. Open it from the Start Menu.\n\nThis development build is unsigned and may trigger Microsoft SmartScreen.",
                "Nimvara Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        catch (Exception error)
        {
            if (!quiet) MessageBox.Show(error.ToString(), "Nimvara installation failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.ExitCode = 1;
        }
    }

    private static void Install(bool createDesktop)
    {
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string roaming = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string programs = Path.Combine(local, "Programs");
        string installRoot = Path.Combine(programs, "Nimvara");
        string newRoot = Path.Combine(programs, "Nimvara.new");
        string oldRoot = Path.Combine(programs, "Nimvara.old");
        Directory.CreateDirectory(programs);
        DeleteDirectory(newRoot);
        Directory.CreateDirectory(newRoot);

        string tempZip = Path.Combine(Path.GetTempPath(), "nimvara-payload-" + Guid.NewGuid().ToString("N") + ".zip");
        using (Stream resource = Assembly.GetExecutingAssembly().GetManifestResourceStream("nimvara.payload.zip"))
        {
            if (resource == null) throw new InvalidOperationException("Installer payload is missing.");
            using (FileStream output = File.Create(tempZip)) resource.CopyTo(output);
        }
        try { ZipFile.ExtractToDirectory(tempZip, newRoot); }
        finally { if (File.Exists(tempZip)) File.Delete(tempZip); }

        if (!File.Exists(Path.Combine(newRoot, "Nimvara.exe")) ||
            !File.Exists(Path.Combine(newRoot, "resources", "app", "sample-workspace", "Welcome to Nimvara.md")))
            throw new InvalidDataException("Installer payload verification failed.");

        DeleteDirectory(oldRoot);
        if (Directory.Exists(installRoot)) Directory.Move(installRoot, oldRoot);
        try
        {
            Directory.Move(newRoot, installRoot);
            DeleteDirectory(oldRoot);
        }
        catch
        {
            DeleteDirectory(installRoot);
            if (Directory.Exists(oldRoot)) Directory.Move(oldRoot, installRoot);
            throw;
        }

        string startMenu = Path.Combine(roaming, "Microsoft", "Windows", "Start Menu", "Programs", "Nimvara");
        Directory.CreateDirectory(startMenu);
        CreateShortcut(Path.Combine(startMenu, "Nimvara.lnk"), Path.Combine(installRoot, "Nimvara.exe"), installRoot, "Nimvara " + Version);
        CreateShortcut(Path.Combine(startMenu, "Uninstall Nimvara.lnk"), Path.Combine(installRoot, "NimvaraUninstall.exe"), installRoot, "Uninstall Nimvara");
        if (createDesktop)
            CreateShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Nimvara.lnk"), Path.Combine(installRoot, "Nimvara.exe"), installRoot, "Nimvara " + Version);

        using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Nimvara"))
        {
            key.SetValue("DisplayName", "Nimvara");
            key.SetValue("DisplayVersion", Version);
            key.SetValue("Publisher", "Nimvara Development");
            key.SetValue("InstallLocation", installRoot);
            key.SetValue("UninstallString", "\"" + Path.Combine(installRoot, "NimvaraUninstall.exe") + "\"");
            key.SetValue("NoModify", 1, RegistryValueKind.DWord);
            key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
        }
        RemoveLegacyLantern(programs, roaming);
    }

    private static void RemoveLegacyLantern(string programs, string roaming)
    {
        string legacyRoot = Path.Combine(programs, "Lantern");
        string legacyExe = Path.Combine(legacyRoot, "Lantern.exe");
        if (File.Exists(legacyExe))
        {
            FileVersionInfo version = FileVersionInfo.GetVersionInfo(legacyExe);
            if (String.Equals(version.ProductName, "Lantern", StringComparison.OrdinalIgnoreCase))
            {
                foreach (Process process in Process.GetProcessesByName("Lantern"))
                {
                    try
                    {
                        process.CloseMainWindow();
                        if (!process.WaitForExit(3000)) process.Kill();
                    }
                    catch { }
                }
                DeleteDirectory(legacyRoot);
            }
        }
        string legacyMenu = Path.Combine(roaming, "Microsoft", "Windows", "Start Menu", "Programs", "Lantern");
        if (Directory.Exists(legacyMenu)) Directory.Delete(legacyMenu, true);
        string legacyDesktop = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Lantern.lnk");
        if (File.Exists(legacyDesktop)) File.Delete(legacyDesktop);
        Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\Lantern", false);
    }

    private static void DeleteDirectory(string path)
    {
        if (Directory.Exists(path)) Directory.Delete(path, true);
    }

    private static void CreateShortcut(string shortcutPath, string target, string workingDirectory, string description)
    {
        Type type = Type.GetTypeFromProgID("WScript.Shell");
        dynamic shell = Activator.CreateInstance(type);
        dynamic shortcut = shell.CreateShortcut(shortcutPath);
        shortcut.TargetPath = target;
        shortcut.WorkingDirectory = workingDirectory;
        shortcut.Description = description;
        shortcut.Save();
    }
}
