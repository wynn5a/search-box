type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();
  private static instance: EventBus;

  private constructor() {
    // 确保在服务器端不会创建多个实例
    if (typeof window === 'undefined') {
      return;
    }
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, callback: EventCallback) {
    // 在服务器端不执行任何操作
    if (typeof window === 'undefined') {
      return;
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(callback);
  }

  off(event: string, callback: EventCallback) {
    // 在服务器端不执行任何操作
    if (typeof window === 'undefined') {
      return;
    }

    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    // 在服务器端不执行任何操作
    if (typeof window === 'undefined') {
      return;
    }

    const callbacks = this.events.get(event);
    callbacks?.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

// 定义事件常量
export const EVENTS = {
  CLUSTER_ADDED: 'clusterAdded',
  CLUSTER_UPDATED: 'clusterUpdated',
  CLUSTER_DELETED: 'clusterDeleted',
} as const;

// 导出单例实例
export const eventBus = EventBus.getInstance(); 