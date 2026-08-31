#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::{
    collections::VecDeque,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::{Duration, Instant},
};
use tauri::{Emitter, Manager};

mod native_ai;
mod native_core;
mod native_ingestion;

struct NativeWatcher(Mutex<Option<RecommendedWatcher>>);
struct NativeSearch(Mutex<Option<native_core::SearchIndex>>);
struct NativeSearchCache(Mutex<Option<PathBuf>>);
struct NativeIndexControl(Mutex<IndexControl>);
struct NativeAiBudget(Mutex<AiBudget>);

struct AiBudget {
    requests: VecDeque<Instant>,
}

impl AiBudget {
    fn acquire(&mut self) -> Result<(), String> {
        let now = Instant::now();
        while self
            .requests
            .front()
            .is_some_and(|time| now.duration_since(*time) >= Duration::from_secs(600))
        {
            self.requests.pop_front();
        }
        if self.requests.len() >= 20 {
            return Err(
                "AI_RATE_LIMIT: Nimvara limits AI to 20 requests per 10 minutes per app session."
                    .into(),
            );
        }
        self.requests.push_back(now);
        Ok(())
    }
}

struct IndexControl {
    generation: u64,
    cancelled: Arc<AtomicBool>,
    status: IndexStatus,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexStatus {
    state: String,
    done: usize,
    total: usize,
    message: String,
}

#[derive(Serialize)]
struct OpenWorkspaceResult {
    workspace: String,
    files: Vec<String>,
}

fn active_root(state: &tauri::State<'_, native_core::NativeWorkspace>) -> Result<PathBuf, String> {
    state
        .0
        .lock()
        .map_err(|_| "WORKSPACE_LOCK: Workspace state is unavailable.".to_string())?
        .clone()
        .ok_or_else(|| "NO_WORKSPACE: Open or create a workspace first.".to_string())
}

#[tauri::command]
fn native_open_workspace(
    path: String,
    create: bool,
    state: tauri::State<'_, native_core::NativeWorkspace>,
    watcher_state: tauri::State<'_, NativeWatcher>,
    app: tauri::AppHandle,
) -> Result<OpenWorkspaceResult, String> {
    let root = native_core::open_workspace(&path, create)?;
    let files = native_core::list_markdown(&root)?;
    let workspace = root.to_string_lossy().to_string();
    *state
        .0
        .lock()
        .map_err(|_| "WORKSPACE_LOCK: Workspace state is unavailable.".to_string())? =
        Some(root.clone());
    *app.state::<NativeSearch>()
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())? = None;
    let cache_root = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("SEARCH_CACHE: {error}"))?
        .join("search");
    std::fs::create_dir_all(&cache_root).map_err(|error| format!("SEARCH_CACHE: {error}"))?;
    let cache_file = cache_root.join(format!("{}.json", native_core::search_cache_key(&root)));
    *app.state::<NativeSearchCache>()
        .0
        .lock()
        .map_err(|_| "SEARCH_CACHE_LOCK: Search cache state is unavailable.".to_string())? =
        Some(cache_file.clone());
    let (generation, cancellation) = {
        let control_state = app.state::<NativeIndexControl>();
        let mut control = control_state
            .0
            .lock()
            .map_err(|_| "SEARCH_CONTROL_LOCK: Search control is unavailable.".to_string())?;
        control.cancelled.store(true, Ordering::Relaxed);
        control.generation += 1;
        control.cancelled = Arc::new(AtomicBool::new(false));
        control.status = IndexStatus {
            state: "indexing".into(),
            done: 0,
            total: files.len(),
            message: "Preparing search index.".into(),
        };
        (control.generation, control.cancelled.clone())
    };
    let index_app = app.clone();
    let index_root = root.clone();
    let index_cache = cache_file.clone();
    std::thread::spawn(move || {
        let progress_app = index_app.clone();
        let outcome = (|| -> Result<native_core::SearchIndex, String> {
            let before = native_core::workspace_state(&index_root, None)?;
            let (built, _) = native_core::build_search_index_cached_controlled(
                &index_root,
                &index_cache,
                &cancellation,
                |done, total| {
                    if let Ok(mut control) = progress_app.state::<NativeIndexControl>().0.lock() {
                        if control.generation == generation {
                            control.status.done = done;
                            control.status.total = total;
                            control.status.message = format!("Indexed {done} of {total} notes.");
                        }
                    }
                },
            )?;
            let after = native_core::workspace_state(&index_root, None)?;
            if before.signature != after.signature {
                return Err("SEARCH_CHANGED: Workspace changed while indexing.".into());
            }
            Ok(built)
        })();
        let workspace_matches = index_app
            .state::<native_core::NativeWorkspace>()
            .0
            .lock()
            .ok()
            .is_some_and(|workspace| workspace.as_ref() == Some(&index_root));
        if let Ok(mut control) = index_app.state::<NativeIndexControl>().0.lock() {
            if control.generation != generation {
                return;
            }
            match outcome {
                Ok(built) if workspace_matches => {
                    if let Ok(mut index) = index_app.state::<NativeSearch>().0.lock() {
                        *index = Some(built);
                    }
                    control.status.state = "ready".into();
                    control.status.done = control.status.total;
                    control.status.message = "Search index ready.".into();
                }
                Err(error) if error.starts_with("SEARCH_CANCELLED:") => {
                    control.status.state = "cancelled".into();
                    control.status.message = "Indexing cancelled; prior cache preserved.".into();
                }
                Err(error) => {
                    control.status.state = "failed".into();
                    control.status.message = error;
                }
                _ => {}
            }
        }
    });
    let event_root = root.clone();
    let watcher_app = app.clone();
    let mut watcher = notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
        if let Ok(event) = event {
            if let Ok(mut index) = watcher_app.state::<NativeSearch>().0.lock() {
                *index = None;
            }
            let paths = event
                .paths
                .into_iter()
                .filter_map(|path| {
                    let relative = path
                        .strip_prefix(&event_root)
                        .ok()?
                        .to_string_lossy()
                        .replace('\\', "/");
                    if relative == ".lantern" || relative.starts_with(".lantern/") {
                        None
                    } else {
                        Some(relative)
                    }
                })
                .collect::<Vec<_>>();
            if !paths.is_empty() {
                let _ = watcher_app.emit("workspace-change", serde_json::json!({ "paths": paths }));
            }
        }
    })
    .map_err(|error| format!("WATCHER_START: {error}"))?;
    watcher
        .watch(&root, RecursiveMode::Recursive)
        .map_err(|error| format!("WATCHER_START: {error}"))?;
    *watcher_state
        .0
        .lock()
        .map_err(|_| "WATCHER_LOCK: Watcher state is unavailable.".to_string())? = Some(watcher);
    Ok(OpenWorkspaceResult { workspace, files })
}

#[tauri::command]
fn native_list_files(
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<Vec<String>, String> {
    native_core::list_markdown(&active_root(&state)?)
}

#[tauri::command]
fn native_read_note(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::Note, String> {
    native_core::read_note(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_save_note(
    path: String,
    content: String,
    expected_hash: Option<String>,
    state: tauri::State<'_, native_core::NativeWorkspace>,
    search_state: tauri::State<'_, NativeSearch>,
) -> Result<native_core::SaveResult, String> {
    let result = native_core::save_note(
        &active_root(&state)?,
        &path,
        &content,
        expected_hash.as_deref(),
    )?;
    *search_state
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())? = None;
    Ok(result)
}

#[tauri::command]
fn native_search(
    query: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
    search_state: tauri::State<'_, NativeSearch>,
    cache_state: tauri::State<'_, NativeSearchCache>,
) -> Result<Vec<native_core::SearchResult>, String> {
    let root = active_root(&state)?;
    let mut index = search_state
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())?;
    if index.is_none() {
        let cache = cache_state
            .0
            .lock()
            .map_err(|_| "SEARCH_CACHE_LOCK: Search cache state is unavailable.".to_string())?
            .clone()
            .ok_or_else(|| "SEARCH_CACHE: Workspace cache is unavailable.".to_string())?;
        *index = Some(native_core::build_search_index_cached(&root, &cache)?.0);
    }
    native_core::search_index(index.as_ref().expect("index initialized"), &query)
}

#[tauri::command]
fn native_search_status(
    control_state: tauri::State<'_, NativeIndexControl>,
) -> Result<IndexStatus, String> {
    Ok(control_state
        .0
        .lock()
        .map_err(|_| "SEARCH_CONTROL_LOCK: Search control is unavailable.".to_string())?
        .status
        .clone())
}

#[tauri::command]
fn native_cancel_search_index(
    control_state: tauri::State<'_, NativeIndexControl>,
) -> Result<(), String> {
    let mut control = control_state
        .0
        .lock()
        .map_err(|_| "SEARCH_CONTROL_LOCK: Search control is unavailable.".to_string())?;
    control.cancelled.store(true, Ordering::Relaxed);
    if control.status.state == "indexing" {
        control.status.state = "cancelling".into();
        control.status.message = "Cancelling after the current note.".into();
    }
    Ok(())
}

#[tauri::command]
fn native_clear_search_cache(
    search_state: tauri::State<'_, NativeSearch>,
    cache_state: tauri::State<'_, NativeSearchCache>,
    control_state: tauri::State<'_, NativeIndexControl>,
) -> Result<(), String> {
    {
        let mut control = control_state
            .0
            .lock()
            .map_err(|_| "SEARCH_CONTROL_LOCK: Search control is unavailable.".to_string())?;
        control.cancelled.store(true, Ordering::Relaxed);
        control.generation += 1;
        control.status = IndexStatus {
            state: "cleared".into(),
            done: 0,
            total: 0,
            message: "Disposable search cache cleared.".into(),
        };
    }
    *search_state
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())? = None;
    if let Some(cache) = cache_state
        .0
        .lock()
        .map_err(|_| "SEARCH_CACHE_LOCK: Search cache state is unavailable.".to_string())?
        .clone()
    {
        match std::fs::remove_file(cache) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(format!("SEARCH_CACHE_CLEAR: {error}")),
        }
    }
    Ok(())
}

#[tauri::command]
fn native_list_history(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<Vec<native_core::Checkpoint>, String> {
    native_core::list_history(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_restore_history(
    checkpoint_id: String,
    expected_hash: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
    search_state: tauri::State<'_, NativeSearch>,
) -> Result<native_core::SaveResult, String> {
    let result =
        native_core::restore_history(&active_root(&state)?, &checkpoint_id, &expected_hash)?;
    *search_state
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())? = None;
    Ok(result)
}

#[tauri::command]
fn native_create_snapshot(
    destination: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::Snapshot, String> {
    native_core::create_snapshot(&active_root(&state)?, &destination)
}

#[tauri::command]
fn native_list_snapshots(destination: String) -> Result<Vec<native_core::Snapshot>, String> {
    native_core::list_snapshots(&destination)
}

#[tauri::command]
fn native_snapshot_prune_plan(
    destination: String,
    keep: usize,
) -> Result<native_core::SnapshotPrunePlan, String> {
    native_core::plan_snapshot_prune(&destination, keep)
}

#[tauri::command]
fn native_prune_snapshots(
    destination: String,
    keep: usize,
    confirm: bool,
) -> Result<native_core::SnapshotPrunePlan, String> {
    native_core::prune_snapshots(&destination, keep, confirm)
}

#[tauri::command]
fn native_publishing_export(
    destination: String,
    paths: Vec<String>,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::StaticExportResult, String> {
    native_core::export_static(&active_root(&state)?, &destination, &paths)
}

#[tauri::command]
fn native_restore_snapshot(
    snapshot_path: String,
    destination: String,
) -> Result<native_core::RestoreResult, String> {
    native_core::restore_snapshot(&snapshot_path, &destination)
}

#[tauri::command]
fn native_backup_schedule(
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::BackupSchedule, String> {
    Ok(native_core::load_backup_schedule(&active_root(&state)?))
}

#[tauri::command]
fn native_set_backup_schedule(
    enabled: bool,
    interval_minutes: u32,
    destination: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::BackupSchedule, String> {
    native_core::save_backup_schedule(
        &active_root(&state)?,
        native_core::BackupSchedule {
            enabled,
            interval_minutes,
            destination,
            next_run_at: None,
        },
    )
}

#[tauri::command]
fn native_run_backup_now(
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::Snapshot, String> {
    let root = active_root(&state)?;
    let schedule = native_core::load_backup_schedule(&root);
    if !schedule.enabled {
        return Err("BACKUP_DISABLED: Enable scheduled backups before running one.".into());
    }
    native_core::create_snapshot(&root, &schedule.destination)
}

#[tauri::command]
fn native_workspace_files(
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<Vec<native_core::WorkspaceFile>, String> {
    native_core::workspace_files(&active_root(&state)?)
}

#[tauri::command]
fn native_workspace_state(
    path: Option<String>,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::WorkspaceState, String> {
    native_core::workspace_state(&active_root(&state)?, path.as_deref())
}

#[tauri::command]
fn native_save_conflict_copy(
    path: String,
    content: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
    search_state: tauri::State<'_, NativeSearch>,
) -> Result<native_core::SaveResult, String> {
    let result = native_core::save_conflict_copy(&active_root(&state)?, &path, &content)?;
    *search_state
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())? = None;
    Ok(result)
}

#[tauri::command]
fn native_reveal_file(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<String, String> {
    native_core::reveal_file(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_read_attachment_preview(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::AttachmentPreview, String> {
    native_core::read_attachment_preview(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_note_context(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::NoteContext, String> {
    native_core::note_context(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_workspace_dashboard(
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::WorkspaceDashboard, String> {
    native_core::workspace_dashboard(&active_root(&state)?)
}

#[tauri::command]
fn native_compatibility_report(
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::CompatibilityReport, String> {
    native_core::compatibility_report(&active_root(&state)?)
}

#[tauri::command]
fn native_read_canvas(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<serde_json::Value, String> {
    native_core::read_canvas(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_save_canvas(
    path: String,
    canvas: serde_json::Value,
    expected_hash: Option<String>,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::CanvasSaveResult, String> {
    native_core::save_canvas(
        &active_root(&state)?,
        &path,
        &canvas,
        expected_hash.as_deref(),
    )
}

#[tauri::command]
fn native_write_recovery(
    path: String,
    content: String,
    expected_hash: Option<String>,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<native_core::RecoveryDraft, String> {
    native_core::write_recovery(
        &active_root(&state)?,
        &path,
        &content,
        expected_hash.as_deref(),
    )
}

#[tauri::command]
fn native_read_recovery(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<Option<native_core::RecoveryDraft>, String> {
    native_core::read_recovery(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_clear_recovery(
    path: String,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<(), String> {
    native_core::clear_recovery(&active_root(&state)?, &path)
}

#[tauri::command]
fn native_status(
    app: tauri::AppHandle,
    state: tauri::State<'_, native_core::NativeWorkspace>,
) -> Result<serde_json::Value, String> {
    let workspace = state
        .0
        .lock()
        .map_err(|_| "WORKSPACE_LOCK: Workspace state unavailable.".to_string())?
        .as_ref()
        .map(|path| path.to_string_lossy().to_string());
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|error| format!("RESOURCE_PATH: {error}"))?;
    let nested = resource_dir
        .join("resources")
        .join("app")
        .join("sample-workspace");
    let direct = resource_dir.join("app").join("sample-workspace");
    let sample = if nested.exists() { nested } else { direct };
    Ok(
        serde_json::json!({ "workspace": workspace, "sampleWorkspace": sample.to_string_lossy(), "version": "0.7.0-dev", "ingestion": native_ingestion::capabilities(), "watchMode": "native-recursive" }),
    )
}

#[tauri::command]
fn native_ai_ask(
    request: native_ai::AiRequest,
    state: tauri::State<'_, native_core::NativeWorkspace>,
    search_state: tauri::State<'_, NativeSearch>,
    cache_state: tauri::State<'_, NativeSearchCache>,
    budget: tauri::State<'_, NativeAiBudget>,
) -> Result<native_ai::AiAnswer, String> {
    budget
        .0
        .lock()
        .map_err(|_| "AI_BUDGET_LOCK: AI request controls are unavailable.".to_string())?
        .acquire()?;
    let root = active_root(&state)?;
    let mut index = search_state
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())?;
    if index.is_none() {
        let cache = cache_state
            .0
            .lock()
            .map_err(|_| "SEARCH_CACHE_LOCK: Search cache state is unavailable.".to_string())?
            .clone()
            .ok_or_else(|| "SEARCH_CACHE: Workspace cache is unavailable.".to_string())?;
        *index = Some(native_core::build_search_index_cached(&root, &cache)?.0);
    }
    native_ai::ask(index.as_ref().expect("index initialized"), request)
}

#[tauri::command]
fn native_ai_detect() -> Vec<native_ai::LocalProvider> {
    native_ai::detect_local()
}

#[tauri::command]
fn native_ai_hardware() -> native_ai::HardwareReport {
    native_ai::hardware_report()
}

#[tauri::command]
fn native_ai_verify_model(
    path: String,
    manifest: native_ai::ModelManifest,
) -> Result<native_ai::ModelVerification, String> {
    native_ai::verify_model(&path, manifest)
}

#[tauri::command]
fn native_ai_import_model(
    path: String,
    manifest: native_ai::ModelManifest,
    app: tauri::AppHandle,
) -> Result<native_ai::ModelVerification, String> {
    let model_root = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("MODEL_STORE: {error}"))?
        .join("models");
    native_ai::import_verified_model(&path, &model_root, manifest)
}

#[tauri::command]
fn native_ai_propose_edit(
    request: native_ai::AiEditRequest,
    state: tauri::State<'_, native_core::NativeWorkspace>,
    budget: tauri::State<'_, NativeAiBudget>,
) -> Result<native_ai::AiEditProposal, String> {
    budget
        .0
        .lock()
        .map_err(|_| "AI_BUDGET_LOCK: AI request controls are unavailable.".to_string())?
        .acquire()?;
    native_ai::propose_edit(&active_root(&state)?, request)
}

#[tauri::command]
fn native_preview_local(
    path: String,
    workspace: tauri::State<'_, native_core::NativeWorkspace>,
    store: tauri::State<'_, native_ingestion::PreviewStore>,
) -> Result<native_ingestion::Preview, String> {
    native_ingestion::preview_local(&active_root(&workspace)?, &path, &store)
}

#[tauri::command]
fn native_preview_url(
    url: String,
    workspace: tauri::State<'_, native_core::NativeWorkspace>,
    store: tauri::State<'_, native_ingestion::PreviewStore>,
) -> Result<native_ingestion::Preview, String> {
    native_ingestion::preview_url(&active_root(&workspace)?, &url, &store)
}

#[tauri::command]
fn native_commit_ingestion(
    preview_id: String,
    destination_folder: String,
    note_name: String,
    allow_duplicate: bool,
    workspace: tauri::State<'_, native_core::NativeWorkspace>,
    store: tauri::State<'_, native_ingestion::PreviewStore>,
    search_state: tauri::State<'_, NativeSearch>,
) -> Result<native_ingestion::CommitResult, String> {
    let result = native_ingestion::commit(
        &active_root(&workspace)?,
        &preview_id,
        &destination_folder,
        &note_name,
        allow_duplicate,
        &store,
    )?;
    *search_state
        .0
        .lock()
        .map_err(|_| "SEARCH_LOCK: Search index is unavailable.".to_string())? = None;
    Ok(result)
}

#[tauri::command]
fn native_cancel_ingestion(
    preview_id: String,
    workspace: tauri::State<'_, native_core::NativeWorkspace>,
    store: tauri::State<'_, native_ingestion::PreviewStore>,
) -> Result<serde_json::Value, String> {
    native_ingestion::cancel(&active_root(&workspace)?, &preview_id, &store)?;
    Ok(serde_json::json!({ "cancelled": true }))
}

fn main() {
    tauri::Builder::default()
        .manage(NativeWatcher(Mutex::new(None)))
        .manage(NativeSearch(Mutex::new(None)))
        .manage(NativeSearchCache(Mutex::new(None)))
        .manage(NativeIndexControl(Mutex::new(IndexControl {
            generation: 0,
            cancelled: Arc::new(AtomicBool::new(false)),
            status: IndexStatus {
                state: "idle".into(),
                done: 0,
                total: 0,
                message: "No workspace index started.".into(),
            },
        })))
        .manage(NativeAiBudget(Mutex::new(AiBudget {
            requests: VecDeque::new(),
        })))
        .manage(native_core::NativeWorkspace::default())
        .manage(native_ingestion::PreviewStore::default())
        .invoke_handler(tauri::generate_handler![
            native_open_workspace,
            native_list_files,
            native_read_note,
            native_save_note,
            native_search,
            native_search_status,
            native_cancel_search_index,
            native_clear_search_cache,
            native_list_history,
            native_restore_history,
            native_create_snapshot,
            native_list_snapshots,
            native_snapshot_prune_plan,
            native_prune_snapshots,
            native_publishing_export,
            native_restore_snapshot,
            native_backup_schedule,
            native_set_backup_schedule,
            native_run_backup_now,
            native_workspace_files,
            native_workspace_state,
            native_save_conflict_copy,
            native_reveal_file,
            native_read_attachment_preview,
            native_note_context,
            native_workspace_dashboard,
            native_compatibility_report,
            native_read_canvas,
            native_save_canvas,
            native_write_recovery,
            native_read_recovery,
            native_clear_recovery,
            native_status,
            native_ai_ask,
            native_ai_detect,
            native_ai_hardware,
            native_ai_verify_model,
            native_ai_import_model,
            native_ai_propose_edit,
            native_preview_local,
            native_preview_url,
            native_commit_ingestion,
            native_cancel_ingestion
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Nimvara");
}
