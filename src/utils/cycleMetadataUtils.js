const METADATA_DELIMITER_START = '---CYCLE_METADATA_START---';
const METADATA_DELIMITER_END = '---CYCLE_METADATA_END---';

export const parseCycleMetadata = (notes) => {
  if (!notes) return {};
  try {
    const startIndex = notes.indexOf(METADATA_DELIMITER_START);
    const endIndex = notes.indexOf(METADATA_DELIMITER_END);

    if (startIndex !== -1 && endIndex !== -1) {
      const jsonString = notes.substring(startIndex + METADATA_DELIMITER_START.length, endIndex).trim();
      return JSON.parse(jsonString);
    }
  } catch (e) {
    console.warn('Failed to parse cycle metadata', e);
  }
  return {};
};

export const updateCycleMetadata = (currentNotes, updates) => {
  const currentMetadata = parseCycleMetadata(currentNotes);
  const newMetadata = { ...currentMetadata, ...updates };
  const jsonString = JSON.stringify(newMetadata, null, 2);
  
  const block = `\n${METADATA_DELIMITER_START}\n${jsonString}\n${METADATA_DELIMITER_END}`;
  
  let newNotes = currentNotes || '';
  const startIndex = newNotes.indexOf(METADATA_DELIMITER_START);
  const endIndex = newNotes.indexOf(METADATA_DELIMITER_END);

  if (startIndex !== -1 && endIndex !== -1) {
    // Replace existing block
    newNotes = newNotes.substring(0, startIndex).trim() + block + newNotes.substring(endIndex + METADATA_DELIMITER_END.length);
  } else {
    // Append new block
    newNotes = newNotes.trim() + block;
  }
  
  return newNotes.trim();
};

export const formatCycleMetadata = (metadata) => {
  return JSON.stringify(metadata, null, 2);
};