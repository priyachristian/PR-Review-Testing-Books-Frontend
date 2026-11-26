import { Link } from 'react-router-dom';

// Extras
import pdf_logo from 'assets/images/PDF_file_icon.svg.webp';

const AttachMentDetails = ({ data }) => {
  let attachments = data?.attachments || data?.purchaseFile || data?.grpoFile || data?.billFile || [];

  const isPDF = data => {
    return data.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {attachments?.map((attachment, index) => {
        let attachmentUrl = attachment?.split('/');
        let rawName = attachmentUrl[attachmentUrl.length - 1]?.split('_')[1];
        let documentName = rawName ? decodeURIComponent(rawName) : rawName;
        return (
          <Link to={attachment} target="_blank" key={attachment}>
            {isPDF(attachment) ? (
              <>
                <img className="w-20" src={pdf_logo} alt="PDF Icon" />
                <p className="text-sm text-center break-words max-w-[6rem] mt-1">{documentName}</p>
              </>
            ) : (
              <>
                <img className="w-24 max-h-32  object-cover" src={attachment} alt={`Attachment ${index + 1}`} />
                <p className="text-sm text-center break-words max-w-[6rem] mt-1">{documentName}</p>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default AttachMentDetails;
