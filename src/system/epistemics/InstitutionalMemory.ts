// STAGE 49 — Institutional Memory Layer

export interface InstitutionalLesson {
    id: string;
    context: string;
    strategy: string;
    shortTermOutcome: string;
    longTermCatastrophe: string;
    extractedLaw: string;
    timestamp: Date;
}

export class InstitutionalKnowledgeGraph {
    private static lessons: InstitutionalLesson[] = [];

    static async commitLesson(lesson: Omit<InstitutionalLesson, 'id' | 'timestamp'>) {
        const fullLesson: InstitutionalLesson = {
            ...lesson,
            id: `lesson_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            timestamp: new Date()
        };
        this.lessons.push(fullLesson);
        console.log(`[Institutional Memory] Committed new law: "${lesson.extractedLaw}"`);
    }

    static async queryRelevantLaws(context: string): Promise<InstitutionalLesson[]> {
        // Return historical lessons to prevent repeating mistakes
        return this.lessons;
    }
}
