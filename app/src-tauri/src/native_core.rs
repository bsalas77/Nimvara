use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs::{self, OpenOptions},
    io::Write,
    path::{Component, Path, PathBuf},
    process::Command,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
    time::{SystemTime, UNIX_EPOCH},
};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};
use uuid::Uuid;

const META: &str = ".lantern";

#[derive(Default)]
pub struct NativeWorkspace(pub Mutex<Option<PathBuf>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub path: String,
    pub content: String,
    pub hash: String,
    pub modified_at: u128,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveResult {
    pub path: String,
    pub hash: String,
    pub unchanged: bool,
    pub checkpoint_id: Option<String>,
}

#[derive(Serialize)]
pub struct SearchResult {
    pub path: String,
    pub snippet: String,
}

#[derive(Deserialize, Serialize)]
pub struct SearchIndex {
    notes: Vec<IndexedNote>,
}

#[derive(Deserialize, Serialize)]
struct IndexedNote {
    path: String,
    content: String,
    lower: String,
    bytes: u64,
    modified_at: u128,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchIndexReport {
    pub total: usize,
    pub reused: usize,
    pub refreshed: usize,
    pub removed: usize,
    pub cache_recovered: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Checkpoint {
    pub id: String,
    pub path: String,
    pub hash: String,
    pub reason: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SnapshotFile {
    pub path: String,
    pub bytes: u64,
    pub sha256: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub schema: u8,
    pub id: String,
    pub created_at: String,
    pub source: String,
    pub files: Vec<SnapshotFile>,
    pub path: String,
    pub verified: bool,
}

#[derive(Debug, Serialize)]
pub struct RestoreResult {
    pub destination: String,
    pub files: usize,
    pub verified: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceFile {
    pub path: String,
    pub kind: String,
    pub extension: String,
    pub bytes: u64,
    pub modified_at: u128,
}

#[derive(Serialize)]
pub struct WorkspaceState {
    pub signature: String,
    pub files: Vec<WorkspaceFile>,
    pub note: Option<NoteState>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteState {
    pub path: String,
    pub hash: Option<String>,
    pub modified_at: Option<u128>,
    pub missing: bool,
}

#[derive(Clone, Serialize)]
pub struct Heading {
    pub level: usize,
    pub text: String,
    pub line: usize,
}

#[derive(Clone, Serialize)]
pub struct LinkView {
    pub target: String,
    pub heading: Option<String>,
    pub alias: Option<String>,
    pub embed: bool,
    pub line: usize,
    pub status: String,
    pub path: Option<String>,
    pub candidates: Vec<String>,
}

#[derive(Clone, Serialize)]
pub struct Backlink {
    pub source: String,
    pub line: usize,
    pub alias: Option<String>,
    pub heading: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteContext {
    pub outline: Vec<Heading>,
    pub outgoing: Vec<LinkView>,
    pub backlinks: Vec<Backlink>,
    pub diagnostic_count: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceDashboard {
    pub notes: Vec<DashboardNote>,
    pub tasks: Vec<DashboardTask>,
    pub scanned_bytes: u64,
}

#[derive(Serialize)]
pub struct DashboardNote {
    pub path: String,
    pub properties: HashMap<String, String>,
}

#[derive(Serialize)]
pub struct DashboardTask {
    pub path: String,
    pub line: usize,
    pub completed: bool,
    pub text: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompatibilityReport {
    pub markdown_notes: usize,
    pub attachments: usize,
    pub canvases: usize,
    pub wikilinks: usize,
    pub embeds: usize,
    pub callouts: usize,
    pub frontmatter_notes: usize,
    pub tasks: usize,
    pub unicode_paths: usize,
    pub long_paths: usize,
    pub longest_relative_path: usize,
    pub broken_links: usize,
    pub ambiguous_links: usize,
    pub extensions: HashMap<String, usize>,
}

pub fn compatibility_report(root: &Path) -> Result<CompatibilityReport, String> {
    let dashboard = workspace_dashboard(root)?;
    let inventory = workspace_files(root)?;
    let mut report = CompatibilityReport {
        markdown_notes: dashboard.notes.len(),
        attachments: inventory
            .iter()
            .filter(|file| file.kind == "attachment")
            .count(),
        canvases: inventory
            .iter()
            .filter(|file| file.extension == ".canvas")
            .count(),
        wikilinks: 0,
        embeds: 0,
        callouts: 0,
        frontmatter_notes: dashboard
            .notes
            .iter()
            .filter(|note| !note.properties.is_empty())
            .count(),
        tasks: dashboard.tasks.len(),
        unicode_paths: inventory
            .iter()
            .filter(|file| !file.path.is_ascii())
            .count(),
        long_paths: inventory
            .iter()
            .filter(|file| file.path.len() > 180)
            .count(),
        longest_relative_path: inventory
            .iter()
            .map(|file| file.path.len())
            .max()
            .unwrap_or(0),
        broken_links: 0,
        ambiguous_links: 0,
        extensions: HashMap::new(),
    };
    for file in &inventory {
        *report.extensions.entry(file.extension.clone()).or_default() += 1;
    }
    for note in &dashboard.notes {
        let content = read_note(root, &note.path)?.content;
        let mut fenced = false;
        for line in content.lines() {
            let trimmed = line.trim_start();
            if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
                fenced = !fenced;
                continue;
            }
            if fenced {
                continue;
            }
            report.wikilinks += line.match_indices("[[").count();
            report.embeds += line.match_indices("![[").count();
            if trimmed.starts_with("> [!") {
                report.callouts += 1;
            }
        }
    }
    for note in &dashboard.notes {
        if let Ok(context) = note_context(root, &note.path) {
            report.broken_links += context.outgoing.iter().filter(|link| link.status == "missing").count();
            report.ambiguous_links += context.outgoing.iter().filter(|link| link.status == "ambiguous").count();
        }
    }
    Ok(report)
}

pub fn read_canvas(root: &Path, relative: &str) -> Result<serde_json::Value, String> {
    const MAX_CANVAS_BYTES: u64 = 10 * 1024 * 1024;
    let normalized = relative.replace('\\', "/");
    let inventory = workspace_files(root)?;
    let file = inventory
        .iter()
        .find(|file| file.path == normalized && file.extension == ".canvas")
        .ok_or_else(|| {
            "CANVAS_NOT_FOUND: Select a .canvas file inside the workspace.".to_string()
        })?;
    if file.bytes > MAX_CANVAS_BYTES {
        return Err("CANVAS_LIMIT: Canvas exceeds 10 MiB.".into());
    }
    let bytes = fs::read(root.join(normalized.split('/').collect::<PathBuf>()))
        .map_err(|error| format!("CANVAS_READ: {error}"))?;
    let value: serde_json::Value =
        serde_json::from_slice(&bytes).map_err(|error| format!("CANVAS_JSON: {error}"))?;
    let nodes = value
        .get("nodes")
        .and_then(|item| item.as_array())
        .ok_or_else(|| "CANVAS_SCHEMA: Canvas nodes array is missing.".to_string())?;
    let edges = value
        .get("edges")
        .and_then(|item| item.as_array())
        .ok_or_else(|| "CANVAS_SCHEMA: Canvas edges array is missing.".to_string())?;
    if nodes.len() > 5_000 || edges.len() > 10_000 {
        return Err("CANVAS_LIMIT: Canvas exceeds the node or edge safety limit.".into());
    }
    Ok(serde_json::json!({ "path": normalized, "nodes": nodes, "edges": edges }))
}

pub fn workspace_dashboard(root: &Path) -> Result<WorkspaceDashboard, String> {
    const MAX_NOTES: usize = 50_000;
    const MAX_BYTES: u64 = 128 * 1024 * 1024;
    let paths = list_markdown(root)?;
    if paths.len() > MAX_NOTES {
        return Err(format!(
            "DASHBOARD_LIMIT: Workspace exceeds {MAX_NOTES} Markdown notes."
        ));
    }
    let mut notes = Vec::with_capacity(paths.len());
    let mut tasks = Vec::new();
    let mut scanned_bytes = 0_u64;
    for path in paths {
        let note = read_note(root, &path)?;
        scanned_bytes = scanned_bytes.saturating_add(note.content.len() as u64);
        if scanned_bytes > MAX_BYTES {
            return Err("DASHBOARD_LIMIT: Markdown dashboard scan exceeds 128 MiB.".into());
        }
        let mut properties = HashMap::new();
        let mut fenced = false;
        let mut frontmatter = note.content.lines().next() == Some("---");
        for (index, line) in note.content.lines().enumerate() {
            let trimmed = line.trim_start();
            if index > 0 && frontmatter && trimmed == "---" {
                frontmatter = false;
                continue;
            }
            if frontmatter && index > 0 {
                if let Some((key, value)) = line.split_once(':') {
                    let key = key.trim();
                    if !key.is_empty()
                        && key.chars().all(|character| {
                            character.is_ascii_alphanumeric() || "_-".contains(character)
                        })
                    {
                        properties.insert(
                            key.to_string(),
                            value.trim().trim_matches(['\'', '"']).to_string(),
                        );
                    }
                }
                continue;
            }
            if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
                fenced = !fenced;
                continue;
            }
            if fenced {
                continue;
            }
            let trimmed = trimmed
                .strip_prefix("- ")
                .or_else(|| trimmed.strip_prefix("* "))
                .or_else(|| trimmed.strip_prefix("+ "));
            if let Some(task) = trimmed {
                if task.len() >= 4 && (&task[..3] == "[ ]" || task[..3].eq_ignore_ascii_case("[x]"))
                {
                    tasks.push(DashboardTask {
                        path: path.clone(),
                        line: index + 1,
                        completed: task[..3].eq_ignore_ascii_case("[x]"),
                        text: task[3..].trim().to_string(),
                    });
                }
            }
        }
        notes.push(DashboardNote { path, properties });
    }
    Ok(WorkspaceDashboard {
        notes,
        tasks,
        scanned_bytes,
    })
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryDraft {
    pub path: String,
    pub content: String,
    pub expected_hash: Option<String>,
    pub saved_at: String,
}

fn recovery_path(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let safe = clean_relative(relative)?;
    Ok(root
        .join(META)
        .join("recovery")
        .join(format!("{}.json", hash(safe.as_bytes()))))
}

pub fn write_recovery(
    root: &Path,
    relative: &str,
    content: &str,
    expected_hash: Option<&str>,
) -> Result<RecoveryDraft, String> {
    let safe = clean_relative(relative)?;
    if !safe.to_lowercase().ends_with(".md") {
        return Err("NOT_MARKDOWN: Recovery drafts require Markdown notes.".into());
    }
    let draft = RecoveryDraft {
        path: safe.clone(),
        content: content.to_string(),
        expected_hash: expected_hash.map(str::to_string),
        saved_at: OffsetDateTime::now_utc()
            .format(&Rfc3339)
            .map_err(|error| format!("RECOVERY_TIME: {error}"))?,
    };
    let bytes = serde_json::to_vec_pretty(&draft)
        .map_err(|error| format!("RECOVERY_SERIALIZE: {error}"))?;
    write_bytes_atomic(&recovery_path(root, &safe)?, &bytes)?;
    Ok(draft)
}

pub fn read_recovery(root: &Path, relative: &str) -> Result<Option<RecoveryDraft>, String> {
    match fs::read(recovery_path(root, relative)?) {
        Ok(bytes) => serde_json::from_slice(&bytes)
            .map(Some)
            .map_err(|error| format!("RECOVERY_CORRUPT: {error}")),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("RECOVERY_READ: {error}")),
    }
}

pub fn clear_recovery(root: &Path, relative: &str) -> Result<(), String> {
    match fs::remove_file(recovery_path(root, relative)?) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("RECOVERY_CLEAR: {error}")),
    }
}

#[derive(Clone)]
struct ParsedLink {
    target: String,
    heading: Option<String>,
    alias: Option<String>,
    embed: bool,
    line: usize,
}

fn parse_structure(content: &str) -> (Vec<Heading>, Vec<ParsedLink>) {
    let mut headings = Vec::new();
    let mut links = Vec::new();
    let mut fence: Option<char> = None;
    for (index, line) in content.lines().enumerate() {
        let trimmed = line.trim_start();
        if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
            let marker = trimmed.chars().next().unwrap();
            if fence == Some(marker) {
                fence = None;
            } else if fence.is_none() {
                fence = Some(marker);
            }
            continue;
        }
        if fence.is_some() {
            continue;
        }
        let level = line
            .chars()
            .take_while(|character| *character == '#')
            .count();
        if (1..=6).contains(&level) && line.chars().nth(level) == Some(' ') {
            headings.push(Heading {
                level,
                text: line[level + 1..]
                    .trim()
                    .trim_end_matches('#')
                    .trim()
                    .to_string(),
                line: index + 1,
            });
        }
        let mut cursor = 0;
        while let Some(start) = line[cursor..].find("[[") {
            let absolute_start = cursor + start;
            if let Some(end) = line[absolute_start + 2..].find("]]") {
                let raw = &line[absolute_start + 2..absolute_start + 2 + end];
                let (destination, alias) =
                    raw.split_once('|').map_or((raw, None), |(left, right)| {
                        (left, Some(right.trim().to_string()))
                    });
                let (target, heading) = destination
                    .split_once('#')
                    .map_or((destination.trim(), None), |(left, right)| {
                        (left.trim(), Some(right.trim().to_string()))
                    });
                links.push(ParsedLink {
                    target: target.to_string(),
                    heading,
                    alias,
                    embed: absolute_start > 0 && line.as_bytes()[absolute_start - 1] == b'!',
                    line: index + 1,
                });
                cursor = absolute_start + 2 + end + 2;
            } else {
                break;
            }
        }
    }
    (headings, links)
}

fn link_key(value: &str) -> String {
    value
        .replace('\\', "/")
        .trim_start_matches('/')
        .trim_end_matches(".md")
        .to_lowercase()
}

pub fn note_context(root: &Path, relative: &str) -> Result<NoteContext, String> {
    let safe = clean_relative(relative)?;
    let notes = list_markdown(root)?;
    if !notes.contains(&safe) {
        return Err("NOTE_NOT_FOUND: Note is not part of this workspace.".into());
    }
    let mut canonical = HashMap::new();
    let mut basenames: HashMap<String, Vec<String>> = HashMap::new();
    let mut parsed = HashMap::new();
    for note in &notes {
        let key = link_key(note);
        canonical.insert(key.clone(), note.clone());
        basenames
            .entry(
                Path::new(&key)
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .to_string(),
            )
            .or_default()
            .push(note.clone());
        parsed.insert(
            note.clone(),
            parse_structure(&read_note(root, note)?.content),
        );
    }
    let resolve = |source: &str, target: &str| -> (String, Option<String>, Vec<String>) {
        if target.is_empty() {
            return ("empty".into(), None, Vec::new());
        }
        let exact = link_key(target);
        let source_dir = Path::new(source).parent().unwrap_or(Path::new(""));
        let relative_key = link_key(&source_dir.join(target).to_string_lossy());
        if let Some(path) = canonical.get(&exact) {
            return ("resolved".into(), Some(path.clone()), vec![path.clone()]);
        }
        if let Some(path) = canonical.get(&relative_key) {
            return ("resolved".into(), Some(path.clone()), vec![path.clone()]);
        }
        let base = Path::new(&exact)
            .file_name()
            .unwrap()
            .to_string_lossy()
            .to_string();
        let candidates = basenames.get(&base).cloned().unwrap_or_default();
        if candidates.len() == 1 {
            ("resolved".into(), Some(candidates[0].clone()), candidates)
        } else if candidates.len() > 1 {
            ("ambiguous".into(), None, candidates)
        } else {
            ("missing".into(), None, candidates)
        }
    };
    let mut backlinks = Vec::new();
    let mut diagnostic_count = 0;
    let mut outgoing = Vec::new();
    for source in &notes {
        for link in &parsed[source].1 {
            let (status, path, candidates) = resolve(source, &link.target);
            if status != "resolved" {
                diagnostic_count += 1;
            }
            if source == &safe {
                outgoing.push(LinkView {
                    target: link.target.clone(),
                    heading: link.heading.clone(),
                    alias: link.alias.clone(),
                    embed: link.embed,
                    line: link.line,
                    status: status.clone(),
                    path: path.clone(),
                    candidates: candidates.clone(),
                });
            }
            if path.as_deref() == Some(&safe) {
                backlinks.push(Backlink {
                    source: source.clone(),
                    line: link.line,
                    alias: link.alias.clone(),
                    heading: link.heading.clone(),
                });
            }
        }
    }
    Ok(NoteContext {
        outline: parsed[&safe].0.clone(),
        outgoing,
        backlinks,
        diagnostic_count,
    })
}

fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn clean_relative(value: &str) -> Result<String, String> {
    if value.trim().is_empty() {
        return Err("INVALID_PATH: A relative Markdown path is required.".into());
    }
    let normalized = value.replace('\\', "/").trim_start_matches('/').to_string();
    let path = Path::new(&normalized);
    if path
        .components()
        .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err("PATH_ESCAPE: The path must stay inside the workspace.".into());
    }
    if normalized
        .split('/')
        .next()
        .is_some_and(|part| part.eq_ignore_ascii_case(META))
    {
        return Err("RESERVED_PATH: Nimvara metadata is not editable as a note.".into());
    }
    validate_portable_components(&normalized)?;
    if !normalized.to_ascii_lowercase().ends_with(".md") {
        return Err("NOT_MARKDOWN: Nimvara edits Markdown files only.".into());
    }
    Ok(normalized)
}

fn validate_portable_components(value: &str) -> Result<(), String> {
    const DEVICES: [&str; 22] = [
        "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8",
        "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];
    for component in value.split('/') {
        if component.chars().any(|character| {
            character.is_control() || matches!(character, '<' | '>' | ':' | '"' | '|' | '?' | '*')
        }) || component.ends_with(['.', ' '])
        {
            return Err(
                "INVALID_PORTABLE_PATH: Path contains characters unsafe across platforms.".into(),
            );
        }
        let stem = component
            .split('.')
            .next()
            .unwrap_or("")
            .to_ascii_uppercase();
        if DEVICES.contains(&stem.as_str()) {
            return Err("INVALID_PORTABLE_PATH: Reserved device names are not allowed.".into());
        }
    }
    Ok(())
}

fn clean_snapshot_relative(value: &str) -> Result<String, String> {
    if value.trim().is_empty() {
        return Err("INVALID_SNAPSHOT_PATH: Snapshot path is empty.".into());
    }
    let normalized = value.replace('\\', "/").trim_start_matches('/').to_string();
    if Path::new(&normalized)
        .components()
        .any(|part| !matches!(part, Component::Normal(_)))
        || normalized
            .split('/')
            .next()
            .is_some_and(|part| part.eq_ignore_ascii_case(META))
    {
        return Err(
            "INVALID_SNAPSHOT_PATH: Snapshot entry escapes the restore destination.".into(),
        );
    }
    validate_portable_components(&normalized)
        .map_err(|_| "INVALID_SNAPSHOT_PATH: Snapshot path is not portable.".to_string())?;
    Ok(normalized)
}

pub fn open_workspace(path: &str, create: bool) -> Result<PathBuf, String> {
    let requested = PathBuf::from(path);
    if create {
        fs::create_dir_all(&requested).map_err(|error| format!("CREATE_WORKSPACE: {error}"))?;
    }
    let metadata = fs::symlink_metadata(&requested)
        .map_err(|_| "NOT_DIRECTORY: Workspace folder does not exist.".to_string())?;
    if metadata.file_type().is_symlink() {
        return Err(
            "SYMLINK_WORKSPACE: A workspace root cannot be a symbolic link or junction.".into(),
        );
    }
    if !metadata.is_dir() {
        return Err("NOT_DIRECTORY: Workspace folder does not exist.".into());
    }
    requested
        .canonicalize()
        .map_err(|error| format!("WORKSPACE_ACCESS: {error}"))
}

fn resolve_note(root: &Path, relative: &str) -> Result<(PathBuf, String), String> {
    let safe = clean_relative(relative)?;
    let candidate = root.join(safe.split('/').collect::<PathBuf>());
    let mut current = root.to_path_buf();
    for component in safe.split('/') {
        current.push(component);
        match fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                return Err("SYMLINK_PATH: Nimvara will not follow a symbolic link or junction inside a workspace.".into())
            }
            Ok(_) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => break,
            Err(error) => return Err(format!("PATH_ACCESS: {error}")),
        }
    }
    Ok((candidate, safe))
}

fn walk_markdown(root: &Path, directory: &Path, output: &mut Vec<String>) -> Result<(), String> {
    for entry in fs::read_dir(directory).map_err(|error| format!("LIST_WORKSPACE: {error}"))? {
        let entry = entry.map_err(|error| format!("LIST_WORKSPACE: {error}"))?;
        if entry
            .file_name()
            .to_string_lossy()
            .eq_ignore_ascii_case(META)
        {
            continue;
        }
        let kind = entry
            .file_type()
            .map_err(|error| format!("LIST_WORKSPACE: {error}"))?;
        if kind.is_symlink() {
            continue;
        }
        if kind.is_dir() {
            walk_markdown(root, &entry.path(), output)?;
        } else if entry
            .path()
            .extension()
            .is_some_and(|extension| extension.eq_ignore_ascii_case("md"))
        {
            output.push(
                entry
                    .path()
                    .strip_prefix(root)
                    .map_err(|error| format!("LIST_WORKSPACE: {error}"))?
                    .to_string_lossy()
                    .replace('\\', "/"),
            );
        }
    }
    Ok(())
}

pub fn list_markdown(root: &Path) -> Result<Vec<String>, String> {
    let mut notes = Vec::new();
    walk_markdown(root, root, &mut notes)?;
    notes.sort_by_key(|value| value.to_lowercase());
    Ok(notes)
}

fn walk_files(
    root: &Path,
    directory: &Path,
    output: &mut Vec<(PathBuf, String)>,
) -> Result<(), String> {
    for entry in fs::read_dir(directory).map_err(|error| format!("LIST_WORKSPACE: {error}"))? {
        let entry = entry.map_err(|error| format!("LIST_WORKSPACE: {error}"))?;
        if entry
            .file_name()
            .to_string_lossy()
            .eq_ignore_ascii_case(META)
        {
            continue;
        }
        let kind = entry
            .file_type()
            .map_err(|error| format!("LIST_WORKSPACE: {error}"))?;
        if kind.is_symlink() {
            continue;
        }
        if kind.is_dir() {
            walk_files(root, &entry.path(), output)?;
        } else if kind.is_file() {
            let relative = entry
                .path()
                .strip_prefix(root)
                .map_err(|error| format!("LIST_WORKSPACE: {error}"))?
                .to_string_lossy()
                .replace('\\', "/");
            output.push((entry.path(), relative));
        }
    }
    Ok(())
}

pub fn workspace_files(root: &Path) -> Result<Vec<WorkspaceFile>, String> {
    let mut walked = Vec::new();
    walk_files(root, root, &mut walked)?;
    let mut files = Vec::new();
    for (absolute, relative) in walked {
        let metadata =
            fs::metadata(absolute).map_err(|error| format!("WORKSPACE_STATE: {error}"))?;
        let modified_at = metadata
            .modified()
            .ok()
            .and_then(|value| value.duration_since(UNIX_EPOCH).ok())
            .map_or(0, |value| value.as_millis());
        let extension = Path::new(&relative)
            .extension()
            .map_or(String::new(), |value| {
                format!(".{}", value.to_string_lossy().to_lowercase())
            });
        files.push(WorkspaceFile {
            kind: if extension.eq_ignore_ascii_case(".md") {
                "markdown".into()
            } else {
                "attachment".into()
            },
            path: relative,
            extension,
            bytes: metadata.len(),
            modified_at,
        });
    }
    files.sort_by_key(|left| left.path.to_lowercase());
    Ok(files)
}

pub fn workspace_state(root: &Path, relative: Option<&str>) -> Result<WorkspaceState, String> {
    let files = workspace_files(root)?;
    let signature_source = files
        .iter()
        .map(|file| format!("{}\0{}\0{}", file.path, file.bytes, file.modified_at))
        .collect::<Vec<_>>()
        .join("\n");
    let note = if let Some(relative) = relative {
        let (absolute, safe) = resolve_note(root, relative)?;
        if absolute.exists() {
            let note = read_note(root, relative)?;
            Some(NoteState {
                path: note.path,
                hash: Some(note.hash),
                modified_at: Some(note.modified_at),
                missing: false,
            })
        } else {
            Some(NoteState {
                path: safe,
                hash: None,
                modified_at: None,
                missing: true,
            })
        }
    } else {
        None
    };
    Ok(WorkspaceState {
        signature: hash(signature_source.as_bytes()),
        files,
        note,
    })
}

pub fn save_conflict_copy(
    root: &Path,
    relative: &str,
    content: &str,
) -> Result<SaveResult, String> {
    let safe = clean_relative(relative)?;
    let source = Path::new(&safe);
    let stem = source
        .file_stem()
        .and_then(|value| value.to_str())
        .ok_or("INVALID_PATH: Note name is invalid.")?;
    let parent = source.parent().unwrap_or(Path::new(""));
    let stamp = OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .map_err(|error| error.to_string())?
        .replace(':', "-");
    for attempt in 0..100 {
        let suffix = if attempt == 0 {
            String::new()
        } else {
            format!("-{attempt}")
        };
        let candidate = parent
            .join(format!("{stem} (Nimvara conflict {stamp}){suffix}.md"))
            .to_string_lossy()
            .replace('\\', "/");
        let (absolute, _) = resolve_note(root, &candidate)?;
        if !absolute.exists() {
            return save_note(root, &candidate, content, None);
        }
    }
    Err("COPY_COLLISION: Could not create a unique conflict copy.".into())
}

pub fn reveal_file(root: &Path, relative: &str) -> Result<String, String> {
    let normalized = clean_snapshot_relative(relative)?;
    let candidate = root.join(normalized.split('/').collect::<PathBuf>());
    let metadata = fs::symlink_metadata(&candidate)
        .map_err(|_| "ATTACHMENT_NOT_FOUND: Attachment was not found.".to_string())?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err("ATTACHMENT_NOT_FOUND: Attachment was not found.".into());
    }
    #[cfg(target_os = "windows")]
    Command::new("explorer.exe")
        .arg("/select,")
        .arg(&candidate)
        .spawn()
        .map_err(|error| format!("REVEAL_FAILED: {error}"))?;
    #[cfg(target_os = "macos")]
    Command::new("open")
        .arg("-R")
        .arg(&candidate)
        .spawn()
        .map_err(|error| format!("REVEAL_FAILED: {error}"))?;
    #[cfg(all(unix, not(target_os = "macos")))]
    Command::new("xdg-open")
        .arg(candidate.parent().unwrap_or(root))
        .spawn()
        .map_err(|error| format!("REVEAL_FAILED: {error}"))?;
    Ok(normalized)
}

pub fn read_note(root: &Path, relative: &str) -> Result<Note, String> {
    let (absolute, safe) = resolve_note(root, relative)?;
    let bytes = fs::read(&absolute).map_err(|error| format!("READ_NOTE: {error}"))?;
    let content = String::from_utf8(bytes.clone())
        .map_err(|_| "INVALID_UTF8: Markdown file is not valid UTF-8.".to_string())?;
    let modified_at = fs::metadata(&absolute)
        .and_then(|metadata| metadata.modified())
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map_or(0, |duration| duration.as_millis());
    Ok(Note {
        path: safe,
        content,
        hash: hash(&bytes),
        modified_at,
    })
}

fn checkpoint(root: &Path, relative: &str, bytes: &[u8]) -> Result<String, String> {
    let id = format!(
        "{}-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| error.to_string())?
            .as_millis(),
        &Uuid::new_v4().to_string()[..8]
    );
    let directory = root.join(META).join("history").join(&id);
    let content = directory.join(relative.split('/').collect::<PathBuf>());
    if let Some(parent) = content.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("CHECKPOINT: {error}"))?;
    }
    fs::write(&content, bytes).map_err(|error| format!("CHECKPOINT: {error}"))?;
    let record = Checkpoint {
        id: id.clone(),
        path: relative.to_string(),
        hash: hash(bytes),
        reason: "before-save".into(),
        created_at: OffsetDateTime::now_utc()
            .format(&Rfc3339)
            .map_err(|error| format!("CHECKPOINT_TIME: {error}"))?,
    };
    fs::write(
        directory.join("checkpoint.json"),
        format!(
            "{}\n",
            serde_json::to_string_pretty(&record)
                .map_err(|error| format!("CHECKPOINT_RECORD: {error}"))?
        ),
    )
    .map_err(|error| format!("CHECKPOINT: {error}"))?;
    Ok(id)
}

pub fn list_history(root: &Path, relative: &str) -> Result<Vec<Checkpoint>, String> {
    let safe = clean_relative(relative)?;
    let history_root = root.join(META).join("history");
    let mut records = Vec::new();
    let entries = match fs::read_dir(history_root) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(records),
        Err(error) => return Err(format!("LIST_HISTORY: {error}")),
    };
    for entry in entries {
        let record_path = entry
            .map_err(|error| format!("LIST_HISTORY: {error}"))?
            .path()
            .join("checkpoint.json");
        let record: Checkpoint = serde_json::from_slice(
            &fs::read(record_path).map_err(|error| format!("LIST_HISTORY: {error}"))?,
        )
        .map_err(|error| format!("INVALID_CHECKPOINT: {error}"))?;
        if record.path == safe {
            records.push(record);
        }
    }
    records.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    Ok(records)
}

pub fn restore_history(
    root: &Path,
    checkpoint_id: &str,
    expected_hash: &str,
) -> Result<SaveResult, String> {
    if checkpoint_id.is_empty()
        || !checkpoint_id.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.')
        })
    {
        return Err("INVALID_CHECKPOINT: Checkpoint identifier is invalid.".into());
    }
    let directory = root.join(META).join("history").join(checkpoint_id);
    let record: Checkpoint = serde_json::from_slice(
        &fs::read(directory.join("checkpoint.json"))
            .map_err(|error| format!("READ_CHECKPOINT: {error}"))?,
    )
    .map_err(|error| format!("INVALID_CHECKPOINT: {error}"))?;
    let safe = clean_relative(&record.path)?;
    let bytes = fs::read(directory.join(safe.split('/').collect::<PathBuf>()))
        .map_err(|error| format!("READ_CHECKPOINT: {error}"))?;
    let content = String::from_utf8(bytes)
        .map_err(|_| "INVALID_UTF8: Checkpoint is not valid UTF-8.".to_string())?;
    save_note(root, &record.path, &content, Some(expected_hash))
}

fn is_inside(parent: &Path, candidate: &Path) -> bool {
    candidate == parent || candidate.starts_with(parent)
}

fn canonical_intent(path: &Path) -> Result<PathBuf, String> {
    let absolute = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|error| format!("PATH_ACCESS: {error}"))?
            .join(path)
    };
    let mut existing = absolute.as_path();
    let mut missing = Vec::new();
    while !existing.exists() {
        missing.push(
            existing
                .file_name()
                .ok_or("PATH_ACCESS: Destination has no existing ancestor.")?
                .to_os_string(),
        );
        existing = existing
            .parent()
            .ok_or("PATH_ACCESS: Destination has no existing ancestor.")?;
    }
    let mut resolved = existing
        .canonicalize()
        .map_err(|error| format!("PATH_ACCESS: {error}"))?;
    for component in missing.into_iter().rev() {
        resolved.push(component);
    }
    Ok(resolved)
}

pub fn create_snapshot(root: &Path, destination: &str) -> Result<Snapshot, String> {
    let source_root = root
        .canonicalize()
        .map_err(|error| format!("WORKSPACE_ACCESS: {error}"))?;
    let intended_destination = canonical_intent(Path::new(destination))?;
    if is_inside(&source_root, &intended_destination)
        || is_inside(&intended_destination, &source_root)
    {
        return Err(
            "UNSAFE_DESTINATION: Backup destination must be separate from the workspace.".into(),
        );
    }
    let destination = open_workspace(destination, true)?;
    let snapshots = destination.join("lantern-snapshots");
    fs::create_dir_all(&snapshots).map_err(|error| format!("CREATE_SNAPSHOT: {error}"))?;
    let id = format!(
        "{}-{}",
        OffsetDateTime::now_utc()
            .format(&Rfc3339)
            .map_err(|error| error.to_string())?
            .replace(':', "-"),
        &Uuid::new_v4().to_string()[..8]
    );
    let temporary = snapshots.join(format!(".incomplete-{id}"));
    let final_path = snapshots.join(&id);
    fs::create_dir_all(temporary.join("files"))
        .map_err(|error| format!("CREATE_SNAPSHOT: {error}"))?;
    let result = (|| {
        let mut source_files = Vec::new();
        walk_files(&source_root, &source_root, &mut source_files)?;
        let mut files = Vec::new();
        for (source, relative) in source_files {
            let data = fs::read(source).map_err(|error| format!("SNAPSHOT_READ: {error}"))?;
            let output = temporary
                .join("files")
                .join(relative.split('/').collect::<PathBuf>());
            if let Some(parent) = output.parent() {
                fs::create_dir_all(parent).map_err(|error| format!("SNAPSHOT_WRITE: {error}"))?;
            }
            fs::write(output, &data).map_err(|error| format!("SNAPSHOT_WRITE: {error}"))?;
            files.push(SnapshotFile {
                path: relative,
                bytes: data.len() as u64,
                sha256: hash(&data),
            });
        }
        files.sort_by_key(|left| left.path.to_lowercase());
        let mut snapshot = Snapshot {
            schema: 1,
            id: id.clone(),
            created_at: OffsetDateTime::now_utc()
                .format(&Rfc3339)
                .map_err(|error| error.to_string())?,
            source: source_root.to_string_lossy().to_string(),
            files,
            path: final_path.to_string_lossy().to_string(),
            verified: true,
        };
        let manifest = serde_json::json!({
            "schema": snapshot.schema,
            "id": snapshot.id,
            "createdAt": snapshot.created_at,
            "source": snapshot.source,
            "files": snapshot.files
        });
        fs::write(
            temporary.join("manifest.json"),
            format!("{}\n", serde_json::to_string_pretty(&manifest).unwrap()),
        )
        .map_err(|error| format!("SNAPSHOT_MANIFEST: {error}"))?;
        verify_snapshot_path(&temporary)?;
        fs::rename(&temporary, &final_path).map_err(|error| format!("SNAPSHOT_COMMIT: {error}"))?;
        snapshot.path = final_path.to_string_lossy().to_string();
        Ok(snapshot)
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(&temporary);
    }
    result
}

pub fn verify_snapshot_path(snapshot_path: &Path) -> Result<Snapshot, String> {
    let root = snapshot_path
        .canonicalize()
        .map_err(|error| format!("SNAPSHOT_NOT_FOUND: {error}"))?;
    let value: serde_json::Value = serde_json::from_slice(
        &fs::read(root.join("manifest.json"))
            .map_err(|error| format!("SNAPSHOT_MANIFEST: {error}"))?,
    )
    .map_err(|error| format!("SNAPSHOT_MANIFEST: {error}"))?;
    let files: Vec<SnapshotFile> = serde_json::from_value(
        value
            .get("files")
            .cloned()
            .ok_or("SNAPSHOT_MANIFEST: files missing")?,
    )
    .map_err(|error| format!("SNAPSHOT_MANIFEST: {error}"))?;
    let mut unique_paths = HashSet::new();
    for entry in &files {
        let relative = clean_snapshot_relative(&entry.path)?;
        if !unique_paths.insert(relative.to_lowercase()) {
            return Err(format!(
                "SNAPSHOT_CORRUPT: Duplicate or case-colliding path {}",
                entry.path
            ));
        }
        let file = root
            .join("files")
            .join(relative.split('/').collect::<PathBuf>());
        let metadata =
            fs::symlink_metadata(&file).map_err(|error| format!("SNAPSHOT_CORRUPT: {error}"))?;
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err(format!("SNAPSHOT_CORRUPT: Invalid file {}", entry.path));
        }
        let data = fs::read(file).map_err(|error| format!("SNAPSHOT_CORRUPT: {error}"))?;
        if data.len() as u64 != entry.bytes || hash(&data) != entry.sha256 {
            return Err(format!(
                "SNAPSHOT_CORRUPT: Verification failed for {}",
                entry.path
            ));
        }
    }
    Ok(Snapshot {
        schema: value
            .get("schema")
            .and_then(|item| item.as_u64())
            .unwrap_or(0) as u8,
        id: value
            .get("id")
            .and_then(|item| item.as_str())
            .unwrap_or_default()
            .to_string(),
        created_at: value
            .get("createdAt")
            .and_then(|item| item.as_str())
            .unwrap_or_default()
            .to_string(),
        source: value
            .get("source")
            .and_then(|item| item.as_str())
            .unwrap_or_default()
            .to_string(),
        files,
        path: root.to_string_lossy().to_string(),
        verified: true,
    })
}

pub fn list_snapshots(destination: &str) -> Result<Vec<Snapshot>, String> {
    let root = PathBuf::from(destination).join("lantern-snapshots");
    let entries = match fs::read_dir(root) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => return Err(format!("LIST_SNAPSHOTS: {error}")),
    };
    let mut output = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|error| format!("LIST_SNAPSHOTS: {error}"))?;
        if entry
            .file_name()
            .to_string_lossy()
            .starts_with(".incomplete-")
        {
            continue;
        }
        match verify_snapshot_path(&entry.path()) {
            Ok(snapshot) => output.push(snapshot),
            Err(_) => output.push(Snapshot {
                schema: 0,
                id: entry.file_name().to_string_lossy().to_string(),
                created_at: String::new(),
                source: String::new(),
                files: Vec::new(),
                path: entry.path().to_string_lossy().to_string(),
                verified: false,
            }),
        }
    }
    output.sort_by(|left, right| right.created_at.cmp(&left.created_at));
    Ok(output)
}

pub fn restore_snapshot(snapshot_path: &str, destination: &str) -> Result<RestoreResult, String> {
    let snapshot = verify_snapshot_path(Path::new(snapshot_path))?;
    let target = PathBuf::from(destination);
    if target.exists()
        && fs::read_dir(&target)
            .map_err(|error| format!("RESTORE_DESTINATION: {error}"))?
            .next()
            .is_some()
    {
        return Err("RESTORE_NOT_EMPTY: Restore destination must be new or empty.".into());
    }
    let parent = target
        .parent()
        .ok_or("RESTORE_DESTINATION: Destination has no parent.")?;
    fs::create_dir_all(parent).map_err(|error| format!("RESTORE_DESTINATION: {error}"))?;
    let staging = parent.join(format!(".lantern-restore-{}", Uuid::new_v4()));
    let result = (|| {
        fs::create_dir(&staging).map_err(|error| format!("RESTORE_STAGE: {error}"))?;
        for entry in &snapshot.files {
            let relative = clean_snapshot_relative(&entry.path)?;
            let source = Path::new(&snapshot.path)
                .join("files")
                .join(relative.split('/').collect::<PathBuf>());
            let output = staging.join(relative.split('/').collect::<PathBuf>());
            if let Some(parent) = output.parent() {
                fs::create_dir_all(parent).map_err(|error| format!("RESTORE_WRITE: {error}"))?;
            }
            fs::copy(source, &output).map_err(|error| format!("RESTORE_WRITE: {error}"))?;
            let data =
                fs::read(output).map_err(|error| format!("RESTORE_VERIFY_FAILED: {error}"))?;
            if hash(&data) != entry.sha256 {
                return Err(format!("RESTORE_VERIFY_FAILED: {}", entry.path));
            }
        }
        if target.exists() {
            fs::remove_dir(&target).map_err(|error| format!("RESTORE_DESTINATION: {error}"))?;
        }
        fs::rename(&staging, &target).map_err(|error| format!("RESTORE_COMMIT: {error}"))?;
        Ok(RestoreResult {
            destination: target.to_string_lossy().to_string(),
            files: snapshot.files.len(),
            verified: true,
        })
    })();
    if result.is_err() {
        let _ = fs::remove_dir_all(&staging);
    }
    result
}

#[cfg(windows)]
fn atomic_replace(temporary: &Path, target: &Path) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::Storage::FileSystem::{
        MoveFileExW, MOVEFILE_REPLACE_EXISTING, MOVEFILE_WRITE_THROUGH,
    };
    let from: Vec<u16> = temporary.as_os_str().encode_wide().chain(Some(0)).collect();
    let to: Vec<u16> = target.as_os_str().encode_wide().chain(Some(0)).collect();
    let result = unsafe {
        MoveFileExW(
            from.as_ptr(),
            to.as_ptr(),
            MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH,
        )
    };
    if result == 0 {
        return Err(format!(
            "ATOMIC_REPLACE: {}",
            std::io::Error::last_os_error()
        ));
    }
    Ok(())
}

#[cfg(not(windows))]
fn atomic_replace(temporary: &Path, target: &Path) -> Result<(), String> {
    fs::rename(temporary, target).map_err(|error| format!("ATOMIC_REPLACE: {error}"))
}

pub(crate) fn write_bytes_atomic(target: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("CREATE_PARENT: {error}"))?;
    }
    let temporary = target.with_extension(format!(
        "{}.lantern-tmp-{}",
        target
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("file"),
        Uuid::new_v4()
    ));
    let result = (|| {
        let mut file = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)
            .map_err(|error| format!("TEMP_WRITE: {error}"))?;
        file.write_all(bytes)
            .map_err(|error| format!("TEMP_WRITE: {error}"))?;
        file.sync_all()
            .map_err(|error| format!("TEMP_SYNC: {error}"))?;
        atomic_replace(&temporary, target)
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

pub fn save_note(
    root: &Path,
    relative: &str,
    content: &str,
    expected_hash: Option<&str>,
) -> Result<SaveResult, String> {
    let (target, safe) = resolve_note(root, relative)?;
    let current = match fs::read(&target) {
        Ok(bytes) => Some(bytes),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
        Err(error) => return Err(format!("READ_BEFORE_SAVE: {error}")),
    };
    let current_hash = current.as_deref().map(hash);
    if expected_hash != current_hash.as_deref() {
        return Err(format!(
            "EXTERNAL_CHANGE: expected={} current={}",
            expected_hash.unwrap_or("null"),
            current_hash.as_deref().unwrap_or("null")
        ));
    }
    let next = content.as_bytes();
    if current.as_deref() == Some(next) {
        return Ok(SaveResult {
            path: safe,
            hash: current_hash.unwrap(),
            unchanged: true,
            checkpoint_id: None,
        });
    }
    let checkpoint_id = current
        .as_deref()
        .map(|bytes| checkpoint(root, &safe, bytes))
        .transpose()?;
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("CREATE_NOTE_FOLDER: {error}"))?;
    }
    write_bytes_atomic(&target, next)?;
    let verified = fs::read(&target).map_err(|error| format!("VERIFY_SAVE: {error}"))?;
    if verified != next {
        return Err("VERIFY_FAILED: Saved bytes did not verify.".into());
    }
    Ok(SaveResult {
        path: safe,
        hash: hash(&verified),
        unchanged: false,
        checkpoint_id,
    })
}

#[cfg(test)]
pub fn build_search_index(root: &Path) -> Result<SearchIndex, String> {
    let mut notes = Vec::new();
    for relative in list_markdown(root)? {
        let note = read_note(root, &relative)?;
        notes.push(IndexedNote {
            path: relative,
            lower: note.content.to_lowercase(),
            bytes: note.content.len() as u64,
            modified_at: note.modified_at,
            content: note.content,
        });
    }
    Ok(SearchIndex { notes })
}

pub fn search_cache_key(root: &Path) -> String {
    hash(root.to_string_lossy().to_lowercase().as_bytes())
}

pub fn build_search_index_cached(
    root: &Path,
    cache_file: &Path,
) -> Result<(SearchIndex, SearchIndexReport), String> {
    build_search_index_cached_controlled(root, cache_file, &AtomicBool::new(false), |_, _| {})
}

pub fn build_search_index_cached_controlled<F>(
    root: &Path,
    cache_file: &Path,
    cancelled: &AtomicBool,
    mut progress: F,
) -> Result<(SearchIndex, SearchIndexReport), String>
where
    F: FnMut(usize, usize),
{
    let mut cache_recovered = false;
    let cached = match fs::read(cache_file) {
        Ok(bytes) => match serde_json::from_slice::<SearchIndex>(&bytes) {
            Ok(index) => index,
            Err(_) => {
                cache_recovered = true;
                SearchIndex { notes: Vec::new() }
            }
        },
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            SearchIndex { notes: Vec::new() }
        }
        Err(error) => return Err(format!("SEARCH_CACHE_READ: {error}")),
    };
    let mut prior = cached
        .notes
        .into_iter()
        .map(|note| (note.path.clone(), note))
        .collect::<HashMap<_, _>>();
    let paths = list_markdown(root)?;
    let total = paths.len();
    progress(0, total);
    let mut notes = Vec::with_capacity(paths.len());
    let mut reused = 0;
    let mut refreshed = 0;
    for (position, relative) in paths.into_iter().enumerate() {
        if cancelled.load(Ordering::Relaxed) {
            return Err(
                "SEARCH_CANCELLED: Indexing was cancelled; the prior cache remains valid.".into(),
            );
        }
        let (absolute, safe) = resolve_note(root, &relative)?;
        let metadata = fs::metadata(&absolute).map_err(|error| format!("SEARCH_INDEX: {error}"))?;
        let modified_at = metadata
            .modified()
            .map_err(|error| format!("SEARCH_INDEX: {error}"))?
            .duration_since(UNIX_EPOCH)
            .map_err(|error| format!("SEARCH_INDEX: {error}"))?
            .as_millis();
        if let Some(note) = prior.remove(&safe) {
            if note.bytes == metadata.len() && note.modified_at == modified_at {
                reused += 1;
                notes.push(note);
                progress(position + 1, total);
                continue;
            }
        }
        let note = read_note(root, &safe)?;
        notes.push(IndexedNote {
            path: safe,
            lower: note.content.to_lowercase(),
            bytes: note.content.len() as u64,
            modified_at: note.modified_at,
            content: note.content,
        });
        refreshed += 1;
        progress(position + 1, total);
    }
    progress(total, total);
    notes.sort_by_key(|note| note.path.to_lowercase());
    let removed = prior.len();
    let index = SearchIndex { notes };
    let bytes =
        serde_json::to_vec(&index).map_err(|error| format!("SEARCH_CACHE_WRITE: {error}"))?;
    write_bytes_atomic(cache_file, &bytes)?;
    let report = SearchIndexReport {
        total: index.notes.len(),
        reused,
        refreshed,
        removed,
        cache_recovered,
    };
    Ok((index, report))
}

pub fn search_index(index: &SearchIndex, query: &str) -> Result<Vec<SearchResult>, String> {
    let needle = query.trim().to_lowercase();
    if needle.is_empty() {
        return Ok(Vec::new());
    }
    let mut results = Vec::new();
    for note in &index.notes {
        if let Some(match_index) = note.lower.find(&needle) {
            let mut start = match_index.saturating_sub(60);
            while start > 0 && !note.content.is_char_boundary(start) {
                start -= 1;
            }
            let mut end = (match_index + needle.len() + 100).min(note.content.len());
            while end < note.content.len() && !note.content.is_char_boundary(end) {
                end += 1;
            }
            results.push(SearchResult {
                path: note.path.clone(),
                snippet: note.content[start..end]
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" "),
            });
        } else if note.path.to_lowercase().contains(&needle) {
            results.push(SearchResult {
                path: note.path.clone(),
                snippet: String::new(),
            });
        }
        if results.len() == 100 {
            break;
        }
    }
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Instant;

    fn fixture() -> PathBuf {
        let root = std::env::temp_dir().join(format!("lantern-rust-test-{}", Uuid::new_v4()));
        fs::create_dir(&root).unwrap();
        root
    }

    #[test]
    fn workspace_dashboard_collects_tasks_and_scalar_properties_without_fenced_examples() {
        let root = fixture();
        fs::write(
            root.join("Plan.md"),
            "---\ntype: project\nstatus: active\n---\n- [ ] Ship\n[[Roadmap]]\n![[image.png]]\n> [!note] Context\n```\n- [ ] Example\n```\n- [x] Done",
        )
        .unwrap();
        fs::write(
            root.join("Plan.canvas"),
            r#"{"nodes":[{"id":"a","type":"text","text":"Safe","x":0,"y":0}],"edges":[]}"#,
        )
        .unwrap();
        let dashboard = workspace_dashboard(&root).unwrap();
        assert_eq!(dashboard.notes[0].properties["type"], "project");
        assert_eq!(dashboard.tasks.len(), 2);
        assert_eq!(dashboard.tasks[0].line, 5);
        assert!(!dashboard.tasks[0].completed);
        assert!(dashboard.tasks[1].completed);
        let report = compatibility_report(&root).unwrap();
        assert_eq!(report.markdown_notes, 1);
        assert_eq!(report.wikilinks, 2);
        assert_eq!(report.embeds, 1);
        assert_eq!(report.callouts, 1);
        assert_eq!(report.frontmatter_notes, 1);
        assert_eq!(report.canvases, 1);
        let canvas = read_canvas(&root, "Plan.canvas").unwrap();
        assert_eq!(canvas["nodes"].as_array().unwrap().len(), 1);
        assert!(read_canvas(&root, "../Plan.canvas").is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn unicode_save_read_search_and_conflict_are_lossless() {
        let root = fixture();
        let saved = save_note(&root, "研究/Résumé.md", "# Café 🏮\n\nNeedle phrase", None).unwrap();
        let opened = read_note(&root, "研究/Résumé.md").unwrap();
        assert_eq!(opened.content, "# Café 🏮\n\nNeedle phrase");
        let index = build_search_index(&root).unwrap();
        assert_eq!(
            search_index(&index, "needle").unwrap()[0].path,
            "研究/Résumé.md"
        );
        fs::write(root.join("研究").join("Résumé.md"), "external").unwrap();
        let error = save_note(&root, "研究/Résumé.md", "draft", Some(&saved.hash)).unwrap_err();
        assert!(error.starts_with("EXTERNAL_CHANGE:"));
        assert_eq!(
            fs::read_to_string(root.join("研究").join("Résumé.md")).unwrap(),
            "external"
        );
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn save_checkpoints_old_bytes_and_rejects_escape() {
        let root = fixture();
        let first = save_note(&root, "Note.md", "old", None).unwrap();
        let second = save_note(&root, "Note.md", "new", Some(&first.hash)).unwrap();
        let checkpoint = second.checkpoint_id.unwrap();
        assert_eq!(
            fs::read(
                root.join(META)
                    .join("history")
                    .join(&checkpoint)
                    .join("Note.md")
            )
            .unwrap(),
            b"old"
        );
        let history = list_history(&root, "Note.md").unwrap();
        assert_eq!(history[0].id, checkpoint);
        let current = read_note(&root, "Note.md").unwrap();
        restore_history(&root, &checkpoint, &current.hash).unwrap();
        assert_eq!(read_note(&root, "Note.md").unwrap().content, "old");
        assert!(save_note(&root, "../escape.md", "bad", None)
            .unwrap_err()
            .starts_with("PATH_ESCAPE:"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn snapshot_preserves_attachments_detects_corruption_and_restores_atomically() {
        let root = fixture();
        let backups = fixture();
        fs::create_dir(root.join("Attachments")).unwrap();
        fs::write(root.join("Note.md"), "# Source\n").unwrap();
        fs::write(
            root.join("Attachments").join("artifact.bin"),
            [0, 1, 2, 255],
        )
        .unwrap();
        let snapshot = create_snapshot(&root, backups.to_str().unwrap()).unwrap();
        assert!(
            verify_snapshot_path(Path::new(&snapshot.path))
                .unwrap()
                .verified
        );
        let restored = root
            .parent()
            .unwrap()
            .join(format!("lantern-restored-{}", Uuid::new_v4()));
        let result = restore_snapshot(&snapshot.path, restored.to_str().unwrap()).unwrap();
        assert_eq!(result.files, 2);
        assert_eq!(
            fs::read(restored.join("Attachments").join("artifact.bin")).unwrap(),
            [0, 1, 2, 255]
        );
        fs::write(
            Path::new(&snapshot.path).join("files").join("Note.md"),
            "tampered",
        )
        .unwrap();
        assert!(verify_snapshot_path(Path::new(&snapshot.path))
            .unwrap_err()
            .starts_with("SNAPSHOT_CORRUPT:"));
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(backups).unwrap();
        fs::remove_dir_all(restored).unwrap();
    }

    #[test]
    fn snapshot_rejects_nested_destinations_and_nonempty_restore_targets() {
        let root = fixture();
        fs::write(root.join("Note.md"), "safe").unwrap();
        let nested = root.join("Backup");
        assert!(create_snapshot(&root, nested.to_str().unwrap())
            .unwrap_err()
            .starts_with("UNSAFE_DESTINATION:"));
        assert!(!nested.exists());
        let backups = fixture();
        let snapshot = create_snapshot(&root, backups.to_str().unwrap()).unwrap();
        let target = fixture();
        fs::write(target.join("existing.txt"), "keep").unwrap();
        assert!(restore_snapshot(&snapshot.path, target.to_str().unwrap())
            .unwrap_err()
            .starts_with("RESTORE_NOT_EMPTY:"));
        assert_eq!(
            fs::read_to_string(target.join("existing.txt")).unwrap(),
            "keep"
        );
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(backups).unwrap();
        fs::remove_dir_all(target).unwrap();
    }

    #[test]
    fn link_context_resolves_aliases_backlinks_and_reports_ambiguity() {
        let root = fixture();
        fs::create_dir(root.join("Projects")).unwrap();
        fs::create_dir(root.join("Archive")).unwrap();
        fs::write(
            root.join("Home.md"),
            "# Home\n[[Projects/Plan#Next|Roadmap]]\n[[Missing]]\n[[Duplicate]]\n```\n[[Ignored]]\n```\n",
        )
        .unwrap();
        fs::write(
            root.join("Projects").join("Plan.md"),
            "# Plan\n## Next\n[[Home]]",
        )
        .unwrap();
        fs::write(root.join("Projects").join("Duplicate.md"), "# Current").unwrap();
        fs::write(root.join("Archive").join("Duplicate.md"), "# Old").unwrap();
        let home = note_context(&root, "Home.md").unwrap();
        assert_eq!(home.outline[0].text, "Home");
        assert_eq!(home.outgoing[0].path.as_deref(), Some("Projects/Plan.md"));
        assert_eq!(home.outgoing[0].alias.as_deref(), Some("Roadmap"));
        assert_eq!(home.outgoing[1].status, "missing");
        assert_eq!(home.outgoing[2].status, "ambiguous");
        assert_eq!(home.outgoing[2].candidates.len(), 2);
        assert_eq!(home.backlinks[0].source, "Projects/Plan.md");
        let plan = note_context(&root, "Projects/Plan.md").unwrap();
        assert_eq!(plan.outgoing[0].path.as_deref(), Some("Home.md"));
        assert_eq!(plan.diagnostic_count, 2);
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn recovery_journal_is_atomic_scoped_and_clearable() {
        let root = fixture();
        fs::write(root.join("Note.md"), "disk").unwrap();
        let disk = read_note(&root, "Note.md").unwrap();
        let draft = write_recovery(&root, "Note.md", "unsaved café", Some(&disk.hash)).unwrap();
        assert_eq!(draft.content, "unsaved café");
        assert_eq!(
            read_recovery(&root, "Note.md")
                .unwrap()
                .unwrap()
                .expected_hash,
            Some(disk.hash)
        );
        assert_eq!(fs::read_to_string(root.join("Note.md")).unwrap(), "disk");
        assert!(write_recovery(&root, "../escape.md", "bad", None).is_err());
        clear_recovery(&root, "Note.md").unwrap();
        assert!(read_recovery(&root, "Note.md").unwrap().is_none());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn rejects_ntfs_streams_device_names_and_nonportable_aliases() {
        let root = fixture();
        for path in [
            "Note.md:secret.md",
            "CON.md",
            "folder/NUL.md",
            "trailing./Note.md",
            "question?/Note.md",
        ] {
            assert!(
                save_note(&root, path, "blocked", None)
                    .unwrap_err()
                    .starts_with("INVALID_PORTABLE_PATH:"),
                "{path}"
            );
        }
        assert!(fs::read_dir(&root).unwrap().next().is_none());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn rejects_case_colliding_snapshot_manifest_paths() {
        let root = fixture();
        let snapshot = root.join("snapshot");
        fs::create_dir_all(snapshot.join("files")).unwrap();
        fs::write(snapshot.join("files").join("Note.md"), "same").unwrap();
        let entry = serde_json::json!({
            "path": "Note.md",
            "bytes": 4,
            "sha256": hash(b"same")
        });
        fs::write(
            snapshot.join("manifest.json"),
            serde_json::to_vec(&serde_json::json!({
                "schema": 1,
                "id": "malicious",
                "createdAt": "",
                "source": "",
                "files": [entry, {
                    "path": "note.md",
                    "bytes": 4,
                    "sha256": hash(b"same")
                }]
            }))
            .unwrap(),
        )
        .unwrap();
        assert!(verify_snapshot_path(&snapshot)
            .unwrap_err()
            .starts_with("SNAPSHOT_CORRUPT: Duplicate"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    #[ignore = "measured release benchmark"]
    fn benchmark_search_10k_synthetic_notes() {
        let root = fixture();
        let start_create = Instant::now();
        for index in 0..10_000 {
            let folder = root.join(format!("folder-{:02}", index % 50));
            fs::create_dir_all(&folder).unwrap();
            let marker = if index == 9_999 {
                " distribution-readiness-marker"
            } else {
                ""
            };
            fs::write(
                folder.join(format!("Note-{index:05}.md")),
                format!(
                    "# Synthetic note {index}\n\nOrdinary Markdown benchmark content.{marker}\n"
                ),
            )
            .unwrap();
        }
        let create_ms = start_create.elapsed().as_millis();
        let start_list = Instant::now();
        let listed = list_markdown(&root).unwrap();
        let list_ms = start_list.elapsed().as_millis();
        let cache_root = fixture();
        let cache = cache_root.join("index.json");
        let start_index = Instant::now();
        let (index, first_report) = build_search_index_cached(&root, &cache).unwrap();
        let index_ms = start_index.elapsed().as_millis();
        let start_reopen = Instant::now();
        let (_, reopen_report) = build_search_index_cached(&root, &cache).unwrap();
        let reopen_ms = start_reopen.elapsed().as_millis();
        let start_search = Instant::now();
        let results = search_index(&index, "distribution-readiness-marker").unwrap();
        let warm_search_us = start_search.elapsed().as_micros();
        assert_eq!(listed.len(), 10_000);
        assert_eq!(results.len(), 1);
        assert_eq!(first_report.refreshed, 10_000);
        assert_eq!(reopen_report.reused, 10_000);
        println!(
            "{{\"notes\":10000,\"createMs\":{create_ms},\"listMs\":{list_ms},\"coldIndexMs\":{index_ms},\"incrementalReopenMs\":{reopen_ms},\"warmSearchUs\":{warm_search_us}}}"
        );
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(cache_root).unwrap();
    }

    #[test]
    fn persistent_search_cache_is_incremental_disposable_and_self_healing() {
        let root = fixture();
        let cache_root = fixture();
        let cache = cache_root.join("index.json");
        fs::write(root.join("One.md"), "alpha").unwrap();
        fs::write(root.join("Two.md"), "beta").unwrap();
        let (first, first_report) = build_search_index_cached(&root, &cache).unwrap();
        assert_eq!(first_report.refreshed, 2);
        assert_eq!(search_index(&first, "alpha").unwrap().len(), 1);
        let (_, second_report) = build_search_index_cached(&root, &cache).unwrap();
        assert_eq!(second_report.reused, 2);
        let prior_cache = fs::read(&cache).unwrap();
        let cancelled = AtomicBool::new(true);
        let cancellation_error =
            build_search_index_cached_controlled(&root, &cache, &cancelled, |_, _| {})
                .err()
                .expect("cancelled build must fail");
        assert!(cancellation_error.starts_with("SEARCH_CANCELLED:"));
        assert_eq!(fs::read(&cache).unwrap(), prior_cache);
        fs::write(root.join("One.md"), "alpha changed").unwrap();
        fs::remove_file(root.join("Two.md")).unwrap();
        let (third, third_report) = build_search_index_cached(&root, &cache).unwrap();
        assert_eq!(third_report.refreshed, 1);
        assert_eq!(third_report.removed, 1);
        assert!(search_index(&third, "beta").unwrap().is_empty());
        fs::write(&cache, "corrupt cache").unwrap();
        let (recovered, report) = build_search_index_cached(&root, &cache).unwrap();
        assert!(report.cache_recovered);
        assert_eq!(search_index(&recovered, "changed").unwrap().len(), 1);
        assert_eq!(
            fs::read_to_string(root.join("One.md")).unwrap(),
            "alpha changed"
        );
        fs::remove_dir_all(root).unwrap();
        fs::remove_dir_all(cache_root).unwrap();
    }
}
