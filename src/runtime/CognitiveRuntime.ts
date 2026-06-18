import { GlobalTaskCoordinator } from './TaskCoordinator';
import { GlobalCooldownManager } from './queue/CooldownManager';

export class CognitiveRuntime {
  static boot() {
     console.log('[Cognitive Runtime] Booting up distributed agents layer...');
     
     GlobalTaskCoordinator.start();
     
     // Initialize load monitors
     setInterval(() => GlobalCooldownManager.tick(), 60000); // 1-minute tick
     
     console.log('[Cognitive Runtime] Active and accepting directives.');
  }

  static shutdown() {
     GlobalTaskCoordinator.stop();
  }
}
