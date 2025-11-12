#!/usr/bin/env python3
"""
Autosoft Desktop Overlay
Een transparante overlay voor Windows laptops die device informatie toont
"""

import tkinter as tk
from tkinter import ttk
import requests
import socket
import platform
import subprocess
import threading
import time
from datetime import datetime
import sys
from io import BytesIO
try:
    from PIL import Image, ImageTk
except ImportError:
    print("PIL/Pillow niet geïnstalleerd. Installeer met: pip install Pillow")
    sys.exit(1)

# Configuration
BACKEND_URL = "https://pixel-diagnostics.preview.emergentagent.com/api"
UPDATE_INTERVAL = 300  # 5 minutes in seconds
OVERLAY_WIDTH = 350
OVERLAY_HEIGHT = 300

# Autosoft logo URL
AUTOSOFT_LOGO_URL = "https://customer-assets.emergentagent.com/job_pixel-diagnostics/artifacts/2r9adp9r_Autosoft%20IT%20Solutions%20BV.png"


class AutosoftOverlay:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Autosoft Device Info")
        
        # Window configuration
        self.root.geometry(f"{OVERLAY_WIDTH}x{OVERLAY_HEIGHT}+20+20")
        self.root.attributes("-topmost", True)  # Always on top
        self.root.attributes("-alpha", 0.95)  # Semi-transparent
        self.root.overrideredirect(True)  # No window borders
        
        # Make window draggable
        self.root.bind("<Button-1>", self.start_move)
        self.root.bind("<B1-Motion>", self.do_move)
        
        # System info
        self.system_info = self.get_system_info()
        
        # Download and cache logo
        self.logo_image = self.load_logo()
        
        # Setup UI
        self.setup_ui()
        
        # Start update loop
        self.update_thread = threading.Thread(target=self.update_loop, daemon=True)
        self.update_thread.start()
        
        # Initial data fetch
        self.update_device_info()
    
    def load_logo(self):
        """Download and load the Autosoft logo"""
        try:
            response = requests.get(AUTOSOFT_LOGO_URL, timeout=10)
            if response.status_code == 200:
                image = Image.open(BytesIO(response.content))
                # Resize to fit in header (max height 50px)
                aspect_ratio = image.width / image.height
                new_height = 50
                new_width = int(new_height * aspect_ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                return ImageTk.PhotoImage(image)
        except Exception as e:
            print(f"Kon logo niet laden: {e}")
        return None
    
    def get_system_info(self):
        """Collect system information"""
        info = {}
        
        # Windows version
        try:
            result = subprocess.run(['cmd', '/c', 'ver'], capture_output=True, text=True)
            info['windows_version'] = result.stdout.strip()
        except:
            info['windows_version'] = platform.version()
        
        # PC name / hostname
        info['hostname'] = socket.gethostname()
        
        # IP address
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            info['ip_address'] = s.getsockname()[0]
            s.close()
        except:
            info['ip_address'] = "N/A"
        
        # Serial number (Windows)
        try:
            result = subprocess.run(
                ['wmic', 'bios', 'get', 'serialnumber'],
                capture_output=True,
                text=True,
                timeout=5
            )
            serial = result.stdout.strip().split('\n')[-1].strip()
            info['serial_number'] = serial if serial else "N/A"
        except:
            info['serial_number'] = "N/A"
        
        return info
    
    def setup_ui(self):
        """Setup the UI components"""
        # Main container with gradient-like background
        main_frame = tk.Frame(self.root, bg="#2596be", relief=tk.RAISED, bd=2)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header with logo
        header_frame = tk.Frame(main_frame, bg="#2596be", height=70)
        header_frame.pack(fill=tk.X, padx=10, pady=5)
        header_frame.pack_propagate(False)
        
        # Logo (if loaded)
        if self.logo_image:
            logo_label = tk.Label(
                header_frame,
                image=self.logo_image,
                bg="#2596be"
            )
            logo_label.pack(side=tk.LEFT, pady=10)
            # Keep a reference to prevent garbage collection
            logo_label.image = self.logo_image
        else:
            # Fallback to text if logo couldn't be loaded
            title_label = tk.Label(
                header_frame,
                text="AUTOSOFT",
                font=("Arial", 16, "bold"),
                bg="#2596be",
                fg="white"
            )
            title_label.pack(side=tk.LEFT, pady=10)
        
        # Close button
        close_btn = tk.Button(
            header_frame,
            text="×",
            font=("Arial", 18),
            bg="#2596be",
            fg="white",
            bd=0,
            command=self.close_overlay,
            cursor="hand2",
            activebackground="#1e7a9f",
            activeforeground="white"
        )
        close_btn.pack(side=tk.RIGHT, pady=10)
        
        # Content frame - dark background
        content_frame = tk.Frame(main_frame, bg="#1a1a1a")
        content_frame.pack(fill=tk.BOTH, expand=True, padx=0, pady=0)
        
        # Info labels container
        info_frame = tk.Frame(content_frame, bg="#1a1a1a")
        info_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=15)
        
        # Device Type
        self.device_type_label = self.create_info_label(info_frame, "Device Type:", "Loading...")
        
        # Barcode
        self.barcode_label = self.create_info_label(info_frame, "Barcode:", "N/A")
        
        # Windows Version
        win_version = self.system_info.get('windows_version', 'N/A')
        # Simplify version string
        if 'Windows' in win_version:
            win_version = win_version.split('[')[0].strip()
        self.win_version_label = self.create_info_label(info_frame, "Windows:", win_version)
        
        # PC Name
        self.pc_name_label = self.create_info_label(info_frame, "PC Naam:", self.system_info.get('hostname', 'N/A'))
        
        # IP Address
        self.ip_label = self.create_info_label(info_frame, "IP Adres:", self.system_info.get('ip_address', 'N/A'))
        
        # Last Check
        self.last_check_label = self.create_info_label(info_frame, "Laatste Check:", "Nog niet gecontroleerd")
        
        # Status bar at bottom
        status_frame = tk.Frame(content_frame, bg="#0d0d0d", height=30)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(
            status_frame,
            text="Laatste update: Net nu",
            font=("Arial", 8),
            bg="#0d0d0d",
            fg="#999999"
        )
        self.status_label.pack(pady=8)
    
    def create_info_label(self, parent, label_text, value_text):
        """Create a clean label pair (label: value) in white text"""
        frame = tk.Frame(parent, bg="#1a1a1a")
        frame.pack(fill=tk.X, pady=4)
        
        # Combined label with value - cleaner look
        full_text = f"{label_text} {value_text}"
        label = tk.Label(
            frame,
            text=full_text,
            font=("Segoe UI", 10),
            bg="#1a1a1a",
            fg="#ffffff",
            anchor="w"
        )
        label.pack(side=tk.LEFT)
        
        # Store reference to update value later
        label.label_text = label_text
        
        return label
    
    def update_device_info(self):
        """Fetch device info from backend"""
        serial_number = self.system_info.get('serial_number', 'N/A')
        
        if serial_number == "N/A":
            self.status_label.config(text="Geen serienummer gevonden")
            return
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/autosoft/device-info/{serial_number}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Update UI with fetched data
                device_type = data.get('device_type', 'Onbekend')
                barcode = data.get('barcode', 'N/A')
                
                self.device_type_label.config(text=f"{self.device_type_label.label_text} {device_type}")
                self.barcode_label.config(text=f"{self.barcode_label.label_text} {barcode}")
                
                # Last check date
                if data.get('last_check_date'):
                    try:
                        check_date = datetime.fromisoformat(data['last_check_date'].replace('Z', '+00:00'))
                        formatted_date = check_date.strftime('%d-%m-%Y %H:%M')
                        self.last_check_label.config(text=formatted_date)
                    except:
                        self.last_check_label.config(text="Datum onbekend")
                else:
                    self.last_check_label.config(text="Nog niet gecontroleerd")
                
                # Update status
                now = datetime.now().strftime('%H:%M')
                self.status_label.config(text=f"Laatste update: {now}")
                
            elif response.status_code == 404:
                self.status_label.config(text="Device niet gevonden in systeem")
            else:
                self.status_label.config(text=f"Fout: {response.status_code}")
                
        except requests.exceptions.Timeout:
            self.status_label.config(text="Timeout - Geen verbinding")
        except requests.exceptions.ConnectionError:
            self.status_label.config(text="Geen verbinding met backend")
        except Exception as e:
            self.status_label.config(text=f"Fout: {str(e)[:30]}")
    
    def update_loop(self):
        """Background thread to update info periodically"""
        while True:
            time.sleep(UPDATE_INTERVAL)
            self.update_device_info()
    
    def start_move(self, event):
        """Start dragging the window"""
        self.x = event.x
        self.y = event.y
    
    def do_move(self, event):
        """Move the window"""
        deltax = event.x - self.x
        deltay = event.y - self.y
        x = self.root.winfo_x() + deltax
        y = self.root.winfo_y() + deltay
        self.root.geometry(f"+{x}+{y}")
    
    def close_overlay(self):
        """Close the overlay"""
        self.root.quit()
        self.root.destroy()
    
    def run(self):
        """Start the application"""
        self.root.mainloop()


def main():
    """Main entry point"""
    try:
        app = AutosoftOverlay()
        app.run()
    except KeyboardInterrupt:
        print("\nOverlay gestopt")
        sys.exit(0)
    except Exception as e:
        print(f"Fout bij starten overlay: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
