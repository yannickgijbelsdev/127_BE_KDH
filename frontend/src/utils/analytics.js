// Analytics tracking utility
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Generate or get session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Get browser info
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  // Detect browser
  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edg') > -1) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browserName = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }
  
  return { browserName, browserVersion };
};

// Log analytics event
export const logEvent = async (toolId, toolName, eventType, eventData = {}) => {
  try {
    const sessionId = getSessionId();
    const { browserName, browserVersion } = getBrowserInfo();
    
    await fetch(`${BACKEND_URL}/api/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool_id: toolId,
        tool_name: toolName,
        event_type: eventType,
        event_data: {
          ...eventData,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          browser_name: browserName,
          browser_version: browserVersion,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          viewport_size: `${window.innerWidth}x${window.innerHeight}`,
          platform: navigator.platform,
          language: navigator.language
        }
      })
    });
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

// Helper functions for common events
export const logPageVisit = (toolId, toolName) => {
  logEvent(toolId, toolName, 'page_visit', {
    path: window.location.pathname,
    referrer: document.referrer
  });
};

export const logButtonClick = (toolId, toolName, buttonName) => {
  logEvent(toolId, toolName, 'button_click', {
    button: buttonName
  });
};

export const logAction = (toolId, toolName, actionName, actionData = {}) => {
  logEvent(toolId, toolName, 'action', {
    action: actionName,
    ...actionData
  });
};

// Log errors
export const logError = (toolId, toolName, errorType, errorData = {}) => {
  logEvent(toolId, toolName, 'error', {
    error_type: errorType,
    ...errorData
  });
};

export default {
  logEvent,
  logPageVisit,
  logButtonClick,
  logAction,
  logError
};
