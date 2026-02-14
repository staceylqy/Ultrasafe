import threading
import time
from typing import Optional, Tuple

import cv2


class FrameGrabber:
    def __init__(self, camera_index: int = 0, size: Optional[Tuple[int, int]] = None) -> None:
        self.camera_index = camera_index
        self.size = size
        self._lock = threading.Lock()
        self._frame = None
        self._running = False
        self._thread = None

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=1)

    def get_frame(self):
        with self._lock:
            return None if self._frame is None else self._frame.copy()

    def _run(self) -> None:
        cap = cv2.VideoCapture(self.camera_index)
        if self.size is not None:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.size[0])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.size[1])

        last_ok = time.time()
        while self._running:
            ok, frame = cap.read()
            if ok:
                with self._lock:
                    self._frame = frame
                last_ok = time.time()
            else:
                if time.time() - last_ok > 2:
                    cap.release()
                    time.sleep(0.25)
                    cap = cv2.VideoCapture(self.camera_index)
                    if self.size is not None:
                        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.size[0])
                        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.size[1])
                    last_ok = time.time()
                time.sleep(0.01)

        cap.release()

