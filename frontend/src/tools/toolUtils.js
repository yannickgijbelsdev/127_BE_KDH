import { toast } from 'sonner';

export async function copyText(text, label = 'Copied to clipboard') {
  const str = String(text ?? '');
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(str);
      toast.success(label);
      return true;
    }
    throw new Error('clipboard-unavailable');
  } catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) { toast.success(label); return true; }
    } catch (_) { /* ignore */ }
    toast.error('Could not copy');
    return false;
  }
}

export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('File downloaded');
}
