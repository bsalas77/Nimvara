using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("Nimvara")]
[assembly: System.Reflection.AssemblyVersion("0.3.0.0")]
[assembly: System.Reflection.AssemblyFileVersion("0.3.0.0")]

internal static class NimvaraLauncher
{
    [STAThread]
    private static void Main()
    {
        try
        {
            string root = AppDomain.CurrentDomain.BaseDirectory;
            string node = Path.Combine(root, "runtime", "node.exe");
            string launcher = Path.Combine(root, "app", "server", "desktop-launcher.mjs");
            if (!File.Exists(node) || !File.Exists(launcher))
                throw new FileNotFoundException("Nimvara runtime files are missing.");
            ProcessStartInfo start = new ProcessStartInfo(node, "\"" + launcher + "\"");
            start.WorkingDirectory = root;
            start.UseShellExecute = false;
            start.CreateNoWindow = true;
            start.WindowStyle = ProcessWindowStyle.Hidden;
            Process.Start(start);
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, "Nimvara could not start", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
