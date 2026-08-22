import TREE_DATA from './dummy/default.json';
import STUDY_TREE_DATA from './dummy/study.json';

// ----------------------------------------------------------------------
// Main Question Drive Database Configuration
// ----------------------------------------------------------------------

const DB_NAME = 'file-manager-db';
const DB_VERSION = 3;
const STORE_NAME = 'app-data';
const KEY = 'main-state';

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export type SectionData = {
  tree: any[];
  scripts: Record<string, any>;
};

export type AppData = SectionData & {
  sections?: Record<string, SectionData>;
};

async function getAppData(): Promise<AppData> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(KEY);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve(result);
      } else {
        resolve(TREE_DATA as AppData);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveAppData(data: AppData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, KEY);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getTreeData(section?: string): Promise<any[]> {
  const data = await getAppData();
  if (!section || section === 'main') return data.tree || [];
  return data.sections?.[section]?.tree || [];
}

export async function saveTreeData(tree: any[], section?: string): Promise<void> {
  const data = await getAppData();
  if (!section || section === 'main') {
    data.tree = tree;
  } else {
    if (!data.sections) data.sections = {};
    if (!data.sections[section]) data.sections[section] = { tree: [], scripts: {} };
    data.sections[section].tree = tree;
  }
  await saveAppData(data);
}

export async function getFileScript(fileId: string, section?: string): Promise<any | null> {
  const data = await getAppData();
  if (!section || section === 'main') return data.scripts?.[fileId] || null;
  return data.sections?.[section]?.scripts[fileId] || null;
}

export async function saveFileScript(fileId: string, script: any, section?: string): Promise<void> {
  const data = await getAppData();
  if (!section || section === 'main') {
    if (!data.scripts) data.scripts = {};
    data.scripts[fileId] = script;
  } else {
    if (!data.sections) data.sections = {};
    if (!data.sections[section]) data.sections[section] = { tree: [], scripts: {} };
    data.sections[section].scripts[fileId] = script;
  }
  await saveAppData(data);
}

export async function deleteFileScripts(fileIds: string[], section?: string): Promise<void> {
  const data = await getAppData();
  if (!section || section === 'main') {
    if (data.scripts) {
      fileIds.forEach((id) => {
        delete data.scripts[id];
      });
    }
  } else if (data.sections?.[section]?.scripts) {
    fileIds.forEach((id) => {
      delete data.sections![section].scripts[id];
    });
  }
  await saveAppData(data);
}

export async function deleteTreeItems(ids: string[], section?: string): Promise<void> {
  const data = await getAppData();

  const getDescendantIds = (tree: any[], targetIds: string[]): string[] => {
    const descendantIds: string[] = [];
    const traverse = (nodes: any[], isDescendant = false) => {
      nodes.forEach((node) => {
        const shouldDelete = isDescendant || targetIds.includes(node.id);
        if (shouldDelete) {
          descendantIds.push(node.id);
        }
        if (node.children) {
          traverse(node.children, shouldDelete);
        }
      });
    };
    traverse(tree);
    return descendantIds;
  };

  const deleteFromTree = (nodes: any[]): any[] =>
    nodes
      .filter((node) => !ids.includes(node.id))
      .map((node) => ({
        ...node,
        children: node.children ? deleteFromTree(node.children) : undefined,
      }));

  const getAllTreeIds = (tree: any[]): string[] => {
    const allIds: string[] = [];
    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        allIds.push(node.id);
        if (node.children) traverse(node.children);
      });
    };
    traverse(tree);
    return allIds;
  };

  if (!section || section === 'main') {
    const allIdsToDelete = getDescendantIds(data.tree, ids);
    allIdsToDelete.forEach((id) => {
      delete data.scripts[id];
    });
    data.tree = deleteFromTree(data.tree);

    const validIds = new Set(getAllTreeIds(data.tree));
    if (data.scripts) {
      Object.keys(data.scripts).forEach((scriptId) => {
        if (!validIds.has(scriptId)) {
          delete data.scripts[scriptId];
        }
      });
    }
  } else if (data.sections?.[section]) {
    const allIdsToDelete = getDescendantIds(data.sections[section].tree, ids);
    allIdsToDelete.forEach((id) => {
      if (data.sections![section].scripts) {
        delete data.sections![section].scripts[id];
      }
    });
    data.sections[section].tree = deleteFromTree(data.sections[section].tree);

    const validIds = new Set(getAllTreeIds(data.sections[section].tree));
    if (data.sections[section].scripts) {
      Object.keys(data.sections[section].scripts).forEach((scriptId) => {
        if (!validIds.has(scriptId)) {
          delete data.sections![section].scripts[scriptId];
        }
      });
    }
  }

  await saveAppData(data);
}

export async function clearAllScripts(section?: string): Promise<void> {
  const data = await getAppData();
  if (!section || section === 'main') {
    data.scripts = {};
  } else if (data.sections?.[section]) {
    data.sections[section].scripts = {};
  }
  await saveAppData(data);
}

export async function getFullData(): Promise<AppData> {
  return getAppData();
}

export async function saveFullData(data: AppData): Promise<void> {
  await saveAppData(data);
}

// ----------------------------------------------------------------------
// Dedicated Study Database Configuration ('study-db')
// ----------------------------------------------------------------------

const STUDY_DB_NAME = 'study-db';
const STUDY_DB_VERSION = 1;
const STUDY_STORE_NAME = 'study-app-data';
const STUDY_KEY = 'study-main-state';

export type StudyAppData = {
  tree: any[];
  scripts: Record<string, any>;
};

export async function openStudyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STUDY_DB_NAME, STUDY_DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STUDY_STORE_NAME)) {
        db.createObjectStore(STUDY_STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function getStudyAppData(): Promise<StudyAppData> {
  const db = await openStudyDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STUDY_STORE_NAME, 'readonly');
    const store = transaction.objectStore(STUDY_STORE_NAME);
    const request = store.get(STUDY_KEY);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve(result);
      } else {
        resolve(STUDY_TREE_DATA as StudyAppData);
      }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveStudyAppData(data: StudyAppData): Promise<void> {
  const db = await openStudyDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STUDY_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STUDY_STORE_NAME);
    const request = store.put(data, STUDY_KEY);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getStudyTreeData(): Promise<any[]> {
  const data = await getStudyAppData();
  return data.tree || [];
}

export async function saveStudyTreeData(tree: any[]): Promise<void> {
  const data = await getStudyAppData();
  data.tree = tree;
  await saveStudyAppData(data);
}

export async function getStudyFileScript(fileId: string): Promise<any | null> {
  const data = await getStudyAppData();
  return data.scripts?.[fileId] || null;
}

export async function saveStudyFileScript(fileId: string, script: any): Promise<void> {
  const data = await getStudyAppData();
  if (!data.scripts) data.scripts = {};
  data.scripts[fileId] = script;
  await saveStudyAppData(data);
}

export async function deleteStudyFileScripts(fileIds: string[]): Promise<void> {
  const data = await getStudyAppData();
  if (data.scripts) {
    fileIds.forEach((id) => {
      delete data.scripts[id];
    });
  }
  await saveStudyAppData(data);
}

export async function deleteStudyTreeItems(ids: string[]): Promise<void> {
  const data = await getStudyAppData();

  const getDescendantIds = (tree: any[], targetIds: string[]): string[] => {
    const descendantIds: string[] = [];
    const traverse = (nodes: any[], isDescendant = false) => {
      nodes.forEach((node) => {
        const shouldDelete = isDescendant || targetIds.includes(node.id);
        if (shouldDelete) {
          descendantIds.push(node.id);
        }
        if (node.children) {
          traverse(node.children, shouldDelete);
        }
      });
    };
    traverse(tree);
    return descendantIds;
  };

  const deleteFromTree = (nodes: any[]): any[] =>
    nodes
      .filter((node) => !ids.includes(node.id))
      .map((node) => ({
        ...node,
        children: node.children ? deleteFromTree(node.children) : undefined,
      }));

  const getAllTreeIds = (tree: any[]): string[] => {
    const allIds: string[] = [];
    const traverse = (nodes: any[]) => {
      nodes.forEach((node) => {
        allIds.push(node.id);
        if (node.children) traverse(node.children);
      });
    };
    traverse(tree);
    return allIds;
  };

  const allIdsToDelete = getDescendantIds(data.tree, ids);
  allIdsToDelete.forEach((id) => {
    delete data.scripts[id];
  });
  data.tree = deleteFromTree(data.tree);

  const validIds = new Set(getAllTreeIds(data.tree));
  if (data.scripts) {
    Object.keys(data.scripts).forEach((scriptId) => {
      if (!validIds.has(scriptId)) {
        delete data.scripts[scriptId];
      }
    });
  }

  await saveStudyAppData(data);
}

export async function clearAllStudyScripts(): Promise<void> {
  const data = await getStudyAppData();
  data.scripts = {};
  await saveStudyAppData(data);
}

export async function getStudyFullData(): Promise<StudyAppData> {
  return getStudyAppData();
}

export async function saveStudyFullData(data: StudyAppData): Promise<void> {
  await saveStudyAppData(data);
}

export async function resetStudyData(): Promise<void> {
  await saveStudyAppData(JSON.parse(JSON.stringify(STUDY_TREE_DATA)));
}

export interface StudyConceptSummary {
  fileId: string;
  fileName: string;
  conceptId: string;
  title: string;
  hashtags: string[];
  blocks: any[];
}

export async function getAllStudyConcepts(): Promise<StudyConceptSummary[]> {
  const data = await getStudyAppData();
  const fileNames: Record<string, string> = {};

  const traverseTree = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.type === 'file') {
        fileNames[node.id] = node.label || 'Untitled Note';
      }
      if (node.children) {
        traverseTree(node.children);
      }
    });
  };

  if (Array.isArray(data.tree)) {
    traverseTree(data.tree);
  }

  const results: StudyConceptSummary[] = [];
  const scripts = data.scripts || {};

  Object.entries(scripts).forEach(([fileId, fileScript]: [string, any]) => {
    if (fileScript && Array.isArray(fileScript.concepts)) {
      fileScript.concepts.forEach((concept: any) => {
        if (concept && concept.title) {
          results.push({
            fileId,
            fileName: fileNames[fileId] || 'Untitled Note',
            conceptId: concept.id,
            title: concept.title,
            hashtags: Array.isArray(concept.hashtags) ? concept.hashtags : [],
            blocks: Array.isArray(concept.blocks) ? concept.blocks : [],
          });
        }
      });
    }
  });

  return results;
}

export async function getStudyConceptById(conceptId: string): Promise<{
  fileId: string;
  fileName: string;
  concept: any;
} | null> {
  const data = await getStudyAppData();
  if (!data.scripts) return null;

  const fileNames: Record<string, string> = {};
  const traverseTree = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (node.type === 'file') {
        fileNames[node.id] = node.label || 'Untitled Note';
      }
      if (node.children) {
        traverseTree(node.children);
      }
    });
  };

  if (Array.isArray(data.tree)) {
    traverseTree(data.tree);
  }

  for (const [fileId, fileScript] of Object.entries(data.scripts)) {
    if (fileScript && Array.isArray((fileScript as any).concepts)) {
      const found = (fileScript as any).concepts.find((c: any) => c.id === conceptId);
      if (found) {
        return {
          fileId,
          fileName: fileNames[fileId] || 'Untitled Note',
          concept: found,
        };
      }
    }
  }

  return null;
}
