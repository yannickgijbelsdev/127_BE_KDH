"""
Backend tests for GET /api/pexels/media-proxy
- Video proxy: full stream (200) + Range (206) + non-pexels host (400)
- Image proxy: images.pexels.com jpeg (200)
Discovers real Pexels video URLs via /api/pexels/videos first.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def real_pexels_urls(api):
    """Fetch one real mp4 url + one real poster url from Pexels via our backend."""
    r = api.get(
        f"{BASE_URL}/api/pexels/videos",
        params={"query": "server room", "per_page": 1, "page": 1, "orientation": "landscape"},
        timeout=25,
    )
    assert r.status_code == 200, f"Cannot list videos: {r.status_code} {r.text[:200]}"
    data = r.json()
    vids = data.get("videos") or []
    assert vids, f"No videos returned: {data}"
    v = vids[0]
    mp4 = None
    for f in v.get("video_files", []):
        if f.get("file_type") == "video/mp4" and f.get("link"):
            mp4 = f["link"]
            break
    assert mp4, f"No mp4 link found in video: {v}"
    image = v.get("image")
    assert image, f"No poster image in video: {v}"
    return {"video": mp4, "image": image}


class TestMediaProxy:
    def test_video_full_stream_200(self, api, real_pexels_urls):
        url = real_pexels_urls["video"]
        r = api.get(
            f"{BASE_URL}/api/pexels/media-proxy",
            params={"url": url},
            timeout=30,
            stream=True,
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code} for url={url}"
        ct = r.headers.get("content-type", "")
        assert "video/mp4" in ct.lower() or ct.startswith("video/"), (
            f"Expected video/mp4 content-type, got {ct}"
        )
        # Read a small chunk to ensure body streams
        chunk = next(r.iter_content(chunk_size=1024), None)
        assert chunk and len(chunk) > 0, "No bytes streamed from proxy"
        r.close()

    def test_video_range_206(self, api, real_pexels_urls):
        url = real_pexels_urls["video"]
        r = api.get(
            f"{BASE_URL}/api/pexels/media-proxy",
            params={"url": url},
            headers={"Range": "bytes=0-1023"},
            timeout=30,
            stream=True,
        )
        # Some upstreams may return 200 if range not supported, but Pexels supports ranges
        assert r.status_code == 206, (
            f"Expected 206 Partial Content, got {r.status_code}. "
            f"Headers: {dict(r.headers)}"
        )
        cr = r.headers.get("content-range")
        assert cr and cr.lower().startswith("bytes "), (
            f"Expected content-range header, got: {cr}"
        )
        # Body should be small (<=1024 bytes)
        body = r.content
        assert len(body) <= 1024, f"Expected <=1024 bytes, got {len(body)}"
        r.close()

    def test_non_pexels_url_400(self, api):
        r = api.get(
            f"{BASE_URL}/api/pexels/media-proxy",
            params={"url": "https://example.com/x.mp4"},
            timeout=15,
        )
        assert r.status_code == 400, (
            f"Expected 400 for non-pexels URL, got {r.status_code}: {r.text[:200]}"
        )

    def test_http_scheme_rejected_400(self, api):
        r = api.get(
            f"{BASE_URL}/api/pexels/media-proxy",
            params={"url": "http://videos.pexels.com/test.mp4"},
            timeout=15,
        )
        assert r.status_code == 400, (
            f"Expected 400 for http scheme, got {r.status_code}"
        )

    def test_image_proxy_jpeg_200(self, api, real_pexels_urls):
        url = real_pexels_urls["image"]
        r = api.get(
            f"{BASE_URL}/api/pexels/media-proxy",
            params={"url": url},
            timeout=30,
            stream=True,
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code} for url={url}"
        ct = r.headers.get("content-type", "").lower()
        assert "image/" in ct, f"Expected image content-type, got {ct}"
        chunk = next(r.iter_content(chunk_size=1024), None)
        assert chunk and len(chunk) > 0, "No bytes streamed from image proxy"
        r.close()


# ---------------- Static local assets check ----------------

class TestLocalAssets:
    @pytest.mark.parametrize("path", [
        "/assets/logo-127.png",
        "/assets/koodh-logo.png",
        "/assets/autosoft-it-solutions.png",
        "/favicon.png",
    ])
    def test_local_asset_200(self, api, path):
        r = api.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"Asset {path} status={r.status_code}"
        ct = r.headers.get("content-type", "").lower()
        assert "image" in ct or "octet" in ct, f"Asset {path} content-type={ct}"
        assert len(r.content) > 100, f"Asset {path} too small ({len(r.content)} bytes)"
