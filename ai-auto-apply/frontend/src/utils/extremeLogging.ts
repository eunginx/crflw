// Extreme Logging Utility for Frontend
export class ExtremeLogger {
  private static instance: ExtremeLogger;
  private isEnabled: boolean = false;

  static getInstance(): ExtremeLogger {
    if (!ExtremeLogger.instance) {
      ExtremeLogger.instance = new ExtremeLogger();
    }
    return ExtremeLogger.instance;
  }

  enable() {
    this.isEnabled = true;
    console.log('🔥 FRONTEND EXTREME LOGGING ENABLED');
    console.log('🔥 Timestamp:', new Date().toISOString());
    console.log('🔥 User Agent:', navigator.userAgent);
    console.log('🔥 URL:', window.location.href);
    console.log('🔥 Screen:', `${screen.width}x${screen.height}`);
    console.log('🔥 Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  }

  disable() {
    this.isEnabled = false;
    console.log('🔥 FRONTEND EXTREME LOGGING DISABLED');
  }

  logAPIRequest(method: string, url: string, data?: any, headers?: any) {
    if (!this.isEnabled) return;
    
    console.log('🔥 API REQUEST:', {
      timestamp: new Date().toISOString(),
      method,
      url,
      data,
      headers,
      requestId: Math.random().toString(36).substring(7)
    });
  }

  logAPIResponse(status: number, data?: any, duration?: number) {
    if (!this.isEnabled) return;
    
    console.log('🔥 API RESPONSE:', {
      timestamp: new Date().toISOString(),
      status,
      dataSize: data ? JSON.stringify(data).length : 0,
      duration: duration ? `${duration}ms` : undefined,
      requestId: Math.random().toString(36).substring(7)
    });
  }

  logComponentRender(componentName: string, props?: any) {
    if (!this.isEnabled) return;
    
    console.log('🔥 COMPONENT RENDER:', {
      timestamp: new Date().toISOString(),
      component: componentName,
      props,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
      } : 'N/A'
    });
  }

  logStateChange(component: string, state: any) {
    if (!this.isEnabled) return;
    
    console.log('🔥 STATE CHANGE:', {
      timestamp: new Date().toISOString(),
      component,
      stateSize: JSON.stringify(state).length,
      stateKeys: Object.keys(state)
    });
  }

  logError(error: Error, context?: any) {
    if (!this.isEnabled) return;
    
    console.error('🔥 ERROR:', {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      name: error.name
    });
  }

  logPerformance(metricName: string, value: number, unit: string = 'ms') {
    if (!this.isEnabled) return;
    
    console.log('🔥 PERFORMANCE:', {
      timestamp: new Date().toISOString(),
      metric: metricName,
      value,
      unit
    });
  }
}

export const extremeLogger = ExtremeLogger.getInstance();
