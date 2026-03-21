import io
import json
import zipfile
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

router = APIRouter()

# Resolve the frontend dist/ directory relative to this file's location
DIST_DIR = Path(__file__).parent.parent.parent.parent / "frontend" / "dist"


@router.get("/version")
def get_version():
    """Return the current build version (bundleId + buildTime)."""
    version_file = DIST_DIR / "version.json"
    if not version_file.exists():
        raise HTTPException(
            status_code=404,
            detail="version.json not found — run 'npm run build' first",
        )
    return JSONResponse(json.loads(version_file.read_text()))


@router.get("/bundle.zip")
def get_bundle():
    """Stream the frontend dist/ directory as a zip bundle."""
    if not DIST_DIR.exists():
        raise HTTPException(
            status_code=404,
            detail="dist/ directory not found — run 'npm run build' first",
        )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in DIST_DIR.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(DIST_DIR))
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=bundle.zip"},
    )
