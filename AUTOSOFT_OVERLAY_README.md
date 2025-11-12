# Autosoft Desktop Overlay

Een transparante desktop overlay voor Windows laptops die live device informatie toont vanuit het Autosoft systeem.

## Features

✅ **Live Data Updates** - Automatische updates elke 5 minuten
✅ **System Info** - Windows versie, PC naam, IP adres
✅ **Device Tracking** - Laatste check datum, device type, barcode
✅ **Altijd Zichtbaar** - Overlay blijft bovenop andere vensters
✅ **Draagbaar** - Sleep de overlay naar gewenste positie
✅ **Minimaal** - Geen installatie nodig, gewoon starten

## Vereisten

- **Windows 10/11**
- **Python 3.8+** ([Download hier](https://www.python.org/downloads/))
- **Internetverbinding** (voor backend communicatie)

## Installatie

### Stap 1: Python Installeren

1. Download Python van https://www.python.org/downloads/
2. Voer de installer uit
3. ✅ **BELANGRIJK**: Vink "Add Python to PATH" aan tijdens installatie

### Stap 2: Bestanden Klaarzetten

1. Kopieer deze bestanden naar een map (bijv. `C:\Autosoft\`):
   - `autosoft_overlay.py`
   - `autosoft_overlay_requirements.txt`
   - `start_autosoft_overlay.bat`

### Stap 3: Dependencies Installeren

Open Command Prompt en navigeer naar de map:
```cmd
cd C:\Autosoft
pip install -r autosoft_overlay_requirements.txt
```

## Gebruik

### Manueel Starten

Dubbelklik op `start_autosoft_overlay.bat`

Of via Command Prompt:
```cmd
cd C:\Autosoft
python autosoft_overlay.py
```

### Automatisch Starten bij Opstarten

1. Druk `Win + R`
2. Typ: `shell:startup` en druk Enter
3. Maak een snelkoppeling naar `start_autosoft_overlay.bat`
4. Plaats de snelkoppeling in de Startup folder

## Configuratie

Edit `autosoft_overlay.py` om instellingen aan te passen:

```python
# Backend URL
BACKEND_URL = "https://autosoft-device.preview.emergentagent.com/api"

# Update interval (in seconden)
UPDATE_INTERVAL = 300  # 5 minuten

# Overlay grootte
OVERLAY_WIDTH = 350
OVERLAY_HEIGHT = 280
```

## Getoonde Informatie

De overlay toont:
- **Device Type** - Bijv. "Dell Latitude 5420"
- **Barcode** - Device barcode uit Autosoft systeem
- **Windows Versie** - Bijv. "Windows 11 24H2"
- **PC Naam** - Hostname van de laptop
- **IP Adres** - Lokaal IP adres
- **Laatste Check** - Datum en tijd van laatste Autosoft check

## Hoe Het Werkt

1. **System Info Verzamelen**
   - Leest Windows versie via `ver` command
   - Haalt PC naam op via `socket.gethostname()`
   - Verzamelt IP adres via socket connectie
   - Leest serienummer via `wmic bios get serialnumber`

2. **Backend Communicatie**
   - Stuurt serienummer naar backend API
   - Ontvangt device informatie (barcode, type, laatste check)
   - Update elke 5 minuten automatisch

3. **Device Matching**
   - Backend zoekt device via serienummer OF barcode
   - Toont meest recente checklist data
   - Werkt alleen als device geregistreerd is in Autosoft systeem

## Troubleshooting

### "Device niet gevonden in systeem"
➡️ Het device moet eerst gescand en geregistreerd worden via het Autosoft dashboard

### "Geen verbinding met backend"
➡️ Check internetverbinding en backend URL

### "Geen serienummer gevonden"
➡️ Sommige VM's of oude systemen hebben geen serienummer. Configureer handmatig via barcode.

### Overlay verdwijnt
➡️ Check of Python proces nog draait in Task Manager

### Python niet herkend
➡️ Herinstalleer Python met "Add to PATH" optie

## Executable Maken (Optioneel)

Voor distributie zonder Python installatie:

```cmd
pip install pyinstaller
pyinstaller --onefile --windowed --icon=autosoft.ico autosoft_overlay.py
```

Dit maakt een `autosoft_overlay.exe` in de `dist/` folder.

## Security

- ✅ **Alleen leestoegang** - Overlay heeft alleen read-only API toegang
- ✅ **Geen admin rechten** - Draait als normale gebruiker
- ✅ **Geen data opslag** - Geen lokale database of logs
- ✅ **HTTPS communicatie** - Veilige verbinding met backend

## Support

Bij problemen of vragen:
- Check de backend logs in Autosoft admin dashboard
- Test API endpoint: `GET /api/autosoft/device-info/{serial_number}`
- Controleer Windows Event Viewer voor Python errors

## Licentie

© 2025 Autosoft IT Solutions BV - Intern gebruik only
