/** One titled block of the generate modal. */
const GstFormSection = ({ title, children }) => (
  <section>
    <h4 className="mb-2 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900">{title}</h4>
    {children}
  </section>
);

export default GstFormSection;
