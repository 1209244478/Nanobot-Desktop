"""
Runtime hook for PyInstaller to set up correct paths for nanobot.
This runs before the main application starts.
"""
import sys
import os
from pathlib import Path

if getattr(sys, 'frozen', False):
    application_path = Path(sys._MEIPASS)
else:
    application_path = Path(__file__).parent

os.environ['NANOBOT_BASE_PATH'] = str(application_path)
