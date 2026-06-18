const StreamStore: any = { load: async (id: string) => [] };
const ProjectionRebuilder: any = { rebuild: async (events: any[]) => null };

export class ProjectionRecovery {
  static async rebuild(streamId: string) {
    const events = await StreamStore.load(streamId);
    return ProjectionRebuilder.rebuild(events);
  }
}
