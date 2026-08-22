export type StudyBlockType = 'markdown' | 'formula' | 'erd' | 'chart' | 'trap';

export interface StudyBlock {
  id: string;
  type: StudyBlockType;
  content: string;
  title?: string;
}

export interface StudyConcept {
  id: string;
  title: string;
  hashtags: string[];
  blocks: StudyBlock[];
}

export interface StudyDocData {
  concepts: StudyConcept[];
}

export function generateUniqueId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function createEmptyBlock(type: StudyBlockType = 'markdown'): StudyBlock {
  return {
    id: generateUniqueId('block'),
    type,
    content: '',
  };
}

export function createEmptyConcept(): StudyConcept {
  return {
    id: generateUniqueId('concept'),
    title: '',
    hashtags: [],
    blocks: [createEmptyBlock('markdown')],
  };
}

export function createDefaultStudyDoc(): StudyDocData {
  return {
    concepts: [createEmptyConcept()],
  };
}
