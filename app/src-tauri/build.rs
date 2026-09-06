fn main() {
    eprintln!("Nimvara: preparing native build resources");
    tauri_build::build();
    eprintln!("Nimvara: native build resources ready");
}
