use crate::native_core;
use reqwest::{blocking::Client, redirect::Policy, Url};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs,
    io::Read,
    net::{IpAddr, SocketAddr, ToSocketAddrs},
    path::{Path, PathBuf},
    sync::Mutex,
    time::Duration,
};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};
use uuid::Uuid;

const MAX_LOCAL: u64 = 25 * 1024 * 1024;
const MAX_WEB: u64 = 5 * 1024 * 1024;
const VERSION: &str = "lantern-native-ingestion/0.2.0";

#[derive(Default)]
pub struct PreviewStore(pub Mutex<HashMap<String, PreviewRecord>>);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Provenance {
    pub source_kind: String,
    pub source: String,
    pub canonical_url: Option<String>,
    pub captured_at: String,
    pub content_hash: String,
    pub original_hash: String,
    pub extractor: String,
    pub extractor_status: String,
    pub original_attachment: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Duplicate {
    pub note_path: String,
    pub canonical_url: Option<String>,
    pub content_hash: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Preview {
    pub id: String,
    pub title: String,
    pub content: String,
    pub suggested_name: String,
    pub extractor_status: String,
    pub provenance: Provenance,
    pub duplicate: Option<Duplicate>,
    pub warnings: Vec<String>,
}

#[derive(Clone)]
pub struct PreviewRecord {
    public: Preview,
    root: PathBuf,
    source_path: Option<PathBuf>,
    preserve_original: bool,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct IndexRecord {
    note_path: String,
    canonical_url: Option<String>,
    content_hash: String,
}

#[derive(Deserialize, Serialize)]
struct Index {
    schema: u8,
    records: Vec<IndexRecord>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitResult {
    pub note_path: String,
    pub attachment: Option<String>,
    pub provenance: Provenance,
    pub duplicate_override: bool,
}

fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn safe_name(value: &str, fallback: &str) -> String {
    let cleaned = value
        .chars()
        .map(|c| {
            if c.is_control() || r#"<>:"/\|?*"#.contains(c) {
                ' '
            } else {
                c
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim_end_matches(['.', ' '])
        .to_string();
    let selected = if cleaned.is_empty() {
        fallback
    } else {
        &cleaned
    };
    selected.chars().take(120).collect()
}

fn decode_entities(value: &str) -> String {
    value
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
}

fn remove_block(mut value: String, tag: &str) -> String {
    loop {
        let lower = value.to_lowercase();
        let Some(start) = lower.find(&format!("<{tag}")) else {
            break;
        };
        let Some(close) = lower[start..].find(&format!("</{tag}>")) else {
            let end = lower[start..]
                .find('>')
                .map_or(value.len(), |offset| start + offset + 1);
            value.replace_range(start..end, "");
            continue;
        };
        let end = start + close + tag.len() + 3;
        value.replace_range(start..end, "");
    }
    value
}

fn strip_tags(value: &str) -> String {
    let mut output = String::new();
    let mut inside = false;
    for character in value.chars() {
        match character {
            '<' => inside = true,
            '>' => {
                inside = false;
                output.push(' ');
            }
            _ if !inside => output.push(character),
            _ => {}
        }
    }
    decode_entities(&output)
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn html_extract(html: &str) -> (String, String, Option<String>) {
    let lower = html.to_lowercase();
    let title = lower
        .find("<title")
        .and_then(|start| lower[start..].find('>').map(|offset| start + offset + 1))
        .and_then(|start| {
            lower[start..]
                .find("</title>")
                .map(|offset| strip_tags(&html[start..start + offset]))
        })
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "Captured page".into());
    let canonical = lower.find("rel=\"canonical\"").and_then(|position| {
        let start = lower[..position].rfind('<')?;
        let end = lower[position..]
            .find('>')
            .map(|offset| position + offset)?;
        let tag = &html[start..=end];
        let href = tag.to_lowercase().find("href=")?;
        let tail = tag[href + 5..].trim_start();
        let quote = tail.chars().next()?;
        if quote == '"' || quote == '\'' {
            tail[1..]
                .find(quote)
                .map(|end| tail[1..1 + end].to_string())
        } else {
            Some(
                tail.split_whitespace()
                    .next()?
                    .trim_end_matches('>')
                    .to_string(),
            )
        }
    });
    let mut safe = html.to_string();
    for tag in [
        "script", "style", "noscript", "iframe", "object", "embed", "svg", "math", "form",
        "template",
    ] {
        safe = remove_block(safe, tag);
    }
    for tag in [
        "h1", "h2", "h3", "p", "div", "section", "article", "li", "br",
    ] {
        safe = safe
            .replace(&format!("<{tag}>"), "\n")
            .replace(&format!("</{tag}>"), "\n");
    }
    let content = strip_tags(&safe);
    (title, content, canonical)
}

fn blocked_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ip) => {
            ip.is_private()
                || ip.is_loopback()
                || ip.is_link_local()
                || ip.is_unspecified()
                || ip.is_multicast()
                || ip.octets()[0] == 0
                || ip.octets()[0] >= 224
        }
        IpAddr::V6(ip) => {
            ip.is_loopback()
                || ip.is_unspecified()
                || ip.is_multicast()
                || (ip.segments()[0] & 0xfe00) == 0xfc00
                || (ip.segments()[0] & 0xffc0) == 0xfe80
        }
    }
}

fn validate_url(input: &str) -> Result<(Url, SocketAddr), String> {
    let mut url = Url::parse(input)
        .map_err(|_| "INVALID_URL: Enter a valid public HTTP or HTTPS URL.".to_string())?;
    if !matches!(url.scheme(), "http" | "https") {
        return Err("BLOCKED_SCHEME: Only public HTTP and HTTPS URLs are supported.".into());
    }
    if !url.username().is_empty() || url.password().is_some() {
        return Err("URL_CREDENTIALS: Credential-bearing URLs are blocked.".into());
    }
    let host = url
        .host_str()
        .ok_or("BLOCKED_HOST: URL host is missing.")?
        .trim_end_matches('.')
        .to_lowercase();
    if host == "localhost"
        || host.ends_with(".localhost")
        || host.ends_with(".local")
        || host.ends_with(".internal")
    {
        return Err("BLOCKED_HOST: Local and private hostnames are blocked.".into());
    }
    let port = url
        .port_or_known_default()
        .ok_or("INVALID_URL: URL port is invalid.")?;
    let addresses = (host.as_str(), port)
        .to_socket_addrs()
        .map_err(|error| format!("DNS_FAILED: {error}"))?
        .collect::<Vec<_>>();
    if addresses.is_empty() || addresses.iter().any(|address| blocked_ip(address.ip())) {
        return Err("BLOCKED_DNS: DNS resolved to a blocked or mixed-trust address.".into());
    }
    url.set_fragment(None);
    Ok((url, addresses[0]))
}

fn robots_disallows(text: &str, path: &str) -> bool {
    let mut applies = false;
    for raw in text.lines() {
        let line = raw.split('#').next().unwrap_or("").trim();
        let Some((name, value)) = line.split_once(':') else {
            continue;
        };
        if name.trim().eq_ignore_ascii_case("user-agent") {
            applies = value.trim() == "*";
        }
        if applies && name.trim().eq_ignore_ascii_case("disallow") {
            let rule = value.trim();
            if !rule.is_empty() && path.starts_with(rule) {
                return true;
            }
        }
    }
    false
}

fn fetch_page(input: &str) -> Result<(Url, String, Vec<u8>), String> {
    let mut current = input.to_string();
    for redirect in 0..=3 {
        let (url, address) = validate_url(&current)?;
        let host = url.host_str().unwrap().to_string();
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .redirect(Policy::none())
            .resolve(&host, address)
            .build()
            .map_err(|error| format!("WEB_CLIENT: {error}"))?;
        let robots_url = url
            .join("/robots.txt")
            .map_err(|_| "INVALID_URL: Robots URL is invalid.")?;
        if let Ok(robots) = client.get(robots_url).send() {
            if robots.status().is_success() {
                let mut bytes = Vec::new();
                let _ = robots.take(256 * 1024 + 1).read_to_end(&mut bytes);
                if bytes.len() <= 256 * 1024
                    && robots_disallows(&String::from_utf8_lossy(&bytes), url.path())
                {
                    return Err(
                        "ROBOTS_DISALLOWED: The site robots policy disallows this path.".into(),
                    );
                }
            }
        }
        let response = client
            .get(url.clone())
            .header(
                "user-agent",
                "NimvaraCapture/0.2 (single-page; user-initiated)",
            )
            .send()
            .map_err(|error| format!("WEB_FETCH: {error}"))?;
        if response.status().is_redirection() {
            if redirect == 3 {
                return Err("TOO_MANY_REDIRECTS: Capture exceeded the redirect limit.".into());
            }
            let location = response
                .headers()
                .get("location")
                .and_then(|value| value.to_str().ok())
                .ok_or("BAD_REDIRECT: Redirect destination missing.")?;
            current = url
                .join(location)
                .map_err(|_| "BAD_REDIRECT: Redirect URL is invalid.".to_string())?
                .to_string();
            continue;
        }
        if matches!(response.status().as_u16(), 401 | 403) {
            return Err("ACCESS_CONTROLLED: Nimvara does not bypass access controls.".into());
        }
        if !response.status().is_success() {
            return Err(format!(
                "WEB_STATUS: Capture failed with HTTP {}.",
                response.status()
            ));
        }
        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|value| value.to_str().ok())
            .unwrap_or("")
            .to_lowercase();
        if !content_type.contains("text/html") && !content_type.contains("text/plain") {
            return Err("UNSUPPORTED_WEB_TYPE: Only HTML and plain text can be captured.".into());
        }
        let mut bytes = Vec::new();
        response
            .take(MAX_WEB + 1)
            .read_to_end(&mut bytes)
            .map_err(|error| format!("WEB_READ: {error}"))?;
        if bytes.len() as u64 > MAX_WEB {
            return Err("WEB_TOO_LARGE: Web response exceeded 5 MiB.".into());
        }
        return Ok((url, content_type, bytes));
    }
    Err("TOO_MANY_REDIRECTS: Capture exceeded the redirect limit.".into())
}

fn index(root: &Path) -> Vec<IndexRecord> {
    fs::read(root.join(".lantern").join("ingestion-index.json"))
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Index>(&bytes).ok())
        .map_or(Vec::new(), |index| index.records)
}

fn duplicate(root: &Path, canonical: Option<&str>, content_hash: &str) -> Option<Duplicate> {
    index(root)
        .into_iter()
        .find(|record| {
            canonical.is_some_and(|url| record.canonical_url.as_deref() == Some(url))
                || record.content_hash == content_hash
        })
        .map(|record| Duplicate {
            note_path: record.note_path,
            canonical_url: record.canonical_url,
            content_hash: record.content_hash,
        })
}

fn remember(store: &PreviewStore, record: PreviewRecord) -> Result<Preview, String> {
    let public = record.public.clone();
    store
        .0
        .lock()
        .map_err(|_| "PREVIEW_LOCK: Preview store unavailable.".to_string())?
        .insert(public.id.clone(), record);
    Ok(public)
}

pub fn preview_local(root: &Path, source: &str, store: &PreviewStore) -> Result<Preview, String> {
    let source = PathBuf::from(source)
        .canonicalize()
        .map_err(|_| "SOURCE_NOT_FILE: Select a readable local file.".to_string())?;
    let metadata = fs::metadata(&source)
        .map_err(|_| "SOURCE_NOT_FILE: Select a readable local file.".to_string())?;
    if !metadata.is_file() {
        return Err("SOURCE_NOT_FILE: Select a readable local file.".into());
    }
    if metadata.len() > MAX_LOCAL {
        return Err("LOCAL_TOO_LARGE: Local import exceeded 25 MiB.".into());
    }
    let extension = source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_lowercase();
    if !matches!(
        extension.as_str(),
        "md" | "txt" | "html" | "htm" | "pdf" | "docx"
    ) {
        return Err(
            "UNSUPPORTED_IMPORT: Supported files are Markdown, TXT, HTML, PDF, and DOCX.".into(),
        );
    }
    let original = fs::read(&source).map_err(|error| format!("SOURCE_READ: {error}"))?;
    let original_hash = hash(&original);
    let fallback = source
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("Imported source");
    let mut title = safe_name(fallback, "Imported source");
    let (content, status, preserve, warnings) = match extension.as_str() {
        "md" | "txt" => {
            let text = String::from_utf8(original.clone()).map_err(|_| "INVALID_UTF8: Text import is not valid UTF-8; original was not changed.".to_string())?;
            (text, "complete", false, Vec::new())
        }
        "html" | "htm" => {
            let text = String::from_utf8_lossy(&original);
            let extracted = html_extract(&text);
            if extracted.0 != "Captured page" { title = extracted.0; }
            (extracted.1, "lossy", true, vec!["HTML was sanitized to readable text; the original will be preserved.".into()])
        }
        _ => (format!("> [!warning]\n> Text extraction for .{} is unavailable. The original file is preserved.", extension.to_uppercase()), "preserved-only", true, vec!["Extraction unavailable; the original will be preserved.".into()]),
    };
    let content_hash = hash(content.as_bytes());
    let provenance = Provenance {
        source_kind: "local-file".into(),
        source: source.to_string_lossy().to_string(),
        canonical_url: None,
        captured_at: OffsetDateTime::now_utc().format(&Rfc3339).unwrap(),
        content_hash: content_hash.clone(),
        original_hash,
        extractor: format!("{VERSION}:{extension}"),
        extractor_status: status.into(),
        original_attachment: None,
    };
    let id = Uuid::new_v4().to_string();
    let public = Preview {
        id,
        title: title.clone(),
        content,
        suggested_name: format!("{}.md", safe_name(&title, "Imported source")),
        extractor_status: status.into(),
        duplicate: duplicate(root, None, &content_hash),
        provenance,
        warnings,
    };
    remember(
        store,
        PreviewRecord {
            public,
            root: root.to_path_buf(),
            source_path: Some(source),
            preserve_original: preserve,
        },
    )
}

pub fn preview_url(root: &Path, input: &str, store: &PreviewStore) -> Result<Preview, String> {
    let (url, content_type, bytes) = fetch_page(input)?;
    let decoded = String::from_utf8(bytes.clone())
        .map_err(|_| "INVALID_UTF8: Web response was not valid UTF-8.".to_string())?;
    let (title, content, canonical_hint) = if content_type.contains("html") {
        html_extract(&decoded)
    } else {
        (
            url.host_str().unwrap_or("Captured page").into(),
            decoded.split_whitespace().collect::<Vec<_>>().join(" "),
            None,
        )
    };
    if content.trim().is_empty() {
        return Err("EMPTY_EXTRACTION: No readable text was extracted.".into());
    }
    let canonical = match canonical_hint {
        Some(value) => url.join(&value).unwrap_or(url.clone()),
        None => url.clone(),
    };
    let (canonical, _) = validate_url(canonical.as_str())?;
    let content_hash = hash(content.as_bytes());
    let provenance = Provenance {
        source_kind: "public-url".into(),
        source: url.to_string(),
        canonical_url: Some(canonical.to_string()),
        captured_at: OffsetDateTime::now_utc().format(&Rfc3339).unwrap(),
        content_hash: content_hash.clone(),
        original_hash: hash(&bytes),
        extractor: format!("{VERSION}:html-readable"),
        extractor_status: "lossy".into(),
        original_attachment: None,
    };
    let id = Uuid::new_v4().to_string();
    let public = Preview {
        id,
        title: title.clone(),
        content,
        suggested_name: format!("{}.md", safe_name(&title, "Captured page")),
        extractor_status: "lossy".into(),
        duplicate: duplicate(root, Some(canonical.as_str()), &content_hash),
        provenance,
        warnings: vec!["Web content was sanitized and treated as untrusted data.".into()],
    };
    remember(
        store,
        PreviewRecord {
            public,
            root: root.to_path_buf(),
            source_path: None,
            preserve_original: false,
        },
    )
}

fn provenance_block(value: &Provenance) -> String {
    format!("\n\n## Source provenance\n\n<!-- lantern-provenance:v1\nsource-kind: {:?}\nsource: {:?}\ncanonical-url: {:?}\ncaptured-at: {:?}\ncontent-sha256: {:?}\noriginal-sha256: {:?}\nextractor: {:?}\nextractor-status: {:?}\noriginal-attachment: {:?}\n-->\n",
        value.source_kind, value.source, value.canonical_url.as_deref().unwrap_or(""), value.captured_at, value.content_hash,
        value.original_hash, value.extractor, value.extractor_status, value.original_attachment.as_deref().unwrap_or(""))
}

pub fn cancel(root: &Path, id: &str, store: &PreviewStore) -> Result<bool, String> {
    let mut previews = store
        .0
        .lock()
        .map_err(|_| "PREVIEW_LOCK: Preview store unavailable.".to_string())?;
    if previews
        .get(id)
        .map_or(true, |preview| preview.root != root)
    {
        return Err("PREVIEW_NOT_FOUND: Preview expired or was cancelled.".into());
    }
    previews.remove(id);
    Ok(true)
}

pub fn commit(
    root: &Path,
    id: &str,
    folder: &str,
    note_name: &str,
    allow_duplicate: bool,
    store: &PreviewStore,
) -> Result<CommitResult, String> {
    let mut record = store
        .0
        .lock()
        .map_err(|_| "PREVIEW_LOCK: Preview store unavailable.".to_string())?
        .get(id)
        .cloned()
        .ok_or("PREVIEW_NOT_FOUND: Preview expired or was cancelled.")?;
    if record.root != root {
        return Err("PREVIEW_NOT_FOUND: Preview belongs to another workspace.".into());
    }
    if record.public.duplicate.is_some() && !allow_duplicate {
        return Err("DUPLICATE_FOUND: Confirm duplicate import to continue.".into());
    }
    let folder = folder.replace('\\', "/").trim_matches('/').to_string();
    if folder.split('/').any(|part| matches!(part, "." | "..")) {
        return Err("PATH_ESCAPE: Destination must stay inside the workspace.".into());
    }
    let file = format!(
        "{}.md",
        safe_name(note_name.trim_end_matches(".md"), &record.public.title)
    );
    let relative = if folder.is_empty() {
        file
    } else {
        format!("{folder}/{file}")
    };
    if root
        .join(relative.replace('/', std::path::MAIN_SEPARATOR_STR))
        .exists()
    {
        return Err("TARGET_EXISTS: A note already exists at the destination.".into());
    }
    let mut attachment = None;
    let mut attachment_created = false;
    if record.preserve_original {
        let source = record
            .source_path
            .as_ref()
            .ok_or("SOURCE_NOT_FILE: Original source is unavailable.")?;
        let bytes = fs::read(source).map_err(|error| format!("SOURCE_READ: {error}"))?;
        if hash(&bytes) != record.public.provenance.original_hash {
            return Err("SOURCE_CHANGED: Source changed after preview.".into());
        }
        let extension = source
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("");
        let stem = safe_name(
            source
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("original"),
            "original",
        );
        let path = format!(
            "Attachments/Imports/{}-{}.{}",
            &record.public.provenance.original_hash[..12],
            stem,
            extension
        );
        let output = root.join(path.replace('/', std::path::MAIN_SEPARATOR_STR));
        if !output.exists() {
            fs::create_dir_all(output.parent().unwrap())
                .map_err(|error| format!("ATTACHMENT_WRITE: {error}"))?;
            native_core::write_bytes_atomic(&output, &bytes)?;
            attachment_created = true;
        }
        record.public.provenance.original_attachment = Some(path.clone());
        attachment = Some(path);
    }
    let heading = if record.public.content.trim_start().starts_with("# ") {
        String::new()
    } else {
        format!("# {}\n\n", record.public.title)
    };
    let attachment_line = attachment.as_ref().map_or(String::new(), |path| {
        format!(
            "\n\n[Open preserved original]({})",
            path.replace(' ', "%20")
        )
    });
    let markdown = format!(
        "{heading}{}{}{}",
        record.public.content.trim(),
        attachment_line,
        provenance_block(&record.public.provenance)
    );
    let save = native_core::save_note(root, &relative, &markdown, None);
    if let Err(error) = save {
        if attachment_created {
            if let Some(path) = &attachment {
                let _ =
                    fs::remove_file(root.join(path.replace('/', std::path::MAIN_SEPARATOR_STR)));
            }
        }
        return Err(error);
    }
    let mut records = index(root);
    records.push(IndexRecord {
        note_path: relative.clone(),
        canonical_url: record.public.provenance.canonical_url.clone(),
        content_hash: record.public.provenance.content_hash.clone(),
    });
    let index_path = root.join(".lantern").join("ingestion-index.json");
    if let Err(error) = native_core::write_bytes_atomic(
        &index_path,
        format!(
            "{}\n",
            serde_json::to_string_pretty(&Index { schema: 1, records }).unwrap()
        )
        .as_bytes(),
    ) {
        let _ = fs::remove_file(root.join(relative.replace('/', std::path::MAIN_SEPARATOR_STR)));
        if attachment_created {
            if let Some(path) = &attachment {
                let _ =
                    fs::remove_file(root.join(path.replace('/', std::path::MAIN_SEPARATOR_STR)));
            }
        }
        return Err(format!("INDEX_WRITE: {error}"));
    }
    store.0.lock().unwrap().remove(id);
    Ok(CommitResult {
        note_path: relative,
        attachment,
        provenance: record.public.provenance,
        duplicate_override: allow_duplicate,
    })
}

pub fn capabilities() -> serde_json::Value {
    serde_json::json!({
        "version": VERSION,
        "urlCapture": { "available": true, "mode": "single-public-page", "maxBytes": MAX_WEB, "redirects": 3, "timeoutMs": 10000 },
        "local": {
            ".md": { "extraction": "lossless-text", "preserveOriginal": false },
            ".txt": { "extraction": "utf8-text", "preserveOriginalWhenLossy": true },
            ".html": { "extraction": "sanitized-readable-text", "preserveOriginal": true },
            ".pdf": { "extraction": "unavailable", "preserveOriginal": true },
            ".docx": { "extraction": "unavailable", "preserveOriginal": true }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocks_private_urls_and_sanitizes_active_html() {
        assert!(validate_url("http://127.0.0.1/x")
            .unwrap_err()
            .starts_with("BLOCKED_DNS:"));
        assert!(validate_url("file:///secret")
            .unwrap_err()
            .starts_with("BLOCKED_SCHEME:"));
        let (_, content, _) = html_extract(
            "<title>Safe</title><script>alert(1)</script><h1>Hello</h1><form>steal</form>",
        );
        assert!(content.contains("Hello"));
        assert!(!content.contains("alert"));
        assert!(!content.contains("steal"));
    }

    #[test]
    fn local_preview_commit_preserves_pdf_and_source_bytes() {
        let root = std::env::temp_dir().join(format!("lantern-ingest-root-{}", Uuid::new_v4()));
        let source = std::env::temp_dir().join(format!("lantern-source-{}.pdf", Uuid::new_v4()));
        fs::create_dir(&root).unwrap();
        let bytes = b"%PDF synthetic untrusted";
        fs::write(&source, bytes).unwrap();
        let store = PreviewStore::default();
        let preview = preview_local(&root, source.to_str().unwrap(), &store).unwrap();
        assert_eq!(preview.extractor_status, "preserved-only");
        let result = commit(&root, &preview.id, "Inbox", "Imported", false, &store).unwrap();
        assert!(result.attachment.is_some());
        assert_eq!(fs::read(&source).unwrap(), bytes);
        let index = native_core::build_search_index(&root).unwrap();
        assert!(native_core::search_index(&index, "preserved")
            .unwrap()
            .iter()
            .any(|item| item.path == "Inbox/Imported.md"));
        fs::remove_dir_all(root).unwrap();
        fs::remove_file(source).unwrap();
    }
}
