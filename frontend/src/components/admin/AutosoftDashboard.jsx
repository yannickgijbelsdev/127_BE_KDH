import React, { useState, useEffect, useRef } from 'react';
import { Search, Printer, CheckCircle, Clock, Trash2 } from 'lucide-react';

const AutosoftDashboard = () => {
  const [barcode, setBarcode] = useState('');
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    no_damage: false,
    windows_version: '',
    charger_included: false,
    image_restored: false,
    customer_data_wiped: false,
    notes: ''
  });

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    // Focus barcode input on mount
    barcodeInputRef.current?.focus();
    fetchDevices();
  }, []);

  useEffect(() => {
    // Filter devices based on status
    if (statusFilter === 'all') {
      setFilteredDevices(devices);
    } else {
      setFilteredDevices(devices.filter(d => d.status === statusFilter));
    }
  }, [devices, statusFilter]);

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
          alert(`Toestel ${barcode} geregistreerd en op technische dienst geplaatst`);
          setBarcode('');
          fetchDevices();
        } else if (data.action === 'open_checklist') {
          // Second scan - open checklist
          setSelectedDevice(data.device);
          setShowChecklist(true);
          
          // Pre-fill checklist if exists
          if (data.device.checklist) {
            setChecklist(data.device.checklist);
          }
        }
      }
    } catch (error) {
      console.error('Error scanning device:', error);
      alert('Fout bij scannen van toestel');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistSubmit = async () => {
    if (!selectedDevice) return;

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
        setChecklist({
          no_damage: false,
          windows_version: '',
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
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Autosoft Checklist - ${selectedDevice.barcode}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #333;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .info-section {
              margin: 20px 0;
            }
            .checklist-item {
              padding: 10px;
              margin: 5px 0;
              background: #f5f5f5;
              border-left: 3px solid ${selectedDevice.checklist?.no_damage ? '#4CAF50' : '#ccc'};
            }
            .checked {
              border-left-color: #4CAF50;
            }
            .not-checked {
              border-left-color: #f44336;
            }
            .notes {
              margin-top: 20px;
              padding: 15px;
              background: #fff3cd;
              border: 1px solid #ffc107;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Autosoft Vervangtoestel Checklist</h1>
          
          <div class="info-section">
            <p><strong>Barcode:</strong> ${selectedDevice.barcode}</p>
            <p><strong>Status:</strong> ${selectedDevice.status === 'checked' ? 'Gecontroleerd' : 'Op technische dienst'}</p>
            <p><strong>Gecontroleerd door:</strong> ${selectedDevice.checked_by || '-'}</p>
            <p><strong>Datum:</strong> ${new Date(selectedDevice.updated_at).toLocaleString('nl-NL')}</p>
          </div>

          <h2>Controle Checklist</h2>
          
          <div class="checklist-item ${checklist.no_damage ? 'checked' : 'not-checked'}">
            <strong>Zonder schade teruggekomen:</strong> ${checklist.no_damage ? '✓ Ja' : '✗ Nee'}
          </div>

          <div class="checklist-item ${checklist.windows_version ? 'checked' : 'not-checked'}">
            <strong>Windows versie:</strong> ${checklist.windows_version || 'Niet ingevuld'}
          </div>

          <div class="checklist-item ${checklist.charger_included ? 'checked' : 'not-checked'}">
            <strong>Lader erbij:</strong> ${checklist.charger_included ? '✓ Ja' : '✗ Nee'}
          </div>

          <div class="checklist-item ${checklist.image_restored ? 'checked' : 'not-checked'}">
            <strong>Image terug gezet:</strong> ${checklist.image_restored ? '✓ Ja' : '✗ Nee'}
          </div>

          <div class="checklist-item ${checklist.customer_data_wiped ? 'checked' : 'not-checked'}">
            <strong>Klant data gewist:</strong> ${checklist.customer_data_wiped ? '✓ Ja' : '✗ Nee'}
          </div>

          ${checklist.notes ? `
            <div class="notes">
              <h3>Notities:</h3>
              <p>${checklist.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Autosoft Computerwinkel - Vervangtoestellen Systeem</p>
            <p>Geprint op: ${new Date().toLocaleString('nl-NL')}</p>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Gecontroleerd door
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
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    Geen toestellen gevonden
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-[#3c4043]">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {device.barcode}
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
                      {device.checked_by || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(device.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {device.status === 'checked' && (
                          <button
                            onClick={() => {
                              setSelectedDevice(device);
                              setChecklist(device.checklist || {
                                no_damage: false,
                                windows_version: '',
                                charger_included: false,
                                image_restored: false,
                                customer_data_wiped: false,
                                notes: ''
                              });
                              handlePrint();
                            }}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                            title="Print checklist"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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

      {/* Checklist Modal */}
      {showChecklist && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#303134] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Controle Checklist - {selectedDevice.barcode}
              </h2>

              <div className="space-y-4">
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

                {/* Windows Version */}
                <div className="p-3 bg-[#202124] rounded-lg">
                  <label className="block text-white mb-2">Windows versie:</label>
                  <select
                    value={checklist.windows_version}
                    onChange={(e) => setChecklist({ ...checklist, windows_version: e.target.value })}
                    className="w-full px-4 py-2 bg-[#303134] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecteer versie...</option>
                    <option value="Windows 10 22H2">Windows 10 22H2</option>
                    <option value="Windows 11 23H2">Windows 11 23H2</option>
                    <option value="Windows 11 24H2">Windows 11 24H2</option>
                    <option value="Windows 11 25H2">Windows 11 25H2</option>
                  </select>
                </div>

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
