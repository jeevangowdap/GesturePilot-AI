import os
import uuid
import shutil
import subprocess
import tempfile
import logging
import atexit
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
}
ALLOWED_EXTENSIONS = {".pptx", ".ppt"}

# Working directory for converted files
WORK_DIR = Path(tempfile.gettempdir()) / "gesturepilot_sessions"
WORK_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Conversion Engine Discovery
# ---------------------------------------------------------------------------
LIBREOFFICE_CANDIDATES = [
    # Windows default install paths
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    os.path.expanduser(r"~\AppData\Local\Programs\LibreOffice\program\soffice.exe"),
    # Linux / macOS
    "soffice",
    "libreoffice",
]


def find_libreoffice() -> Optional[str]:
    for candidate in LIBREOFFICE_CANDIDATES:
        path = Path(candidate)
        if path.is_absolute():
            if path.exists():
                return str(path)
        else:
            resolved = shutil.which(candidate)
            if resolved:
                return resolved
    return None


def check_powerpoint_com() -> bool:
    """Check if Microsoft PowerPoint is available via COM (Windows)."""
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        try:
            ppt = win32com.client.Dispatch("PowerPoint.Application")
            ppt.Quit()
            return True
        finally:
            pythoncom.CoUninitialize()
    except Exception:
        return False


LIBREOFFICE_PATH = find_libreoffice()
HAS_POWERPOINT_COM = check_powerpoint_com()

log.info("LibreOffice path: %s", LIBREOFFICE_PATH or "NOT FOUND")
log.info("PowerPoint COM support: %s", "AVAILABLE" if HAS_POWERPOINT_COM else "NOT AVAILABLE")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="GesturePilot AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve converted PDF files
app.mount("/files", StaticFiles(directory=str(WORK_DIR)), name="files")

# Track active sessions for cleanup
active_sessions: dict[str, Path] = {}


def cleanup_session(session_dir: Path):
    """Remove a session directory safely."""
    try:
        if session_dir.exists():
            shutil.rmtree(session_dir)
            log.info("Cleaned up session: %s", session_dir)
    except Exception as e:
        log.warning("Cleanup failed for %s: %s", session_dir, e)


@atexit.register
def cleanup_all():
    """Best-effort cleanup on shutdown."""
    for session_dir in active_sessions.values():
        cleanup_session(session_dir)


def convert_presentation_to_pdf(input_path: Path, output_dir: Path) -> Path:
    """Convert a .pptx/.ppt file to .pdf using LibreOffice or PowerPoint COM."""
    errors = []

    # 1. Try LibreOffice if found
    if LIBREOFFICE_PATH:
        try:
            log.info("Attempting conversion with LibreOffice...")
            result = subprocess.run(
                [
                    LIBREOFFICE_PATH,
                    "--headless",
                    "--norestore",
                    "--convert-to", "pdf",
                    "--outdir", str(output_dir),
                    str(input_path),
                ],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(output_dir),
            )
            if result.returncode == 0:
                pdfs = list(output_dir.glob("*.pdf"))
                if pdfs:
                    log.info("LibreOffice conversion successful: %s", pdfs[0].name)
                    return pdfs[0]
            errors.append(f"LibreOffice failed: {result.stderr or result.stdout}")
        except Exception as e:
            errors.append(f"LibreOffice error: {e}")

    # 2. Try Microsoft PowerPoint COM (Windows)
    if HAS_POWERPOINT_COM:
        try:
            log.info("Attempting conversion with PowerPoint COM...")
            import win32com.client
            import pythoncom
            pythoncom.CoInitialize()
            ppt = None
            pres = None
            try:
                ppt = win32com.client.Dispatch("PowerPoint.Application")
                pres = ppt.Presentations.Open(str(input_path.resolve()), WithWindow=False)
                target_pdf = output_dir / f"{input_path.stem}.pdf"
                # 32 = ppSaveAsPDF
                pres.SaveAs(str(target_pdf.resolve()), 32)
                pres.Close()
                pres = None
                ppt.Quit()
                ppt = None
                if target_pdf.exists():
                    log.info("PowerPoint COM conversion successful: %s", target_pdf.name)
                    return target_pdf
            finally:
                if pres:
                    try:
                        pres.Close()
                    except Exception:
                        pass
                if ppt:
                    try:
                        ppt.Quit()
                    except Exception:
                        pass
                pythoncom.CoUninitialize()
        except Exception as e:
            errors.append(f"PowerPoint COM error: {e}")

    # Neither worked
    error_summary = "; ".join(errors) if errors else "No converter available"
    log.error("Conversion failed: %s", error_summary)
    raise RuntimeError(
        f"Conversion failed. {error_summary}. "
        "Please install LibreOffice (https://www.libreoffice.org) or Microsoft PowerPoint on the server."
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    converter = "libreoffice" if LIBREOFFICE_PATH else ("powerpoint_com" if HAS_POWERPOINT_COM else None)
    return {
        "status": "ok",
        "libreoffice_available": LIBREOFFICE_PATH is not None,
        "libreoffice_path": LIBREOFFICE_PATH,
        "powerpoint_com_available": HAS_POWERPOINT_COM,
        "converter": converter,
    }


@app.post("/upload")
async def upload_presentation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    # ---- Validate extension ----
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{suffix}'. Please upload a .pptx or .ppt file.",
        )

    # ---- Check converter availability ----
    if not LIBREOFFICE_PATH and not HAS_POWERPOINT_COM:
        raise HTTPException(
            status_code=503,
            detail=(
                "No presentation converter available on the server. "
                "Please install LibreOffice (https://www.libreoffice.org) or Microsoft PowerPoint."
            ),
        )

    # ---- Read & size-check ----
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ---- Create session directory ----
    session_id = str(uuid.uuid4())
    session_dir = WORK_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    active_sessions[session_id] = session_dir

    # ---- Save uploaded file ----
    pptx_path = session_dir / f"presentation{suffix}"
    try:
        pptx_path.write_bytes(contents)
    except OSError as e:
        cleanup_session(session_dir)
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")

    # ---- Convert presentation to PDF ----
    try:
        pdf_path = convert_presentation_to_pdf(pptx_path, session_dir)
    except Exception as e:
        cleanup_session(session_dir)
        raise HTTPException(status_code=500, detail=f"Conversion failed: {e}")

    pdf_url = f"/files/{session_id}/{pdf_path.name}"
    log.info("Session %s created successfully with PDF: %s", session_id, pdf_path.name)

    return JSONResponse(
        {
            "session_id": session_id,
            "pdf_url": pdf_url,
            "filename": file.filename or "presentation.pptx",
        }
    )


@app.delete("/session/{session_id}")
def delete_session(session_id: str, background_tasks: BackgroundTasks):
    """Client calls this when user closes presentation."""
    session_dir = WORK_DIR / session_id
    background_tasks.add_task(cleanup_session, session_dir)
    active_sessions.pop(session_id, None)
    return {"status": "scheduled for cleanup"}
