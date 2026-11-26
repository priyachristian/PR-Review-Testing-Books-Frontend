// Components
import Icons from '@/assets/icons/icon';
import pdf_logo from '@/assets/images/PDF_file_icon.svg.webp';

const isPDF = data => {
  if (typeof data === 'string') {
    return data?.toLowerCase()?.endsWith('.pdf');
  } else if (typeof data === 'object') {
    return data?.file?.type === 'application/pdf' || data?.name?.toLowerCase()?.endsWith('.pdf');
  } else {
    return false;
  }
};

const getDisplayUrl = file => {
  if (typeof file === 'string') {
    return file;
  } else if (file?.previewUrl) {
    return file.previewUrl;
  } else if (file instanceof File) {
    return URL.createObjectURL(file);
  }
  return '';
};

// const getFileName = file => {
//   let fileName = '';

//   if (typeof file === 'string') {
//     fileName = file.split('/').pop();
//   } else if (file?.file?.name) {
//     fileName = file.file.name;
//   }

//   // Decode URL-encoded filenames (spaces, brackets, etc.)
//   try {
//     return decodeURIComponent(fileName);
//   } catch {
//     // If decoding fails, return the raw filename safely
//     return fileName;
//   }
// };

const getFileName = file => {
  let fileName = '';
  if (typeof file === 'string') {
    // Get last part of URL
    fileName = file.split('/').pop();

    // Decode URL-encoded characters
    try {
      fileName = decodeURIComponent(fileName);
    } catch {
      // leave as-is if decoding fails
    }

    // Remove prefix before first underscore (e.g. timestamp_)
    const underscoreIndex = fileName.indexOf('_');
    if (underscoreIndex !== -1) {
      fileName = fileName.slice(underscoreIndex + 1);
    }
  } else if (file?.name) {
    fileName = file.name;
  }

  return fileName;
};

const DisplayUploadedDocuments = ({ fileArray, setFiles = null, bordered = true }) => {
  // Normalize input: handle single file, array, or null/undefined
  const normalizeFiles = input => {
    if (!input) return [];
    if (Array.isArray(input)) return input.filter(Boolean);
    // Single file (File object or string URL)
    if (input instanceof File || typeof input === 'string' || typeof input === 'object') {
      return [input];
    }
    return [];
  };

  const files = normalizeFiles(fileArray);

  // Handle file removal - pass the file to remove to the parent handler
  const handleRemove = fileToRemove => {
    if (setFiles) {
      setFiles(fileToRemove);
    }
  };

  if (files.length === 0) return null;

  return (
    <div className={`flex gap-6 w-full h-full ${bordered ? 'border rounded p-3' : ''}`}>
      {files.map((file, index) => {
        const displayUrl = getDisplayUrl(file);
        const fileName = getFileName(file);

        return (
          <div className="relative w-max" key={index}>
            {setFiles && (
              <div>
                <Icons.CloseCircleFilled onClick={() => handleRemove(file)} className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full cursor-pointer" />
              </div>
            )}
            <a href={displayUrl} rel="noreferrer" target="_blank">
              {isPDF(file) ? (
                <div className="flex flex-col items-center gap-2">
                  <img className="w-20" src={pdf_logo} alt="PDF Icon" />
                  <p className="text-sm text-center break-words max-w-[6rem] mt-1">{fileName}</p>
                </div>
              ) : (
                <img className="w-24 max-h-32 object-cover" src={displayUrl} alt={`Attachment ${index + 1}`} />
              )}
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default DisplayUploadedDocuments;
