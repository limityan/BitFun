//! Tauri commands for context capture foundations (status + consent).

use crate::api::app_state::AppState;
use crate::api::session_storage_path::desktop_effective_session_storage_path;
use crate::computer_use::DesktopComputerUseHost;
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use bitfun_core::agentic::tools::computer_use_host::ComputerScreenshot;
use bitfun_core::agentic::tools::computer_use_host::ComputerUseHost;
use bitfun_core::service::config::types::{AppConfig, ContextCaptureConfig};
use image::codecs::jpeg::JpegEncoder;
use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView, RgbImage};
use log::{info, warn};
use muxide::api::{MuxerBuilder, VideoCodec};
use openh264::encoder::{BitRate, Encoder, EncoderConfig, FrameRate, FrameType, UsageType};
use openh264::formats::{RgbSliceU8, YUVBuffer};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs::File;
use std::path::{Component, Path, PathBuf};
use std::sync::{Arc, OnceLock};
use std::time::{Duration as StdDuration, SystemTime};
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

const CONTEXT_CAPTURE_RECORDING_MAX_DURATION_MS: u64 = 10_000;
const CONTEXT_CAPTURE_RECORDING_INTERVAL_MS: u64 = 500;
const CONTEXT_CAPTURE_RECORDING_INTERVAL_MAX_MS: u64 = 1_000;
const CONTEXT_CAPTURE_RECORDING_MAX_RAW_FRAMES: usize = 20;
const CONTEXT_CAPTURE_PRIVACY_VERSION: u32 = 1;
const CONTEXT_CAPTURE_WINDOW_SETTLE_MS: u64 = 300;
const CONTEXT_CAPTURE_ARTIFACT_RETENTION_SECS: u64 = 7 * 24 * 60 * 60;
const CONTEXT_CAPTURE_THUMBNAIL_MAX_LONG_EDGE: u32 = 320;
const CONTEXT_CAPTURE_THUMBNAIL_MAX_BYTES: usize = 80 * 1024;
const CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_LONG_EDGE: u32 = 1440;
const CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_BYTES: usize = 450 * 1024;
const CONTEXT_CAPTURE_RECORDING_VIDEO_MAX_LONG_EDGE: u32 = 960;
const CONTEXT_CAPTURE_RECORDING_VIDEO_MAX_BYTES: usize = 50 * 1024 * 1024;
const CONTEXT_CAPTURE_RECORDING_VIDEO_TARGET_BITRATE_KBPS: u32 = 900;
const CONTEXT_CAPTURE_PERSIST_JPEG_QUALITY_START: u8 = 78;
const CONTEXT_CAPTURE_PERSIST_JPEG_QUALITY_MIN: u8 = 58;
const CONTEXT_CAPTURE_RECORDING_VIDEO_MIME_TYPE: &str = "video/mp4";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextCaptureStatusResponse {
    pub enabled: bool,
    pub screen_capture_granted: bool,
    pub consent_required: bool,
    pub recording_active: bool,
    pub platform_note: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureImageDto {
    pub id: String,
    pub image_path: String,
    pub image_name: String,
    pub mime_type: String,
    pub file_size: usize,
    pub width: u32,
    pub height: u32,
    pub thumbnail_data_url: Option<String>,
    pub source: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureVideoDto {
    pub id: String,
    pub video_path: String,
    pub video_name: String,
    pub mime_type: String,
    pub file_size: usize,
    pub width: u32,
    pub height: u32,
    pub duration_ms: u64,
    pub thumbnail_data_url: Option<String>,
    pub source: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureSessionRequest {
    pub session_id: String,
    pub workspace_path: String,
    #[serde(default)]
    pub remote_connection_id: Option<String>,
    #[serde(default)]
    pub remote_ssh_host: Option<String>,
    #[serde(default)]
    pub minimize_before_capture: bool,
    #[serde(default)]
    pub privacy_consent_confirmed: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextCaptureAckPrivacyConsentRequest {
    pub version: u32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextCaptureStartRecordingRequest {
    #[serde(flatten)]
    pub session: CaptureSessionRequest,
    #[serde(default)]
    pub max_duration_ms: Option<u64>,
    #[serde(default)]
    pub interval_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextCaptureStartRecordingResponse {
    pub recording_id: String,
    pub started_at_ms: u64,
    pub expires_at_ms: u64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextCaptureStopRecordingRequest {
    pub recording_id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextCaptureStopRecordingResponse {
    pub recording_id: String,
    pub capture_group_id: String,
    pub duration_ms: u64,
    pub raw_frame_count: usize,
    pub video: CaptureVideoDto,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextCaptureDeleteManagedArtifactRequest {
    pub artifact_path: String,
    #[serde(default)]
    pub session_id: Option<String>,
    #[serde(default)]
    pub workspace_path: Option<String>,
    #[serde(default)]
    pub remote_connection_id: Option<String>,
    #[serde(default)]
    pub remote_ssh_host: Option<String>,
}

#[derive(Debug, Clone)]
struct RecordedContextCaptureFrame {
    captured_at_ms: u64,
    screenshot: ComputerScreenshot,
}

#[derive(Debug, Clone)]
struct ActiveContextCaptureRecording {
    recording_id: String,
    session: CaptureSessionRequest,
    started_at_ms: u64,
    expires_at_ms: u64,
    interval_ms: u64,
    restore_main_window_after_capture: bool,
    raw_frames: Vec<RecordedContextCaptureFrame>,
}

#[derive(Debug, Clone)]
struct CompletedContextCaptureRecording {
    recording_id: String,
    session: CaptureSessionRequest,
    started_at_ms: u64,
    ended_at_ms: u64,
    interval_ms: u64,
    restore_main_window_after_capture: bool,
    raw_frames: Vec<RecordedContextCaptureFrame>,
}

#[derive(Debug, Clone)]
struct PersistedCaptureImage {
    bytes: Vec<u8>,
    mime_type: String,
    width: u32,
    height: u32,
}

#[derive(Debug, Clone)]
struct PersistedCaptureVideo {
    mime_type: String,
    width: u32,
    height: u32,
    file_size: usize,
}

#[derive(Debug, Default)]
struct ContextCaptureRecordingRegistry {
    active: Option<ActiveContextCaptureRecording>,
    completed: Option<CompletedContextCaptureRecording>,
}

fn ensure_context_capture_enabled(config: &ContextCaptureConfig) -> Result<(), String> {
    if !config.enabled {
        return Err("Context capture is disabled.".to_string());
    }
    Ok(())
}

fn ensure_context_capture_consent(
    config: &ContextCaptureConfig,
    request_confirmed: bool,
) -> Result<(), String> {
    if request_confirmed {
        return Ok(());
    }

    if config.capture_privacy_acknowledged_at.is_none()
        || config.capture_privacy_version < CONTEXT_CAPTURE_PRIVACY_VERSION
    {
        return Err("Context capture privacy consent is required before capture.".to_string());
    }
    Ok(())
}

fn context_capture_consent_required(config: &ContextCaptureConfig) -> bool {
    config.enabled
        && (config.capture_privacy_acknowledged_at.is_none()
            || config.capture_privacy_version < CONTEXT_CAPTURE_PRIVACY_VERSION)
}

fn session_context_capture_artifacts_root(session_root: PathBuf, session_id: &str) -> PathBuf {
    session_root
        .join(session_id)
        .join("artifacts")
        .join("context-capture")
}

fn session_capture_artifacts_dir(session_root: PathBuf, session_id: &str) -> PathBuf {
    session_context_capture_artifacts_root(session_root, session_id).join("screenshots")
}

fn recording_capture_group_dir(
    session_root: PathBuf,
    session_id: &str,
    capture_group_id: &str,
) -> PathBuf {
    session_context_capture_artifacts_root(session_root, session_id)
        .join("recordings")
        .join(capture_group_id)
}

fn build_thumbnail_data_url(screenshot: &ComputerScreenshot) -> Result<String, String> {
    let thumbnail = optimize_capture_for_persistence(
        screenshot,
        CONTEXT_CAPTURE_THUMBNAIL_MAX_LONG_EDGE,
        CONTEXT_CAPTURE_THUMBNAIL_MAX_BYTES,
    )?;
    Ok(format!(
        "data:{};base64,{}",
        thumbnail.mime_type,
        BASE64_STANDARD.encode(thumbnail.bytes)
    ))
}

fn is_managed_context_capture_path(path: &Path) -> bool {
    let mut saw_context_capture = false;
    let mut saw_artifacts = false;

    for component in path.components() {
        if let Component::Normal(name) = component {
            if name == "artifacts" {
                saw_artifacts = true;
            } else if saw_artifacts && name == "context-capture" {
                saw_context_capture = true;
                break;
            }
        }
    }

    saw_context_capture
}

fn is_managed_context_capture_path_under_root(path: &Path, expected_root: &Path) -> bool {
    path.starts_with(expected_root) && is_managed_context_capture_path(path)
}

fn normalize_recording_interval_ms(interval_ms: Option<u64>) -> u64 {
    interval_ms
        .unwrap_or(CONTEXT_CAPTURE_RECORDING_INTERVAL_MS)
        .clamp(100, CONTEXT_CAPTURE_RECORDING_INTERVAL_MAX_MS)
}

fn cleanup_empty_context_capture_ancestors(path: &Path) {
    for ancestor in path.ancestors().skip(1) {
        if !is_managed_context_capture_path(ancestor) {
            break;
        }

        let is_context_capture_root = ancestor
            .file_name()
            .map(|name| name == "context-capture")
            .unwrap_or(false);

        if std::fs::read_dir(ancestor)
            .ok()
            .and_then(|mut entries| entries.next())
            .is_none()
        {
            let _ = std::fs::remove_dir(ancestor);
        } else {
            break;
        }

        if is_context_capture_root {
            break;
        }
    }
}

fn current_timestamp_ms() -> u64 {
    chrono::Utc::now().timestamp_millis() as u64
}

fn recording_registry() -> &'static Arc<Mutex<ContextCaptureRecordingRegistry>> {
    static RECORDING_REGISTRY: OnceLock<Arc<Mutex<ContextCaptureRecordingRegistry>>> =
        OnceLock::new();
    RECORDING_REGISTRY
        .get_or_init(|| Arc::new(Mutex::new(ContextCaptureRecordingRegistry::default())))
}

fn encode_dynamic_image_as_jpeg(image: &DynamicImage, quality: u8) -> Result<Vec<u8>, String> {
    let mut buffer = Vec::new();
    let mut encoder = JpegEncoder::new_with_quality(&mut buffer, quality);
    encoder
        .encode_image(image)
        .map_err(|error| format!("Failed to encode persisted capture image: {}", error))?;
    Ok(buffer)
}

fn resize_dynamic_image_to_long_edge(image: &DynamicImage, max_long_edge: u32) -> DynamicImage {
    if max_long_edge == 0 {
        return image.clone();
    }

    let (width, height) = image.dimensions();
    let long_edge = width.max(height);
    if long_edge <= max_long_edge {
        return image.clone();
    }

    image.resize(max_long_edge, max_long_edge, FilterType::Triangle)
}

fn optimize_capture_for_persistence(
    screenshot: &ComputerScreenshot,
    max_long_edge: u32,
    target_max_bytes: usize,
) -> Result<PersistedCaptureImage, String> {
    let decoded = match image::load_from_memory(&screenshot.bytes) {
        Ok(image) => image,
        Err(error) => {
            warn!(
                "Failed to decode capture image for persistence optimization, falling back to source bytes: error={}",
                error
            );
            return Ok(PersistedCaptureImage {
                bytes: screenshot.bytes.clone(),
                mime_type: screenshot.mime_type.clone(),
                width: screenshot.image_width,
                height: screenshot.image_height,
            });
        }
    };

    let mut best = PersistedCaptureImage {
        bytes: screenshot.bytes.clone(),
        mime_type: screenshot.mime_type.clone(),
        width: screenshot.image_width,
        height: screenshot.image_height,
    };

    for scale in [1.0_f32, 0.88, 0.76, 0.64] {
        let scaled_long_edge = ((max_long_edge as f32) * scale).round().max(480.0) as u32;
        let resized = resize_dynamic_image_to_long_edge(&decoded, scaled_long_edge);

        for quality in [
            CONTEXT_CAPTURE_PERSIST_JPEG_QUALITY_START,
            72,
            66,
            CONTEXT_CAPTURE_PERSIST_JPEG_QUALITY_MIN,
        ] {
            let encoded = encode_dynamic_image_as_jpeg(&resized, quality)?;
            if encoded.len() < best.bytes.len() {
                let (width, height) = resized.dimensions();
                best = PersistedCaptureImage {
                    bytes: encoded.clone(),
                    mime_type: "image/jpeg".to_string(),
                    width,
                    height,
                };
            }

            if encoded.len() <= target_max_bytes {
                let (width, height) = resized.dimensions();
                return Ok(PersistedCaptureImage {
                    bytes: encoded,
                    mime_type: "image/jpeg".to_string(),
                    width,
                    height,
                });
            }
        }
    }

    Ok(best)
}

fn artifact_expired(path: &Path, cutoff: SystemTime) -> bool {
    let metadata = match std::fs::metadata(path) {
        Ok(metadata) => metadata,
        Err(_) => return false,
    };

    let timestamp = metadata
        .modified()
        .or_else(|_| metadata.created())
        .unwrap_or(SystemTime::UNIX_EPOCH);
    timestamp < cutoff
}

fn cleanup_context_capture_directory(path: &Path, cutoff: SystemTime) -> Result<bool, String> {
    if !path.exists() {
        return Ok(true);
    }

    if path.is_file() {
        if artifact_expired(path, cutoff) {
            std::fs::remove_file(path)
                .map_err(|error| format!("Failed to remove expired capture artifact: {}", error))?;
            return Ok(true);
        }

        return Ok(false);
    }

    let entries = std::fs::read_dir(path)
        .map_err(|error| format!("Failed to read capture artifact directory: {}", error))?;
    let mut is_empty = true;

    for entry in entries {
        let entry =
            entry.map_err(|error| format!("Failed to read capture artifact entry: {}", error))?;
        let child_path = entry.path();
        if cleanup_context_capture_directory(&child_path, cutoff)? {
            continue;
        }
        is_empty = false;
    }

    if is_empty {
        std::fs::remove_dir(path).map_err(|error| {
            format!(
                "Failed to remove empty capture artifact directory: {}",
                error
            )
        })?;
        return Ok(true);
    }

    Ok(false)
}

fn cleanup_expired_context_capture_artifacts(session_storage_root: &Path) -> Result<(), String> {
    if !session_storage_root.exists() {
        return Ok(());
    }

    let cutoff = SystemTime::now()
        .checked_sub(StdDuration::from_secs(
            CONTEXT_CAPTURE_ARTIFACT_RETENTION_SECS,
        ))
        .unwrap_or(SystemTime::UNIX_EPOCH);

    let session_entries = std::fs::read_dir(session_storage_root)
        .map_err(|error| format!("Failed to inspect session storage root: {}", error))?;

    for session_entry in session_entries {
        let session_entry = session_entry
            .map_err(|error| format!("Failed to inspect session directory: {}", error))?;
        let session_path = session_entry.path();
        if !session_path.is_dir() {
            continue;
        }

        let capture_root = session_path.join("artifacts").join("context-capture");
        if !capture_root.exists() {
            continue;
        }

        let _ = cleanup_context_capture_directory(&capture_root, cutoff)?;
    }

    Ok(())
}

async fn maybe_minimize_main_window_before_capture(
    app: &AppHandle,
    minimize_before_capture: bool,
) -> Result<bool, String> {
    if !minimize_before_capture {
        return Ok(false);
    }

    let Some(main_window) = app.get_webview_window("main") else {
        return Err("Main window is not available for context capture.".to_string());
    };

    main_window
        .minimize()
        .map_err(|error| format!("Failed to minimize main window: {}", error))?;
    sleep(Duration::from_millis(CONTEXT_CAPTURE_WINDOW_SETTLE_MS)).await;
    Ok(true)
}

async fn maybe_restore_main_window_after_capture(app: &AppHandle, should_restore: bool) {
    if !should_restore {
        return;
    }

    let Some(main_window) = app.get_webview_window("main") else {
        warn!("Main window was unavailable when restoring after context capture");
        return;
    };

    if let Err(error) = main_window.unminimize() {
        warn!(
            "Failed to unminimize main window after context capture: {}",
            error
        );
    }
    if let Err(error) = main_window.show() {
        warn!(
            "Failed to show main window after context capture: {}",
            error
        );
    }
    if let Err(error) = main_window.set_focus() {
        warn!(
            "Failed to focus main window after context capture: {}",
            error
        );
    }
}

fn prepare_recording_video_rgb_frame(screenshot: &ComputerScreenshot) -> Result<RgbImage, String> {
    let decoded = image::load_from_memory(&screenshot.bytes)
        .map_err(|error| format!("Failed to decode recording frame: {}", error))?;
    let resized =
        resize_dynamic_image_to_long_edge(&decoded, CONTEXT_CAPTURE_RECORDING_VIDEO_MAX_LONG_EDGE);
    let (width, height) = resized.dimensions();
    let even_width = width.saturating_sub(width % 2).max(2);
    let even_height = height.saturating_sub(height % 2).max(2);
    let normalized = if even_width != width || even_height != height {
        resized.crop_imm(0, 0, even_width, even_height)
    } else {
        resized
    };

    Ok(normalized.to_rgb8())
}

fn encode_recording_video_to_file(
    video_path: &Path,
    frames: &[RecordedContextCaptureFrame],
    interval_ms: u64,
) -> Result<PersistedCaptureVideo, String> {
    if frames.is_empty() {
        return Err("Recording did not capture any frames.".to_string());
    }

    let first_frame = prepare_recording_video_rgb_frame(&frames[0].screenshot)?;
    let width = first_frame.width();
    let height = first_frame.height();
    let fps = ((1000_u64 / interval_ms.max(100)).max(1)).min(60) as f64;
    let fps_f32 = fps as f32;

    let file = File::create(video_path)
        .map_err(|error| format!("Failed to create recording file: {}", error))?;
    let mut muxer = MuxerBuilder::new(file)
        .video(VideoCodec::H264, width, height, fps)
        .with_fast_start(true)
        .build()
        .map_err(|error| format!("Failed to create MP4 muxer for recording: {}", error))?;
    let encoder_config = EncoderConfig::new()
        .bitrate(BitRate::from_bps(
            CONTEXT_CAPTURE_RECORDING_VIDEO_TARGET_BITRATE_KBPS.saturating_mul(1_000),
        ))
        .max_frame_rate(FrameRate::from_hz(fps_f32))
        .usage_type(UsageType::ScreenContentRealTime);
    let mut encoder =
        Encoder::with_api_config(openh264::OpenH264API::from_source(), encoder_config)
            .map_err(|error| format!("Failed to create H264 recording encoder: {}", error))?;

    for (index, frame) in frames.iter().enumerate() {
        let rgb_frame = if index == 0 {
            first_frame.clone()
        } else {
            let next = prepare_recording_video_rgb_frame(&frame.screenshot)?;
            if next.width() == width && next.height() == height {
                next
            } else {
                DynamicImage::ImageRgb8(next)
                    .resize_exact(width, height, FilterType::Triangle)
                    .to_rgb8()
            }
        };
        let rgb_source = RgbSliceU8::new(rgb_frame.as_raw(), (width as usize, height as usize));
        let yuv_frame = YUVBuffer::from_rgb_source(rgb_source);
        if index == 0 {
            encoder.force_intra_frame();
        }
        let bitstream = encoder
            .encode(&yuv_frame)
            .map_err(|error| format!("Failed to encode recording frame: {}", error))?;
        let encoded_frame = bitstream.to_vec();
        let is_keyframe = matches!(bitstream.frame_type(), FrameType::IDR | FrameType::I);
        let pts = index as f64 / fps;
        muxer
            .write_video(pts, &encoded_frame, is_keyframe)
            .map_err(|error| format!("Failed to mux recording frame into MP4: {}", error))?;
    }

    muxer
        .finish()
        .map_err(|error| format!("Failed to finalize recording video: {}", error))?;

    let file_size = std::fs::metadata(video_path)
        .map_err(|error| format!("Failed to inspect recording file: {}", error))?
        .len() as usize;
    if file_size > CONTEXT_CAPTURE_RECORDING_VIDEO_MAX_BYTES {
        let _ = std::fs::remove_file(video_path);
        return Err(format!(
            "Recording exceeded the maximum file size after compression ({} bytes).",
            file_size
        ));
    }

    Ok(PersistedCaptureVideo {
        mime_type: CONTEXT_CAPTURE_RECORDING_VIDEO_MIME_TYPE.to_string(),
        width,
        height,
        file_size,
    })
}

async fn finalize_active_recording(
    recording_id: &str,
    ended_at_ms: u64,
) -> Option<CompletedContextCaptureRecording> {
    let mut registry = recording_registry().lock().await;
    let active = match registry.active.take() {
        Some(active) if active.recording_id == recording_id => active,
        Some(other) => {
            registry.active = Some(other);
            return None;
        }
        None => return None,
    };

    let completed = CompletedContextCaptureRecording {
        recording_id: active.recording_id.clone(),
        session: active.session,
        started_at_ms: active.started_at_ms,
        ended_at_ms,
        interval_ms: active.interval_ms,
        restore_main_window_after_capture: active.restore_main_window_after_capture,
        raw_frames: active.raw_frames,
    };
    registry.completed = Some(completed.clone());
    Some(completed)
}

async fn capture_recording_frame(
    recording_id: &str,
    host: &DesktopComputerUseHost,
) -> Result<bool, String> {
    let screenshot = host
        .screenshot_peek_full_display()
        .await
        .map_err(|e| e.to_string())?;
    let frame = RecordedContextCaptureFrame {
        captured_at_ms: current_timestamp_ms(),
        screenshot,
    };

    let mut registry = recording_registry().lock().await;
    let Some(active) = registry.active.as_mut() else {
        return Ok(false);
    };
    if active.recording_id != recording_id {
        return Ok(false);
    }
    if active.raw_frames.len() >= CONTEXT_CAPTURE_RECORDING_MAX_RAW_FRAMES {
        return Ok(false);
    }

    active.raw_frames.push(frame);
    Ok(active.raw_frames.len() < CONTEXT_CAPTURE_RECORDING_MAX_RAW_FRAMES)
}

async fn run_context_capture_recording(app: AppHandle, recording_id: String, interval_ms: u64) {
    let host = DesktopComputerUseHost::new();

    loop {
        let should_continue = {
            let registry = recording_registry().lock().await;
            match registry.active.as_ref() {
                Some(active) if active.recording_id == recording_id => {
                    current_timestamp_ms() < active.expires_at_ms
                        && active.raw_frames.len() < CONTEXT_CAPTURE_RECORDING_MAX_RAW_FRAMES
                }
                _ => false,
            }
        };

        if !should_continue {
            let completed = finalize_active_recording(&recording_id, current_timestamp_ms()).await;
            if let Some(completed) = completed {
                maybe_restore_main_window_after_capture(
                    &app,
                    completed.restore_main_window_after_capture,
                )
                .await;
            }
            break;
        }

        match capture_recording_frame(&recording_id, &host).await {
            Ok(true) => {}
            Ok(false) => {
                let completed =
                    finalize_active_recording(&recording_id, current_timestamp_ms()).await;
                if let Some(completed) = completed {
                    maybe_restore_main_window_after_capture(
                        &app,
                        completed.restore_main_window_after_capture,
                    )
                    .await;
                }
                break;
            }
            Err(error) => {
                warn!(
                    "Context capture recording frame failed: recording_id={}, error={}",
                    recording_id, error
                );
                let completed =
                    finalize_active_recording(&recording_id, current_timestamp_ms()).await;
                if let Some(completed) = completed {
                    maybe_restore_main_window_after_capture(
                        &app,
                        completed.restore_main_window_after_capture,
                    )
                    .await;
                }
                break;
            }
        }

        sleep(Duration::from_millis(interval_ms)).await;
    }
}

async fn persist_recording_video(
    state: &AppState,
    session: &CaptureSessionRequest,
    capture_group_id: &str,
    duration_ms: u64,
    interval_ms: u64,
    frames: Vec<RecordedContextCaptureFrame>,
) -> Result<CaptureVideoDto, String> {
    let preview_frame = frames
        .get(frames.len() / 2)
        .or_else(|| frames.first())
        .ok_or_else(|| "Recording did not capture any frames.".to_string())?;
    let thumbnail_data_url = build_thumbnail_data_url(&preview_frame.screenshot).ok();
    let captured_at = frames
        .first()
        .map(|frame| frame.captured_at_ms)
        .unwrap_or_else(current_timestamp_ms);

    let session_storage_root = desktop_effective_session_storage_path(
        state,
        &session.workspace_path,
        session.remote_connection_id.as_deref(),
        session.remote_ssh_host.as_deref(),
    )
    .await;
    cleanup_expired_context_capture_artifacts(&session_storage_root)?;
    let artifacts_dir =
        recording_capture_group_dir(session_storage_root, &session.session_id, capture_group_id);
    std::fs::create_dir_all(&artifacts_dir)
        .map_err(|e| format!("Failed to create recording artifacts directory: {}", e))?;
    let video_name = format!("recording-{}.mp4", capture_group_id);
    let video_path = artifacts_dir.join(&video_name);
    let encoder_video_path = video_path.clone();
    let persisted_video = tokio::task::spawn_blocking(move || {
        encode_recording_video_to_file(&encoder_video_path, &frames, interval_ms)
    })
    .await
    .map_err(|error| format!("Recording encoder task failed: {}", error))??;

    Ok(CaptureVideoDto {
        id: capture_group_id.to_string(),
        video_path: video_path.to_string_lossy().to_string(),
        video_name,
        mime_type: persisted_video.mime_type,
        file_size: persisted_video.file_size,
        width: persisted_video.width,
        height: persisted_video.height,
        duration_ms,
        thumbnail_data_url,
        source: "file".to_string(),
        metadata: json!({
            "captureKind": "recording",
            "captureGroupId": capture_group_id,
            "capturedAt": captured_at,
            "recordingDurationMs": duration_ms,
            "minimizeBeforeCapture": session.minimize_before_capture,
            "sessionId": session.session_id,
            "workspacePath": session.workspace_path,
            "remoteConnectionId": session.remote_connection_id,
            "remoteSshHost": session.remote_ssh_host,
            "managedArtifact": true,
        }),
    })
}

#[tauri::command]
pub async fn context_capture_get_status(
    state: State<'_, AppState>,
) -> Result<ContextCaptureStatusResponse, String> {
    let app_config: AppConfig = state
        .config_service
        .get_config(Some("app"))
        .await
        .map_err(|e| e.to_string())?;
    let context_capture = app_config.context_capture;

    let host = DesktopComputerUseHost::new();
    let snapshot = host
        .permission_snapshot()
        .await
        .map_err(|e| e.to_string())?;
    let recording_active = recording_registry().lock().await.active.is_some();

    Ok(ContextCaptureStatusResponse {
        enabled: context_capture.enabled,
        screen_capture_granted: snapshot.screen_capture_granted,
        consent_required: context_capture_consent_required(&context_capture),
        recording_active,
        platform_note: snapshot.platform_note,
    })
}

#[tauri::command]
pub async fn context_capture_take_screenshot(
    app: AppHandle,
    state: State<'_, AppState>,
    request: CaptureSessionRequest,
) -> Result<CaptureImageDto, String> {
    let app_config: AppConfig = state
        .config_service
        .get_config(Some("app"))
        .await
        .map_err(|e| e.to_string())?;
    let context_capture = app_config.context_capture;
    ensure_context_capture_enabled(&context_capture)?;
    ensure_context_capture_consent(&context_capture, request.privacy_consent_confirmed)?;

    let host = DesktopComputerUseHost::new();
    let permission_snapshot = host
        .permission_snapshot()
        .await
        .map_err(|e| e.to_string())?;
    if !permission_snapshot.screen_capture_granted {
        return Err("Screen capture permission is not granted.".to_string());
    }

    let session_storage_root = desktop_effective_session_storage_path(
        &state,
        &request.workspace_path,
        request.remote_connection_id.as_deref(),
        request.remote_ssh_host.as_deref(),
    )
    .await;
    cleanup_expired_context_capture_artifacts(&session_storage_root)?;

    let captured_at = chrono::Utc::now().timestamp_millis() as u64;
    let capture_id = format!("cap-{}", captured_at);
    let image_name = format!("screenshot-{}.jpg", captured_at);

    let artifacts_dir = session_capture_artifacts_dir(session_storage_root, &request.session_id);
    std::fs::create_dir_all(&artifacts_dir)
        .map_err(|e| format!("Failed to create capture artifacts directory: {}", e))?;

    let should_restore_main_window =
        maybe_minimize_main_window_before_capture(&app, request.minimize_before_capture).await?;
    let screenshot = host
        .screenshot_peek_full_display()
        .await
        .map_err(|e| e.to_string());
    if screenshot.is_err() {
        maybe_restore_main_window_after_capture(&app, should_restore_main_window).await;
    }
    let screenshot = screenshot?;
    let persisted_screenshot = optimize_capture_for_persistence(
        &screenshot,
        CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_LONG_EDGE,
        CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_BYTES,
    );
    if persisted_screenshot.is_err() {
        maybe_restore_main_window_after_capture(&app, should_restore_main_window).await;
    }
    let persisted_screenshot = persisted_screenshot?;
    let image_path = artifacts_dir.join(&image_name);
    let write_result = std::fs::write(&image_path, &persisted_screenshot.bytes)
        .map_err(|e| format!("Failed to persist screenshot: {}", e));
    maybe_restore_main_window_after_capture(&app, should_restore_main_window).await;
    write_result?;

    let thumbnail_data_url = build_thumbnail_data_url(&screenshot).ok();

    Ok(CaptureImageDto {
        id: capture_id.clone(),
        image_path: image_path.to_string_lossy().to_string(),
        image_name,
        mime_type: persisted_screenshot.mime_type,
        file_size: persisted_screenshot.bytes.len(),
        width: persisted_screenshot.width,
        height: persisted_screenshot.height,
        thumbnail_data_url,
        source: "file".to_string(),
        metadata: json!({
            "captureKind": "screenshot",
            "captureGroupId": capture_id,
            "capturedAt": captured_at,
            "minimizeBeforeCapture": request.minimize_before_capture,
            "sessionId": request.session_id,
            "workspacePath": request.workspace_path,
            "remoteConnectionId": request.remote_connection_id,
            "remoteSshHost": request.remote_ssh_host,
            "managedArtifact": true,
        }),
    })
}

#[tauri::command]
pub async fn context_capture_start_recording(
    app: AppHandle,
    state: State<'_, AppState>,
    request: ContextCaptureStartRecordingRequest,
) -> Result<ContextCaptureStartRecordingResponse, String> {
    let app_config: AppConfig = state
        .config_service
        .get_config(Some("app"))
        .await
        .map_err(|e| e.to_string())?;
    let context_capture = app_config.context_capture;
    ensure_context_capture_enabled(&context_capture)?;
    ensure_context_capture_consent(&context_capture, request.session.privacy_consent_confirmed)?;

    let host = DesktopComputerUseHost::new();
    let permission_snapshot = host
        .permission_snapshot()
        .await
        .map_err(|e| e.to_string())?;
    if !permission_snapshot.screen_capture_granted {
        return Err("Screen capture permission is not granted.".to_string());
    }

    let session_storage_root = desktop_effective_session_storage_path(
        &state,
        &request.session.workspace_path,
        request.session.remote_connection_id.as_deref(),
        request.session.remote_ssh_host.as_deref(),
    )
    .await;
    cleanup_expired_context_capture_artifacts(&session_storage_root)?;

    {
        let mut registry = recording_registry().lock().await;
        if registry.active.is_some() {
            return Err("A context capture recording is already in progress.".to_string());
        }
        registry.completed = None;
    }

    let restore_main_window_after_capture =
        maybe_minimize_main_window_before_capture(&app, request.session.minimize_before_capture)
            .await?;

    let mut registry = recording_registry().lock().await;
    if registry.active.is_some() {
        maybe_restore_main_window_after_capture(&app, restore_main_window_after_capture).await;
        return Err("A context capture recording is already in progress.".to_string());
    }

    let started_at_ms = current_timestamp_ms();
    let max_duration_ms = request
        .max_duration_ms
        .unwrap_or(CONTEXT_CAPTURE_RECORDING_MAX_DURATION_MS)
        .min(CONTEXT_CAPTURE_RECORDING_MAX_DURATION_MS);
    let interval_ms = normalize_recording_interval_ms(request.interval_ms);
    let expires_at_ms = started_at_ms + max_duration_ms;
    let recording_id = format!("recording-{}", started_at_ms);

    registry.active = Some(ActiveContextCaptureRecording {
        recording_id: recording_id.clone(),
        session: request.session.clone(),
        started_at_ms,
        expires_at_ms,
        interval_ms,
        restore_main_window_after_capture,
        raw_frames: Vec::new(),
    });
    drop(registry);

    let _ = capture_recording_frame(&recording_id, &host).await;

    tokio::spawn(run_context_capture_recording(
        app.clone(),
        recording_id.clone(),
        interval_ms,
    ));

    info!(
        "Started context capture recording: recording_id={}, session_id={}, workspace_path={}",
        recording_id, request.session.session_id, request.session.workspace_path
    );

    Ok(ContextCaptureStartRecordingResponse {
        recording_id,
        started_at_ms,
        expires_at_ms,
    })
}

#[tauri::command]
pub async fn context_capture_stop_recording(
    app: AppHandle,
    state: State<'_, AppState>,
    request: ContextCaptureStopRecordingRequest,
) -> Result<ContextCaptureStopRecordingResponse, String> {
    let completed = {
        let mut registry = recording_registry().lock().await;
        if registry
            .active
            .as_ref()
            .is_some_and(|active| active.recording_id == request.recording_id)
        {
            let active = registry
                .active
                .take()
                .expect("checked active recording exists");
            registry.completed = None;
            CompletedContextCaptureRecording {
                recording_id: active.recording_id,
                session: active.session,
                started_at_ms: active.started_at_ms,
                ended_at_ms: current_timestamp_ms(),
                interval_ms: active.interval_ms,
                restore_main_window_after_capture: active.restore_main_window_after_capture,
                raw_frames: active.raw_frames,
            }
        } else if registry
            .completed
            .as_ref()
            .is_some_and(|completed| completed.recording_id == request.recording_id)
        {
            registry
                .completed
                .take()
                .expect("checked completed recording exists")
        } else {
            return Err("Recording session was not found.".to_string());
        }
    };

    let CompletedContextCaptureRecording {
        session,
        started_at_ms,
        ended_at_ms,
        interval_ms,
        restore_main_window_after_capture,
        raw_frames,
        ..
    } = completed;
    let duration_ms = ended_at_ms.saturating_sub(started_at_ms);
    let capture_group_id = format!("rec-{}", started_at_ms);
    let raw_frame_count = raw_frames.len();
    maybe_restore_main_window_after_capture(&app, restore_main_window_after_capture).await;
    let persisted_video = persist_recording_video(
        &state,
        &session,
        &capture_group_id,
        duration_ms,
        interval_ms,
        raw_frames,
    )
    .await;
    let persisted_video = persisted_video?;

    info!(
        "Completed context capture recording: recording_id={}, video_size={}, raw_frames={}",
        request.recording_id, persisted_video.file_size, raw_frame_count
    );

    Ok(ContextCaptureStopRecordingResponse {
        recording_id: request.recording_id,
        capture_group_id,
        duration_ms,
        raw_frame_count,
        video: persisted_video,
    })
}

#[tauri::command]
pub async fn context_capture_ack_privacy_consent(
    state: State<'_, AppState>,
    request: ContextCaptureAckPrivacyConsentRequest,
) -> Result<(), String> {
    let app_config: AppConfig = state
        .config_service
        .get_config(Some("app"))
        .await
        .map_err(|e| e.to_string())?;
    let mut context_capture: ContextCaptureConfig = app_config.context_capture;

    context_capture.capture_privacy_version = request.version;
    context_capture.capture_privacy_acknowledged_at =
        Some(chrono::Utc::now().timestamp_millis() as u64);

    let value = serde_json::to_value(&context_capture)
        .map_err(|e| format!("Failed to serialize context capture config: {}", e))?;

    state
        .config_service
        .set_config("app.context_capture", value)
        .await
        .map_err(|e| e.to_string())?;

    if let Err(e) = bitfun_core::service::config::reload_global_config().await {
        warn!(
            "Failed to sync global config after context capture consent acknowledgement: {}",
            e
        );
    } else {
        info!(
            "Context capture consent acknowledged with version {}",
            request.version
        );
    }

    Ok(())
}

#[tauri::command]
pub async fn context_capture_delete_managed_artifact(
    state: State<'_, AppState>,
    request: ContextCaptureDeleteManagedArtifactRequest,
) -> Result<(), String> {
    let artifact_path = PathBuf::from(&request.artifact_path);
    if !artifact_path.exists() {
        return Ok(());
    }

    let canonical_path = artifact_path
        .canonicalize()
        .map_err(|error| format!("Failed to inspect capture artifact path: {}", error))?;
    if !is_managed_context_capture_path(&canonical_path) {
        return Err("Only managed context capture artifacts can be deleted.".to_string());
    }

    let session_id = request
        .session_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            "session_id is required to delete managed context capture artifacts.".to_string()
        })?;
    let workspace_path = request
        .workspace_path
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            "workspace_path is required to delete managed context capture artifacts.".to_string()
        })?;
    let session_storage_root = desktop_effective_session_storage_path(
        &state,
        workspace_path,
        request.remote_connection_id.as_deref(),
        request.remote_ssh_host.as_deref(),
    )
    .await;
    let expected_root = session_context_capture_artifacts_root(session_storage_root, session_id);
    let canonical_expected_root = expected_root
        .canonicalize()
        .map_err(|error| format!("Failed to inspect capture artifact root: {}", error))?;
    if !is_managed_context_capture_path_under_root(&canonical_path, &canonical_expected_root) {
        return Err(
            "Managed context capture artifact path is outside the current session.".to_string(),
        );
    }

    std::fs::remove_file(&canonical_path)
        .map_err(|error| format!("Failed to remove capture artifact: {}", error))?;
    cleanup_empty_context_capture_ancestors(&canonical_path);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{DynamicImage, ImageBuffer, ImageOutputFormat, Rgb};
    use std::fs;
    use std::io::Cursor;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_test_dir(name: &str) -> PathBuf {
        let unique = format!(
            "bitfun-context-capture-{}-{}",
            name,
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock before unix epoch")
                .as_nanos()
        );
        let path = std::env::temp_dir().join(unique);
        fs::create_dir_all(&path).expect("create temp test dir");
        path
    }

    fn sample_screenshot(width: u32, height: u32, offset: u8) -> ComputerScreenshot {
        let image = ImageBuffer::from_fn(width, height, |x, y| {
            let r = ((x + y + offset as u32) % 255) as u8;
            let g = ((x * 2 + offset as u32) % 255) as u8;
            let b = ((y * 3 + offset as u32) % 255) as u8;
            Rgb([r, g, b])
        });
        let mut bytes = Vec::new();
        DynamicImage::ImageRgb8(image)
            .write_to(&mut Cursor::new(&mut bytes), ImageOutputFormat::Png)
            .expect("encode png");

        ComputerScreenshot {
            screenshot_id: None,
            bytes,
            mime_type: "image/png".to_string(),
            image_width: width,
            image_height: height,
            native_width: width,
            native_height: height,
            display_origin_x: 0,
            display_origin_y: 0,
            vision_scale: 1.0,
            pointer_image_x: None,
            pointer_image_y: None,
            screenshot_crop_center: None,
            point_crop_half_extent_native: None,
            navigation_native_rect: None,
            quadrant_navigation_click_ready: false,
            image_content_rect: None,
            image_global_bounds: None,
            ui_tree_text: None,
            implicit_confirmation_crop_applied: false,
        }
    }

    #[test]
    fn consent_requires_current_privacy_version() {
        let mut config = ContextCaptureConfig {
            capture_privacy_acknowledged_at: Some(1),
            capture_privacy_version: 0,
            ..ContextCaptureConfig::default()
        };

        assert!(ensure_context_capture_consent(&config, false).is_err());
        assert!(ensure_context_capture_consent(&config, true).is_ok());

        config.capture_privacy_version = CONTEXT_CAPTURE_PRIVACY_VERSION;
        assert!(ensure_context_capture_consent(&config, false).is_ok());
    }

    #[test]
    fn optimize_capture_for_persistence_shrinks_large_screenshot() {
        let screenshot = sample_screenshot(2400, 1600, 12);
        let optimized = optimize_capture_for_persistence(
            &screenshot,
            CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_LONG_EDGE,
            CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_BYTES,
        )
        .expect("optimize screenshot");

        assert_eq!(optimized.mime_type, "image/jpeg");
        assert!(optimized.width <= CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_LONG_EDGE);
        assert!(optimized.height <= CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_LONG_EDGE);
        assert!(optimized.bytes.len() < screenshot.bytes.len());
        assert!(optimized.bytes.len() <= CONTEXT_CAPTURE_SCREENSHOT_PERSIST_MAX_BYTES);
    }

    #[test]
    fn recording_video_encoding_creates_small_mp4_file() {
        let temp_dir = temp_test_dir("recording");
        let video_path = temp_dir.join("recording.mp4");
        let frames = vec![
            RecordedContextCaptureFrame {
                captured_at_ms: 1,
                screenshot: sample_screenshot(1280, 720, 5),
            },
            RecordedContextCaptureFrame {
                captured_at_ms: 501,
                screenshot: sample_screenshot(1280, 720, 25),
            },
            RecordedContextCaptureFrame {
                captured_at_ms: 1001,
                screenshot: sample_screenshot(1280, 720, 55),
            },
        ];

        let persisted = encode_recording_video_to_file(
            &video_path,
            &frames,
            CONTEXT_CAPTURE_RECORDING_INTERVAL_MS,
        )
        .expect("encode recording video");

        assert_eq!(
            persisted.mime_type,
            CONTEXT_CAPTURE_RECORDING_VIDEO_MIME_TYPE
        );
        assert!(video_path.exists());
        assert!(persisted.file_size > 0);
        assert!(persisted.file_size <= CONTEXT_CAPTURE_RECORDING_VIDEO_MAX_BYTES);

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn cleanup_context_capture_directory_removes_expired_artifacts() {
        let temp_dir = temp_test_dir("cleanup");
        let capture_root = temp_dir
            .join("session")
            .join("artifacts")
            .join("context-capture")
            .join("recordings")
            .join("group-1");
        fs::create_dir_all(&capture_root).expect("create capture root");
        let file_path = capture_root.join("artifact.mp4");
        fs::write(&file_path, b"artifact").expect("write artifact");

        let removed = cleanup_context_capture_directory(
            &temp_dir
                .join("session")
                .join("artifacts")
                .join("context-capture"),
            SystemTime::now() + StdDuration::from_secs(1),
        )
        .expect("cleanup expired artifacts");

        assert!(removed);
        assert!(!file_path.exists());
        assert!(!temp_dir
            .join("session")
            .join("artifacts")
            .join("context-capture")
            .exists());

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn managed_capture_path_requires_context_capture_artifact_root() {
        let managed =
            PathBuf::from("C:\\temp\\session\\artifacts\\context-capture\\screenshots\\shot.jpg");
        let unmanaged = PathBuf::from("C:\\temp\\session\\artifacts\\other\\shot.jpg");

        assert!(is_managed_context_capture_path(&managed));
        assert!(!is_managed_context_capture_path(&unmanaged));
    }

    #[test]
    fn managed_capture_path_must_stay_under_expected_root() {
        let expected_root = PathBuf::from("C:\\temp\\session-a\\artifacts\\context-capture");
        let managed = expected_root.join("screenshots").join("shot.jpg");
        let lookalike =
            PathBuf::from("C:\\temp\\session-b\\artifacts\\context-capture\\screenshots\\shot.jpg");

        assert!(is_managed_context_capture_path_under_root(
            &managed,
            &expected_root
        ));
        assert!(!is_managed_context_capture_path_under_root(
            &lookalike,
            &expected_root
        ));
    }

    #[test]
    fn session_context_capture_root_contains_screenshots_and_recordings() {
        let session_root = PathBuf::from("C:\\temp");
        let context_capture_root =
            session_context_capture_artifacts_root(session_root.clone(), "session-a");

        assert_eq!(
            session_capture_artifacts_dir(session_root.clone(), "session-a"),
            context_capture_root.join("screenshots")
        );
        assert_eq!(
            recording_capture_group_dir(session_root, "session-a", "rec-1"),
            context_capture_root.join("recordings").join("rec-1")
        );

        let managed_recording = context_capture_root
            .join("recordings")
            .join("rec-1")
            .join("recording-rec-1.mp4");
        assert!(is_managed_context_capture_path_under_root(
            &managed_recording,
            &context_capture_root
        ));
    }

    #[test]
    fn recording_interval_is_clamped_to_capture_budget() {
        assert_eq!(
            normalize_recording_interval_ms(None),
            CONTEXT_CAPTURE_RECORDING_INTERVAL_MS
        );
        assert_eq!(normalize_recording_interval_ms(Some(1)), 100);
        assert_eq!(normalize_recording_interval_ms(Some(20_000)), 1_000);
    }
}
