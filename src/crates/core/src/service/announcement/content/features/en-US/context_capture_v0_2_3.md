---
id: feature_context_capture_v0_2_3
trigger: manual
once_per_version: false
delay_ms: 1500
toast_title: "New in chat"
toast_desc: Screenshots and short recordings can now attach directly to the current message
modal_size: lg
completion_action: dismiss
auto_dismiss_ms: 12000
priority: 6
---

# Chat screenshots and short recordings

BitFun can now capture a **single screenshot** or a **short screen recording** and attach the result directly to the current chat draft.

What the current version supports:
- **Screenshot capture** from the desktop app
- **Short recording sessions** up to **10 seconds**
- Recording saved as **one managed short video**
- Automatic frame extraction when you send that video to a multimodal model

<!-- page -->

# How it works

Use the new controls in the chat input:
- **Take screenshot** captures the current screen and adds one image
- **Start recording** begins a short capture session
- **Stop recording** ends the session early, or BitFun stops automatically after **10 seconds**

BitFun compresses screenshots and recordings locally before they are attached, which keeps storage smaller and helps make multimodal costs more predictable. Managed videos stay in local session artifacts for preview and history; model requests use sampled frames and metadata.

<!-- page -->

# Privacy reminders

Screenshots and recordings may include:
- passwords or one-time codes
- notifications and private messages
- customer or internal business data

Before captured content is attached, BitFun asks for confirmation. If you select **do not show again**, that choice is remembered only after you continue.

You stay in control:
- nothing is sent automatically
- no background recording is started
- no audio is captured
- you can remove any screenshot or recording before sending
