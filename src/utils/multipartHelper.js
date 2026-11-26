const getByPath = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

const setByPath = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();

  const target = keys.reduce((acc, key) => {
    if (!acc[key] || typeof acc[key] !== 'object') {
      acc[key] = {};
    }
    return acc[key];
  }, obj);

  target[lastKey] = value;
};

const omitByPath = (obj, path) => {
  const keys = path.split('.');

  const cloneLevel = (current, depth = 0) => {
    if (depth === keys.length) return current;

    const key = keys[depth];

    if (Array.isArray(current)) {
      return current.map(item => cloneLevel(item, depth));
    }

    if (typeof current !== 'object' || current === null) {
      return current;
    }

    const copy = { ...current };

    if (depth === keys.length - 1) {
      delete copy[key];
    } else if (key in copy) {
      copy[key] = cloneLevel(copy[key], depth + 1);
    }

    return copy;
  };

  return cloneLevel(obj);
};

export const buildMultipartPayload = (data, attachmentPath = 'attachments', formFieldName = 'attachment') => {
  const attachments = getByPath(data, attachmentPath);

  if (!Array.isArray(attachments)) {
    return {
      formData: null,
      hasFiles: false,
      jsonPayload: data,
    };
  }

  const existingUrls = attachments.filter(item => typeof item === 'string');
  const newFiles = attachments.filter(item => item instanceof File);

  const formData = new FormData();

  if (!newFiles.length) {
    formData.append('JSONString', JSON.stringify(data));
    return {
      formData,
      hasFiles: false,
      data,
    };
  }

  if (newFiles.length > 0) {
    newFiles.forEach(file => {
      formData.append(formFieldName, file);
    });
  }

  const jsonPayload = omitByPath(data, attachmentPath);

  setByPath(jsonPayload, attachmentPath, existingUrls);

  formData.append('JSONString', JSON.stringify(jsonPayload));

  return {
    formData,
    hasFiles: true,
    jsonPayload,
  };
};

const cloneAndReplaceAtPaths = (obj, pathReplacements, currentPath = '') => {
  if (currentPath && Object.prototype.hasOwnProperty.call(pathReplacements, currentPath)) {
    return pathReplacements[currentPath];
  }
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof File || obj instanceof Blob) return null;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) {
    return obj.map((item, i) => cloneAndReplaceAtPaths(item, pathReplacements, currentPath ? `${currentPath}.${i}` : String(i)));
  }
  const out = {};
  for (const k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    const childPath = currentPath ? `${currentPath}.${k}` : k;
    const value = cloneAndReplaceAtPaths(obj[k], pathReplacements, childPath);
    if (value !== undefined) out[k] = value;
  }
  return out;
};

export const buildMultipartPayloadMultipleFields = (data, fieldsConfig) => {
  const pathReplacements = {};
  const formData = new FormData();
  let hasFiles = false;

  for (const field of fieldsConfig) {
    const { path, formFieldName, single } = field;
    const value = getByPath(data, path);

    if (single) {
      const isNewFile = value instanceof File;
      const existingUrl = value && typeof value === 'string' ? value : null;

      if (isNewFile) {
        pathReplacements[path] = undefined;
        formData.append(formFieldName, value);
        hasFiles = true;
      } else if (existingUrl != null) {
        pathReplacements[path] = existingUrl;
      }
    } else {
      const list = Array.isArray(value) ? value : [];
      const existingUrls = list.filter(item => typeof item === 'string');
      const newFiles = list.filter(item => item instanceof File);
      pathReplacements[path] = existingUrls.length ? existingUrls : undefined;
      if (newFiles.length > 0) {
        newFiles.forEach(file => formData.append(formFieldName, file));
        hasFiles = true;
      }
    }
  }

  if (!hasFiles) {
    return { formData: null, hasFiles: false, jsonPayload: data };
  }

  let jsonPayload = cloneAndReplaceAtPaths(data, pathReplacements);
  for (const path of Object.keys(pathReplacements)) {
    setByPath(jsonPayload, path, pathReplacements[path]);
  }
  formData.append('JSONString', JSON.stringify(jsonPayload));

  return { formData, hasFiles: true, jsonPayload };
};

export const buildFileFormData = (fileData, formFieldName = 'files') => {
  const formData = new FormData();
  const file = fileData?.files != null ? fileData.files : fileData instanceof File ? fileData : null;
  if (file != null) {
    formData.append(formFieldName, file);
  }
  return formData;
};

export const buildSingleFileMultipartPayload = (data, file, formFieldName = 'attachment') => {
  const hasFile = file && file instanceof File;

  if (!hasFile) {
    return {
      formData: null,
      hasFile: false,
      jsonPayload: data,
    };
  }

  const formData = new FormData();
  formData.append(formFieldName, file);
  formData.append('JSONString', JSON.stringify(data));

  return {
    formData,
    hasFile: true,
    jsonPayload: data,
  };
};

const extractFilesFromAttachments = (attachments = []) => {
  const newFiles = [];
  const existingUrls = [];

  if (!Array.isArray(attachments)) return { newFiles, existingUrls };

  attachments.forEach(att => {
    if (typeof att === 'string') {
      existingUrls.push(att);
    } else if (att instanceof File) {
      newFiles.push(att);
    } else if (typeof att === 'object' && att?.file instanceof File) {
      newFiles.push(att.file);
    }
  });

  return { newFiles, existingUrls };
};

export const buildItemMasterMultipartPayload = data => {
  const purchasingAttachments = extractFilesFromAttachments(data.purchasingData?.vendorSideMFGAndQCDocument);

  const salesAttachments = extractFilesFromAttachments(data.salesData?.vendorSideMFGAndQCDocument);

  const mainAttachments = extractFilesFromAttachments(data.attachments);

  const hasFiles = purchasingAttachments.newFiles.length > 0 || salesAttachments.newFiles.length > 0 || mainAttachments.newFiles.length > 0;

  const jsonPayload = {
    ...data,
    purchasingData: data.purchasingData
      ? {
          ...data.purchasingData,
          vendorSideMFGAndQCDocument: purchasingAttachments.existingUrls,
        }
      : undefined,
    salesData: data.salesData
      ? {
          ...data.salesData,
          vendorSideMFGAndQCDocument: salesAttachments.existingUrls,
        }
      : undefined,
    attachments: mainAttachments.existingUrls,
  };

  const formData = new FormData();

  purchasingAttachments.newFiles.forEach(file => {
    formData.append('purchasingData.attachment', file);
  });

  salesAttachments.newFiles.forEach(file => {
    formData.append('salesData.attachment', file);
  });

  mainAttachments.newFiles.forEach(file => {
    formData.append('attachment', file);
  });

  formData.append('JSONString', JSON.stringify(jsonPayload));

  return {
    formData,
    hasFiles,
    jsonPayload,
  };
};
