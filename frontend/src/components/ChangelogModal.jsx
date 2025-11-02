import React, { useState } from 'react';
import { X, Calendar, Package } from 'lucide-react';
import { CHANGELOG } from '../utils/changelog';

const ChangelogModal = ({ isOpen, onClose, currentVersion }) => {
  const [language, setLanguage] = useState('nl');

  if (!isOpen) return null;

  // Get sorted versions
  const versions = Object.keys(CHANGELOG).sort((a, b) => {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    if (bMajor !== aMajor) return bMajor - aMajor;
    if (bMinor !== aMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] px-4 backdrop-blur-sm">
      <div 
        className="rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-white text-opacity-90" />
            <div>
              <h2 className="text-2xl font-bold text-white">Changelog</h2>
              <p className="text-sm text-white text-opacity-70">Huidige versie: {currentVersion}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div 
              className="flex rounded-lg p-1"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <button
                onClick={() => setLanguage('nl')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'nl'
                    ? 'text-white'
                    : 'text-white text-opacity-60 hover:text-opacity-90'
                }`}
                style={language === 'nl' ? { background: 'rgba(150, 180, 255, 0.3)' } : {}}
              >
                NL
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'text-white'
                    : 'text-white text-opacity-60 hover:text-opacity-90'
                }`}
                style={language === 'en' ? { background: 'rgba(150, 180, 255, 0.3)' } : {}}
              >
                EN
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
            >
              <X className="w-5 h-5 text-white text-opacity-70" />
            </button>
          </div>
        </div>

        {/* Changelog List */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
          <div className="space-y-6">
            {versions.map((version) => {
              const changelog = CHANGELOG[version][language];
              const isCurrent = version === currentVersion;

              return (
                <div
                  key={version}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: isCurrent ? '1px solid rgba(150, 180, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">
                          Version {version}
                        </h3>
                        {isCurrent && (
                          <span 
                            className="px-2 py-1 text-xs font-semibold rounded"
                            style={{
                              background: 'rgba(150, 180, 255, 0.3)',
                              color: '#cfe1ff'
                            }}
                          >
                            HUIDIGE
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold" style={{ color: '#8fa8ff' }}>
                        {changelog.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white text-opacity-60">
                      <Calendar className="w-4 h-4" />
                      <span>{changelog.date}</span>
                    </div>
                  </div>

                  {changelog.features.length > 0 ? (
                    <div className="space-y-2">
                      {changelog.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#8fa8ff' }} />
                          <p className="text-white text-opacity-90">{feature}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white text-opacity-50 italic text-sm">
                      {language === 'nl' 
                        ? 'Deze versie bevat voornamelijk backend wijzigingen.'
                        : 'This version mainly contains backend changes.'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
