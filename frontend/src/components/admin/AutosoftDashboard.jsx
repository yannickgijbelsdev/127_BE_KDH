import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, CheckCircle, Clock, Trash2, History, Plus, Laptop, Monitor, Apple, Smartphone, TabletSmartphone } from 'lucide-react';

const AutosoftDashboard = () => {
  const [barcode, setBarcode] = useState('');
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showDeviceOptions, setShowDeviceOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    no_damage: false,
    device_platform: '',
    os_version: '',
    charger_included: false,
    image_restored: false,
    customer_data_wiped: false,
    notes: ''
  });

  // OS Version options based on platform
  const osVersionOptions = {
    'Windows': ['Windows 10 22H2', 'Windows 11 23H2', 'Windows 11 24H2', 'Windows 11 25H2'],
    'macOS': ['macOS Sequoia 15', 'macOS Sonoma 14', 'macOS Ventura 13', 'macOS Monterey 12', 'macOS Big Sur 11'],
    'Android': ['Android 15', 'Android 14', 'Android 13', 'Android 12', 'Android 11', 'Android 10'],
    'iOS': ['iOS 18', 'iOS 17', 'iOS 16', 'iOS 15', 'iOS 14']
  };

  const barcodeInputRef = useRef(null);

  // Helper function to get platform icon
  const getPlatformIcon = (device) => {
    const latestCheck = device.checklists && device.checklists.length > 0 
      ? device.checklists[device.checklists.length - 1] 
      : null;
    
    const platform = latestCheck?.device_platform || '';
    
    switch(platform) {
      case 'Windows':
        return <Monitor className="w-4 h-4 text-blue-400" title="Windows" />;
      case 'macOS':
        return <Apple className="w-4 h-4 text-gray-300" title="macOS" />;
      case 'Android':
        return <Smartphone className="w-4 h-4 text-green-400" title="Android" />;
      case 'iOS':
        return <Smartphone className="w-4 h-4 text-gray-400" title="iOS" />;
      default:
        return <TabletSmartphone className="w-4 h-4 text-gray-500" title="Onbekend" />;
    }
  };

  useEffect(() => {
    // Focus barcode input on mount
    barcodeInputRef.current?.focus();
    fetchDevices();
  }, []);

  useEffect(() => {
    // Filter devices based on status and platform
    let filtered = devices;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(d => {
        const latestCheck = d.checklists && d.checklists.length > 0 
          ? d.checklists[d.checklists.length - 1] 
          : null;
        return latestCheck?.device_platform === platformFilter;
      });
    }
    
    setFilteredDevices(filtered);
  }, [devices, statusFilter, platformFilter]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/autosoft/devices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/autosoft/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ barcode: barcode.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.action === 'registered') {
          // First scan - device registered
          setSelectedDevice(data.device);
          setDeviceType(data.device.device_type || '');
          setSerialNumber(data.device.serial_number || '');
          setShowChecklist(true);
          setBarcode('');
          fetchDevices();
        } else if (data.action === 'device_exists') {
          // Device exists - show options
          setSelectedDevice(data.device);
          setDeviceType(data.device.device_type || '');
          setSerialNumber(data.device.serial_number || '');
          setShowDeviceOptions(true);
          setBarcode('');
        }
      }
    } catch (error) {
      console.error('Error scanning device:', error);
      alert('Fout bij scannen van toestel');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCheck = () => {
    setShowDeviceOptions(false);
    setShowChecklist(true);
    setChecklist({
      no_damage: false,
      device_platform: '',
      os_version: '',
      charger_included: false,
      image_restored: false,
      customer_data_wiped: false,
      notes: ''
    });
  };

  const handleViewHistory = () => {
    setShowDeviceOptions(false);
    setShowHistory(true);
  };

  const handleUpdateDeviceInfo = async () => {
    if (!selectedDevice) return;
    if (!deviceType.trim() && !serialNumber.trim()) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/autosoft/device/${selectedDevice.barcode}/info`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            device_type: deviceType || null,
            serial_number: serialNumber || null
          })
        }
      );

      if (response.ok) {
        const updatedDevice = await response.json();
        setSelectedDevice(updatedDevice);
        fetchDevices();
      }
    } catch (error) {
      console.error('Error updating device info:', error);
    }
  };

  const handleChecklistSubmit = async () => {
    if (!selectedDevice) return;

    // First update device info if changed
    if ((deviceType && deviceType !== selectedDevice.device_type) || 
        (serialNumber && serialNumber !== selectedDevice.serial_number)) {
      await handleUpdateDeviceInfo();
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/autosoft/device/${selectedDevice.barcode}/checklist`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ checklist })
        }
      );

      if (response.ok) {
        alert('Checklist opgeslagen!');
        setShowChecklist(false);
        setSelectedDevice(null);
        setDeviceType('');
        setSerialNumber('');
        setChecklist({
          no_damage: false,
          device_platform: '',
          os_version: '',
          charger_included: false,
          image_restored: false,
          customer_data_wiped: false,
          notes: ''
        });
        setBarcode('');
        fetchDevices();
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Fout bij opslaan checklist');
    }
  };

  const handlePrint = () => {
    if (!selectedDevice) return;
    
    // Determine which checklist to print
    let checklistToPrint = checklist;
    let checkDate = new Date();
    let checkedBy = '';
    
    if (selectedDevice.currentCheckIndex !== undefined && selectedDevice.checklists) {
      // Printing from history
      checklistToPrint = selectedDevice.checklists[selectedDevice.currentCheckIndex];
      checkDate = new Date(checklistToPrint.checked_at);
      checkedBy = checklistToPrint.checked_by || '';
    } else if (selectedDevice.checklists && selectedDevice.checklists.length > 0) {
      // Print most recent checklist
      checklistToPrint = selectedDevice.checklists[selectedDevice.checklists.length - 1];
      checkDate = new Date(checklistToPrint.checked_at);
      checkedBy = checklistToPrint.checked_by || '';
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Autosoft Checklist - ${selectedDevice.barcode}</title>
          <style>
            @media print {
              @page { 
                margin: 15mm; 
                size: A4;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #000;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 15mm;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .header-left img {
              max-width: 180px;
              height: auto;
            }
            .header-right {
              text-align: right;
              font-size: 9pt;
              line-height: 1.6;
            }
            .header-right strong {
              font-size: 10pt;
            }
            .customer-info {
              margin: 20px 0;
              padding: 10px 0;
            }
            .customer-info p {
              margin: 3px 0;
              font-size: 10pt;
            }
            .document-title {
              color: #2596be !important;
              font-size: 20pt;
              font-weight: bold;
              margin: 20px 0 10px 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .document-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 10pt;
            }
            .document-info-left, .document-info-right {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 10pt;
            }
            table thead {
              background-color: #2596be !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            table th {
              padding: 10px;
              text-align: left;
              font-weight: bold;
              background-color: #2596be !important;
              color: white !important;
            }
            table td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            table tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-ok {
              color: #4CAF50;
              font-weight: bold;
            }
            .status-nok {
              color: #f44336;
              font-weight: bold;
            }
            .notes-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #fffbf0;
              border: 1px solid #ffd700;
              border-radius: 3px;
            }
            .notes-section h3 {
              color: #cc8800;
              font-size: 11pt;
              margin-bottom: 10px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 2px solid #2596be !important;
              text-align: center;
              font-size: 8pt;
              line-height: 1.8;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .footer-divider {
              margin: 5px 0;
            }
            @media print {
              .container {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="header-left">
                <img src="https://customer-assets.emergentagent.com/job_pixel-diagnostics/artifacts/2r9adp9r_Autosoft%20IT%20Solutions%20BV.png" alt="Autosoft Logo" />
              </div>
              <div class="header-right">
                <strong>Autosoft IT Solutions BV</strong><br>
                Binnensingel 38, 3920 Lommel<br>
                BTW: BE0476690068<br>
                BELFIUS: BE47 7775 9649 2280<br>
                BNP: BE25 0017 2567 7082
              </div>
            </div>

            <!-- Document Title -->
            <div class="document-title">Checklist # ${selectedDevice.barcode}</div>

            <!-- Device Info Section -->
            <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2596be;">
              ${selectedDevice.device_type ? `
                <p style="margin: 5px 0;"><strong>Type:</strong> ${selectedDevice.device_type}</p>
              ` : ''}
              ${selectedDevice.serial_number ? `
                <p style="margin: 5px 0;"><strong>Serienummer:</strong> ${selectedDevice.serial_number}</p>
              ` : ''}
              ${checklistToPrint.device_platform && checklistToPrint.os_version ? `
                <p style="margin: 5px 0;"><strong>Platform:</strong> ${checklistToPrint.device_platform} - ${checklistToPrint.os_version}</p>
              ` : ''}
              <p style="margin: 5px 0;"><strong>Datum Controle:</strong> ${checkDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Gecontroleerd</p>
            </div>

            <!-- Checklist Table -->
            <table>
              <thead>
                <tr>
                  <th>CONTROLE PUNT</th>
                  <th style="width: 150px; text-align: center;">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Zonder schade teruggekomen</td>
                  <td style="text-align: center;" class="${checklistToPrint.no_damage ? 'status-ok' : 'status-nok'}">
                    ${checklistToPrint.no_damage ? '✓ JA' : '✗ NEE'}
                  </td>
                </tr>
                ${checklistToPrint.device_platform && checklistToPrint.os_version ? `
                <tr>
                  <td>${checklistToPrint.device_platform} versie</td>
                  <td style="text-align: center;" class="status-ok">
                    ${checklistToPrint.os_version}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td>Lader erbij</td>
                  <td style="text-align: center;" class="${checklistToPrint.charger_included ? 'status-ok' : 'status-nok'}">
                    ${checklistToPrint.charger_included ? '✓ JA' : '✗ NEE'}
                  </td>
                </tr>
                <tr>
                  <td>Image terug gezet</td>
                  <td style="text-align: center;" class="${checklistToPrint.image_restored ? 'status-ok' : 'status-nok'}">
                    ${checklistToPrint.image_restored ? '✓ JA' : '✗ NEE'}
                  </td>
                </tr>
                <tr>
                  <td>Klant data gewist</td>
                  <td style="text-align: center;" class="${checklistToPrint.customer_data_wiped ? 'status-ok' : 'status-nok'}">
                    ${checklistToPrint.customer_data_wiped ? '✓ JA' : '✗ NEE'}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Notes Section -->
            ${checklistToPrint.notes ? `
              <div class="notes-section">
                <h3>Notities:</h3>
                <p>${checklistToPrint.notes}</p>
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
              <p><strong>B2C:</strong> 011 554513 | winkel@autosoft.be | www.autosoft.be</p>
              <p><strong>B2B:</strong> 011 711030 | sales@ascit.pro | www.ascit.pro</p>
              <div style="margin-top: 10px; font-size: 7pt;">
                <p>Pagina: 1 / 1</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDelete = async (barcode) => {
    if (!confirm('Weet je zeker dat je dit toestel wilt verwijderen?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/autosoft/device/${barcode}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert('Toestel verwijderd');
        fetchDevices();
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Fout bij verwijderen');
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#202124] text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Autosoft Vervangtoestellen</h1>
        <p className="text-gray-400">Scan barcodes om toestellen te registreren en controleren</p>
      </div>

      {/* Scanner Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-[#303134] rounded-lg p-6">
          <form onSubmit={handleScan} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && barcode.trim()) {
                    e.preventDefault();
                    handleScan(e);
                  }
                }}
                placeholder="Scan barcode..."
                className="w-full pl-10 pr-4 py-3 bg-[#202124] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !barcode.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Scannen...' : 'Scan'}
            </button>
          </form>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-[#303134] text-gray-300 hover:bg-[#3c4043]'
            }`}
          >
            Alle ({devices.length})
          </button>
          <button
            onClick={() => setStatusFilter('technical_check')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'technical_check' ? 'bg-orange-600 text-white' : 'bg-[#303134] text-gray-300 hover:bg-[#3c4043]'
            }`}
          >
            <Clock className="inline w-4 h-4 mr-2" />
            Op technische dienst ({devices.filter(d => d.status === 'technical_check').length})
          </button>
          <button
            onClick={() => setStatusFilter('checked')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'checked' ? 'bg-green-600 text-white' : 'bg-[#303134] text-gray-300 hover:bg-[#3c4043]'
            }`}
          >
            <CheckCircle className="inline w-4 h-4 mr-2" />
            Gecontroleerd ({devices.filter(d => d.status === 'checked').length})
          </button>
        </div>
      </div>

      {/* Devices Table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#303134] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#202124]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Checks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Laatste update
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                    Geen toestellen gevonden
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-[#3c4043]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(device)}
                        <span className="font-mono text-sm">{device.barcode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {device.device_type || <span className="text-gray-500 italic">Niet ingevuld</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {device.status === 'checked' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Gecontroleerd
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-900 text-orange-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Technische dienst
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-900/30 text-blue-300 text-xs">
                        {device.checklists?.length || 0} check(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(device.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {device.checklists && device.checklists.length > 0 && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedDevice(device);
                                setShowHistory(true);
                              }}
                              className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                              title="Bekijk historie"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDevice(device);
                                handlePrint();
                              }}
                              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                              title="Print laatste check"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(device.barcode)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                          title="Verwijder toestel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Options Modal */}
      {showDeviceOptions && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#303134] rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Device Gevonden - {selectedDevice.barcode}
              </h2>
              
              <div className="space-y-3 mb-6">
                <p className="text-gray-300">
                  Dit device bestaat al met {selectedDevice.checklists?.length || 0} eerdere check(s).
                </p>
                {selectedDevice.device_type && (
                  <p className="text-gray-400 text-sm">
                    Type: {selectedDevice.device_type}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleNewCheck}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nieuwe Check Maken
                </button>
                
                <button
                  onClick={handleViewHistory}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
                >
                  <History className="w-5 h-5" />
                  Bekijk Historie ({selectedDevice.checklists?.length || 0})
                </button>
                
                <button
                  onClick={() => {
                    setShowDeviceOptions(false);
                    setSelectedDevice(null);
                  }}
                  className="w-full px-4 py-3 bg-[#202124] hover:bg-[#252629] rounded-lg text-white font-medium transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#303134] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Check Historie - {selectedDevice.barcode}
              </h2>
              
              {selectedDevice.device_type && (
                <p className="text-gray-400 mb-4">Type: {selectedDevice.device_type}</p>
              )}

              <div className="space-y-4">
                {(selectedDevice.checklists || []).length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nog geen checks uitgevoerd</p>
                ) : (
                  [...(selectedDevice.checklists || [])].reverse().map((check, index) => (
                    <div key={index} className="bg-[#202124] rounded-lg p-4 border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-white font-medium">
                            Check #{selectedDevice.checklists.length - index}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {new Date(check.checked_at).toLocaleString('nl-NL')}
                          </p>
                          {check.checked_by && (
                            <p className="text-gray-500 text-sm">Door: {check.checked_by}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDevice({ ...selectedDevice, currentCheckIndex: selectedDevice.checklists.length - 1 - index });
                            handlePrint();
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                          title="Print deze check"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={`p-2 rounded ${check.no_damage ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                          Schade: {check.no_damage ? '✓ Geen' : '✗ Ja'}
                        </div>
                        {check.device_platform && check.os_version ? (
                          <div className="p-2 bg-gray-700 rounded text-gray-300">
                            {check.device_platform}: {check.os_version}
                          </div>
                        ) : check.windows_version ? (
                          <div className="p-2 bg-gray-700 rounded text-gray-300">
                            Windows: {check.windows_version}
                          </div>
                        ) : (
                          <div className="p-2 bg-gray-700 rounded text-gray-400">
                            OS: N/A
                          </div>
                        )}
                        <div className={`p-2 rounded ${check.charger_included ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                          Lader: {check.charger_included ? '✓ Ja' : '✗ Nee'}
                        </div>
                        <div className={`p-2 rounded ${check.image_restored ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                          Image: {check.image_restored ? '✓ Ja' : '✗ Nee'}
                        </div>
                        <div className={`p-2 rounded ${check.customer_data_wiped ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                          Data gewist: {check.customer_data_wiped ? '✓ Ja' : '✗ Nee'}
                        </div>
                      </div>
                      
                      {check.notes && (
                        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700 rounded">
                          <p className="text-yellow-300 text-sm font-medium">Notities:</p>
                          <p className="text-gray-300 text-sm">{check.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setShowHistory(false);
                  setSelectedDevice(null);
                }}
                className="w-full mt-6 px-4 py-3 bg-[#202124] hover:bg-[#252629] rounded-lg text-white font-medium transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist Modal */}
      {showChecklist && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#303134] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Controle Checklist - {selectedDevice.barcode}
              </h2>

              <div className="space-y-4">
                {/* Device Type */}
                <div className="p-3 bg-[#202124] rounded-lg">
                  <label className="flex items-center gap-2 text-white mb-2">
                    <Laptop className="w-4 h-4" />
                    Toestel Type:
                  </label>
                  <input
                    type="text"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    placeholder="Bijv. Dell Latitude 5420, iPhone 14 Pro, Samsung Galaxy S23..."
                    className="w-full px-4 py-2 bg-[#303134] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Serial Number */}
                <div className="p-3 bg-[#202124] rounded-lg">
                  <label className="block text-white mb-2">Serienummer:</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Serienummer van het toestel..."
                    className="w-full px-4 py-2 bg-[#303134] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* No Damage */}
                <label className="flex items-center space-x-3 p-3 bg-[#202124] rounded-lg cursor-pointer hover:bg-[#252629]">
                  <input
                    type="checkbox"
                    checked={checklist.no_damage}
                    onChange={(e) => setChecklist({ ...checklist, no_damage: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Zonder schade teruggekomen</span>
                </label>

                {/* Platform Selection */}
                <div className="p-3 bg-[#202124] rounded-lg">
                  <label className="block text-white mb-2">Platform:</label>
                  <select
                    value={checklist.device_platform}
                    onChange={(e) => {
                      setChecklist({ ...checklist, device_platform: e.target.value, os_version: '' });
                    }}
                    className="w-full px-4 py-2 bg-[#303134] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecteer platform...</option>
                    <option value="Windows">Windows</option>
                    <option value="macOS">macOS (Apple)</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                  </select>
                </div>

                {/* OS Version (conditional based on platform) */}
                {checklist.device_platform && (
                  <div className="p-3 bg-[#202124] rounded-lg">
                    <label className="block text-white mb-2">
                      {checklist.device_platform === 'Windows' ? 'Windows Versie:' :
                       checklist.device_platform === 'macOS' ? 'macOS Versie:' :
                       checklist.device_platform === 'Android' ? 'Android Versie:' :
                       'iOS Versie:'}
                    </label>
                    <select
                      value={checklist.os_version}
                      onChange={(e) => setChecklist({ ...checklist, os_version: e.target.value })}
                      className="w-full px-4 py-2 bg-[#303134] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecteer versie...</option>
                      {osVersionOptions[checklist.device_platform]?.map(version => (
                        <option key={version} value={version}>{version}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Charger Included */}
                <label className="flex items-center space-x-3 p-3 bg-[#202124] rounded-lg cursor-pointer hover:bg-[#252629]">
                  <input
                    type="checkbox"
                    checked={checklist.charger_included}
                    onChange={(e) => setChecklist({ ...checklist, charger_included: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Lader erbij</span>
                </label>

                {/* Image Restored */}
                <label className="flex items-center space-x-3 p-3 bg-[#202124] rounded-lg cursor-pointer hover:bg-[#252629]">
                  <input
                    type="checkbox"
                    checked={checklist.image_restored}
                    onChange={(e) => setChecklist({ ...checklist, image_restored: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Image terug gezet</span>
                </label>

                {/* Customer Data Wiped */}
                <label className="flex items-center space-x-3 p-3 bg-[#202124] rounded-lg cursor-pointer hover:bg-[#252629]">
                  <input
                    type="checkbox"
                    checked={checklist.customer_data_wiped}
                    onChange={(e) => setChecklist({ ...checklist, customer_data_wiped: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">Alle klant data gewist</span>
                </label>

                {/* Notes */}
                <div className="p-3 bg-[#202124] rounded-lg">
                  <label className="block text-white mb-2">Notities:</label>
                  <textarea
                    value={checklist.notes}
                    onChange={(e) => setChecklist({ ...checklist, notes: e.target.value })}
                    placeholder="Extra opmerkingen..."
                    rows="4"
                    className="w-full px-4 py-2 bg-[#303134] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChecklist(false);
                    setSelectedDevice(null);
                    setBarcode('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleChecklistSubmit}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                >
                  Opslaan
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutosoftDashboard;
