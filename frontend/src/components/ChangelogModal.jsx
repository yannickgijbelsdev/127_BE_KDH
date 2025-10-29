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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] px-4">
      <div className="bg-[#303134] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden border border-[#5f6368] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#5f6368]">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-[#8ab4f8]" />
            <div>
              <h2 className="text-2xl font-bold text-[#e8eaed]">Changelog</h2>
              <p className="text-sm text-[#9aa0a6]">Huidige versie: {currentVersion}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex bg-[#202124] rounded-lg p-1 border border-[#5f6368]">
              <button
                onClick={() => setLanguage('nl')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'nl'
                    ? 'bg-[#8ab4f8] text-[#202124]'
                    : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                }`}
              >
                NL
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-[#8ab4f8] text-[#202124]'
                    : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                }`}
              >
                EN
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#5f6368] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#9aa0a6]" />
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
                  className={`bg-[#202124] rounded-lg p-6 border ${
                    isCurrent ? 'border-[#8ab4f8]' : 'border-[#5f6368]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[#e8eaed]">
                          Version {version}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-[#8ab4f8] text-[#202124] text-xs font-semibold rounded">
                            HUIDIGE
                          </span>
                        )}
                      </div>
                      <p className="text-lg text-[#8ab4f8] font-semibold">
                        {changelog.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#9aa0a6]">
                      <Calendar className="w-4 h-4" />
                      <span>{changelog.date}</span>
                    </div>
                  </div>

                  {changelog.features.length > 0 ? (
                    <div className="space-y-2">
                      {changelog.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-[#8ab4f8] rounded-full mt-2 flex-shrink-0" />
                          <p className="text-[#e8eaed]">{feature}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[#9aa0a6] italic text-sm">
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
