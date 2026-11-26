export const getPriceListChangeConfirmModalProps = ({ message, width = '480px' }) => {
  return {
    title: 'Price List Change',
    content: <p className="text-sm text-gray-700 mt-1">{message}</p>,
    width,
  };
};
